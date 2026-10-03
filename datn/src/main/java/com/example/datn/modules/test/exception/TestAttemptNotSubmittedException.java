package com.example.datn.modules.test.exception;

/** The attempt is still in progress, so it has no result (and its correct answers stay hidden) yet. */
public class TestAttemptNotSubmittedException extends RuntimeException {

    public TestAttemptNotSubmittedException(Long id) {
        super("Test attempt has not been submitted: " + id);
    }
}
