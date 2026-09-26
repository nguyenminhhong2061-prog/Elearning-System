package com.example.datn.modules.vocabulary.service;

import java.time.Duration;

/**
 * The scoring rules of docs/api/games.md, as pure functions (the frontend mock, frontend/mock/routes/games.js,
 * implements the same ones):
 *
 * <ul>
 *   <li>each right answer earns {@code points × 10};</li>
 *   <li>answers handed in more than 3 seconds after the time limit count as wrong;</li>
 *   <li>when every question was answered in time, the remaining seconds are added, scaled by the share of right
 *       answers, so answering at random as fast as possible earns no bonus.</li>
 * </ul>
 */
public final class GameScoring {

    public static final int POINTS_PER_UNIT = 10;

    /** Network and rendering slack allowed after the time limit. */
    public static final int GRACE_SECONDS = 3;

    private GameScoring() {
    }

    /** Whether answers handed in after {@code elapsed} still count (always, without a time limit). */
    public static boolean inTime(Integer limitSeconds, Duration elapsed) {
        return limitSeconds == null || elapsed.compareTo(Duration.ofSeconds(limitSeconds + GRACE_SECONDS)) <= 0;
    }

    /** {@code floor(remaining seconds × right answers / questions)}, or 0 without a time limit. */
    public static int timeBonus(Integer limitSeconds, Duration elapsed, int correctCount, int questionCount) {
        if (limitSeconds == null || questionCount == 0) {
            return 0;
        }
        double remainingSeconds = Math.max(0, limitSeconds - elapsed.toMillis() / 1000.0);
        return (int) Math.floor(remainingSeconds * correctCount / questionCount);
    }
}
