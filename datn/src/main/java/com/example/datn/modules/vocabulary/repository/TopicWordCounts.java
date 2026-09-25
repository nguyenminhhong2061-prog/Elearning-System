package com.example.datn.modules.vocabulary.repository;

/** Word counts of one topic for one user, computed by {@link VocabularyRepository#countByTopic}. */
public record TopicWordCounts(
        Long topicId,
        Long wordCount,
        Long learnedCount,
        Long dueCount) {

    public static TopicWordCounts empty(Long topicId) {
        return new TopicWordCounts(topicId, 0L, 0L, 0L);
    }
}
