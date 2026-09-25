package com.example.datn.modules.user.dto.response;

import com.example.datn.common.enums.CefrLevel;
import com.example.datn.modules.user.enums.UserRole;
import com.example.datn.modules.user.enums.UserStatus;

import java.time.Instant;

public record UserResponse(
        Long id,
        String fullName,
        String email,
        UserRole role,
        UserStatus status,
        CefrLevel currentLevel,
        Instant createdAt) {
}
