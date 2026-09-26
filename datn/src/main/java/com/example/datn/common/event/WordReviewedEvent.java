package com.example.datn.common.event;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Published by the vocabulary module each time a learner rates a flashcard (POST /api/learning/reviews), so that other
 * modules (for example the progress module updating user_progress) can react without calling into vocabulary.
 *
 * Published inside the review transaction: listen with
 * {@code @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)} to only count reviews that were saved.
 * The values are plain strings so that listeners only depend on the {@code common} package.
 *
 * @param userId the learner (users.id)
 * @param vocabularyId the reviewed word (vocabulary.id)
 * @param result "FORGOT", "VAGUE" or "REMEMBERED"
 * @param learningStatus the word's status after the review: "LEARNING" or "MASTERED"
 * @param firstReview true when the learner reviewed this word for the first time (the word counts as learned from now)
 * @param studyDate the day of the review in Vietnam time, the day user_progress rows are keyed by
 * @param reviewedAt the instant of the review
 */
public record WordReviewedEvent(
        Long userId,
        Long vocabularyId,
        String result,
        String learningStatus,
        boolean firstReview,
        LocalDate studyDate,
        Instant reviewedAt) {
}
