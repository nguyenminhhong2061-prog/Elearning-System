package com.example.datn.modules.auth.dto.response;

import com.example.datn.modules.user.dto.response.UserResponse;

/**
 * @param expiresIn lifetime of the access token in seconds
 */
public record AuthTokenResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        UserResponse user) {
}
