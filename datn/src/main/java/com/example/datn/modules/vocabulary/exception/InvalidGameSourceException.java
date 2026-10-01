package com.example.datn.modules.vocabulary.exception;

/** A round asked for both a topic and a personal list. */
public class InvalidGameSourceException extends RuntimeException {

    public InvalidGameSourceException(String message) {
        super(message);
    }
}
