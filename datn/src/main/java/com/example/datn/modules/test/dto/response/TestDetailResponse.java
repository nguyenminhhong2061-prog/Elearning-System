package com.example.datn.modules.test.dto.response;

import com.example.datn.modules.test.enums.TestSkill;
import com.example.datn.modules.test.enums.TestType;

import java.time.Instant;
import java.util.List;

/**
 * The full content of a test: its passages and questions (no answers). {@code lastAttemptId} is the current learner's
 * latest submitted attempt, null when there is none.
 */
public record TestDetailResponse(
        Long id,
        String title,
        TestType type,
        TestSkill skill,
        Instant startDate,
        Instant endDate,
        boolean retakeAllowed,
        List<PassageResponse> passages,
        List<QuestionResponse> questions,
        boolean hasInProgress,
        Long lastAttemptId) {
}
