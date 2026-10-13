package com.example.datn.modules.test.exception;

/** Learners have submitted the test, so what they were graded on can no longer change (scenario 24, branch 2a). */
public class TestLockedException extends RuntimeException {

    public TestLockedException(Long testId) {
        super("The test has submissions: only the title, the closing date and hiding it may change: " + testId);
    }
}
