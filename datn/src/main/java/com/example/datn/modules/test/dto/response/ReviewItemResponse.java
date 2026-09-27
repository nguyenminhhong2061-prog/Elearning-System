package com.example.datn.modules.test.dto.response;

import com.example.datn.modules.test.enums.TestQuestionType;

import java.math.BigDecimal;

/** The graded result of one question in the review. {@code correct} is null for AI-graded questions. */
public record ReviewItemResponse(
        Long questionId,
        TestQuestionType type,
        Boolean correct,
        Long selectedOptionId,
        String answerText,
        Long correctOptionId,
        String correctAnswer,
        int points,
        BigDecimal scoreEarned) {
}
