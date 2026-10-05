package com.example.datn.modules.exercise.audio;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class R2AudioProperties {
    private static final Map<String, String> DOTENV_VALUES = readR2ValuesFromDotEnv();

    private final boolean readDotEnv;
    private final boolean enabled;
    private final String accountId;
    private final String accessKeyId;
    private final String secretAccessKey;
    private final String bucket;
    private final String endpoint;
    private final String publicBaseUrl;

    public R2AudioProperties(
            @Value("${app.r2.read-dotenv:true}") String configuredReadDotEnv,
            @Value("${app.r2.enabled:}") String configuredEnabled,
            @Value("${app.r2.account-id:}") String configuredAccountId,
            @Value("${app.r2.access-key-id:}") String configuredAccessKeyId,
            @Value("${app.r2.secret-access-key:}") String configuredSecretAccessKey,
            @Value("${app.r2.bucket:}") String configuredBucket,
            @Value("${app.r2.endpoint:}") String configuredEndpoint,
            @Value("${app.r2.public-base-url:}") String configuredPublicBaseUrl) {
        this.readDotEnv = Boolean.parseBoolean(configuredReadDotEnv);
        this.enabled = Boolean.parseBoolean(value(configuredEnabled, "R2_ENABLED", "false"));
        this.accountId = value(configuredAccountId, "R2_ACCOUNT_ID", "");
        this.accessKeyId = value(configuredAccessKeyId, "R2_ACCESS_KEY_ID", "");
        this.secretAccessKey = value(configuredSecretAccessKey, "R2_SECRET_ACCESS_KEY", "");
        this.bucket = value(configuredBucket, "R2_BUCKET", "learning-audio");
        this.endpoint = value(configuredEndpoint, "R2_ENDPOINT", "").replaceAll("/+$", "");
        this.publicBaseUrl = value(configuredPublicBaseUrl, "R2_PUBLIC_BASE_URL", "").replaceAll("/+$", "");
    }

    public boolean enabled() { return enabled; }
    public String accountId() { return accountId; }
    public String accessKeyId() { return accessKeyId; }
    public String secretAccessKey() { return secretAccessKey; }
    public String bucket() { return bucket; }
    public String publicBaseUrl() { return publicBaseUrl; }

    public URI endpointUri() {
        if (!endpoint.isBlank()) {
            return URI.create(endpoint);
        }
        return URI.create("https://" + accountId + ".r2.cloudflarestorage.com");
    }

    public boolean hasCredentials() {
        return !accountId.isBlank() && !accessKeyId.isBlank() && !secretAccessKey.isBlank() && !bucket.isBlank();
    }

    private String value(String configuredValue, String name, String fallback) {
        if (configuredValue != null && !configuredValue.isBlank()) {
            return configuredValue.trim();
        }
        String fromProcess = System.getenv(name);
        if (fromProcess != null) {
            return fromProcess.trim();
        }
        return (readDotEnv ? DOTENV_VALUES.getOrDefault(name, fallback) : fallback).trim();
    }

    private static Map<String, String> readR2ValuesFromDotEnv() {
        Map<String, String> values = new HashMap<>();
        for (Path path : List.of(Path.of("../.env"), Path.of(".env"))) {
            if (!Files.isRegularFile(path)) {
                continue;
            }
            try {
                for (String line : Files.readAllLines(path, StandardCharsets.UTF_8)) {
                    String trimmed = line.trim();
                    if (trimmed.isEmpty() || trimmed.startsWith("#")) {
                        continue;
                    }
                    if (trimmed.startsWith("export ")) {
                        trimmed = trimmed.substring("export ".length()).trim();
                    }
                    int separator = trimmed.indexOf('=');
                    if (separator <= 0) {
                        continue;
                    }
                    String name = trimmed.substring(0, separator).trim();
                    if (!name.startsWith("R2_")) {
                        continue;
                    }
                    String value = trimmed.substring(separator + 1).trim();
                    if (value.length() >= 2 && isMatchingQuote(value.charAt(0), value.charAt(value.length() - 1))) {
                        value = value.substring(1, value.length() - 1);
                    }
                    values.put(name, value);
                }
            } catch (IOException ignored) {
                // R2 environment variables can still be supplied directly to the backend process.
            }
        }
        return Map.copyOf(values);
    }

    private static boolean isMatchingQuote(char first, char last) {
        return (first == '"' && last == '"') || (first == '\'' && last == '\'');
    }
}
