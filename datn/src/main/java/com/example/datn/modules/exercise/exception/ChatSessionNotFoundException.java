package com.example.datn.modules.exercise.exception;

public class ChatSessionNotFoundException extends RuntimeException {
    public ChatSessionNotFoundException(Long id) { super("Chat session " + id + " was not found"); }
}
