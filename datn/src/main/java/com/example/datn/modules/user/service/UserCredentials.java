package com.example.datn.modules.user.service;

import com.example.datn.modules.user.enums.UserRole;
import com.example.datn.modules.user.enums.UserStatus;

/**
 * What the auth module needs to verify a login. Contains the password hash, so it is for
 * server-side use only and must never be returned to clients.
 */
public record UserCredentials(
        Long id,
        String email,
        String passwordHash,
        UserRole role,
        UserStatus status) {
}
