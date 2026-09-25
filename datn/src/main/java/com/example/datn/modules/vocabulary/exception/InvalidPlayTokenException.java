package com.example.datn.modules.vocabulary.exception;

/** A playToken that was tampered with, expired, already handed in, or issued for another player or game. */
public class InvalidPlayTokenException extends RuntimeException {

    public InvalidPlayTokenException(String message) {
        super(message);
    }
}
