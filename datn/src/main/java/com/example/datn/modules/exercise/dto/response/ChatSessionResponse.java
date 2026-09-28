package com.example.datn.modules.exercise.dto.response;

import java.time.Instant;

public record ChatSessionResponse(Long id, String title, Long lessonId, Instant createdAt, Instant updatedAt) {
}
