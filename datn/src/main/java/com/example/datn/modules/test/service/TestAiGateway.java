package com.example.datn.modules.test.service;

import com.example.datn.common.enums.CefrLevel;
import com.example.datn.modules.test.entity.TestQuestion;
import com.example.datn.modules.test.enums.TestSkill;

import java.util.Map;
import java.util.Optional;

/**
 * Grades the AI-graded question types (SPEAKING, free-form WRITING) and writes the suggested roadmap. Module C talks
 * only to this contract, so a real external service can replace the deterministic fallback without touching the flow.
 */
public interface TestAiGateway {

    /**
     * Grades a spoken answer as a 0-100 score, or {@link Optional#empty()} when it must be graded later (no
     * transcription and no speech service available).
     */
    Optional<Integer> gradeSpeaking(TestQuestion question, String submittedText);

    /**
     * Grades a free-form written answer as a 0-100 score, or {@link Optional#empty()} when it must be graded later.
     */
    Optional<Integer> gradeWriting(TestQuestion question, String submittedText);

    /** A Vietnamese roadmap suggestion based on the graded outcome; may return {@code null} when unavailable. */
    String suggestRoadmap(CefrLevel level, Map<TestSkill, Integer> skills);
}
