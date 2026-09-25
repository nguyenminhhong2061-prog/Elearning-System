package com.example.datn.modules.vocabulary.dto.response;

import com.example.datn.modules.vocabulary.enums.GameType;

/** A game in the list of GET /api/games; {@code myBestScore} is null before the player's first round. */
public record GameResponse(
        Long id,
        String name,
        GameType gameType,
        Integer timeLimitSeconds,
        int questionCount,
        Integer myBestScore) {
}
