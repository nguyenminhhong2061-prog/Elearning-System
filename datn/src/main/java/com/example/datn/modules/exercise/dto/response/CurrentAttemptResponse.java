package com.example.datn.modules.exercise.dto.response;

import com.example.datn.common.enums.CefrLevel;
import com.example.datn.modules.exercise.enums.ExerciseSkill;

import java.time.Instant;

public record CurrentAttemptResponse(Current current) {
    public record Current(Long attemptId, Lesson lesson, long doneCount, Instant lastActivityAt) {}
    public record Lesson(Long id, ExerciseSkill skill, String title, CefrLevel cefrLevel, long itemCount) {}
}
