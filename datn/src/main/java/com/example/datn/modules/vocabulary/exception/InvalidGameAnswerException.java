package com.example.datn.modules.vocabulary.exception;

/** An answer about a question or an option that is not part of the round. */
public class InvalidGameAnswerException extends RuntimeException {

    public InvalidGameAnswerException(String message) {
        super(message);
    }
}
