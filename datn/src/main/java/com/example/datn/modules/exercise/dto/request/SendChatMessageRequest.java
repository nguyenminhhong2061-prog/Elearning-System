package com.example.datn.modules.exercise.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SendChatMessageRequest(
        @NotBlank @Size(max = 1000) String content,
        Long questionId,
        Long attemptId,
        Long pronunciationItemId) {
}
