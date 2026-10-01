package com.example.datn.modules.vocabulary.service;

import com.example.datn.common.dto.PageResponse;
import com.example.datn.common.event.WordReviewedEvent;
import com.example.datn.common.security.CurrentUser;
import com.example.datn.modules.vocabulary.dto.request.ReviewRequest;
import com.example.datn.modules.vocabulary.dto.response.LearningCardResponse;
import com.example.datn.modules.vocabulary.dto.response.LearningSummaryResponse;
import com.example.datn.modules.vocabulary.dto.response.LearningSummaryResponse.DayCount;
import com.example.datn.modules.vocabulary.dto.response.ReviewResponse;
import com.example.datn.modules.vocabulary.dto.response.SessionSummaryResponse;
import com.example.datn.modules.vocabulary.dto.response.SessionSummaryResponse.DueTomorrow;
import com.example.datn.modules.vocabulary.dto.response.StudySessionResponse;
import com.example.datn.modules.vocabulary.dto.response.StudySessionResponse.Source;
import com.example.datn.modules.vocabulary.entity.CustomVocabularyList;
import com.example.datn.modules.vocabulary.entity.Topic;
import com.example.datn.modules.vocabulary.entity.UserVocabulary;
import com.example.datn.modules.vocabulary.entity.Vocabulary;
import com.example.datn.modules.vocabulary.entity.VocabularyReview;
import com.example.datn.modules.vocabulary.enums.LearningStatus;
import com.example.datn.modules.vocabulary.enums.ReviewResult;
import com.example.datn.modules.vocabulary.enums.SessionType;
import com.example.datn.modules.vocabulary.exception.ConcurrentReviewException;
import com.example.datn.modules.vocabulary.exception.InvalidSessionRequestException;
import com.example.datn.modules.vocabulary.exception.TopicNotFoundException;
import com.example.datn.modules.vocabulary.exception.VocabularyNotFoundException;
import com.example.datn.modules.vocabulary.mapper.LearningCardMapper;
import com.example.datn.modules.vocabulary.repository.DueDateCount;
import com.example.datn.modules.vocabulary.repository.LearningCounts;
import com.example.datn.modules.vocabulary.repository.ResultCount;
import com.example.datn.modules.vocabulary.repository.TopicRepository;
import com.example.datn.modules.vocabulary.repository.UserVocabularyRepository;
import com.example.datn.modules.vocabulary.repository.VocabularyRepository;
import com.example.datn.modules.vocabulary.repository.VocabularyReviewRepository;
import com.example.datn.modules.vocabulary.repository.WordProgress;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.EnumMap;
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

    /** Words named in the "due tomorrow" line of the session summary; the count covers them all. */
    static final int DUE_TOMORROW_WORDS = 20;

    private final TopicRepository topicRepository;
    private final VocabularyRepository vocabularyRepository;
    private final UserVocabularyRepository progressRepository;
    private final VocabularyReviewRepository reviewRepository;
    private final ReviewScheduler scheduler;
    private final StudyCalendar calendar;
    private final CurrentUser currentUser;
    private final LearningCardMapper mapper;
    private final ApplicationEventPublisher events;
    private final CustomListService customListService;

    public LearningService(
            TopicRepository topicRepository,
            VocabularyRepository vocabularyRepository,
            UserVocabularyRepository progressRepository,
            VocabularyReviewRepository reviewRepository,
            ReviewScheduler scheduler,
            StudyCalendar calendar,
            CurrentUser currentUser,
            LearningCardMapper mapper,
            ApplicationEventPublisher events,
            CustomListService customListService) {
        this.topicRepository = topicRepository;
        this.vocabularyRepository = vocabularyRepository;
        this.progressRepository = progressRepository;
        this.reviewRepository = reviewRepository;
        this.scheduler = scheduler;
        this.calendar = calendar;
        this.currentUser = currentUser;
        this.mapper = mapper;
        this.events = events;
        this.customListService = customListService;
    }

    /**
     * The cards of a session (Business model, "Học flashcard theo chủ đề"): the due words first, by the latest rating
     * (FORGOT, VAGUE, then REMEMBERED) and then the longest overdue, followed, for a topic or a personal list, by the
     * words never studied, easiest first. Words learned but not yet due are left out. Without a topic or list, only the
     * due words of every topic and list (review mode, scenario 6). Every card goes in, unless {@code size} is given.
     *
     * @param size at most this many cards, or null for all of them
     */
    @Transactional(readOnly = true)
    public StudySessionResponse session(Long topicId, Long listId, Integer size) {
        if (topicId != null && listId != null) {
            throw new InvalidSessionRequestException("Send topicId or listId, not both");
        }
        Long userId = currentUser.id();
        LocalDate today = calendar.today();
        Instant startedAt = calendar.now();
        if (listId != null) {
            CustomVocabularyList list = customListService.requireOwnList(listId);
            List<LearningCardResponse> cards = new ArrayList<>(dueCards(userId, null, list.getId(), today, size));
            if (size == null || cards.size() < size) {
                vocabularyRepository
                        .findNewInList(list.getId(), userId, LearningStatus.NEW, upTo(size, cards.size()))
                        .forEach(word -> cards.add(mapper.toCard(word, null)));
            }
            return new StudySessionResponse(new Source(SessionType.LIST, list.getId(), list.getName()), startedAt, cards);
        }
        if (topicId == null) {
            return new StudySessionResponse(
                    new Source(SessionType.DUE, null, null), startedAt, dueCards(userId, null, null, today, size));
        }

        Topic topic = topicRepository.findById(topicId).orElseThrow(() -> new TopicNotFoundException(topicId));
        List<LearningCardResponse> cards = new ArrayList<>(dueCards(userId, topicId, null, today, size));
        if (size == null || cards.size() < size) {
            vocabularyRepository
                    .findNewInTopic(topicId, userId, LearningStatus.NEW, upTo(size, cards.size()))
                    .forEach(word -> cards.add(mapper.toCard(word, null)));
        }
        return new StudySessionResponse(new Source(SessionType.TOPIC, topic.getId(), topic.getName()), startedAt, cards);
    }

    /**
     * Saves one rating right away (a learner who leaves mid-session keeps the cards already rated): a review row (the
     * "Lượt ôn từ") and the word's new state, with the next review scheduled by {@link ReviewScheduler}. Then publishes
     * a {@link WordReviewedEvent}.
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
        reviewRepository.save(new VocabularyReview(progress.getId(), result, now));

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

    /**
     * The summary card of a session (scenario 5 step 14, scenario 6 step 5): the ratings given since {@code since}
     * (the session's {@code startedAt}), per rating, and the words due tomorrow, those due today and not reviewed yet
     * included, since they will still be due then.
     */
    @Transactional(readOnly = true)
    public SessionSummaryResponse sessionSummary(Instant since) {
        Long userId = currentUser.id();
        Map<ReviewResult, Long> results = new EnumMap<>(ReviewResult.class);
        for (ReviewResult result : ReviewResult.values()) {
            results.put(result, 0L);
        }
        for (ResultCount count : reviewRepository.countByResultSince(userId, since)) {
            results.put(count.result(), count.count());
        }
        long reviewed = results.values().stream().mapToLong(Long::longValue).sum();

        LocalDate tomorrow = calendar.today().plusDays(1);
        DueTomorrow dueTomorrow = new DueTomorrow(
                tomorrow,
                progressRepository.countDueBy(userId, tomorrow),
                progressRepository.findWordsDueBy(userId, tomorrow, PageRequest.of(0, DUE_TOMORROW_WORDS)));
        return new SessionSummaryResponse(since, reviewed, results, dueTomorrow);
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

    private List<LearningCardResponse> dueCards(Long userId, Long topicId, Long listId, LocalDate today, Integer size) {
        return progressRepository
                .findDue(userId, topicId, listId, today, ReviewResult.FORGOT, ReviewResult.VAGUE, upTo(size, 0))
                .stream()
                .map(mapper::toCard)
                .toList();
    }

    /** The cards still allowed once {@code taken} are in: every one without a size. */
    private static Pageable upTo(Integer size, int taken) {
        return size == null ? Pageable.unpaged() : PageRequest.of(0, size - taken);
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
