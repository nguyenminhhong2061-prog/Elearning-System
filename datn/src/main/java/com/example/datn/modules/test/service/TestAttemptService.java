package com.example.datn.modules.test.service;

import com.example.datn.common.enums.CefrLevel;
import com.example.datn.common.event.TestCompletedEvent;
import com.example.datn.common.security.CurrentUser;
import com.example.datn.common.user.LevelRecorder;
import com.example.datn.modules.test.dto.request.SaveAnswerRequest;
import com.example.datn.modules.test.dto.response.PassagePlayResponse;
import com.example.datn.modules.test.dto.response.PassageReviewResponse;
import com.example.datn.modules.test.dto.response.PronunciationReviewResponse;
import com.example.datn.modules.test.dto.response.ReviewItemResponse;
import com.example.datn.modules.test.dto.response.SavedAnswerResponse;
import com.example.datn.modules.test.dto.response.SkillScoreResponse;
import com.example.datn.modules.test.dto.response.StartAttemptResponse;
import com.example.datn.modules.test.dto.response.TestResultResponse;
import com.example.datn.modules.test.entity.PronunciationDetails;
import com.example.datn.modules.test.entity.Test;
import com.example.datn.modules.test.entity.TestAttempt;
import com.example.datn.modules.test.entity.TestAttemptAnswer;
import com.example.datn.modules.test.entity.TestPassage;
import com.example.datn.modules.test.entity.TestPassagePlay;
import com.example.datn.modules.test.entity.TestQuestion;
import com.example.datn.modules.test.entity.TestQuestionAcceptedAnswer;
import com.example.datn.modules.test.entity.TestQuestionOption;
import com.example.datn.modules.test.enums.TestAttemptStatus;
import com.example.datn.modules.test.enums.TestSkill;
import com.example.datn.modules.test.enums.TestType;
import com.example.datn.modules.test.exception.InvalidTestAnswerException;
import com.example.datn.modules.test.exception.ListenLimitReachedException;
import com.example.datn.modules.test.exception.TestAttemptNotFoundException;
import com.example.datn.modules.test.exception.TestAttemptNotInProgressException;
import com.example.datn.modules.test.exception.TestAttemptNotSubmittedException;
import com.example.datn.modules.test.exception.TestNotFoundException;
import com.example.datn.modules.test.exception.TestPassageNotFoundException;
import com.example.datn.modules.test.exception.TestRetakeNotAllowedException;
import com.example.datn.modules.test.repository.TestAttemptAnswerRepository;
import com.example.datn.modules.test.repository.TestAttemptRepository;
import com.example.datn.modules.test.repository.TestPassagePlayRepository;
import com.example.datn.modules.test.repository.TestPassageRepository;
import com.example.datn.modules.test.repository.TestQuestionAcceptedAnswerRepository;
import com.example.datn.modules.test.repository.TestQuestionOptionRepository;
import com.example.datn.modules.test.repository.TestQuestionRepository;
import com.example.datn.modules.test.repository.TestRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Runs a test attempt: start/resume, save answers, submit (graded by {@link TestGradingService}), read the result. */
@Service
@Transactional
public class TestAttemptService {

    private static final List<TestAttemptStatus> COMPLETED = List.of(TestAttemptStatus.SUBMITTED, TestAttemptStatus.GRADED);

    private final TestRepository testRepository;
    private final TestPassageRepository passageRepository;
    private final TestPassagePlayRepository playRepository;
    private final TestQuestionRepository questionRepository;
    private final TestQuestionOptionRepository optionRepository;
    private final TestQuestionAcceptedAnswerRepository acceptedAnswerRepository;
    private final TestAttemptRepository attemptRepository;
    private final TestAttemptAnswerRepository answerRepository;
    private final TestService testService;
    private final CurrentUser currentUser;
    private final TestCalendar calendar;
    private final TestGradingService gradingService;
    private final LevelRecorder levelRecorder;
    private final ApplicationEventPublisher eventPublisher;

    public TestAttemptService(
            TestRepository testRepository,
            TestPassageRepository passageRepository,
            TestPassagePlayRepository playRepository,
            TestQuestionRepository questionRepository,
            TestQuestionOptionRepository optionRepository,
            TestQuestionAcceptedAnswerRepository acceptedAnswerRepository,
            TestAttemptRepository attemptRepository,
            TestAttemptAnswerRepository answerRepository,
            TestService testService,
            CurrentUser currentUser,
            TestCalendar calendar,
            TestGradingService gradingService,
            LevelRecorder levelRecorder,
            ApplicationEventPublisher eventPublisher) {
        this.testRepository = testRepository;
        this.passageRepository = passageRepository;
        this.playRepository = playRepository;
        this.questionRepository = questionRepository;
        this.optionRepository = optionRepository;
        this.acceptedAnswerRepository = acceptedAnswerRepository;
        this.attemptRepository = attemptRepository;
        this.answerRepository = answerRepository;
        this.testService = testService;
        this.currentUser = currentUser;
        this.calendar = calendar;
        this.gradingService = gradingService;
        this.levelRecorder = levelRecorder;
        this.eventPublisher = eventPublisher;
    }

    public StartAttemptResponse start(Long testId, boolean restart) {
        Test test = testService.findOpen(testId);
        Long userId = currentUser.id();

        TestAttempt attempt = attemptRepository
                .findFirstByTestIdAndUserIdAndStatusOrderByIdDesc(testId, userId, TestAttemptStatus.IN_PROGRESS)
                .orElse(null);

        if (!test.getType().retakeAllowed()) {
            // Taken once: a submitted attempt is final, and the one in progress cannot be thrown away to start over
            // (that would also hand back the plays of its recordings).
            boolean submitted = attempt == null
                    && attemptRepository.existsByTestIdAndUserIdAndStatusIn(testId, userId, COMPLETED);
            if (submitted || (restart && attempt != null)) {
                throw new TestRetakeNotAllowedException(testId);
            }
        }

        if (restart && attempt != null) {
            // Deleting the attempt cascades to its answers and plays (attempt_id ON DELETE CASCADE).
            attemptRepository.delete(attempt);
            attempt = null;
        }

        boolean resumed = attempt != null;
        if (attempt == null) {
            attempt = attemptRepository.save(new TestAttempt(testId, userId));
        }

        return new StartAttemptResponse(attempt.getId(), resumed, attempt.getStatus(), savedAnswers(attempt.getId()),
                passagePlays(attempt.getId()));
    }

    /**
     * Counts one play of a passage's recording, refused once the attempt has used them all. The client asks before
     * each play, so the count survives a reload and a resumed attempt.
     */
    public PassagePlayResponse recordPlay(Long attemptId, Long passageId) {
        TestAttempt attempt = inProgressOwnedAttempt(attemptId);
        passageRepository.findById(passageId)
                .filter(passage -> passage.getTestId().equals(attempt.getTestId()) && passage.hasAudio())
                .orElseThrow(() -> new TestPassageNotFoundException(passageId));

        TestPassagePlay play = playRepository.findByAttemptIdAndPassageId(attemptId, passageId)
                .orElseGet(() -> new TestPassagePlay(attemptId, passageId));
        if (play.getPlayCount() >= TestPassage.MAX_PLAYS) {
            throw new ListenLimitReachedException(passageId);
        }
        play.countPlay();
        playRepository.save(play);

        return new PassagePlayResponse(passageId, play.getPlayCount(), TestPassage.MAX_PLAYS);
    }

    public void saveAnswer(Long attemptId, Long questionId, SaveAnswerRequest request) {
        TestAttempt attempt = inProgressOwnedAttempt(attemptId);
        TestQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new InvalidTestAnswerException("Question not found: " + questionId));
        if (!question.getTestId().equals(attempt.getTestId())) {
            throw new InvalidTestAnswerException("Question does not belong to this test");
        }
        if (question.isReadAloud()) {
            throw new InvalidTestAnswerException("Expected a recording for this question");
        }

        List<TestQuestionOption> options = optionRepository.findByQuestionIdInOrderByIdAsc(List.of(questionId));

        TestAttemptAnswer answer = answerRepository.findByAttemptIdAndQuestionId(attemptId, questionId)
                .orElseGet(() -> new TestAttemptAnswer(attemptId, questionId));

        if (!options.isEmpty()) {
            if (request.optionId() == null || request.text() != null) {
                throw new InvalidTestAnswerException("Expected optionId for this question");
            }
            boolean belongs = options.stream().anyMatch(option -> option.getId().equals(request.optionId()));
            if (!belongs) {
                throw new InvalidTestAnswerException("Option does not belong to this question");
            }
            answer.setOption(request.optionId());
        } else {
            if (request.text() == null || request.optionId() != null) {
                throw new InvalidTestAnswerException("Expected text for this question");
            }
            if (request.text().isBlank()) {
                throw new InvalidTestAnswerException("text must not be blank");
            }
            answer.setText(request.text().trim());
        }

        answerRepository.save(answer);
    }

    public TestResultResponse submit(Long attemptId) {
        TestAttempt attempt = inProgressOwnedAttempt(attemptId);
        Test test = testRepository.findById(attempt.getTestId())
                .orElseThrow(() -> new TestNotFoundException(attempt.getTestId()));

        Instant submittedAt = calendar.now();
        gradingService.grade(attempt, submittedAt);
        boolean fullyGraded = attempt.getStatus() == TestAttemptStatus.GRADED;

        if (fullyGraded && test.getType() == TestType.COMPREHENSIVE) {
            Optional<CefrLevel> previous = currentUser.currentLevel();
            if (previous.isEmpty() || previous.get() != attempt.getSuggestedLevel()) {
                levelRecorder.recordLevelChange(currentUser.id(), attempt.getSuggestedLevel(), attemptId);
            }
        }

        eventPublisher.publishEvent(new TestCompletedEvent(
                currentUser.id(),
                attemptId,
                test.getId(),
                test.getType().name(),
                fullyGraded ? attempt.getTotalScore().intValue() : 0,
                calendar.today(),
                submittedAt));

        return buildResult(attempt);
    }

    @Transactional(readOnly = true)
    public TestResultResponse getResult(Long attemptId) {
        TestAttempt attempt = ownedAttempt(attemptId);
        if (attempt.getStatus() == TestAttemptStatus.IN_PROGRESS) {
            // The result carries the correct answers and the transcripts: not before the attempt is submitted.
            throw new TestAttemptNotSubmittedException(attemptId);
        }
        return buildResult(attempt);
    }

    private TestResultResponse buildResult(TestAttempt attempt) {
        Test test = testRepository.findById(attempt.getTestId())
                .orElseThrow(() -> new TestNotFoundException(attempt.getTestId()));
        List<TestQuestion> questions = questionRepository.findByTestIdOrderByIdAsc(test.getId());
        List<Long> questionIds = questions.stream().map(TestQuestion::getId).toList();

        Map<Long, List<TestQuestionOption>> optionsByQuestion = optionsOf(questionIds);
        Map<Long, List<TestQuestionAcceptedAnswer>> acceptedByQuestion = acceptedAnswersOf(questionIds);
        Map<Long, TestAttemptAnswer> answerByQuestion = answerRepository.findByAttemptId(attempt.getId()).stream()
                .collect(Collectors.toMap(TestAttemptAnswer::getQuestionId, Function.identity()));

        int questionCount = questions.size();
        int totalPoints = questions.stream().mapToInt(TestQuestion::getPoints).sum();
        BigDecimal earnedPoints = answerByQuestion.values().stream()
                .map(TestAttemptAnswer::getScoreEarned)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        int correctCount = (int) answerByQuestion.values().stream()
                .filter(answer -> Boolean.TRUE.equals(answer.getCorrect()))
                .count();

        Integer scorePercent = attempt.getStatus() == TestAttemptStatus.GRADED
                ? attempt.getTotalScore().intValue()
                : null;

        List<ReviewItemResponse> review = questions.stream()
                .map(question -> reviewItem(question, answerByQuestion.get(question.getId()),
                        optionsByQuestion.getOrDefault(question.getId(), List.of()),
                        acceptedByQuestion.getOrDefault(question.getId(), List.of())))
                .toList();

        Set<TestSkill> testSkills = questions.stream()
                .map(TestGradingService::skillOf)
                .collect(Collectors.toCollection(() -> EnumSet.noneOf(TestSkill.class)));
        Map<String, SkillScoreResponse> skills = new LinkedHashMap<>();
        Map<String, Integer> storedScores = attempt.getSkillScores();
        Map<String, CefrLevel> storedLevels = attempt.getSkillLevels();
        for (TestSkill skill : TestSkill.values()) {
            if (!testSkills.contains(skill)) {
                continue;
            }
            Integer score = storedScores == null ? null : storedScores.get(skill.dbKey());
            CefrLevel level = storedLevels == null ? null : storedLevels.get(skill.dbKey());
            if (level == null && score != null) {
                level = CefrLevels.fromScore(score); // graded before skill levels were stored
            }
            skills.put(skill.apiKey(), new SkillScoreResponse(score, level));
        }

        Integer best = null;
        boolean personalBest = false;
        Integer currentScore = attempt.getStatus() == TestAttemptStatus.GRADED ? attempt.getTotalScore().intValue() : null;
        List<TestAttempt> completed = attemptRepository.findByTestIdAndUserIdAndStatusIn(
                test.getId(), currentUser.id(), COMPLETED);
        Integer previousBest = completed.stream()
                .filter(other -> other.getStatus() == TestAttemptStatus.GRADED && !other.getId().equals(attempt.getId()))
                .map(other -> other.getTotalScore().intValue())
                .max(Integer::compareTo)
                .orElse(null);
        if (currentScore != null) {
            best = previousBest == null ? currentScore : Math.max(previousBest, currentScore);
        }
        personalBest = previousBest != null && currentScore != null && currentScore > previousBest;

        List<PassageReviewResponse> passages = passageRepository.findByTestIdOrderByIdAsc(test.getId()).stream()
                .map(passage -> new PassageReviewResponse(passage.getId(), passage.getTitle(), passage.getContent(),
                        passage.getAudioUrl(), passage.getTranscript()))
                .toList();

        return new TestResultResponse(
                attempt.getId(),
                test.getId(),
                test.getTitle(),
                test.getType(),
                attempt.getStatus(),
                attempt.getSubmittedAt(),
                correctCount,
                questionCount,
                totalPoints,
                earnedPoints,
                scorePercent,
                best,
                personalBest,
                attempt.getSuggestedLevel(),
                attempt.getSuggestedRoadmap(),
                skills,
                passages,
                review);
    }

    private ReviewItemResponse reviewItem(
            TestQuestion question,
            TestAttemptAnswer answer,
            List<TestQuestionOption> options,
            List<TestQuestionAcceptedAnswer> accepted) {
        Long correctOptionId = null;
        String correctAnswer = null;
        if (!options.isEmpty()) {
            TestQuestionOption correctOption = options.stream()
                    .filter(TestQuestionOption::isCorrect)
                    .findFirst()
                    .orElse(null);
            correctOptionId = correctOption == null ? null : correctOption.getId();
            correctAnswer = correctOption == null ? null : correctOption.getContent();
        } else if (!accepted.isEmpty()) {
            correctAnswer = accepted.stream()
                    .filter(TestQuestionAcceptedAnswer::isPrimary)
                    .findFirst()
                    .map(TestQuestionAcceptedAnswer::getAnswerText)
                    .orElse(accepted.get(0).getAnswerText());
        } else if (question.isReadAloud()) {
            correctAnswer = question.getReferenceText();
        }

        Boolean correct = answer == null ? (options.isEmpty() && accepted.isEmpty() ? null : false) : answer.getCorrect();

        return new ReviewItemResponse(
                question.getId(),
                question.getPassageId(),
                question.getQuestionType(),
                question.getLevel(),
                correct,
                answer == null ? null : answer.getSelectedOptionId(),
                answer == null ? null : answer.getAnswerContent(),
                correctOptionId,
                correctAnswer,
                question.getPoints(),
                answer == null ? BigDecimal.ZERO : answer.getScoreEarned(),
                answer == null ? null : answer.getAiCriteria(),
                answer == null ? null : answer.getAiComment(),
                pronunciationReview(answer));
    }

    private static PronunciationReviewResponse pronunciationReview(TestAttemptAnswer answer) {
        if (answer == null || !answer.isRecording()) {
            return null;
        }
        PronunciationDetails details = answer.getPronunciationDetails();
        if (details == null) {
            return new PronunciationReviewResponse(answer.getPronunciationScore(), null, null, List.of());
        }
        return new PronunciationReviewResponse(
                answer.getPronunciationScore(),
                details.phonemeAccuracy(),
                details.wordAccuracy(),
                details.errors().stream()
                        .map(error -> new PronunciationReviewResponse.WordErrorResponse(
                                error.word(), error.expectedIpa(), error.heardIpa()))
                        .toList());
    }

    private List<SavedAnswerResponse> savedAnswers(Long attemptId) {
        return answerRepository.findByAttemptId(attemptId).stream()
                // What was heard in a recording stays hidden until the attempt is submitted.
                .map(answer -> answer.isRecording()
                        ? new SavedAnswerResponse(answer.getQuestionId(), null, null, true)
                        : new SavedAnswerResponse(
                                answer.getQuestionId(), answer.getSelectedOptionId(), answer.getAnswerContent(), false))
                .toList();
    }

    private List<PassagePlayResponse> passagePlays(Long attemptId) {
        return playRepository.findByAttemptId(attemptId).stream()
                .map(play -> new PassagePlayResponse(play.getPassageId(), play.getPlayCount(), TestPassage.MAX_PLAYS))
                .toList();
    }

    private Map<Long, List<TestQuestionOption>> optionsOf(List<Long> questionIds) {
        if (questionIds.isEmpty()) {
            return Map.of();
        }
        return optionRepository.findByQuestionIdInOrderByIdAsc(questionIds).stream()
                .collect(Collectors.groupingBy(TestQuestionOption::getQuestionId));
    }

    private Map<Long, List<TestQuestionAcceptedAnswer>> acceptedAnswersOf(List<Long> questionIds) {
        if (questionIds.isEmpty()) {
            return Map.of();
        }
        return acceptedAnswerRepository.findByQuestionIdIn(questionIds).stream()
                .collect(Collectors.groupingBy(TestQuestionAcceptedAnswer::getQuestionId));
    }

    private TestAttempt inProgressOwnedAttempt(Long attemptId) {
        TestAttempt attempt = ownedAttempt(attemptId);
        if (attempt.getStatus() != TestAttemptStatus.IN_PROGRESS) {
            throw new TestAttemptNotInProgressException(attemptId);
        }
        return attempt;
    }

    private TestAttempt ownedAttempt(Long attemptId) {
        return attemptRepository.findByIdAndUserId(attemptId, currentUser.id())
                .orElseThrow(() -> new TestAttemptNotFoundException(attemptId));
    }
}
