package com.example.datn.modules.exercise.service;

import com.example.datn.common.security.CurrentUser;
import com.example.datn.modules.exercise.dto.response.ExerciseDetailResponse;
import com.example.datn.modules.exercise.dto.response.ExerciseSummaryResponse;
import com.example.datn.modules.exercise.entity.ExerciseAttempt;
import com.example.datn.modules.exercise.entity.ExerciseLesson;
import com.example.datn.modules.exercise.entity.ExerciseQuestion;
import com.example.datn.modules.exercise.entity.ListeningPassage;
import com.example.datn.modules.exercise.entity.QuestionOption;
import com.example.datn.modules.exercise.enums.AttemptStatus;
import com.example.datn.modules.exercise.enums.ExerciseSkill;
import com.example.datn.modules.exercise.enums.PublicationStatus;
import com.example.datn.modules.exercise.exception.ExerciseNotFoundException;
import com.example.datn.modules.exercise.mapper.ExerciseMapper;
import com.example.datn.modules.exercise.repository.ExerciseAttemptRepository;
import com.example.datn.modules.exercise.repository.ExerciseLessonRepository;
import com.example.datn.modules.exercise.repository.ExerciseQuestionRepository;
import com.example.datn.modules.exercise.repository.ListeningPassageRepository;
import com.example.datn.modules.exercise.repository.ListeningSegmentRepository;
import com.example.datn.modules.exercise.repository.PronunciationAttemptRepository;
import com.example.datn.modules.exercise.repository.PronunciationItemRepository;
import com.example.datn.modules.exercise.repository.QuestionOptionRepository;
import com.example.datn.modules.exercise.repository.QuestionResponseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ExerciseService {
    private final ExerciseLessonRepository lessons;
    private final ExerciseQuestionRepository questions;
    private final QuestionOptionRepository options;
    private final ListeningPassageRepository passages;
    private final ListeningSegmentRepository segments;
    private final PronunciationItemRepository pronunciationItems;
    private final ExerciseAttemptRepository attempts;
    private final QuestionResponseRepository responses;
    private final PronunciationAttemptRepository pronunciationAttempts;
    private final ExerciseMapper mapper;
    private final CurrentUser currentUser;

    public ExerciseService(ExerciseLessonRepository lessons, ExerciseQuestionRepository questions,
            QuestionOptionRepository options, ListeningPassageRepository passages,
            ListeningSegmentRepository segments, PronunciationItemRepository pronunciationItems,
            ExerciseAttemptRepository attempts, QuestionResponseRepository responses,
            PronunciationAttemptRepository pronunciationAttempts, ExerciseMapper mapper, CurrentUser currentUser) {
        this.lessons = lessons; this.questions = questions; this.options = options; this.passages = passages;
        this.segments = segments; this.pronunciationItems = pronunciationItems; this.attempts = attempts;
        this.responses = responses; this.pronunciationAttempts = pronunciationAttempts; this.mapper = mapper;
        this.currentUser = currentUser;
    }

    public List<ExerciseSummaryResponse> findAll(ExerciseSkill skill) {
        return lessons.findAllBySkillAndPublicationStatusOrderByCefrLevelAscSortOrderAscIdAsc(
                        skill, PublicationStatus.PUBLISHED).stream()
                .filter(lesson -> itemCount(lesson) > 0)
                .map(this::summary).toList();
    }

    public ExerciseDetailResponse findById(Long id) {
        ExerciseLesson lesson = published(id);
        List<ExerciseQuestion> lessonQuestions = questions.findAllByLessonIdOrderBySortOrderAscIdAsc(id);
        List<Long> questionIds = lessonQuestions.stream().map(ExerciseQuestion::getId).toList();
        Map<Long, List<QuestionOption>> optionMap = questionIds.isEmpty() ? Map.of()
                : options.findAllByQuestionIdInOrderBySortOrderAscIdAsc(questionIds).stream()
                    .collect(Collectors.groupingBy(QuestionOption::getQuestionId));
        ListeningPassage passage = passages.findByLessonId(id).orElse(null);
        return mapper.toDetail(lesson, lessonQuestions, optionMap, passage,
                passage == null ? List.of() : segments.findAllByPassageIdOrderByOrderAscIdAsc(passage.getId()),
                pronunciationItems.findAllByLessonIdOrderBySortOrderAscIdAsc(id));
    }

    public ExerciseLesson published(Long id) {
        ExerciseLesson lesson = lessons.findById(id).orElseThrow(() -> new ExerciseNotFoundException(id));
        if (lesson.getPublicationStatus() != PublicationStatus.PUBLISHED || itemCount(lesson) == 0) {
            throw new ExerciseNotFoundException(id);
        }
        return lesson;
    }

    public long itemCount(ExerciseLesson lesson) {
        return lesson.getSkill() == ExerciseSkill.PRONUNCIATION
                ? pronunciationItems.countByLessonId(lesson.getId()) : questions.countByLessonId(lesson.getId());
    }

    private ExerciseSummaryResponse summary(ExerciseLesson lesson) {
        List<ExerciseAttempt> completed = attempts.findAllByUserIdAndLessonIdAndStatus(
                currentUser.id(), lesson.getId(), AttemptStatus.COMPLETED);
        Integer best = completed.stream().map(ExerciseAttempt::getScorePercent).filter(Objects::nonNull)
                .mapToInt(Number::intValue).max().stream().boxed().findFirst().orElse(null);
        Instant lastCompleted = completed.stream().map(ExerciseAttempt::getFinishedAt).filter(Objects::nonNull)
                .max(Instant::compareTo).orElse(null);
        ExerciseSummaryResponse.InProgress inProgress = attempts
                .findAllByUserIdAndLessonIdAndStatusOrderByStartedAtDesc(
                        currentUser.id(), lesson.getId(), AttemptStatus.IN_PROGRESS).stream()
                .map(attempt -> resumableProgress(lesson, attempt)).filter(Objects::nonNull).findFirst().orElse(null);
        return new ExerciseSummaryResponse(lesson.getId(), lesson.getSkill(), lesson.getTitle(), lesson.getDescription(),
                lesson.getTopic(), lesson.getCefrLevel(), lesson.getDifficulty(), lesson.getEstimatedMinutes(),
                itemCount(lesson), new ExerciseSummaryResponse.Progress(completed.size(), best, lastCompleted, inProgress));
    }

    ExerciseSummaryResponse.InProgress resumableProgress(ExerciseLesson lesson, ExerciseAttempt attempt) {
        if (lesson.getSkill() == ExerciseSkill.LISTENING || lesson.getUpdatedAt().isAfter(attempt.getStartedAt())) return null;
        long done = lesson.getSkill() == ExerciseSkill.GRAMMAR ? responses.countByAttemptId(attempt.getId())
                : pronunciationAttempts.findAllByAttemptId(attempt.getId()).stream()
                    .map(item -> item.getPronunciationItemId()).distinct().count();
        if (done == 0) return null;
        Instant last = lesson.getSkill() == ExerciseSkill.GRAMMAR
                ? responses.findFirstByAttemptIdOrderByAnsweredAtDescIdDesc(attempt.getId())
                    .map(item -> item.getAnsweredAt()).orElse(attempt.getStartedAt())
                : pronunciationAttempts.findFirstByAttemptIdOrderByAssessedAtDescIdDesc(attempt.getId())
                    .map(item -> item.getAssessedAt()).orElse(attempt.getStartedAt());
        if (last.isBefore(Instant.now().minusSeconds(7L * 24 * 60 * 60))) return null;
        return new ExerciseSummaryResponse.InProgress(attempt.getId(), done, last);
    }
}
