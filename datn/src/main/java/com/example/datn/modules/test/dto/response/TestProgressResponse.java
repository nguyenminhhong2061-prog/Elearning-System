package com.example.datn.modules.test.dto.response;

import java.time.Instant;

/** The current learner's progress on one test. */
public record TestProgressResponse(
        int attemptCount,
        Integer bestScorePercent,
        Instant lastCompletedAt,
        InProgressResponse inProgress) {
}
