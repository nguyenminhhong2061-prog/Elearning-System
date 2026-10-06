package com.example.datn.modules.test.exception;

/** The pronunciation service could not assess a recording now; the recording was not scored. */
public class PronunciationUnavailableException extends RuntimeException {

    public PronunciationUnavailableException(String message) {
        super(message);
    }
}
