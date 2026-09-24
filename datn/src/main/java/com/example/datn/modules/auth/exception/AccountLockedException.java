package com.example.datn.modules.auth.exception;

public class AccountLockedException extends RuntimeException {

    public AccountLockedException() {
        super("This account is locked");
    }
}
