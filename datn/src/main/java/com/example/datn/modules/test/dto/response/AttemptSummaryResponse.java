package com.example.datn.modules.test.dto.response;

import com.example.datn.common.enums.CefrLevel;
import com.example.datn.modules.test.enums.TestAttemptStatus;

import java.time.Instant;

/**
 * One submitted attempt in the history of a test. {@code scorePercent} and {@code suggestedLevel} are null while the
 * attempt is still being graded (SUBMITTED).
 */
public record AttemptSummaryResponse(
        Long attemptId,
        TestAttemptStatus status,
        Instant submittedAt,
        Integer scorePercent,
        CefrLevel suggestedLevel) {
}
