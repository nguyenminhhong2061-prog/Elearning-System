package com.example.datn.modules.test.enums;

/**
 * How a question is answered and graded, as the admin editor names it (docs/api/admin.md). The skill is a separate
 * field there, so this has no LISTENING or READING; {@link TestQuestionType} is what test_questions stores.
 */
public enum AdminQuestionType {
    MULTIPLE_CHOICE,
    FILL_BLANK,
    /** A spoken answer, graded by the examiner or, for a read-aloud question, on its pronunciation. */
    SPEAKING,
    /** A written answer with nothing to compare it with, graded by the examiner. */
    ESSAY
}
