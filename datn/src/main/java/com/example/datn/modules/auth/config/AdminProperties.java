package com.example.datn.modules.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * Optional bootstrap admin account. It is created at startup only when both email and password are set
 * (through the ADMIN_EMAIL and ADMIN_PASSWORD environment variables), so no default credentials live in the repo.
 */
@ConfigurationProperties(prefix = "app.admin")
public record AdminProperties(
        String email,
        String password,
        @DefaultValue("Administrator") String fullName) {
}
