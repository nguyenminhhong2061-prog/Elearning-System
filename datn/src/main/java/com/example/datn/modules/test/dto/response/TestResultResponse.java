package com.example.datn.modules.test.dto.response;

import com.example.datn.common.enums.CefrLevel;
import com.example.datn.modules.test.enums.TestAttemptStatus;
import com.example.datn.modules.test.enums.TestType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

/** The result of a submitted test attempt. */
public record TestResultResponse(
        Long attemptId,
        Long testId,
        String title,
        TestType type,
        TestAttemptStatus status,
        Instant submittedAt,
        int correctCount,
        int questionCount,
        int totalPoints,
        BigDecimal earnedPoints,
        Integer scorePercent,
        Integer bestScorePercent,
        boolean isPersonalBest,
        CefrLevel suggestedLevel,
        String suggestedRoadmap,
        Map<String, SkillScoreResponse> skills,
        List<PassageReviewResponse> passages,
        List<ReviewItemResponse> review) {
}
