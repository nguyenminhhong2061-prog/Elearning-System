package com.example.datn.modules.auth.dto.request;

import com.example.datn.modules.auth.validation.MaxUtf8Bytes;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank(message = "Current password is required") String currentPassword,
        @NotBlank(message = "New password is required")
        @Size(min = 8, message = "New password must be at least 8 characters")
        @MaxUtf8Bytes(value = 72, message = "New password must be at most 72 bytes") String newPassword) {
}
