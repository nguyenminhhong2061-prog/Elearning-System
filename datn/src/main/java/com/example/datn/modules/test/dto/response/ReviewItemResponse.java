package com.example.datn.modules.test.dto.response;

import com.example.datn.common.enums.CefrLevel;
import com.example.datn.modules.test.enums.TestQuestionType;

import java.math.BigDecimal;
import java.util.Map;

/**
 * The graded result of one question in the review. {@code correct} is null for AI-graded questions, which have
 * {@code aiCriteria} (a band 0-6 per criterion) and {@code aiComment} instead once the examiner has graded them, and
 * for read-aloud questions, which have {@code pronunciation} when they were answered.
 */
public record ReviewItemResponse(
        Long questionId,
        Long passageId,
        TestQuestionType type,
        CefrLevel level,
        Boolean correct,
        Long selectedOptionId,
        String answerText,
        Long correctOptionId,
        String correctAnswer,
        int points,
        BigDecimal scoreEarned,
        Map<String, Integer> aiCriteria,
        String aiComment,
        PronunciationReviewResponse pronunciation) {
}
