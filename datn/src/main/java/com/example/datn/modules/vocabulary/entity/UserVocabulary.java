package com.example.datn.modules.vocabulary.entity;

import com.example.datn.modules.vocabulary.enums.LearningStatus;
import com.example.datn.modules.vocabulary.enums.ReviewResult;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;
import java.time.LocalDate;

/**
 * A user's progress on one word: created at the word's first review and updated at every review after that.
 * A word without a row is NEW for that user.
 */
@Entity
// The unique constraint is in the real schema; declaring it also gives the H2 test database the same guarantee.
@Table(name = "user_vocabulary", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "vocabulary_id"}))
public class UserVocabulary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Plain ids, like Vocabulary.createdBy: users belong to another module.
    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long vocabularyId;

    @Convert(converter = LearningStatusConverter.class)
    @Column(nullable = false, length = 20)
    private LearningStatus status;

    @Convert(converter = ReviewResultConverter.class)
    @Column(length = 20)
    private ReviewResult lastReviewResult;

    @Column(nullable = false)
    private int reviewCount;

    // The current step of the spaced repetition schedule, in days (see ReviewScheduler); null before the first review.
    private Integer intervalDays;

    // A DATE: "due today" is decided in Vietnam time, see StudyCalendar.
    private LocalDate nextReviewAt;

    private Instant lastReviewedAt;

    private Instant firstLearnedAt;

    protected UserVocabulary() {
    }

    /** A word the user is about to review for the first time. */
    public UserVocabulary(Long userId, Long vocabularyId) {
        this.userId = userId;
        this.vocabularyId = vocabularyId;
        this.status = LearningStatus.NEW;
        this.reviewCount = 0;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public Long getVocabularyId() {
        return vocabularyId;
    }

    public LearningStatus getStatus() {
        return status;
    }

    public ReviewResult getLastReviewResult() {
        return lastReviewResult;
    }

    public int getReviewCount() {
        return reviewCount;
    }

    public Integer getIntervalDays() {
        return intervalDays;
    }

    public LocalDate getNextReviewAt() {
        return nextReviewAt;
    }

    public Instant getLastReviewedAt() {
        return lastReviewedAt;
    }

    public Instant getFirstLearnedAt() {
        return firstLearnedAt;
    }

    /** Whether no review has been recorded yet (the scheduler then treats the word as new). */
    public boolean isFirstReview() {
        return reviewCount == 0;
    }

    /** Records one review; the new status, interval and next review day come from ReviewScheduler. */
    public void recordReview(
            ReviewResult result,
            LearningStatus newStatus,
            int newIntervalDays,
            LocalDate newNextReviewAt,
            Instant reviewedAt) {
        this.status = newStatus;
        this.lastReviewResult = result;
        this.reviewCount++;
        this.intervalDays = newIntervalDays;
        this.nextReviewAt = newNextReviewAt;
        this.lastReviewedAt = reviewedAt;
        if (this.firstLearnedAt == null) {
            this.firstLearnedAt = reviewedAt;
        }
    }
}
