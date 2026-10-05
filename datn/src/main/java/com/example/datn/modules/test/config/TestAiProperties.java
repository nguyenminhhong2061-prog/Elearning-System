package com.example.datn.modules.test.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

/**
 * The Groq settings of application.properties ({@code app.ai.groq.*}), the same keys the chatbot of module B reads.
 * Module C binds them itself because modules do not depend on each other.
 */
@ConfigurationProperties("app.ai.groq")
public record TestAiProperties(
        String baseUrl,
        String model,
        String primaryKey,
        String backupKey,
        Duration connectTimeout,
        Duration readTimeout) {

    public TestAiProperties {
        if (baseUrl == null || baseUrl.isBlank()) {
            baseUrl = "https://api.groq.com/openai/v1";
        }
        if (model == null || model.isBlank()) {
            model = "openai/gpt-oss-120b";
        }
        if (connectTimeout == null) {
            connectTimeout = Duration.ofSeconds(5);
        }
        if (readTimeout == null) {
            readTimeout = Duration.ofSeconds(12);
        }
    }
}
