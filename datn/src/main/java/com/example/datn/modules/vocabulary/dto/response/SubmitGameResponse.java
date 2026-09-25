package com.example.datn.modules.vocabulary.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

/** The score of a round handed in, as the server computed it. */
public record SubmitGameResponse(
        Long sessionId,
        int score,
        int correctCount,
        int questionCount,
        int timeBonus,
        int bestScore,
        // Named explicitly: Jackson may otherwise drop the "is" of a boolean and write "personalBest".
        @JsonProperty("isPersonalBest") boolean isPersonalBest) {
}
