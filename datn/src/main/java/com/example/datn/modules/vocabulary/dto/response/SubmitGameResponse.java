package com.example.datn.modules.vocabulary.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * The result of a round handed in, as the server computed it (scenario 8, step 8).
 *
 * @param timeBonus always 0 since 02/10/2026 (scenario 8 has no time bonus); kept until the frontend stops reading it
 * @param wrongAnswers the questions answered wrongly or not at all, in the order of the round ("Các câu sai")
 */
public record SubmitGameResponse(
        Long sessionId,
        int score,
        int correctCount,
        int questionCount,
        int durationSeconds,
        int timeBonus,
        int bestScore,
        // Named explicitly: Jackson may otherwise drop the "is" of a boolean and write "personalBest".
        @JsonProperty("isPersonalBest") boolean isPersonalBest,
        List<WrongAnswer> wrongAnswers) {

    /** @param chosen the meaning the player picked, or null when the question was not answered */
    public record WrongAnswer(Long questionId, String word, String chosen, String correct) {
    }
}
