package com.example.datn.modules.test.dto.response;

/** How many times the recording of a passage has been played in an attempt, out of how many allowed. */
public record PassagePlayResponse(Long passageId, int playCount, int maxPlays) {
}
