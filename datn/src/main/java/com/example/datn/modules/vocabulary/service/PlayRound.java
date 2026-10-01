package com.example.datn.modules.vocabulary.service;

import java.time.Instant;
import java.util.List;

/**
 * A round of a game as the server dealt it: who plays it, when it started, where its words come from and, for each
 * question, the asked word and the words whose meanings were offered, in the order shown. Carried by the encrypted
 * playToken (see PlayTokenService), so the server keeps nothing while the round is played.
 *
 * Question and option ids in the API are positions from 1: question {@code n} is {@code questions.get(n - 1)}, its
 * option {@code m} is {@code optionVocabularyIds.get(m - 1)}, and for WORD_MATCH, meaning {@code m} is
 * {@code matchVocabularyIds.get(m - 1)}. An answer is right when the chosen option's word is the question's word.
 *
 * @param topicId the topic the words come from, or null
 * @param listId the personal list the words come from, or null (both null: every system word)
 */
public record PlayRound(
        Long gameId,
        Long userId,
        Instant issuedAt,
        String nonce,
        Long topicId,
        Long listId,
        List<Question> questions,
        List<Long> matchVocabularyIds) {

    /** @param optionVocabularyIds empty for WORD_MATCH, whose meanings are shared by every question */
    public record Question(Long vocabularyId, List<Long> optionVocabularyIds) {
    }

    /** The question at a 1-based position, or null when there is none. */
    public Question question(long questionId) {
        return questionId >= 1 && questionId <= questions.size() ? questions.get((int) questionId - 1) : null;
    }
}
