package com.example.datn.modules.test.exception;

/** The attempt has already been submitted, so its answers can no longer be changed or it re-submitted. */
public class TestAttemptNotInProgressException extends RuntimeException {

    public TestAttemptNotInProgressException(Long id) {
        super("Test attempt is not in progress: " + id);
    }
}
