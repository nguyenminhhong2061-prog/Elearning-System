package com.example.datn.modules.test.exception;

/** An attempt does not exist or belongs to another user. */
public class TestAttemptNotFoundException extends RuntimeException {

    public TestAttemptNotFoundException(Long id) {
        super("Test attempt not found: " + id);
    }
}
