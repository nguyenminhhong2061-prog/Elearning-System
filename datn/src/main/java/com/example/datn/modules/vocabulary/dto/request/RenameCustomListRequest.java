package com.example.datn.modules.vocabulary.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RenameCustomListRequest(
        @NotBlank(message = "Name is required") @Size(max = 150, message = "Name must be at most 150 characters") String name) {

    public RenameCustomListRequest {
        name = name == null ? null : name.strip();
    }
}
