package com.example.datn.modules.vocabulary.dto.request;

import com.example.datn.modules.vocabulary.enums.ReviewResult;
import jakarta.validation.constraints.NotNull;

public record ReviewRequest(
        @NotNull(message = "Vocabulary id is required") Long vocabularyId,
        @NotNull(message = "Result is required") ReviewResult result) {
}
