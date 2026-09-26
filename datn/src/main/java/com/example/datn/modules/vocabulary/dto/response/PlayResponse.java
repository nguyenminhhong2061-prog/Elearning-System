package com.example.datn.modules.vocabulary.dto.response;

import com.example.datn.modules.vocabulary.enums.GameType;

import java.util.List;

/**
 * One round, as sent to the browser: it never says which option is right (docs/api/games.md). {@code matchOptions}
 * is only set for WORD_MATCH: the meanings of every question, shuffled.
 */
public record PlayResponse(
        Long gameId,
        GameType gameType,
        Integer timeLimitSeconds,
        String playToken,
        List<Question> questions,
        List<Option> matchOptions) {

    /** {@code phonetic} is only set for GUESS_MEANING; {@code options} is empty for WORD_MATCH. */
    public record Question(Long id, String prompt, String phonetic, int points, List<Option> options) {
    }

    public record Option(Long id, String content) {
    }
}
