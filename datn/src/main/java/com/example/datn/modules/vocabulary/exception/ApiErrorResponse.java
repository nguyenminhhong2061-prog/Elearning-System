package com.example.datn.modules.vocabulary.exception;

import java.time.Instant;

public record ApiErrorResponse(
        Instant timestamp,
        int status,
        String message) {
}
