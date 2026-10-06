package com.example.datn.modules.test.dto.response;

import java.math.BigDecimal;
import java.util.List;

/**
 * How a read-aloud answer was pronounced, shown in the review of a submitted attempt. Scores are 0-100.
 *
 * @param score the overall pronunciation score
 * @param phonemeAccuracy the share of sounds that match the reference sentence
 * @param wordAccuracy the share of words that match
 * @param errors the words that were mispronounced or left out
 */
public record PronunciationReviewResponse(
        BigDecimal score,
        BigDecimal phonemeAccuracy,
        BigDecimal wordAccuracy,
        List<WordErrorResponse> errors) {

    /** {@code heardIpa} is empty when the word was left out. */
    public record WordErrorResponse(String word, String expectedIpa, String heardIpa) {
    }
}
