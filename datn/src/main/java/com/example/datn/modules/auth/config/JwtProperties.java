package com.example.datn.modules.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

import java.time.Duration;

/**
 * @param secret     HMAC key for signing tokens (at least 32 bytes). When blank, a random key is generated at
 *                   startup, which is fine for development but invalidates all tokens on every restart.
 * @param expiration how long an access token stays valid
 */
@ConfigurationProperties(prefix = "app.jwt")
public record JwtProperties(
        String secret,
        @DefaultValue("8h") Duration expiration) {
}
