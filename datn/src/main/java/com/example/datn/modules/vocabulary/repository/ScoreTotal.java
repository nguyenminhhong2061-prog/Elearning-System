package com.example.datn.modules.vocabulary.repository;

import java.time.Instant;

/**
 * A player's total score in one game (or all games, with {@code gameId} null) over a period, and when they reached it:
 * the time of their last round in the period, which breaks ties on the leaderboard.
 */
public record ScoreTotal(Long gameId, Long userId, Long total, Instant reachedAt) {
}
