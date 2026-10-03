package com.example.datn.modules.vocabulary.entity;

import com.example.datn.modules.vocabulary.enums.ReviewResult;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * One rating of a flashcard ("Lượt ôn từ" of the Business model): saved with every review, next to the update of the
 * word's {@link UserVocabulary}, which only keeps the latest state.
 */
@Entity
@Table(name = "vocabulary_reviews")
public class VocabularyReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userVocabularyId;

    @Convert(converter = ReviewResultConverter.class)
    @Column(nullable = false, length = 20)
    private ReviewResult result;

    @Column(nullable = false)
    private Instant reviewedAt;

    protected VocabularyReview() {
    }

    public VocabularyReview(Long userVocabularyId, ReviewResult result, Instant reviewedAt) {
        this.userVocabularyId = userVocabularyId;
        this.result = result;
        this.reviewedAt = reviewedAt;
    }

    public Long getId() {
        return id;
    }

    public Long getUserVocabularyId() {
        return userVocabularyId;
    }

    public ReviewResult getResult() {
        return result;
    }

    public Instant getReviewedAt() {
        return reviewedAt;
    }
}
