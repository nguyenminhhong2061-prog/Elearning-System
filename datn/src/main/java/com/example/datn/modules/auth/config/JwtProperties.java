package com.example.datn.modules.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

import java.time.Duration;

/**
 * @param secret      HMAC key for signing tokens (at least 32 bytes). When blank, a random key is generated at
 *                    startup, which is fine for development but invalidates all tokens on every restart.
 * @param expiration  the longest a session lasts after logging in, however active the user is: refreshing never
 *                    issues a token past it, so the user then logs in again
 * @param idleTimeout how long one access token stays valid. The client refreshes it while the user is active, so
 *                    this is how long a user can stay inactive before the session ends (scenario 3, branch 1a)
 */
@ConfigurationProperties(prefix = "app.jwt")
public record JwtProperties(
        String secret,
        @DefaultValue("8h") Duration expiration,
        @DefaultValue("30m") Duration idleTimeout) {
}
