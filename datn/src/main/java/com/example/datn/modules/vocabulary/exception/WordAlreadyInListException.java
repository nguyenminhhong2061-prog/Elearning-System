package com.example.datn.modules.vocabulary.exception;

public class WordAlreadyInListException extends RuntimeException {

    public WordAlreadyInListException(Long listId, Long vocabularyId) {
        super("Vocabulary " + vocabularyId + " is already in list " + listId);
    }
}
