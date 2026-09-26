package com.example.datn.modules.vocabulary.exception;

public class GameNotFoundException extends RuntimeException {

    public GameNotFoundException(Long id) {
        super("Game not found: " + id);
    }
}
