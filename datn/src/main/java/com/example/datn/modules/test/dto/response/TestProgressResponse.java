package com.example.datn.modules.test.dto.response;

import java.time.Instant;

/** The current learner's progress on one test. {@code lastAttemptId} is their latest submitted attempt. */
public record TestProgressResponse(
        int attemptCount,
        Integer bestScorePercent,
        Instant lastCompletedAt,
        Long lastAttemptId,
        InProgressResponse inProgress) {
}
