package com.example.datn.modules.vocabulary.entity;

import com.example.datn.modules.vocabulary.enums.LearningStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;

/**
 * A user's progress on one word. Phase 2 only reads it (learned and due counts, learning status); the review
 * columns and the code that writes rows come with the flashcard sessions of Phase 3.
 */
@Entity
@Table(name = "user_vocabulary")
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

    // A DATE: "due today" is decided in Vietnam time, see StudyCalendar.
    private LocalDate nextReviewAt;

    protected UserVocabulary() {
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

    public LocalDate getNextReviewAt() {
        return nextReviewAt;
    }
}
