package com.example.datn.modules.test.dto.response;

import com.example.datn.modules.test.enums.TestPhase;
import com.example.datn.modules.test.enums.TestSkill;
import com.example.datn.modules.test.enums.TestStatus;
import com.example.datn.modules.test.enums.TestType;

import java.time.LocalDate;
import java.util.List;

/**
 * A row of the admin test list (docs/api/admin.md). Dates are Vietnamese days, null for an older test without that
 * bound. {@code submissions} counts the attempts every learner submitted; {@code averageScore} (0-100) is over the
 * graded ones and null when there is none.
 */
public record AdminTestSummaryResponse(
        Long id,
        String title,
        TestType type,
        String skillText,
        LocalDate startDate,
        LocalDate endDate,
        TestStatus status,
        TestPhase phase,
        int questionCount,
        List<TestSkill> skills,
        long submissions,
        Integer averageScore) {
}
