package com.example.datn.common.exception;

import java.time.Instant;

/**
 * Standard error body returned by the API. Same shape as the per-module copies in
 * {@code sample} and {@code vocabulary}.
 */
public record ApiErrorResponse(
        Instant timestamp,
        int status,
        String message) {
}
