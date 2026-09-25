package com.example.datn.modules.vocabulary.dto.response;

import com.example.datn.common.enums.CefrLevel;
import com.example.datn.modules.vocabulary.enums.LearningStatus;
import com.example.datn.modules.vocabulary.enums.ReviewResult;

import java.time.Instant;
import java.time.LocalDate;

/** A word with the current user's review state (LearningCard of docs/api/learning.md). */
public record LearningCardResponse(
        Long id,
        Long topicId,
        Long createdBy,
        String word,
        String meaning,
        String exampleSentence,
        String phonetic,
        String audioUrl,
        String imageUrl,
        CefrLevel difficultyLevel,
        LearningStatus learningStatus,
        ReviewResult lastReviewResult,
        int reviewCount,
        LocalDate nextReviewAt,
        Instant lastReviewedAt) {
}
