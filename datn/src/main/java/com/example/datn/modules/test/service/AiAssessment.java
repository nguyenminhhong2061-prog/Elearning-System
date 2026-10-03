package com.example.datn.modules.test.service;

import java.util.Map;

/**
 * The AI examiner's assessment of one spoken or written answer.
 *
 * @param criteria a band per criterion ({@code task}, {@code coherence}, {@code vocabulary}, {@code grammar}):
 *                 0 when the answer shows no English that can be rated, 1 (A1) to 6 (C2) otherwise
 * @param comment a short comment for the learner, in Vietnamese
 */
public record AiAssessment(Map<String, Integer> criteria, String comment) {

    public static final int MAX_BAND = 6;

    /** The band of an answer: the average of its criteria. The service computes it; the AI is not asked for a total. */
    public static double band(Map<String, Integer> criteria) {
        return criteria.values().stream().mapToInt(Integer::intValue).average().orElse(0);
    }
}
