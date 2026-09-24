package com.example.datn.modules.sample.dto.response;

import com.example.datn.modules.sample.enums.SampleItemStatus;

import java.time.Instant;

public record SampleItemResponse(
        Long id,
        String name,
        String description,
        SampleItemStatus status,
        Instant createdAt) {
}
