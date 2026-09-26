package com.example.datn.modules.vocabulary.service;

import java.time.Instant;
import java.util.List;

/**
 * A round of a game as the server handed it out: who plays it, when it started and which questions it has, in order.
 * Carried by the signed playToken (see PlayTokenService), so the server keeps nothing while the round is played.
 */
public record PlayRound(
        Long gameId,
        Long userId,
        Instant issuedAt,
        String nonce,
        List<Long> questionIds) {
}
