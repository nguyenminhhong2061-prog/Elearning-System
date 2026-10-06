package com.example.datn.modules.test.entity;

import java.math.BigDecimal;
import java.util.List;

/**
 * What the pronunciation assessor found in a read-aloud answer, stored as JSON in
 * test_attempt_answers.pronunciation_details.
 *
 * @param phonemeAccuracy the share of sounds that match the reference sentence, 0-100
 * @param wordAccuracy the share of words that match, 0-100
 * @param errors the words that were mispronounced or left out, in the order of the sentence
 */
public record PronunciationDetails(BigDecimal phonemeAccuracy, BigDecimal wordAccuracy, List<WordError> errors) {

    /**
     * @param word the word of the reference sentence
     * @param expectedIpa how it should sound (IPA)
     * @param heardIpa what was heard (IPA), empty when the word was left out
     */
    public record WordError(String word, String expectedIpa, String heardIpa) {
    }
}
