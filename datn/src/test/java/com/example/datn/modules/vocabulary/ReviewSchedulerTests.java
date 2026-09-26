package com.example.datn.modules.vocabulary;

import com.example.datn.modules.vocabulary.enums.LearningStatus;
import com.example.datn.modules.vocabulary.enums.ReviewResult;
import com.example.datn.modules.vocabulary.service.ReviewScheduler;
import com.example.datn.modules.vocabulary.service.ScheduledReview;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

/** The table of docs/api/learning.md, with the same cases as frontend/mock/scheduler.test.js. */
class ReviewSchedulerTests {

    private static final LocalDate TODAY = LocalDate.of(2026, 9, 25);

    private final ReviewScheduler scheduler = new ReviewScheduler();

    @ParameterizedTest(name = "{0}")
    @CsvSource(nullValues = "NEW", textBlock = """
            # case,                       current interval, result,     interval, status,   next review
            a new word forgot,            NEW,              FORGOT,     1,        LEARNING, 2026-09-26
            a new word vague,             NEW,              VAGUE,      1,        LEARNING, 2026-09-26
            a new word remembered,        NEW,              REMEMBERED, 3,        LEARNING, 2026-09-28
            step 2 forgot,                7,                FORGOT,     1,        LEARNING, 2026-09-26
            step 2 vague,                 7,                VAGUE,      7,        LEARNING, 2026-10-02
            step 2 remembered,            7,                REMEMBERED, 14,       LEARNING, 2026-10-09
            step 3 remembered,            14,               REMEMBERED, 30,       MASTERED, 2026-10-25
            mastered remembered again,    30,               REMEMBERED, 30,       MASTERED, 2026-10-25
            mastered vague,               30,               VAGUE,      30,       LEARNING, 2026-10-25
            mastered forgot,              30,               FORGOT,     1,        LEARNING, 2026-09-26
            interval not in the table,    10,               REMEMBERED, 14,       LEARNING, 2026-10-09
            """)
    void schedulesTheNextReview(
            String label,
            Integer currentInterval,
            ReviewResult result,
            int expectedInterval,
            LearningStatus expectedStatus,
            LocalDate expectedNextReview) {
        ScheduledReview next = scheduler.schedule(currentInterval, result, TODAY);

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
            next = scheduler.schedule(interval, ReviewResult.REMEMBERED, TODAY);
            interval = next.intervalDays();
        }

        assertThat(next.status()).isEqualTo(expected);
    }
}
