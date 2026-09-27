package com.example.datn.common.event;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Published by the test module each time a learner submits a test (module C), so that other modules (for example the
 * progress module updating user_progress) can react without calling into the test module.
 *
 * Published inside the submit transaction: listen with
 * {@code @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)} to only count submissions that were saved.
 * The values are plain strings so that listeners only depend on the {@code common} package.
 *
 * @param userId the learner (users.id)
 * @param testAttemptId the submitted attempt (test_attempts.id)
 * @param testId the test (tests.id)
 * @param testType "PERIODIC" or "COMPREHENSIVE"
 * @param scorePercent the earned score as an integer 0-100
 * @param studyDate the day of the submission in Vietnam time, the day user_progress rows are keyed by
 * @param submittedAt the instant of the submission
 */
public record TestCompletedEvent(
        Long userId,
        Long testAttemptId,
        Long testId,
        String testType,
        int scorePercent,
        LocalDate studyDate,
        Instant submittedAt) {
}
