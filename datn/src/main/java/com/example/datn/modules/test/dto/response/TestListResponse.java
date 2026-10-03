package com.example.datn.modules.test.dto.response;

import com.example.datn.modules.test.enums.TestSkill;
import com.example.datn.modules.test.enums.TestType;

import java.time.Instant;

/** One test in the list (GET /api/tests). */
public record TestListResponse(
        Long id,
        String title,
        TestType type,
        TestSkill skill,
        Instant startDate,
        Instant endDate,
        boolean retakeAllowed,
        int questionCount,
        TestProgressResponse progress) {
}
