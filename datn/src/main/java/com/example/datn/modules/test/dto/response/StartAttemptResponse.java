package com.example.datn.modules.test.dto.response;

import com.example.datn.modules.test.enums.TestAttemptStatus;

import java.util.List;

/** Result of starting or resuming a test attempt. */
public record StartAttemptResponse(
        Long attemptId,
        boolean resumed,
        TestAttemptStatus status,
        List<SavedAnswerResponse> answers) {
}
