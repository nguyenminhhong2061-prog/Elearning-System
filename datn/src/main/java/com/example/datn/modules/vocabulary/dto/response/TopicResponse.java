package com.example.datn.modules.vocabulary.dto.response;

/** A topic with the word counts of the current user (docs/api/vocabulary.md). */
public record TopicResponse(
        Long id,
        String name,
        String description,
        String imageUrl,
        long wordCount,
        long learnedCount,
        long dueCount) {
}
