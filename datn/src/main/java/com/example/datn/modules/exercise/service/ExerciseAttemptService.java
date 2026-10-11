package com.example.datn.modules.exercise.service;

import com.example.datn.common.security.CurrentUser;
import com.example.datn.modules.exercise.dto.request.AnswerQuestionRequest;
import com.example.datn.modules.exercise.dto.request.CompleteAttemptRequest;
import com.example.datn.modules.exercise.dto.response.AnswerResultResponse;
import com.example.datn.modules.exercise.dto.response.AttemptResultResponse;
import com.example.datn.modules.exercise.dto.response.AttemptStartResponse;
import com.example.datn.modules.exercise.dto.response.CurrentAttemptResponse;
import com.example.datn.modules.exercise.dto.response.ExerciseSummaryResponse;
import com.example.datn.modules.exercise.entity.ExerciseAttempt;
import com.example.datn.modules.exercise.entity.ExerciseLesson;
import com.example.datn.modules.exercise.entity.ExerciseQuestion;
import com.example.datn.modules.exercise.entity.ListeningSegment;
import com.example.datn.modules.exercise.entity.QuestionAcceptedAnswer;
import com.example.datn.modules.exercise.entity.QuestionOption;
import com.example.datn.modules.exercise.entity.QuestionResponse;
import com.example.datn.modules.exercise.entity.PronunciationAttempt;
import com.example.datn.modules.exercise.enums.AttemptStatus;
import com.example.datn.modules.exercise.enums.ExerciseSkill;
import com.example.datn.modules.exercise.enums.QuestionType;
import com.example.datn.modules.exercise.exception.AttemptConflictException;
import com.example.datn.modules.exercise.exception.AttemptNotFoundException;
import com.example.datn.modules.exercise.exception.InvalidExerciseRequestException;
import com.example.datn.modules.exercise.repository.ExerciseAttemptRepository;
import com.example.datn.modules.exercise.repository.ExerciseLessonRepository;
import com.example.datn.modules.exercise.repository.ExerciseQuestionRepository;
import com.example.datn.modules.exercise.repository.ListeningPassageRepository;
import com.example.datn.modules.exercise.repository.ListeningSegmentRepository;
import com.example.datn.modules.exercise.repository.PronunciationAttemptRepository;
import com.example.datn.modules.exercise.repository.PronunciationItemRepository;
import com.example.datn.modules.exercise.repository.QuestionAcceptedAnswerRepository;
import com.example.datn.modules.exercise.repository.QuestionOptionRepository;
import com.example.datn.modules.exercise.repository.QuestionResponseRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Service
@Transactional
public class ExerciseAttemptService {
    private final ExerciseAttemptRepository attempts;
    private final ExerciseLessonRepository lessons;
    private final ExerciseQuestionRepository questions;
    private final QuestionOptionRepository options;
    private final QuestionAcceptedAnswerRepository acceptedAnswers;
    private final QuestionResponseRepository responses;
    private final PronunciationAttemptRepository pronunciationAttempts;
    private final PronunciationItemRepository pronunciationItems;
    private final ListeningPassageRepository passages;
    private final ListeningSegmentRepository segments;
    private final ExerciseService exerciseService;
    private final CurrentUser currentUser;
    private final GroqWritingGrader writingGrader;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ExerciseAttemptService(ExerciseAttemptRepository attempts, ExerciseLessonRepository lessons,
            ExerciseQuestionRepository questions, QuestionOptionRepository options,
            QuestionAcceptedAnswerRepository acceptedAnswers, QuestionResponseRepository responses,
            PronunciationAttemptRepository pronunciationAttempts, PronunciationItemRepository pronunciationItems,
            ListeningPassageRepository passages,
            ListeningSegmentRepository segments, ExerciseService exerciseService, CurrentUser currentUser,
            GroqWritingGrader writingGrader) {
        this.attempts = attempts; this.lessons = lessons; this.questions = questions; this.options = options;
        this.acceptedAnswers = acceptedAnswers; this.responses = responses;
        this.pronunciationAttempts = pronunciationAttempts; this.pronunciationItems = pronunciationItems;
        this.passages = passages; this.segments = segments;
        this.exerciseService = exerciseService; this.currentUser = currentUser; this.writingGrader = writingGrader;
    }

    public Started start(Long lessonId, boolean restart) {
        ExerciseLesson lesson = exerciseService.published(lessonId);
        List<ExerciseAttempt> open = attempts.findAllByUserIdAndLessonIdAndStatusOrderByStartedAtDesc(
                currentUser.id(), lessonId, AttemptStatus.IN_PROGRESS);
        if (!restart) {
            for (ExerciseAttempt attempt : open) {
                if (exerciseService.resumableProgress(lesson, attempt) != null) {
                    return new Started(startResponse(attempt, true), HttpStatus.OK);
                }
            }
        }
        open.forEach(ExerciseAttempt::abandon);
        attempts.flush();
        ExerciseAttempt created = attempts.save(new ExerciseAttempt(currentUser.id(), lessonId, Instant.now()));
        return new Started(startResponse(created, false), HttpStatus.CREATED);
    }

    @Transactional(readOnly = true)
    public CurrentAttemptResponse current() {
        CurrentAttemptResponse.Current current = attempts.findAllByUserIdAndStatus(currentUser.id(), AttemptStatus.IN_PROGRESS)
                .stream().map(attempt -> {
                    ExerciseLesson lesson = lessons.findById(attempt.getLessonId()).orElse(null);
                    if (lesson == null) return null;
                    ExerciseSummaryResponse.InProgress progress = exerciseService.resumableProgress(lesson, attempt);
                    return progress == null ? null : new CurrentAttemptResponse.Current(attempt.getId(),
                            new CurrentAttemptResponse.Lesson(lesson.getId(), lesson.getSkill(), lesson.getTitle(),
                                    lesson.getCefrLevel(), exerciseService.itemCount(lesson)),
                            progress.doneCount(), progress.lastActivityAt());
                }).filter(Objects::nonNull)
                .max(Comparator.comparing(CurrentAttemptResponse.Current::lastActivityAt)).orElse(null);
        return new CurrentAttemptResponse(current);
    }

    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public AnswerResultResponse answer(Long attemptId, AnswerQuestionRequest request) {
        ExerciseAttempt attempt = ownedInProgress(attemptId);
        ExerciseLesson lesson = exerciseService.published(attempt.getLessonId());
        if (lesson.getSkill() == ExerciseSkill.WRITING) {
            return gradeWritingAndSave(attempt, request);
        }
        if (lesson.getSkill() != ExerciseSkill.GRAMMAR) {
            throw new InvalidExerciseRequestException("Only reading and writing questions are graded one at a time");
        }
        return gradeAndSave(attempt, request);
    }

    public AttemptResultResponse complete(Long attemptId, CompleteAttemptRequest request) {
        ExerciseAttempt attempt = ownedInProgress(attemptId);
        ExerciseLesson lesson = exerciseService.published(attempt.getLessonId());
        if (lesson.getSkill() == ExerciseSkill.WRITING && !request.safeResponses().isEmpty()) {
            throw new InvalidExerciseRequestException("Submit writing answers through the responses endpoint first");
        }
        for (AnswerQuestionRequest pending : request.safeResponses()) gradeAndSave(attempt, pending);

        if (lesson.getSkill() == ExerciseSkill.PRONUNCIATION) {
            return completePronunciation(attempt, lesson, request.playbackRate());
        }

        List<ExerciseQuestion> lessonQuestions = questions.findAllByLessonIdOrderBySortOrderAscIdAsc(lesson.getId());
        List<QuestionResponse> saved = responses.findAllByAttemptIdOrderByAnsweredAtAscIdAsc(attemptId);
        if (lesson.getSkill() == ExerciseSkill.WRITING
                && (saved.size() != lessonQuestions.size() || saved.stream().anyMatch(response -> !response.isGraded()))) {
            throw new AttemptConflictException("Every writing answer must be graded before completing the attempt");
        }
        BigDecimal total = lessonQuestions.stream().map(ExerciseQuestion::getPoints)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal earned = saved.stream().map(QuestionResponse::getAwardedPoints).filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        int percent = total.signum() == 0 ? 0 : earned.multiply(BigDecimal.valueOf(100))
                .divide(total, 0, RoundingMode.HALF_UP).intValue();
        List<ExerciseAttempt> previous = attempts.findAllByUserIdAndLessonIdAndStatus(
                currentUser.id(), lesson.getId(), AttemptStatus.COMPLETED);
        Integer previousBest = previous.stream().map(ExerciseAttempt::getScorePercent)
                .mapToInt(Number::intValue).max().stream().boxed().findFirst().orElse(null);
        boolean personalBest = previousBest != null && percent > previousBest;
        int best = previousBest == null ? percent : Math.max(previousBest, percent);
        attempt.complete(request.playbackRate(), total, earned, BigDecimal.valueOf(percent), Instant.now());

        List<AnswerResultResponse> review = lessonQuestions.stream().map(question -> saved.stream()
                .filter(response -> response.getQuestionId().equals(question.getId())).findFirst()
                .map(response -> result(question, response)).orElseGet(() -> unanswered(question))).toList();
        long correctCount = lesson.getSkill() == ExerciseSkill.WRITING
                ? lessonQuestions.stream().filter(question -> saved.stream()
                    .filter(response -> response.getQuestionId().equals(question.getId()))
                    .map(QuestionResponse::getAwardedPoints).filter(Objects::nonNull)
                    .anyMatch(points -> points.compareTo(question.getPoints()) >= 0)).count()
                : saved.stream().filter(QuestionResponse::isCorrect).count();
        List<AttemptResultResponse.Translation> translations = passages.findByLessonId(lesson.getId())
                .map(passage -> segments.findAllByPassageIdOrderByOrderAscIdAsc(passage.getId()).stream()
                        .map(segment -> new AttemptResultResponse.Translation(segment.getId(), segment.getTranslationVi()))
                        .toList()).orElse(List.of());
        return new AttemptResultResponse(attemptId, lesson.getId(), correctCount,
                lessonQuestions.size(), earned, total, percent, best, personalBest, review, translations, null);
    }

    private AttemptResultResponse completePronunciation(
            ExerciseAttempt attempt, ExerciseLesson lesson, BigDecimal playbackRate) {
        List<PronunciationAttempt> assessed = pronunciationAttempts.findAllByAttemptId(attempt.getId());
        List<BigDecimal> bestScores = assessed.stream()
                .collect(java.util.stream.Collectors.groupingBy(PronunciationAttempt::getPronunciationItemId,
                        java.util.stream.Collectors.mapping(PronunciationAttempt::getOverallScore,
                                java.util.stream.Collectors.collectingAndThen(
                                        java.util.stream.Collectors.toList(), values -> values.stream()
                                                .filter(Objects::nonNull).max(BigDecimal::compareTo)
                                                .orElse(BigDecimal.ZERO)))))
                .values().stream().toList();
        long itemCount = pronunciationItems.countByLessonId(lesson.getId());
        BigDecimal earned = bestScores.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal total = BigDecimal.valueOf(itemCount * 100L);
        int percent = total.signum() == 0 ? 0 : earned.multiply(BigDecimal.valueOf(100))
                .divide(total, 0, RoundingMode.HALF_UP).intValue();
        int average = bestScores.isEmpty() ? 0 : earned
                .divide(BigDecimal.valueOf(bestScores.size()), 0, RoundingMode.HALF_UP).intValue();
        List<ExerciseAttempt> previous = attempts.findAllByUserIdAndLessonIdAndStatus(
                currentUser.id(), lesson.getId(), AttemptStatus.COMPLETED);
        Integer previousBest = previous.stream().map(ExerciseAttempt::getScorePercent)
                .mapToInt(Number::intValue).max().stream().boxed().findFirst().orElse(null);
        boolean personalBest = previousBest != null && percent > previousBest;
        int best = previousBest == null ? percent : Math.max(previousBest, percent);
        attempt.complete(playbackRate, total, earned, BigDecimal.valueOf(percent), Instant.now());
        return new AttemptResultResponse(attempt.getId(), lesson.getId(), bestScores.size(), itemCount,
                earned, total, percent, best, personalBest, List.of(), List.of(),
                new AttemptResultResponse.PronunciationSummary(average, bestScores.size(), itemCount));
    }

    private AnswerResultResponse gradeAndSave(ExerciseAttempt attempt, AnswerQuestionRequest request) {
        if (request == null || request.questionId() == null) {
            throw new InvalidExerciseRequestException("questionId is required");
        }
        if (responses.findByAttemptIdAndQuestionId(attempt.getId(), request.questionId()).isPresent()) {
            throw new AttemptConflictException("Question was already answered in this attempt");
        }
        ExerciseQuestion question = questions.findById(request.questionId())
                .filter(item -> item.getLessonId().equals(attempt.getLessonId()))
                .orElseThrow(() -> new InvalidExerciseRequestException("Question does not belong to this lesson"));
        boolean hasOption = request.optionId() != null;
        boolean hasAnswer = request.answer() != null && !request.answer().isBlank();
        if (hasOption == hasAnswer) {
            throw new InvalidExerciseRequestException("Send exactly one of optionId or answer");
        }

        Long optionId = null;
        String entered = null;
        String normalized = null;
        boolean correct;
        if (question.getQuestionType() == QuestionType.MULTIPLE_CHOICE) {
            if (!hasOption) throw new InvalidExerciseRequestException("optionId is required for multiple choice");
            QuestionOption selected = options.findByIdAndQuestionId(request.optionId(), question.getId())
                    .orElseThrow(() -> new InvalidExerciseRequestException("Option does not belong to this question"));
            optionId = selected.getId();
            correct = selected.isCorrect();
        } else {
            if (!hasAnswer) throw new InvalidExerciseRequestException("answer is required for fill blank");
            entered = request.answer();
            normalized = AnswerNormalizer.normalize(entered);
            String normalizedForComparison = normalized;
            correct = acceptedAnswers.findAllByQuestionId(question.getId()).stream()
                    .anyMatch(answer -> answer.getNormalizedAnswer().equals(normalizedForComparison));
        }
        QuestionResponse saved = responses.save(new QuestionResponse(attempt.getId(), attempt.getLessonId(),
                question.getId(), optionId, entered, normalized, correct,
                correct ? question.getPoints() : BigDecimal.ZERO, Instant.now()));
        return result(question, saved);
    }

    private AnswerResultResponse gradeWritingAndSave(ExerciseAttempt attempt, AnswerQuestionRequest request) {
        if (request == null || request.questionId() == null || request.answer() == null || request.answer().isBlank()) {
            throw new InvalidExerciseRequestException("questionId and a non-empty answer are required");
        }
        if (responses.findByAttemptIdAndQuestionId(attempt.getId(), request.questionId()).isPresent()) {
            throw new AttemptConflictException("Question was already answered in this attempt");
        }
        ExerciseQuestion question = questions.findById(request.questionId())
                .filter(item -> item.getLessonId().equals(attempt.getLessonId()))
                .orElseThrow(() -> new InvalidExerciseRequestException("Question does not belong to this lesson"));
        if (!isWritingType(question.getQuestionType())) {
            throw new InvalidExerciseRequestException("This question is not a writing question");
        }

        QuestionResponse saved = new QuestionResponse(attempt.getId(), attempt.getLessonId(), question.getId(),
                request.answer().strip(), Instant.now());
        // Commit the learner's answer before the network call, so an AI timeout never loses their work.
        QuestionResponse response = responses.save(saved);
        writingGrader.grade(question, request.answer().strip()).ifPresent(grade -> {
            BigDecimal awarded = question.getPoints().multiply(BigDecimal.valueOf(grade.scorePercent()))
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            JsonNode samples = objectMapper.valueToTree(grade.sampleAnswers());
            response.applyAiGrade(awarded, grade.feedback(), grade.explanation(), samples, grade.translationAssessment());
        });
        return result(question, responses.save(response));
    }

    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public AnswerResultResponse regrade(Long attemptId, Long questionId) {
        ExerciseAttempt attempt = ownedInProgress(attemptId);
        ExerciseLesson lesson = exerciseService.published(attempt.getLessonId());
        if (lesson.getSkill() != ExerciseSkill.WRITING) {
            throw new InvalidExerciseRequestException("Only writing answers can be graded again");
        }
        QuestionResponse saved = responses.findByAttemptIdAndQuestionId(attemptId, questionId)
                .orElseThrow(() -> new InvalidExerciseRequestException("Answer has not been submitted"));
        ExerciseQuestion question = questions.findById(questionId)
                .orElseThrow(() -> new InvalidExerciseRequestException("Question does not belong to this lesson"));
        if (!question.getLessonId().equals(lesson.getId()) || !isWritingType(question.getQuestionType())) {
            throw new InvalidExerciseRequestException("Question does not belong to this writing lesson");
        }
        writingGrader.grade(question, saved.getEnteredAnswer()).ifPresentOrElse(grade -> {
            BigDecimal awarded = question.getPoints().multiply(BigDecimal.valueOf(grade.scorePercent()))
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            saved.applyAiGrade(awarded, grade.feedback(), grade.explanation(),
                    objectMapper.valueToTree(grade.sampleAnswers()), grade.translationAssessment());
        }, saved::markUngraded);
        return result(question, responses.save(saved));
    }

    private static boolean isWritingType(QuestionType type) {
        return type == QuestionType.TRANSLATION || type == QuestionType.REWRITE
                || type == QuestionType.KEYWORD_SENTENCE || type == QuestionType.PARAGRAPH_TRANSLATION;
    }

    private AnswerResultResponse result(ExerciseQuestion question, QuestionResponse response) {
        if (isWritingType(question.getQuestionType())) {
            return new AnswerResultResponse(question.getId(), response.isGraded(), null,
                    response.getSelectedOptionId(), response.getEnteredAnswer(), null, null,
                    response.getAiExplanation() == null ? question.getExplanation() : response.getAiExplanation(),
                    response.getAwardedPoints(), question.getPoints(), response.getFeedback(),
                    jsonStrings(response.getSampleAnswers()), response.getAiAssessment());
        }
        QuestionOption correctOption = options.findFirstByQuestionIdAndCorrectTrueOrderBySortOrderAscIdAsc(question.getId())
                .orElse(null);
        String correctAnswer = correctOption != null ? correctOption.getOptionText()
                : acceptedAnswers.findFirstByQuestionIdAndPrimaryTrueOrderByIdAsc(question.getId())
                    .map(QuestionAcceptedAnswer::getAnswerText).orElse(null);
        return new AnswerResultResponse(question.getId(), true, response.getCorrect(), response.getSelectedOptionId(),
                response.getEnteredAnswer(), correctOption == null ? null : correctOption.getId(), correctAnswer,
                question.getExplanation(), response.getAwardedPoints(), question.getPoints(), null, List.of(), null);
    }

    private AnswerResultResponse unanswered(ExerciseQuestion question) {
        QuestionOption correctOption = options.findFirstByQuestionIdAndCorrectTrueOrderBySortOrderAscIdAsc(question.getId())
                .orElse(null);
        String answer = correctOption != null ? correctOption.getOptionText()
                : acceptedAnswers.findFirstByQuestionIdAndPrimaryTrueOrderByIdAsc(question.getId())
                    .map(QuestionAcceptedAnswer::getAnswerText).orElse(null);
        return new AnswerResultResponse(question.getId(), true, false, null, null,
                correctOption == null ? null : correctOption.getId(), answer, question.getExplanation(), BigDecimal.ZERO,
                question.getPoints(), null, List.of(), null);
    }

    private List<String> jsonStrings(JsonNode node) {
        if (node == null || !node.isArray()) return List.of();
        List<String> values = new ArrayList<>();
        node.forEach(item -> { if (item.isString()) values.add(item.asString()); });
        return values;
    }

    private ExerciseAttempt ownedInProgress(Long id) {
        ExerciseAttempt attempt = attempts.findById(id)
                .filter(item -> item.getUserId().equals(currentUser.id()))
                .orElseThrow(() -> new AttemptNotFoundException(id));
        if (attempt.getStatus() != AttemptStatus.IN_PROGRESS) {
            throw new AttemptConflictException("Exercise attempt is no longer in progress");
        }
        return attempt;
    }

    private AttemptStartResponse startResponse(ExerciseAttempt attempt, boolean resumed) {
        List<AnswerResultResponse> answered = new ArrayList<>();
        for (QuestionResponse response : responses.findAllByAttemptIdOrderByAnsweredAtAscIdAsc(attempt.getId())) {
            questions.findById(response.getQuestionId()).ifPresent(question -> answered.add(result(question, response)));
        }
        return new AttemptStartResponse(attempt.getId(), attempt.getStartedAt(), resumed, answered, List.of());
    }

    public record Started(AttemptStartResponse body, HttpStatus status) {}
}
