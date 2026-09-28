package com.example.datn.modules.test.dto.response;

/** A saved answer of an attempt, used to resume it. */
public record SavedAnswerResponse(Long questionId, Long optionId, String text) {
}
