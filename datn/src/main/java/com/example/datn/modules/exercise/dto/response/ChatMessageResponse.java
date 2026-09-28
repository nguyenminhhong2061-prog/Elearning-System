package com.example.datn.modules.exercise.dto.response;

import com.example.datn.modules.exercise.enums.ChatRole;

import java.time.Instant;
import java.util.List;

public record ChatMessageResponse(
        Long id,
        ChatRole role,
        String content,
        Instant createdAt,
        List<Source> sources) {
    public record Source(String title) {}
}
