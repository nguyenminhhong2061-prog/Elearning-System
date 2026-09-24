package com.example.datn.modules.sample.exception;

public class SampleItemNotFoundException extends RuntimeException {

    public SampleItemNotFoundException(Long id) {
        super("Sample item not found: " + id);
    }
}
