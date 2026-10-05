package com.example.datn.modules.exercise.audio;

import jakarta.annotation.PreDestroy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;

@Service
public class R2AudioStorageService {
    private final R2AudioProperties properties;
    private final S3Client s3Client;

    public R2AudioStorageService(R2AudioProperties properties) {
        this.properties = properties;
        if (properties.enabled() && !properties.hasCredentials()) {
            throw new IllegalStateException(
                    "R2_ENABLED=true requires R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET");
        }
        this.s3Client = properties.enabled()
                ? S3Client.builder()
                        .endpointOverride(properties.endpointUri())
                        .region(Region.of("auto"))
                        .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(
                                properties.accessKeyId(), properties.secretAccessKey())))
                        .build()
                : null;
    }

    public boolean enabled() {
        return properties.enabled();
    }

    public ResponseInputStream<GetObjectResponse> getObject(String key, String range) {
        ensureEnabled();
        GetObjectRequest.Builder request = GetObjectRequest.builder()
                .bucket(properties.bucket())
                .key(key);
        if (range != null && !range.isBlank()) {
            request.range(range);
        }
        return s3Client.getObject(request.build());
    }

    public HeadObjectResponse headObject(String key) {
        ensureEnabled();
        return s3Client.headObject(HeadObjectRequest.builder()
                .bucket(properties.bucket())
                .key(key)
                .build());
    }

    @PreDestroy
    public void close() {
        if (s3Client != null) {
            s3Client.close();
        }
    }

    private void ensureEnabled() {
        if (!properties.enabled()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "R2 audio proxy is not enabled");
        }
    }
}
