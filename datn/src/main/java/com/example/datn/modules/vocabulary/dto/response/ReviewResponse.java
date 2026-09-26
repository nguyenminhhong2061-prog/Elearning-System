package com.example.datn.modules.vocabulary.dto.response;

import com.example.datn.modules.vocabulary.enums.LearningStatus;
import com.example.datn.modules.vocabulary.enums.ReviewResult;

import java.time.LocalDate;

/** The word's review state after POST /api/learning/reviews. */
public record ReviewResponse(
        Long vocabularyId,
        LearningStatus learningStatus,
        ReviewResult lastReviewResult,
        int reviewCount,
        int intervalDays,
        LocalDate nextReviewAt) {
}
