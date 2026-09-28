package com.example.datn.modules.test.dto.response;

import java.time.Instant;

/** The learner's in-progress attempt of a test, as shown in the test list. */
public record InProgressResponse(Long attemptId, int answeredCount, Instant lastActivityAt) {
}
