package com.example.datn.modules.exercise.dto.response;

import java.math.BigDecimal;

public record AnswerResultResponse(
        Long questionId,
        boolean correct,
        Long optionId,
        String answer,
        Long correctOptionId,
        String correctAnswer,
        String explanation,
        BigDecimal awardedPoints) {
}
