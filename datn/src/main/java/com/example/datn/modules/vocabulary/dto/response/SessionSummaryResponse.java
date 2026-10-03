package com.example.datn.modules.vocabulary.dto.response;

import com.example.datn.modules.vocabulary.enums.ReviewResult;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * The summary card at the end of a flashcard session (scenario 5 step 14, scenario 6 step 5): the cards rated since
 * the session started, per rating, and the words to review tomorrow.
 *
 * @param results every rating, 0 when it was not given
 */
public record SessionSummaryResponse(
        Instant since,
        long reviewedCount,
        Map<ReviewResult, Long> results,
        DueTomorrow dueTomorrow) {

    /**
     * The words that will be due tomorrow, those not reviewed yet today included.
     *
     * @param words the first ones, the earliest due first, at most {@code LearningService.DUE_TOMORROW_WORDS}
     */
    public record DueTomorrow(LocalDate date, long count, List<String> words) {
    }
}
