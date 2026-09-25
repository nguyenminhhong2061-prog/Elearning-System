package com.example.datn.modules.vocabulary.exception;

public class TopicNotFoundException extends RuntimeException {

    public TopicNotFoundException(Long id) {
        super("Topic not found: " + id);
    }
}
