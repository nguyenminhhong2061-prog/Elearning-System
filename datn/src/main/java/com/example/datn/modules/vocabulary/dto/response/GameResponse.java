package com.example.datn.modules.vocabulary.dto.response;

import com.example.datn.modules.vocabulary.enums.GameType;
import com.example.datn.modules.vocabulary.enums.GameUnavailableReason;

/**
 * A game in the list of GET /api/games, for the topic or list chosen (scenario 8, step 2 and branch 3a).
 *
 * @param questionCount questions (pairs for WORD_MATCH) a round has with the words chosen, 0 when not available
 * @param myBestScore the player's best score in this game, whatever the words; null before their first round
 * @param unavailableReason why the words chosen cannot make a round, null when they can
 */
public record GameResponse(
        Long id,
        String name,
        GameType gameType,
        Integer timeLimitSeconds,
        int questionCount,
        Integer myBestScore,
        boolean available,
        GameUnavailableReason unavailableReason) {
}
