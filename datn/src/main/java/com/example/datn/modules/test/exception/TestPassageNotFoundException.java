package com.example.datn.modules.test.exception;

/** The test of the attempt has no listening passage with this id. */
public class TestPassageNotFoundException extends RuntimeException {

    public TestPassageNotFoundException(Long id) {
        super("Listening passage not found in this test: " + id);
    }
}
