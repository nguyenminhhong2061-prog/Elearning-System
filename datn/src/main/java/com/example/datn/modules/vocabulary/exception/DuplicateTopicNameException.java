package com.example.datn.modules.vocabulary.exception;

/** Another topic already has this name, ignoring case (scenario 22, branch 6a). */
public class DuplicateTopicNameException extends RuntimeException {

    public DuplicateTopicNameException(String name) {
        super("A topic named \"" + name + "\" already exists");
    }
}
