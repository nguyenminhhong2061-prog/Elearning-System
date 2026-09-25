package com.example.datn.modules.vocabulary.dto.request;

import com.example.datn.common.enums.CefrLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * A word a learner types in for one of their lists (NewWord of docs/api/custom-lists.md). Without a difficulty level
 * the learner's current level is used, or A1.
 */
public record NewWordRequest(
        @NotBlank(message = "Word is required") @Size(max = 150, message = "Word must be at most 150 characters") String word,
        @NotBlank(message = "Meaning is required") String meaning,
        @Size(max = 150, message = "Phonetic must be at most 150 characters") String phonetic,
        String exampleSentence,
        CefrLevel difficultyLevel) {

    // Trimmed before validation (a record is built before it is validated); empty optional texts become null.
    public NewWordRequest {
        word = strip(word);
        meaning = strip(meaning);
        phonetic = blankToNull(strip(phonetic));
        exampleSentence = blankToNull(strip(exampleSentence));
    }

    private static String strip(String value) {
        return value == null ? null : value.strip();
    }

    private static String blankToNull(String value) {
        return value == null || value.isEmpty() ? null : value;
    }
}
