package com.example.datn.modules.vocabulary.service;

import com.example.datn.modules.vocabulary.enums.LearningStatus;
import com.example.datn.modules.vocabulary.enums.ReviewResult;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

/**
 * The spaced repetition rule of docs/api/learning.md. Each word of a learner sits on a step whose interval is 1, 3, 7,
 * 14 or 30 days:
 *
 * <ul>
 *   <li>FORGOT goes back to the first step;</li>
 *   <li>VAGUE keeps the current step (a new word starts on the first step);</li>
 *   <li>REMEMBERED moves one step up (a new word goes to the second step), and reaching the last step masters the word.</li>
 * </ul>
 *
 * Pure logic: no database and no clock, "today" is given by the caller. The frontend mock
 * (frontend/mock/scheduler.js) implements the same table.
 */
@Component
public class ReviewScheduler {

    /** Days until the next review, one per step. */
    public static final List<Integer> INTERVAL_DAYS = List.of(1, 3, 7, 14, 30);

    private static final int LAST_STEP = INTERVAL_DAYS.size() - 1;

    /**
     * @param currentIntervalDays the interval of the word's current step, or null for a word never reviewed
     * @param today the review day in Vietnam time (see StudyCalendar)
     */
    public ScheduledReview schedule(Integer currentIntervalDays, ReviewResult result, LocalDate today) {
        boolean firstReview = currentIntervalDays == null;
        int step = switch (result) {
            case FORGOT -> 0;
            case VAGUE -> firstReview ? 0 : stepOf(currentIntervalDays);
            case REMEMBERED -> firstReview ? 1 : Math.min(stepOf(currentIntervalDays) + 1, LAST_STEP);
        };
        LearningStatus status = result == ReviewResult.REMEMBERED && step == LAST_STEP
                ? LearningStatus.MASTERED
                : LearningStatus.LEARNING;
        int intervalDays = INTERVAL_DAYS.get(step);
        return new ScheduledReview(status, intervalDays, today.plusDays(intervalDays));
    }

    /**
     * The step of a stored interval. An interval that is not in the table (if the table changes one day) counts as the
     * highest step that does not exceed it, so existing progress is never lost.
     */
    static int stepOf(int intervalDays) {
        int step = 0;
        for (int candidate = 0; candidate <= LAST_STEP; candidate++) {
            if (INTERVAL_DAYS.get(candidate) <= intervalDays) {
                step = candidate;
            }
        }
        return step;
    }
}
