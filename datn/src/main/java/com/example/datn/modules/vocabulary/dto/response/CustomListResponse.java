package com.example.datn.modules.vocabulary.dto.response;

import java.time.Instant;

/** A personal list with the word counts of its owner (CustomList of docs/api/custom-lists.md). */
public record CustomListResponse(
        Long id,
        String name,
        Instant createdAt,
        long wordCount,
        long learnedCount,
        long dueCount) {
}
