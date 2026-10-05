package com.example.datn.modules.vocabulary.dto.response;

import com.example.datn.common.enums.CefrLevel;

import java.time.Instant;

/**
 * A topic with the admin's numbers (docs/api/admin.md, GET /api/admin/topics). Counts cover the visible system words;
 * {@code learnerCount} is the learners with at least one word of the topic in their progress.
 */
public record AdminTopicResponse(
        Long id,
        String name,
        String description,
        String imageUrl,
        long wordCount,
        CefrLevel minLevel,
        CefrLevel maxLevel,
        long missingAudioCount,
        long missingExampleCount,
        long learnerCount,
        Instant updatedAt) {
}
