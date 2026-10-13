package com.example.datn.modules.test.enums;

/**
 * Whether learners may see a test (tests.status). A shown test is still only open between its dates. Stored
 * upper-case to match the CHECK.
 */
public enum TestStatus {
    /** Being written: learners do not see it, whatever its dates. */
    DRAFT,
    VISIBLE,
    /** Withdrawn by an admin: learners no longer see it, the attempts they submitted stay. */
    HIDDEN
}
