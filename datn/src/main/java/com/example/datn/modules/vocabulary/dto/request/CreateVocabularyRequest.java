package com.example.datn.modules.vocabulary.dto.request;

import com.example.datn.modules.vocabulary.enums.CefrLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateVocabularyRequest(
        Long topicId,
        @NotBlank(message = "Word is required") @Size(max = 150, message = "Word must be at most 150 characters") String word,
        @NotBlank(message = "Meaning is required") String meaning,
        String exampleSentence,
        @Size(max = 150, message = "Phonetic must be at most 150 characters") String phonetic,
        @Size(max = 500, message = "Audio URL must be at most 500 characters") String audioUrl,
        @Size(max = 500, message = "Image URL must be at most 500 characters") String imageUrl,
        @NotNull(message = "Difficulty level is required") CefrLevel difficultyLevel) {
}
