package com.example.datn.modules.vocabulary.dto.response;

import com.example.datn.modules.vocabulary.enums.CefrLevel;

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
        CefrLevel difficultyLevel) {
}
