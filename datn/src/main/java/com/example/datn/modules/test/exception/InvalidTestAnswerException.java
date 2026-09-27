package com.example.datn.modules.test.exception;

/** An answer is malformed: wrong pairing of option/text, or the option/question does not match the test. */
public class InvalidTestAnswerException extends RuntimeException {

    public InvalidTestAnswerException(String message) {
        super(message);
    }
}
