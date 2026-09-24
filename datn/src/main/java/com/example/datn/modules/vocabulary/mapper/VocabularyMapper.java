package com.example.datn.modules.vocabulary.mapper;

import com.example.datn.modules.vocabulary.dto.response.VocabularyResponse;
import com.example.datn.modules.vocabulary.entity.Vocabulary;
import org.springframework.stereotype.Component;

@Component
public class VocabularyMapper {

    public VocabularyResponse toResponse(Vocabulary vocabulary) {
        return new VocabularyResponse(
                vocabulary.getId(),
                vocabulary.getTopicId(),
                vocabulary.getCreatedBy(),
                vocabulary.getWord(),
                vocabulary.getMeaning(),
                vocabulary.getExampleSentence(),
                vocabulary.getPhonetic(),
                vocabulary.getAudioUrl(),
                vocabulary.getImageUrl(),
                vocabulary.getDifficultyLevel());
    }
}
