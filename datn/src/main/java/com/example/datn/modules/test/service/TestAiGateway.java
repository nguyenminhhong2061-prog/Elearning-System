package com.example.datn.modules.test.service;

import com.example.datn.common.enums.CefrLevel;
import com.example.datn.modules.test.entity.TestQuestion;
import com.example.datn.modules.test.enums.TestSkill;

import java.util.Map;
import java.util.Optional;

/**
 * Grades the AI-graded question types (SPEAKING, free-form WRITING) and writes the suggested roadmap. Module C talks
 * only to this contract, so the AI service can change without touching the grading flow.
 */
public interface TestAiGateway {

    /**
     * Assesses a spoken (typed, until recording exists) or written answer, or returns {@link Optional#empty()} when
     * the AI service cannot grade now: the answer stays "being graded" and is tried again later. It never makes up a
     * score.
     */
    Optional<AiAssessment> assess(TestQuestion question, String submittedText);

    /** A Vietnamese roadmap suggestion based on the graded outcome. */
    String suggestRoadmap(CefrLevel level, Map<TestSkill, Integer> skillScores);
}
