package com.example.datn.modules.test.dto.response;

/** A passage in the result of a submitted attempt, with the transcript of its recording. */
public record PassageReviewResponse(Long id, String title, String content, String audioUrl, String transcript) {
}
