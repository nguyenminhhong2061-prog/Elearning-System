package com.example.datn.modules.vocabulary.service;

import com.example.datn.modules.vocabulary.enums.LearningStatus;

import java.time.LocalDate;

/** The state of a word after one review, as decided by {@link ReviewScheduler}. */
public record ScheduledReview(
        LearningStatus status,
        int intervalDays,
        LocalDate nextReviewAt) {
}
