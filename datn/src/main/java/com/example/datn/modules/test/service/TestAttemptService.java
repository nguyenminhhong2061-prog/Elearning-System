package com.example.datn.modules.test.service;

import com.example.datn.common.enums.CefrLevel;
import com.example.datn.common.event.TestCompletedEvent;
import com.example.datn.common.security.CurrentUser;
import com.example.datn.common.user.LevelRecorder;
import com.example.datn.modules.test.dto.request.SaveAnswerRequest;
import com.example.datn.modules.test.dto.response.ReviewItemResponse;
import com.example.datn.modules.test.dto.response.SavedAnswerResponse;
import com.example.datn.modules.test.dto.response.SkillScoreResponse;
import com.example.datn.modules.test.dto.response.StartAttemptResponse;
import com.example.datn.modules.test.dto.response.TestResultResponse;
import com.example.datn.modules.test.entity.Test;
import com.example.datn.modules.test.entity.TestAttempt;
import com.example.datn.modules.test.entity.TestAttemptAnswer;
import com.example.datn.modules.test.entity.TestQuestion;
import com.example.datn.modules.test.entity.TestQuestionAcceptedAnswer;
import com.example.datn.modules.test.entity.TestQuestionOption;
import com.example.datn.modules.test.enums.TestAttemptStatus;
import com.example.datn.modules.test.enums.TestQuestionType;
import com.example.datn.modules.test.enums.TestSkill;
import com.example.datn.modules.test.enums.TestType;
import com.example.datn.modules.test.exception.InvalidTestAnswerException;
import com.example.datn.modules.test.exception.TestAttemptNotFoundException;
import com.example.datn.modules.test.exception.TestAttemptNotInProgressException;
import com.example.datn.modules.test.exception.TestNotFoundException;
import com.example.datn.modules.test.repository.TestAttemptAnswerRepository;
import com.example.datn.modules.test.repository.TestAttemptRepository;
import com.example.datn.modules.test.repository.TestQuestionAcceptedAnswerRepository;
import com.example.datn.modules.test.repository.TestQuestionOptionRepository;
import com.example.datn.modules.test.repository.TestQuestionRepository;
import com.example.datn.modules.test.repository.TestRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Runs a test attempt: start/resume, save answers, submit with grading, and read the result. */
@Service
@Transactional
public class TestAttemptService {

    private final TestRepository testRepository;
    private final TestQuestionRepository questionRepository;
    private final TestQuestionOptionRepository optionRepository;
    private final TestQuestionAcceptedAnswerRepository acceptedAnswerRepository;
    private final TestAttemptRepository attemptRepository;
    private final TestAttemptAnswerRepository answerRepository;
    private final TestService testService;
    private final CurrentUser currentUser;
    private final TestCalendar calendar;
    private final TestAiGateway aiGateway;
    private final LevelRecorder levelRecorder;
    private final ApplicationEventPublisher eventPublisher;

    public TestAttemptService(
            TestRepository testRepository,
            TestQuestionRepository questionRepository,
            TestQuestionOptionRepository optionRepository,
            TestQuestionAcceptedAnswerRepository acceptedAnswerRepository,
            TestAttemptRepository attemptRepository,
            TestAttemptAnswerRepository answerRepository,
            TestService testService,
            CurrentUser currentUser,
            TestCalendar calendar,
            TestAiGateway aiGateway,
            LevelRecorder levelRecorder,
            ApplicationEventPublisher eventPublisher) {
        this.testRepository = testRepository;
        this.questionRepository = questionRepository;
        this.optionRepository = optionRepository;
        this.acceptedAnswerRepository = acceptedAnswerRepository;
        this.attemptRepository = attemptRepository;
        this.answerRepository = answerRepository;
        this.testService = testService;
        this.currentUser = currentUser;
        this.calendar = calendar;
        this.aiGateway = aiGateway;
        this.levelRecorder = levelRecorder;
        this.eventPublisher = eventPublisher;
    }

    public StartAttemptResponse start(Long testId, boolean restart) {
        testService.findOpen(testId);
        Long userId = currentUser.id();

        TestAttempt attempt = attemptRepository
                .findFirstByTestIdAndUserIdAndStatusOrderByIdDesc(testId, userId, TestAttemptStatus.IN_PROGRESS)
                .orElse(null);

        if (restart && attempt != null) {
            // Deleting the attempt cascades to its answers (test_attempt_answers.attempt_id ON DELETE CASCADE).
            attemptRepository.delete(attempt);
            attempt = null;
        }

        boolean resumed = attempt != null;
        if (attempt == null) {
            attempt = attemptRepository.save(new TestAttempt(testId, userId));
        }

        return new StartAttemptResponse(attempt.getId(), resumed, attempt.getStatus(), savedAnswers(attempt.getId()));
    }

    public void saveAnswer(Long attemptId, Long questionId, SaveAnswerRequest request) {
        TestAttempt attempt = inProgressOwnedAttempt(attemptId);
        TestQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new InvalidTestAnswerException("Question not found: " + questionId));
        if (!question.getTestId().equals(attempt.getTestId())) {
            throw new InvalidTestAnswerException("Question does not belong to this test");
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
        List<TestQuestion> questions = questionRepository.findByTestIdOrderByIdAsc(test.getId());
        List<Long> questionIds = questions.stream().map(TestQuestion::getId).toList();

        Map<Long, List<TestQuestionOption>> optionsByQuestion = optionsOf(questionIds);
        Map<Long, List<TestQuestionAcceptedAnswer>> acceptedByQuestion = acceptedAnswersOf(questionIds);
        Map<Long, TestAttemptAnswer> answerByQuestion = answerRepository.findByAttemptId(attemptId).stream()
                .collect(Collectors.toMap(TestAttemptAnswer::getQuestionId, Function.identity()));

        Map<TestSkill, Integer> skillPoints = new EnumMap<>(TestSkill.class);
        Map<TestSkill, BigDecimal> skillEarned = new EnumMap<>(TestSkill.class);
        Set<TestSkill> pendingSkills = EnumSet.noneOf(TestSkill.class);

        for (TestQuestion question : questions) {
            TestSkill skill = effectiveSkill(question);
            skillPoints.merge(skill, question.getPoints(), Integer::sum);

            TestAttemptAnswer answer = answerByQuestion.get(question.getId());
            if (answer == null) {
                continue; // unanswered: contributes 0 points, not persisted
            }

            List<TestQuestionOption> options = optionsByQuestion.getOrDefault(question.getId(), List.of());
            List<TestQuestionAcceptedAnswer> accepted = acceptedByQuestion.getOrDefault(question.getId(), List.of());

            if (!options.isEmpty()) {
                boolean correct = gradeOption(answer, options);
                answer.grade(correct, correct ? BigDecimal.valueOf(question.getPoints()) : BigDecimal.ZERO);
            } else if (!accepted.isEmpty()) {
                boolean correct = gradeText(answer, accepted);
                answer.grade(correct, correct ? BigDecimal.valueOf(question.getPoints()) : BigDecimal.ZERO);
            } else if (question.getQuestionType() == TestQuestionType.SPEAKING
                    || question.getQuestionType() == TestQuestionType.WRITING) {
                Optional<Integer> score = gradeAi(question, answer);
                if (score.isPresent()) {
                    answer.grade(null, scaledPoints(question.getPoints(), score.get()));
                } else {
                    answer.grade(null, BigDecimal.ZERO);
                    pendingSkills.add(skill);
                }
            }

            skillEarned.merge(skill, answer.getScoreEarned(), BigDecimal::add);
            answerRepository.save(answer);
        }

        Map<TestSkill, Integer> skillScores = new EnumMap<>(TestSkill.class);
        for (Map.Entry<TestSkill, Integer> entry : skillPoints.entrySet()) {
            if (pendingSkills.contains(entry.getKey())) {
                continue;
            }
            skillScores.put(entry.getKey(), percent(skillEarned.getOrDefault(entry.getKey(), BigDecimal.ZERO), entry.getValue()));
        }

        Instant submittedAt = calendar.now();
        boolean fullyGraded = pendingSkills.isEmpty();
        BigDecimal totalScore = BigDecimal.ZERO;
        CefrLevel suggestedLevel = null;
        String roadmap = null;
        Map<String, Integer> storedSkillScores = Map.of();

        if (fullyGraded) {
            int overall = average(skillScores.values());
            totalScore = BigDecimal.valueOf(overall);
            suggestedLevel = CefrLevels.fromScore(overall);
            roadmap = aiGateway.suggestRoadmap(suggestedLevel, skillScores);
            storedSkillScores = skillScores.entrySet().stream()
                    .collect(Collectors.toMap(entry -> entry.getKey().dbKey(), Map.Entry::getValue));
        }

        attempt.grade(totalScore, fullyGraded ? TestAttemptStatus.GRADED : TestAttemptStatus.SUBMITTED,
                storedSkillScores, suggestedLevel, roadmap, submittedAt);
        attemptRepository.save(attempt);

        if (fullyGraded && test.getType() == TestType.COMPREHENSIVE) {
            Optional<CefrLevel> previous = currentUser.currentLevel();
            if (previous.isEmpty() || previous.get() != suggestedLevel) {
                levelRecorder.recordLevelChange(currentUser.id(), suggestedLevel, attemptId);
            }
        }

        eventPublisher.publishEvent(new TestCompletedEvent(
                currentUser.id(),
                attemptId,
                test.getId(),
                test.getType().name(),
                fullyGraded ? totalScore.intValue() : 0,
                calendar.today(),
                submittedAt));

        return buildResult(attempt);
    }

    @Transactional(readOnly = true)
    public TestResultResponse getResult(Long attemptId) {
        return buildResult(ownedAttempt(attemptId));
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
                .map(question -> effectiveSkill(question))
                .collect(Collectors.toCollection(() -> EnumSet.noneOf(TestSkill.class)));
        Map<String, SkillScoreResponse> skills = new LinkedHashMap<>();
        Map<String, Integer> stored = attempt.getSkillScores();
        for (TestSkill skill : TestSkill.values()) {
            if (!testSkills.contains(skill)) {
                continue;
            }
            Integer score = stored == null ? null : stored.get(skill.dbKey());
            skills.put(skill.apiKey(), new SkillScoreResponse(score, score == null ? null : CefrLevels.fromScore(score)));
        }

        Integer best = null;
        boolean personalBest = false;
        Integer currentScore = attempt.getStatus() == TestAttemptStatus.GRADED ? attempt.getTotalScore().intValue() : null;
        List<TestAttempt> completed = attemptRepository.findByTestIdAndUserIdAndStatusIn(
                test.getId(), currentUser.id(), List.of(TestAttemptStatus.SUBMITTED, TestAttemptStatus.GRADED));
        Integer previousBest = completed.stream()
                .filter(other -> other.getStatus() == TestAttemptStatus.GRADED && !other.getId().equals(attempt.getId()))
                .map(other -> other.getTotalScore().intValue())
                .max(Integer::compareTo)
                .orElse(null);
        if (currentScore != null) {
            best = previousBest == null ? currentScore : Math.max(previousBest, currentScore);
        }
        personalBest = previousBest != null && currentScore != null && currentScore > previousBest;

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
        }

        Boolean correct = answer == null ? (options.isEmpty() && accepted.isEmpty() ? null : false) : answer.getCorrect();

        return new ReviewItemResponse(
                question.getId(),
                question.getQuestionType(),
                correct,
                answer == null ? null : answer.getSelectedOptionId(),
                answer == null ? null : answer.getAnswerContent(),
                correctOptionId,
                correctAnswer,
                question.getPoints(),
                answer == null ? BigDecimal.ZERO : answer.getScoreEarned());
    }

    private List<SavedAnswerResponse> savedAnswers(Long attemptId) {
        return answerRepository.findByAttemptId(attemptId).stream()
                .map(answer -> new SavedAnswerResponse(
                        answer.getQuestionId(), answer.getSelectedOptionId(), answer.getAnswerContent()))
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

    private boolean gradeOption(TestAttemptAnswer answer, List<TestQuestionOption> options) {
        Long selected = answer.getSelectedOptionId();
        return options.stream().anyMatch(option -> option.isCorrect() && option.getId().equals(selected));
    }

    private boolean gradeText(TestAttemptAnswer answer, List<TestQuestionAcceptedAnswer> accepted) {
        String normalized = AnswerNormalizer.normalize(answer.getAnswerContent());
        return accepted.stream().anyMatch(item -> item.getNormalizedAnswer().equals(normalized));
    }

    private Optional<Integer> gradeAi(TestQuestion question, TestAttemptAnswer answer) {
        if (question.getQuestionType() == TestQuestionType.SPEAKING) {
            return aiGateway.gradeSpeaking(question, answer.getAnswerContent());
        }
        return aiGateway.gradeWriting(question, answer.getAnswerContent());
    }

    private static BigDecimal scaledPoints(int points, int score) {
        return BigDecimal.valueOf(points)
                .multiply(BigDecimal.valueOf(score))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    private static int percent(BigDecimal earned, int points) {
        if (points <= 0) {
            return 0;
        }
        return earned.multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(points), 0, RoundingMode.HALF_UP)
                .intValue();
    }

    private static int average(java.util.Collection<Integer> scores) {
        if (scores.isEmpty()) {
            return 0;
        }
        return (int) Math.round(scores.stream().mapToInt(Integer::intValue).average().orElse(0));
    }

    private static TestSkill effectiveSkill(TestQuestion question) {
        if (question.getSkill() != null) {
            return question.getSkill();
        }
        return switch (question.getQuestionType()) {
            case LISTENING -> TestSkill.LISTENING;
            case SPEAKING -> TestSkill.SPEAKING;
            case WRITING -> TestSkill.WRITING;
            case FILL_BLANK -> TestSkill.WRITING;
            case READING, MULTIPLE_CHOICE -> TestSkill.READING;
        };
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
