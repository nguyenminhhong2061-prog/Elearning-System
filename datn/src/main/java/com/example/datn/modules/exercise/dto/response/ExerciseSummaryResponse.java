package com.example.datn.modules.exercise.dto.response;

import com.example.datn.common.enums.CefrLevel;
import com.example.datn.modules.exercise.enums.ExerciseDifficulty;
import com.example.datn.modules.exercise.enums.ExerciseSkill;

import java.time.Instant;

public record ExerciseSummaryResponse(
        Long id,
        ExerciseSkill skill,
        String title,
        String description,
        String topic,
        CefrLevel cefrLevel,
        ExerciseDifficulty difficulty,
        Integer estimatedMinutes,
        long itemCount,
        Progress progress) {

    public record Progress(long attemptCount, Integer bestScorePercent, Instant lastCompletedAt, InProgress inProgress) {}
    public record InProgress(Long attemptId, long doneCount, Instant lastActivityAt) {}
}
