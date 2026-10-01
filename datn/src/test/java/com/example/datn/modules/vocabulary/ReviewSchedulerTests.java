package com.example.datn.modules.vocabulary;

import com.example.datn.modules.vocabulary.enums.LearningStatus;
import com.example.datn.modules.vocabulary.enums.ReviewResult;
import com.example.datn.modules.vocabulary.service.ReviewScheduler;
import com.example.datn.modules.vocabulary.service.ScheduledReview;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The review rule of the Business model (k kept, doubled or reset; mastered from 16 days), checked against the words
 * of scenarios 5 and 6 of docs/English Learning System/Analysis/Scenarios.md.
 */
class ReviewSchedulerTests {

    private final ReviewScheduler scheduler = new ReviewScheduler();

    @ParameterizedTest(name = "{0}")
    @CsvSource(nullValues = "NEW", textBlock = """
            # word (scenario),              review day, k,   rating,     interval, status,   next review
            itinerary (5),                  2026-10-06, 4,   VAGUE,      4,        LEARNING, 2026-10-10
            passport (5),                   2026-10-06, 8,   REMEMBERED, 16,       MASTERED, 2026-10-22
            luggage (5),                    2026-10-06, NEW, REMEMBERED, 2,        LEARNING, 2026-10-08
            departure (5),                  2026-10-06, NEW, FORGOT,     1,        LEARNING, 2026-10-07
            departure (6),                  2026-10-07, 1,   REMEMBERED, 2,        LEARNING, 2026-10-09
            colleague (6),                  2026-10-07, 2,   VAGUE,      2,        LEARNING, 2026-10-09
            deadline (6),                   2026-10-07, 4,   REMEMBERED, 8,        LEARNING, 2026-10-15
            recipe (6),                     2026-10-07, 8,   FORGOT,     1,        LEARNING, 2026-10-08
            ingredient (6),                 2026-10-07, 16,  REMEMBERED, 32,       MASTERED, 2026-11-08
            a new word rated vague,         2026-10-06, NEW, VAGUE,      1,        LEARNING, 2026-10-07
            a mastered word rated vague,    2026-10-06, 16,  VAGUE,      16,       MASTERED, 2026-10-22
            a mastered word forgotten,      2026-10-06, 32,  FORGOT,     1,        LEARNING, 2026-10-07
            """)
    void schedulesTheNextReview(
            String label,
            LocalDate today,
            Integer k,
            ReviewResult rating,
            int expectedInterval,
            LearningStatus expectedStatus,
            LocalDate expectedNextReview) {
        ScheduledReview next = scheduler.schedule(k, rating, today);

        assertThat(next.intervalDays()).isEqualTo(expectedInterval);
        assertThat(next.status()).isEqualTo(expectedStatus);
        assertThat(next.nextReviewAt()).isEqualTo(expectedNextReview);
    }

    @ParameterizedTest(name = "{0} REMEMBERED in a row")
    @CsvSource({"3, LEARNING", "4, MASTERED"})
    void aNewWordIsMasteredAfterFourRememberedReviews(int reviews, LearningStatus expected) {
        Integer interval = null;
        ScheduledReview next = null;
        for (int i = 0; i < reviews; i++) {
            next = scheduler.schedule(interval, ReviewResult.REMEMBERED, LocalDate.of(2026, 10, 6));
            interval = next.intervalDays();
        }

        // 2, 4, 8, then 16 days: mastered.
        assertThat(next.status()).isEqualTo(expected);
    }

    @Test
    void anOverdueWordIsScheduledFromItsKAndTheDayItIsReviewed() {
        // Scenario 6, branch 3a: k = 4, due on 07/10, reviewed three days late.
        ScheduledReview next = scheduler.schedule(4, ReviewResult.REMEMBERED, LocalDate.of(2026, 10, 10));

        assertThat(next.intervalDays()).isEqualTo(8);
        assertThat(next.nextReviewAt()).isEqualTo(LocalDate.of(2026, 10, 18));
    }

    @Test
    void anIntervalNeverGrowsBeyondAHundredYears() {
        ScheduledReview next = scheduler.schedule(Integer.MAX_VALUE, ReviewResult.REMEMBERED, LocalDate.of(2026, 10, 6));

        assertThat(next.intervalDays()).isEqualTo(36_500);
        assertThat(next.status()).isEqualTo(LearningStatus.MASTERED);
    }
}
