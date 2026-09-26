package com.example.datn.modules.vocabulary.enums;

import java.util.Collections;
import java.util.EnumSet;
import java.util.Set;

/** A user's progress on one word (user_vocabulary.status). A word without a user_vocabulary row is NEW. */
public enum LearningStatus {
    NEW,
    LEARNING,
    MASTERED;

    /** The statuses that count as "learned" in the topic counts and the learning history. */
    public static final Set<LearningStatus> LEARNED = Collections.unmodifiableSet(EnumSet.of(LEARNING, MASTERED));
}
