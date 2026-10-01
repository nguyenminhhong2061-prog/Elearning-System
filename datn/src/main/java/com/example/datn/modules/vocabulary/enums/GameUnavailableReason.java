package com.example.datn.modules.vocabulary.enums;

/** Why the words chosen cannot make a round of a game (scenario 8, branch 3a). */
public enum GameUnavailableReason {
    /** Fewer than {@link GameType#MIN_WORDS} words with different meanings: not enough options. */
    NOT_ENOUGH_WORDS,
    /** GUESS_MEANING only: no word has an example sentence. */
    NO_EXAMPLES
}
