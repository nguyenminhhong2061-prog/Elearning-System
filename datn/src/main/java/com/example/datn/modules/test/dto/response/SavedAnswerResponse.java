package com.example.datn.modules.test.dto.response;

/**
 * A saved answer of an attempt, used to resume it. A recorded answer only says that it exists ({@code recorded}):
 * what was heard in it stays hidden until the attempt is submitted.
 */
public record SavedAnswerResponse(Long questionId, Long optionId, String text, boolean recorded) {
}
