package com.example.datn.modules.exercise.dto.response;

import org.springframework.data.domain.Page;

import java.util.List;

public record ChatPageResponse<T>(List<T> content, boolean last, long totalElements) {
    public static <T> ChatPageResponse<T> from(Page<T> page) {
        return new ChatPageResponse<>(page.getContent(), page.isLast(), page.getTotalElements());
    }
}
