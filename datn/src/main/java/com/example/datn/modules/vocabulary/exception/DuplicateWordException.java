package com.example.datn.modules.vocabulary.exception;

/** The topic already has a visible system word with this text, ignoring case (scenario 19 branch 12b, 20 branch 4b). */
public class DuplicateWordException extends RuntimeException {

    public DuplicateWordException(String word) {
        super("The topic already has the word \"" + word + "\"");
    }
}
