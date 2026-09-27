package com.example.datn.modules.test.dto.response;

import com.example.datn.modules.test.enums.TestSkill;
import com.example.datn.modules.test.enums.TestType;

import java.time.Instant;
import java.util.List;

/** The full content of a test, questions included (no answers). */
public record TestDetailResponse(
        Long id,
        String title,
        TestType type,
        TestSkill skill,
        Instant startDate,
        Instant endDate,
        List<QuestionResponse> questions,
        boolean hasInProgress) {
}
