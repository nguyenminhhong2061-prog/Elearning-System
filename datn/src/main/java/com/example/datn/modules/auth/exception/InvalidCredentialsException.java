package com.example.datn.modules.auth.exception;

public class InvalidCredentialsException extends RuntimeException {

    // The same message for an unknown email and a wrong password, so the API does not reveal which emails exist.
    public InvalidCredentialsException() {
        super("Invalid email or password");
    }

    public InvalidCredentialsException(String message) {
        super(message);
    }
}
