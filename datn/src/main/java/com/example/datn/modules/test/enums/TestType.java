package com.example.datn.modules.test.enums;

/** The kind of a test (tests.type). Stored upper-case by {@code @Enumerated(EnumType.STRING)} to match the CHECK. */
public enum TestType {
    PERIODIC,
    COMPREHENSIVE;

    /**
     * Whether a learner may take the test again. A comprehensive test sets the learner's level, so it is taken once;
     * a periodic test measures progress and may be repeated.
     */
    public boolean retakeAllowed() {
        return this != COMPREHENSIVE;
    }
}
