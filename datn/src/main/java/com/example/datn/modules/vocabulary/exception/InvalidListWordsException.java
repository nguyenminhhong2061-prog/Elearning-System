package com.example.datn.modules.vocabulary.exception;

import java.util.Collection;

/**
 * A new list refers to words that do not exist or that the learner cannot see. Answered with 400 rather than 404:
 * the list being created is fine, its content is not (docs/api/custom-lists.md).
 */
public class InvalidListWordsException extends RuntimeException {

    public InvalidListWordsException(Collection<Long> vocabularyIds) {
        super("Unknown vocabulary ids: " + vocabularyIds);
    }
}
