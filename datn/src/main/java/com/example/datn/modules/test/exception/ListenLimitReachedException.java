package com.example.datn.modules.test.exception;

/** The recording of the passage has already been played as many times as an attempt allows. */
public class ListenLimitReachedException extends RuntimeException {

    public ListenLimitReachedException(Long passageId) {
        super("Listening passage has no plays left: " + passageId);
    }
}
