package com.example.datn.modules.test.dto.request;

import jakarta.validation.constraints.Size;

/**
 * One saved answer. Exactly one of {@code optionId} (multiple-choice) and {@code text} (fill-blank / writing / speaking)
 * must be present, depending on the question type; the service enforces the pairing.
 */
public record SaveAnswerRequest(
        Long optionId,
        @Size(max = 5000) String text) {
}
