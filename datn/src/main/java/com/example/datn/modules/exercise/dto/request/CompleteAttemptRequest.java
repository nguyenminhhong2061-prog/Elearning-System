package com.example.datn.modules.exercise.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;
import java.util.List;

public record CompleteAttemptRequest(
        List<@Valid AnswerQuestionRequest> responses,
        @DecimalMin("0.5") @DecimalMax("2.0") BigDecimal playbackRate) {
    public List<AnswerQuestionRequest> safeResponses() {
        return responses == null ? List.of() : responses;
    }
}
