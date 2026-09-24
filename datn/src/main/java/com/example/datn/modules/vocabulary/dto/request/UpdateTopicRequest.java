package com.example.datn.modules.vocabulary.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateTopicRequest(
        @NotBlank(message = "Name is required") @Size(max = 150, message = "Name must be at most 150 characters") String name,
        String description,
        @Size(max = 500, message = "Image URL must be at most 500 characters") String imageUrl) {
}
