package com.example.datn.modules.vocabulary.exception;

/** The learner already has another list with this name, ignoring case (scenario 7, branch 11a). */
public class DuplicateListNameException extends RuntimeException {

    public DuplicateListNameException(String name) {
        super("A list named \"" + name + "\" already exists");
    }
}
