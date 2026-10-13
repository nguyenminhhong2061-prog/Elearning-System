package com.example.datn.modules.test.exception;

/** A test the admin editor sent breaks a rule of docs/api/admin.md ("Đề kiểm tra"). */
public class InvalidTestException extends RuntimeException {

    public InvalidTestException(String message) {
        super(message);
    }
}
