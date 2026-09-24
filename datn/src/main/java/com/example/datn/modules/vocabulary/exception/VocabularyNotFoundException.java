package com.example.datn.modules.vocabulary.exception;

public class VocabularyNotFoundException extends RuntimeException {

    public VocabularyNotFoundException(Long id) {
        super("Vocabulary not found: " + id);
    }
}
