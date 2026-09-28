package com.example.datn.modules.exercise.exception;

public class AttemptNotFoundException extends RuntimeException {
    public AttemptNotFoundException(Long id) { super("Exercise attempt " + id + " was not found"); }
}
