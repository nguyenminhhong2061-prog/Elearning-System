package com.example.datn.modules.vocabulary.enums;

/**
 * The three vocabulary games (games.game_type, stored upper-case as the schema expects), with the number of questions
 * one round draws from the game's question bank (docs/api/games.md).
 */
public enum GameType {
    /** An English word; pick its meaning among four. */
    GUESS_MEANING(10),
    /** A meaning; pick the English word among four, against a tight timer. */
    QUICK_QUIZ(12),
    /** Words and meanings shuffled; match each word with its meaning. */
    WORD_MATCH(6);

    private final int questionsPerRound;

    GameType(int questionsPerRound) {
        this.questionsPerRound = questionsPerRound;
    }

    public int questionsPerRound() {
        return questionsPerRound;
    }

    /** Whether each question comes with its own options to choose from (every game but WORD_MATCH). */
    public boolean hasOptionsPerQuestion() {
        return this != WORD_MATCH;
    }
}
