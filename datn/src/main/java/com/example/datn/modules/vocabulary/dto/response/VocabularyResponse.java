package com.example.datn.modules.vocabulary.dto.response;

import com.example.datn.common.enums.CefrLevel;
import com.example.datn.modules.vocabulary.enums.LearningStatus;

/** A word with the current user's learning status (docs/api/vocabulary.md). */
public record VocabularyResponse(
        Long id,
        Long topicId,
        Long createdBy,
        String word,
        String meaning,
        String exampleSentence,
        String phonetic,
        String audioUrl,
        String imageUrl,
        CefrLevel difficultyLevel,
        LearningStatus learningStatus) {
}
