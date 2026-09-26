package com.example.datn.modules.vocabulary.dto.request;

import jakarta.validation.constraints.NotNull;

public record AddListWordRequest(
        @NotNull(message = "Vocabulary id is required") Long vocabularyId) {
}
