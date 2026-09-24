package com.example.datn.modules.sample.dto.request;

import com.example.datn.modules.sample.enums.SampleItemStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateSampleItemRequest(
        @NotBlank(message = "Name is required") @Size(max = 100, message = "Name must be at most 100 characters") String name,
        @Size(max = 500, message = "Description must be at most 500 characters") String description,
        @NotNull(message = "Status is required") SampleItemStatus status) {
}
