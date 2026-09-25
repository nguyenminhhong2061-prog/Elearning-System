package com.example.datn.modules.vocabulary.enums;

/** Where the cards of a study session come from (docs/api/learning.md). */
public enum SessionType {
    /** The words of one topic (A1). */
    TOPIC,
    /** The words of one of the learner's own lists (A3). */
    LIST,
    /** Every word due for review (A2). */
    DUE
}
