package com.example.datn.modules.vocabulary.service;

import com.example.datn.modules.vocabulary.enums.LearningStatus;
import com.example.datn.modules.vocabulary.enums.ReviewResult;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * The spaced repetition rule of the Business model (docs/English Learning System, "Ngày ôn tiếp theo") and
 * docs/api/learning.md. Let k be the interval, in days, between the word's last review and the review scheduled
 * after it (0 for a new word):
 *
 * <ul>
 *   <li>FORGOT: the new interval is 1 day;</li>
 *   <li>VAGUE: max(1, k), the interval is kept;</li>
 *   <li>REMEMBERED: max(2, 2k), the interval doubles;</li>
 *   <li>the next review is today plus the new interval, and the word is mastered from an interval of 16 days.</li>
 * </ul>
 *
 * An overdue word is scheduled from its k and from the day it is actually reviewed (scenario 6, branch 3a). Pure
 * logic: no database and no clock, "today" is given by the caller.
 */
@Component
public class ReviewScheduler {

    /** A word whose new interval reaches this many days is mastered. */
    public static final int MASTERED_FROM_DAYS = 16;

    /**
     * Upper bound of an interval: a hundred years. It takes eleven "Nhớ rõ" in a row after mastering a word to get
     * there, so a learner never does; it only keeps the date arithmetic safe whatever is stored.
     */
    static final int MAX_INTERVAL_DAYS = 36_500;

    /**
     * @param currentIntervalDays k: the interval stored with the word, or null for a word never reviewed
     * @param today the review day in Vietnam time (see StudyCalendar)
     */
    public ScheduledReview schedule(Integer currentIntervalDays, ReviewResult result, LocalDate today) {
        long k = currentIntervalDays == null ? 0 : currentIntervalDays;
        long next = switch (result) {
            case FORGOT -> 1;
            case VAGUE -> Math.max(1, k);
            case REMEMBERED -> Math.max(2, 2 * k);
        };
        int intervalDays = (int) Math.min(next, MAX_INTERVAL_DAYS);
        LearningStatus status = intervalDays >= MASTERED_FROM_DAYS ? LearningStatus.MASTERED : LearningStatus.LEARNING;
        return new ScheduledReview(status, intervalDays, today.plusDays(intervalDays));
    }
}
