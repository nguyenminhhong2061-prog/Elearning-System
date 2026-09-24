package com.example.datn.modules.auth.exception;

public class InvalidPasswordChangeException extends RuntimeException {

    public InvalidPasswordChangeException(String message) {
        super(message);
    }
}
