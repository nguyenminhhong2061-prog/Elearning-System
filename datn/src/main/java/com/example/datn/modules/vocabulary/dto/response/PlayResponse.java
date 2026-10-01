package com.example.datn.modules.vocabulary.dto.response;

import com.example.datn.modules.vocabulary.enums.GameType;

import java.util.List;

/**
 * One round, as sent to the browser: it never says which option is right (docs/api/games.md). Question and option ids
 * are positions in the round, from 1. {@code matchOptions} is only set for WORD_MATCH: the meanings of every question,
 * shuffled.
 *
 * @param topicId the topic the words come from, or null
 * @param listId the personal list the words come from, or null (both null: every system word)
 */
public record PlayResponse(
        Long gameId,
        GameType gameType,
        Integer timeLimitSeconds,
        Long topicId,
        Long listId,
        String playToken,
        List<Question> questions,
        List<Option> matchOptions) {

    /**
     * {@code prompt} is the English word; {@code example} is only set for GUESS_MEANING (the sentence that shows the
     * word in context); {@code options} are four meanings, and are empty for WORD_MATCH.
     */
    public record Question(Long id, String prompt, String phonetic, String example, int points, List<Option> options) {
    }

    public record Option(Long id, String content) {
    }
}
