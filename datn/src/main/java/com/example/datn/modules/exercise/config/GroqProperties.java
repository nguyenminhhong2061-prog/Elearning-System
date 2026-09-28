package com.example.datn.modules.exercise.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties("app.ai.groq")
public record GroqProperties(
        String baseUrl,
        String model,
        String primaryKey,
        String backupKey,
        Duration connectTimeout,
        Duration readTimeout) {
    public GroqProperties {
        if (baseUrl == null || baseUrl.isBlank()) baseUrl = "https://api.groq.com/openai/v1";
        if (model == null || model.isBlank()) model = "openai/gpt-oss-120b";
        if (connectTimeout == null) connectTimeout = Duration.ofSeconds(5);
        if (readTimeout == null) readTimeout = Duration.ofSeconds(12);
    }
}
