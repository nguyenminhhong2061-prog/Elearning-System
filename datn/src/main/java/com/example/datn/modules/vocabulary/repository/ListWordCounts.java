package com.example.datn.modules.vocabulary.repository;

/** Word counts of one personal list for its owner, computed by {@link CustomVocabularyListItemRepository#countByList}. */
public record ListWordCounts(
        Long listId,
        Long wordCount,
        Long learnedCount,
        Long dueCount) {

    public static ListWordCounts empty(Long listId) {
        return new ListWordCounts(listId, 0L, 0L, 0L);
    }
}
