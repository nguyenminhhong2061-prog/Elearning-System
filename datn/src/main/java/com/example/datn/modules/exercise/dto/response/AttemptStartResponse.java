package com.example.datn.modules.exercise.dto.response;

import java.time.Instant;
import java.util.List;

public record AttemptStartResponse(
        Long attemptId,
        Instant startedAt,
        boolean resumed,
        List<AnswerResultResponse> responses,
        List<PronunciationProgress> pronunciation) {
    public record PronunciationProgress(Long itemId, long tryCount, Integer bestScore) {}
}
