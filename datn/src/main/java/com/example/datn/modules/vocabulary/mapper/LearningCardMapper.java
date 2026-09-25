package com.example.datn.modules.vocabulary.mapper;

import com.example.datn.modules.vocabulary.dto.response.LearningCardResponse;
import com.example.datn.modules.vocabulary.dto.response.ReviewResponse;
import com.example.datn.modules.vocabulary.entity.UserVocabulary;
import com.example.datn.modules.vocabulary.entity.Vocabulary;
import com.example.datn.modules.vocabulary.enums.LearningStatus;
import com.example.datn.modules.vocabulary.repository.WordProgress;
import org.springframework.stereotype.Component;

@Component
public class LearningCardMapper {

    public LearningCardResponse toCard(WordProgress wordProgress) {
        return toCard(wordProgress.word(), wordProgress.progress());
    }

    /** @param progress null for a word the user never reviewed */
    public LearningCardResponse toCard(Vocabulary word, UserVocabulary progress) {
        return new LearningCardResponse(
                word.getId(),
                word.getTopicId(),
                word.getCreatedBy(),
                word.getWord(),
                word.getMeaning(),
                word.getExampleSentence(),
                word.getPhonetic(),
                word.getAudioUrl(),
                word.getImageUrl(),
                word.getDifficultyLevel(),
                progress == null ? LearningStatus.NEW : progress.getStatus(),
                progress == null ? null : progress.getLastReviewResult(),
                progress == null ? 0 : progress.getReviewCount(),
                progress == null ? null : progress.getNextReviewAt(),
                progress == null ? null : progress.getLastReviewedAt());
    }

    public ReviewResponse toReviewResponse(UserVocabulary progress) {
        return new ReviewResponse(
                progress.getVocabularyId(),
                progress.getStatus(),
                progress.getLastReviewResult(),
                progress.getReviewCount(),
                progress.getIntervalDays(),
                progress.getNextReviewAt());
    }
}
