package com.example.datn.modules.auth.dto.request;

import com.example.datn.modules.auth.validation.MaxUtf8Bytes;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Full name is required") @Size(max = 150, message = "Full name must be at most 150 characters") String fullName,
        @NotBlank(message = "Email is required") @Email(message = "Email is not valid") @Size(max = 255, message = "Email must be at most 255 characters") String email,
        // BCrypt only uses the first 72 bytes, so longer passwords are rejected instead of being silently truncated.
        @NotBlank(message = "Password is required")
        @Size(min = 8, message = "Password must be at least 8 characters")
        @MaxUtf8Bytes(value = 72, message = "Password must be at most 72 bytes") String password) {

    // Whitespace around the name and email (typically from copy/paste) is dropped before validation, so
    // registration accepts the same padded email that login already accepts. The password is left untouched.
    public RegisterRequest {
        fullName = fullName == null ? null : fullName.strip();
        email = email == null ? null : email.strip();
    }
}
