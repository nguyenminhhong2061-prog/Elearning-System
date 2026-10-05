package com.example.datn.modules.vocabulary.exception;

/** A question made from a word needs three other words of its topic as wrong choices (scenario 24, step 6). */
public class NotEnoughDistractorsException extends RuntimeException {

    public NotEnoughDistractorsException(Long vocabularyId) {
        super("Word " + vocabularyId + " needs three other words in its topic");
    }
}
