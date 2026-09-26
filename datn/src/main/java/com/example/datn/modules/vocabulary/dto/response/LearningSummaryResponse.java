package com.example.datn.modules.vocabulary.dto.response;

import java.time.LocalDate;
import java.util.List;

/**
 * Review reminder and statistics of the current user (docs/api/learning.md). {@code upcoming} has exactly one entry per
 * day for the 7 days after today.
 */
public record LearningSummaryResponse(
        long dueToday,
        long learningCount,
        long masteredCount,
        long reviewedToday,
        List<DayCount> upcoming) {

    public record DayCount(LocalDate date, long count) {
    }
}
