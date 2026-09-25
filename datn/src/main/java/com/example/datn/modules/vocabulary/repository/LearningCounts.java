package com.example.datn.modules.vocabulary.repository;

/** The counts of GET /api/learning/summary for one user, computed by {@link UserVocabularyRepository#countSummary}. */
public record LearningCounts(
        Long dueToday,
        Long learningCount,
        Long masteredCount,
        Long reviewedToday) {
}
