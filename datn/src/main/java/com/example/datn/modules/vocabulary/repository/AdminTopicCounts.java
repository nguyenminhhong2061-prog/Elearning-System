package com.example.datn.modules.vocabulary.repository;

import com.example.datn.common.enums.CefrLevel;

/**
 * Admin numbers of one topic's visible system words (docs/api/admin.md, GET /api/admin/topics), computed by
 * {@link VocabularyRepository#countForAdmin}.
 */
public record AdminTopicCounts(
        Long topicId,
        Long wordCount,
        CefrLevel minLevel,
        CefrLevel maxLevel,
        Long missingAudioCount,
        Long missingExampleCount) {
}
