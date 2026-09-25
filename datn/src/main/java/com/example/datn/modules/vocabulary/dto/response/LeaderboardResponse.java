package com.example.datn.modules.vocabulary.dto.response;

import com.example.datn.modules.vocabulary.enums.LeaderboardPeriod;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * The top of a leaderboard and the current player's place ({@code me} is null without a score in the period).
 * {@code updatedAt} is when the cache was last rebuilt, so a round just played may not be counted yet.
 */
public record LeaderboardResponse(
        LeaderboardPeriod periodType,
        LocalDate periodStart,
        Instant updatedAt,
        List<Entry> entries,
        Me me) {

    /** {@code displayName} is only the player's given name, never their full name or email. */
    public record Entry(int rank, Long userId, String displayName, int totalScore) {
    }

    public record Me(int rank, int totalScore) {
    }
}
