package com.example.datn.modules.vocabulary.exception;

import com.example.datn.modules.vocabulary.enums.GameUnavailableReason;

/** The topic or list chosen cannot make a round of this game (scenario 8, branch 3a). */
public class NotEnoughWordsException extends RuntimeException {

    public NotEnoughWordsException(GameUnavailableReason reason) {
        super(reason == GameUnavailableReason.NO_EXAMPLES
                ? "No word of the topic or list has an example sentence"
                : "The topic or list has fewer than 4 words with different meanings");
    }
}
