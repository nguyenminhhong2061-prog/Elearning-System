package com.example.datn.modules.test.dto.response;

/**
 * A passage of a test while it is being taken: the text to read, or the recording to listen to. It has no transcript
 * (that is only revealed after submission). {@code maxPlays} is how many times the recording may be played in one
 * attempt, null for a reading passage.
 */
public record PassageResponse(Long id, String title, String content, String audioUrl, Integer maxPlays) {
}
