package com.example.datn.modules.exercise.dto.request;

import jakarta.validation.constraints.Size;

public record AnswerQuestionRequest(
        Long questionId,
        Long optionId,
        @Size(max = 200) String answer) {
}
