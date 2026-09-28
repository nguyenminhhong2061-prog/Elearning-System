package com.example.datn.modules.exercise.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record AttemptResultResponse(
        Long attemptId,
        Long lessonId,
        long correctCount,
        long questionCount,
        BigDecimal earnedPoints,
        BigDecimal totalPoints,
        int scorePercent,
        Integer bestScorePercent,
        boolean personalBest,
        List<AnswerResultResponse> review,
        List<Translation> translations,
        PronunciationSummary pronunciation) {
    public record Translation(Long segmentId, String translation) {}
    public record PronunciationSummary(int averageScore, long practicedCount, long itemCount) {}
}
