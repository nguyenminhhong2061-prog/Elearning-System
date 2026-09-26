package com.example.datn.modules.vocabulary.exception;

/**
 * Two first reviews of the same word by the same user arrived at the same time (for example from two browser tabs),
 * and the unique (user_id, vocabulary_id) constraint rejected the second one. Retrying succeeds, since the row now
 * exists.
 */
public class ConcurrentReviewException extends RuntimeException {

    public ConcurrentReviewException(Long vocabularyId, Throwable cause) {
        super("Another review of vocabulary " + vocabularyId + " was saved at the same time; please rate it again", cause);
    }
}
