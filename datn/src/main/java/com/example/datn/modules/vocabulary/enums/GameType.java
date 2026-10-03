package com.example.datn.modules.vocabulary.enums;

/**
 * The three vocabulary games (games.game_type, stored upper-case as the schema expects), with the rules of scenario 8:
 * how many questions (or pairs) one round has at most. A round takes its questions from the words of a topic or a
 * personal list when the round is dealt (docs/api/games.md).
 */
public enum GameType {
    /** An example sentence with the word in bold; pick the word's meaning among four. Only words with an example. */
    GUESS_MEANING(5),
    /** An English word; pick its meaning among four, against the clock. */
    QUICK_QUIZ(10),
    /** Words and meanings shuffled; match each word with its meaning. */
    WORD_MATCH(8);

    /** A topic or list needs this many words with different meanings: one right and three wrong options. */
    public static final int MIN_WORDS = 4;

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

    /** Whether a question needs the word's example sentence. */
    public boolean needsExample() {
        return this == GUESS_MEANING;
    }
}
