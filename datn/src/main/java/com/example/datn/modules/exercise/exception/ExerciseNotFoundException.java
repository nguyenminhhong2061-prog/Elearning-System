package com.example.datn.modules.exercise.exception;

public class ExerciseNotFoundException extends RuntimeException {
    public ExerciseNotFoundException(Long id) { super("Exercise lesson " + id + " was not found"); }
}
