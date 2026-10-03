package com.example.datn.modules.vocabulary.service;

import java.time.Duration;

/**
 * The scoring rules of scenario 8 and docs/api/games.md, as pure functions:
 *
 * <ul>
 *   <li>each right answer earns {@code points × 10} (8 right answers out of 10 make 80 points), with no time bonus;</li>
 *   <li>answers handed in more than 3 seconds after the time limit count as wrong;</li>
 *   <li>the time played is the time between dealing the round and handing it in, at most the time limit.</li>
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

    /** {@code correctCount × points × 10}. */
    public static int score(int correctCount, int pointsPerQuestion) {
        return correctCount * pointsPerQuestion * POINTS_PER_UNIT;
    }

    /** Whole seconds played, rounded, and never more than the time limit (a round is over when the time is up). */
    public static int playedSeconds(Integer limitSeconds, Duration elapsed) {
        long seconds = Math.max(0, Math.round(elapsed.toMillis() / 1000.0));
        return (int) (limitSeconds == null ? seconds : Math.min(seconds, limitSeconds));
    }
}
