package com.example.datn.modules.exercise.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record PronunciationAssessmentResponse(
        Long itemId,
        int tryNumber,
        BigDecimal overallScore,
        BigDecimal phonemeAccuracyScore,
        BigDecimal wordAccuracyScore,
        String recognizedText,
        List<WordError> errors,
        List<String> tips) {

    public record WordError(
            String word,
            String expectedIpa,
            String heardIpa,
            BigDecimal confidence,
            String errorType,
            List<PhoneDifference> phones) {}

    public record PhoneDifference(String expected, String heard, BigDecimal confidence) {}
}
