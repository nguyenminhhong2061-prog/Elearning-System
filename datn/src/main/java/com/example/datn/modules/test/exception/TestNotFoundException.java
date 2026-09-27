package com.example.datn.modules.test.exception;

/** A test does not exist, is closed, or belongs to no available window. */
public class TestNotFoundException extends RuntimeException {

    public TestNotFoundException(Long id) {
        super("Test not found: " + id);
    }
}
