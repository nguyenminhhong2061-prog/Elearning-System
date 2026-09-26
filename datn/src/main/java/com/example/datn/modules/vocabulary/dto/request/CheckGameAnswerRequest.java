package com.example.datn.modules.vocabulary.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CheckGameAnswerRequest(
        @NotBlank(message = "playToken is required") String playToken,
        @NotNull(message = "Question id is required") Long questionId,
        @NotNull(message = "Option id is required") Long optionId) {
}
