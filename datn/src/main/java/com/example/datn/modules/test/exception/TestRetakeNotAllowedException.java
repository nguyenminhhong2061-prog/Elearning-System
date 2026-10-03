package com.example.datn.modules.test.exception;

/** The test may be taken only once, and the learner has already submitted it or tries to start it over. */
public class TestRetakeNotAllowedException extends RuntimeException {

    public TestRetakeNotAllowedException(Long testId) {
        super("This test can only be taken once: " + testId);
    }
}
