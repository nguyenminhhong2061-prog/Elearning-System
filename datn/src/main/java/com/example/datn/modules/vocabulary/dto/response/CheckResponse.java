package com.example.datn.modules.vocabulary.dto.response;

/** Whether a choice is right; {@code correctOptionId} is null for WORD_MATCH, where it would give the pair away. */
public record CheckResponse(boolean correct, Long correctOptionId) {
}
