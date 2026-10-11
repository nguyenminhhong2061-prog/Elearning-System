package com.example.datn.modules.exercise.dto.response;

import java.math.BigDecimal;
import java.util.List;
import tools.jackson.databind.JsonNode;

public record AnswerResultResponse(
        Long questionId,
        boolean graded,
        Boolean correct,
        Long optionId,
        String answer,
        Long correctOptionId,
        String correctAnswer,
        String explanation,
        BigDecimal awardedPoints,
        BigDecimal maxPoints,
        String feedback,
        List<String> sampleAnswers,
        JsonNode translationAssessment) {
}
