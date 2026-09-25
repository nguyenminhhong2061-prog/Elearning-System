package com.example.datn.modules.vocabulary.exception;

/** A study session request whose parameters contradict each other, such as both a topic and a list. */
public class InvalidSessionRequestException extends RuntimeException {

    public InvalidSessionRequestException(String message) {
        super(message);
    }
}
