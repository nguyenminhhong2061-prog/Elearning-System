package com.example.datn.modules.vocabulary.dto.response;

import com.example.datn.modules.vocabulary.enums.SessionType;

import java.util.List;

/** The cards of one flashcard session and where they come from (docs/api/learning.md). */
public record StudySessionResponse(
        Source source,
        List<LearningCardResponse> cards) {

    /** {@code id} and {@code name} are null for a DUE session. */
    public record Source(SessionType type, Long id, String name) {
    }
}
