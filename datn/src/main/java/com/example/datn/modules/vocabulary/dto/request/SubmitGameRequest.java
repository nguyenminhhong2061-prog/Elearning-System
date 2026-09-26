package com.example.datn.modules.vocabulary.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.util.List;

/** A finished round: one answer per question, {@code optionId} null for a question left unanswered. */
public record SubmitGameRequest(
        @NotBlank(message = "playToken is required") String playToken,
        @NotNull(message = "Answers are required")
        @Size(max = 100, message = "Too many answers") List<@Valid @NotNull(message = "Answer is required") Answer> answers) {

    public record Answer(
            @NotNull(message = "Question id is required") Long questionId,
            Long optionId,
            @PositiveOrZero(message = "Response time must not be negative") Integer responseTimeMs) {
    }
}
