package com.example.datn.modules.vocabulary.service;

import com.example.datn.common.dto.PageResponse;
import com.example.datn.common.event.WordReviewedEvent;
import com.example.datn.common.security.CurrentUser;
import com.example.datn.modules.vocabulary.dto.request.ReviewRequest;
import com.example.datn.modules.vocabulary.dto.response.LearningCardResponse;
import com.example.datn.modules.vocabulary.dto.response.LearningSummaryResponse;
import com.example.datn.modules.vocabulary.dto.response.LearningSummaryResponse.DayCount;
import com.example.datn.modules.vocabulary.dto.response.ReviewResponse;
import com.example.datn.modules.vocabulary.dto.response.StudySessionResponse;
import com.example.datn.modules.vocabulary.dto.response.StudySessionResponse.Source;
import com.example.datn.modules.vocabulary.entity.Topic;
import com.example.datn.modules.vocabulary.entity.UserVocabulary;
import com.example.datn.modules.vocabulary.entity.Vocabulary;
import com.example.datn.modules.vocabulary.enums.LearningStatus;
import com.example.datn.modules.vocabulary.enums.ReviewResult;
import com.example.datn.modules.vocabulary.enums.SessionType;
import com.example.datn.modules.vocabulary.exception.ConcurrentReviewException;
import com.example.datn.modules.vocabulary.exception.InvalidSessionRequestException;
import com.example.datn.modules.vocabulary.exception.ListNotFoundException;
import com.example.datn.modules.vocabulary.exception.TopicNotFoundException;
import com.example.datn.modules.vocabulary.exception.VocabularyNotFoundException;
import com.example.datn.modules.vocabulary.mapper.LearningCardMapper;
import com.example.datn.modules.vocabulary.repository.DueDateCount;
import com.example.datn.modules.vocabulary.repository.LearningCounts;
import com.example.datn.modules.vocabulary.repository.TopicRepository;
import com.example.datn.modules.vocabulary.repository.UserVocabularyRepository;
import com.example.datn.modules.vocabulary.repository.VocabularyRepository;
import com.example.datn.modules.vocabulary.repository.WordProgress;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

/** Flashcard sessions, reviews and review statistics of the current user (docs/api/learning.md). */
@Service
@Transactional
public class LearningService {

    /** Days listed in the "upcoming reviews" part of the summary, starting tomorrow. */
    static final int UPCOMING_DAYS = 7;

    private final TopicRepository topicRepository;
    private final VocabularyRepository vocabularyRepository;
    private final UserVocabularyRepository progressRepository;
    private final ReviewScheduler scheduler;
    private final StudyCalendar calendar;
    private final CurrentUser currentUser;
    private final LearningCardMapper mapper;
    private final ApplicationEventPublisher events;

    public LearningService(
            TopicRepository topicRepository,
            VocabularyRepository vocabularyRepository,
            UserVocabularyRepository progressRepository,
            ReviewScheduler scheduler,
            StudyCalendar calendar,
            CurrentUser currentUser,
            LearningCardMapper mapper,
            ApplicationEventPublisher events) {
        this.topicRepository = topicRepository;
        this.vocabularyRepository = vocabularyRepository;
        this.progressRepository = progressRepository;
        this.scheduler = scheduler;
        this.calendar = calendar;
        this.currentUser = currentUser;
        this.mapper = mapper;
        this.events = events;
    }

    /**
     * Up to {@code size} cards: the due words first (VAGUE first, then the longest overdue), then, for a topic, the
     * words never studied, easiest first. Words learned but not yet due are left out. Without a topic or list, only
     * the due words of every topic and list (review mode).
     */
    @Transactional(readOnly = true)
    public StudySessionResponse session(Long topicId, Long listId, int size) {
        if (topicId != null && listId != null) {
            throw new InvalidSessionRequestException("Send topicId or listId, not both");
        }
        if (listId != null) {
            // Personal lists come with Phase 4 (docs/api/custom-lists.md); until then no list exists.
            throw new ListNotFoundException(listId);
        }
        Long userId = currentUser.id();
        LocalDate today = calendar.today();
        if (topicId == null) {
            return new StudySessionResponse(new Source(SessionType.DUE, null, null), dueCards(userId, null, today, size));
        }

        Topic topic = topicRepository.findById(topicId).orElseThrow(() -> new TopicNotFoundException(topicId));
        List<LearningCardResponse> cards = new ArrayList<>(dueCards(userId, topicId, today, size));
        if (cards.size() < size) {
            vocabularyRepository
                    .findNewInTopic(topicId, userId, LearningStatus.NEW, PageRequest.of(0, size - cards.size()))
                    .forEach(word -> cards.add(mapper.toCard(word, null)));
        }
        return new StudySessionResponse(new Source(SessionType.TOPIC, topic.getId(), topic.getName()), cards);
    }

    /**
     * Saves one rating right away (a learner who leaves mid-session keeps the cards already rated), schedules the
     * next review and publishes a {@link WordReviewedEvent}.
     */
    public ReviewResponse review(ReviewRequest request) {
        Long userId = currentUser.id();
        Vocabulary word = vocabularyRepository.findById(request.vocabularyId())
                .filter(candidate -> candidate.isVisibleTo(userId))
                .orElseThrow(() -> new VocabularyNotFoundException(request.vocabularyId()));

        UserVocabulary progress = progressRepository.findByUserIdAndVocabularyId(userId, word.getId())
                .orElseGet(() -> new UserVocabulary(userId, word.getId()));
        boolean firstReview = progress.isFirstReview();
        LocalDate today = calendar.today();
        Instant now = calendar.now();
        ReviewResult result = request.result();
        ScheduledReview next = scheduler.schedule(progress.getIntervalDays(), result, today);
        progress.recordReview(result, next.status(), next.intervalDays(), next.nextReviewAt(), now);
        if (progress.getId() == null) {
            insert(progress);
        }

        events.publishEvent(new WordReviewedEvent(
                userId, word.getId(), result.name(), next.status().name(), firstReview, today, now));
        return mapper.toReviewResponse(progress);
    }

    @Transactional(readOnly = true)
    public LearningSummaryResponse summary() {
        Long userId = currentUser.id();
        LocalDate today = calendar.today();
        LearningCounts counts = progressRepository.countSummary(
                userId,
                today,
                LearningStatus.LEARNING,
                LearningStatus.MASTERED,
                calendar.startOf(today),
                calendar.startOf(today.plusDays(1)));

        Map<LocalDate, Long> dueByDay = progressRepository
                .countDueByDay(userId, today.plusDays(1), today.plusDays(UPCOMING_DAYS))
                .stream()
                .collect(Collectors.toMap(DueDateCount::date, DueDateCount::count));
        List<DayCount> upcoming = IntStream.rangeClosed(1, UPCOMING_DAYS)
                .mapToObj(today::plusDays)
                .map(day -> new DayCount(day, dueByDay.getOrDefault(day, 0L)))
                .toList();

        return new LearningSummaryResponse(
                counts.dueToday(), counts.learningCount(), counts.masteredCount(), counts.reviewedToday(), upcoming);
    }

    /** Words reviewed at least once, latest first; the filters give the same totals as {@link #summary()}. */
    @Transactional(readOnly = true)
    public PageResponse<LearningCardResponse> history(LearningStatus status, boolean reviewedToday, int page, int size) {
        LocalDate today = calendar.today();
        Page<WordProgress> words = progressRepository.findHistory(
                currentUser.id(),
                status,
                reviewedToday,
                calendar.startOf(today),
                calendar.startOf(today.plusDays(1)),
                PageRequest.of(page, size));
        return PageResponse.from(words, mapper::toCard);
    }

    private List<LearningCardResponse> dueCards(Long userId, Long topicId, LocalDate today, int size) {
        return progressRepository.findDue(userId, topicId, today, ReviewResult.VAGUE, PageRequest.of(0, size)).stream()
                .map(mapper::toCard)
                .toList();
    }

    /**
     * Inserts the first progress row of a word. Flushing here makes a concurrent first review of the same word (two
     * browser tabs) fail on the unique (user_id, vocabulary_id) constraint now, where it can be answered with 409.
     */
    private void insert(UserVocabulary progress) {
        try {
            progressRepository.saveAndFlush(progress);
        } catch (DataIntegrityViolationException exception) {
            throw new ConcurrentReviewException(progress.getVocabularyId(), exception);
        }
    }
}
