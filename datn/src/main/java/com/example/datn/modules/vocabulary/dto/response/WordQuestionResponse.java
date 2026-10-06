package com.example.datn.modules.vocabulary.dto.response;

import java.util.List;

/**
 * A multiple-choice test question made from a word, not saved (docs/api/admin.md,
 * GET /api/admin/vocabulary/{id}/test-question). Its shape is a question of POST /api/admin/tests, so the editor adds
 * it to the test as it is.
 */
public record WordQuestionResponse(
        String skill,
        String type,
        int points,
        String audioUrl,
        Long vocabularyId,
        Integer materialIndex,
        String content,
        List<Option> options,
        List<String> acceptedAnswers) {

    public record Option(String text, boolean correct) {
    }
}
