package com.example.datn.modules.exercise.audio;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaTypeFactory;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.exception.SdkClientException;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Arrays;

@RestController
@RequestMapping("/media/r2")
public class R2AudioController {
    private final R2AudioStorageService storage;

    public R2AudioController(R2AudioStorageService storage) {
        this.storage = storage;
    }

    @GetMapping("/{*objectKey}")
    public ResponseEntity<StreamingResponseBody> getAudio(
            @PathVariable("objectKey") String rawObjectKey,
            @RequestHeader(value = HttpHeaders.RANGE, required = false) String range) {
        String objectKey = validateObjectKey(rawObjectKey);
        ResponseInputStream<GetObjectResponse> object = storage.getObject(objectKey, range);
        GetObjectResponse metadata = object.response();
        HttpHeaders headers = objectHeaders(objectKey, metadata.contentType(), metadata.contentLength(),
                metadata.contentRange(), metadata.eTag(), metadata.lastModified());
        StreamingResponseBody body = output -> {
            try (object) {
                object.transferTo(output);
            } catch (IOException exception) {
                throw exception;
            }
        };

        HttpStatus status = range == null || range.isBlank() ? HttpStatus.OK : HttpStatus.PARTIAL_CONTENT;
        return ResponseEntity.status(status).headers(headers).body(body);
    }

    @RequestMapping(value = "/{*objectKey}", method = RequestMethod.HEAD)
    public ResponseEntity<Void> headAudio(@PathVariable("objectKey") String rawObjectKey) {
        String objectKey = validateObjectKey(rawObjectKey);
        HeadObjectResponse metadata = storage.headObject(objectKey);
        HttpHeaders headers = objectHeaders(objectKey, metadata.contentType(), metadata.contentLength(),
                null, metadata.eTag(), metadata.lastModified());
        return ResponseEntity.ok().headers(headers).build();
    }

    @ExceptionHandler(S3Exception.class)
    public ResponseEntity<Void> handleR2Error(S3Exception exception) {
        HttpStatus status = switch (exception.statusCode()) {
            case 404 -> HttpStatus.NOT_FOUND;
            case 416 -> HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE;
            default -> HttpStatus.BAD_GATEWAY;
        };
        return ResponseEntity.status(status).build();
    }

    @ExceptionHandler(SdkClientException.class)
    public ResponseEntity<Void> handleR2ConnectionError(SdkClientException exception) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
    }

    private String validateObjectKey(String rawObjectKey) {
        String objectKey = rawObjectKey == null ? "" : rawObjectKey.replaceFirst("^/+", "");
        boolean unsafeSegment = Arrays.stream(objectKey.split("/", -1))
                .anyMatch(segment -> segment.isBlank() || segment.equals(".") || segment.equals(".."));
        if (!objectKey.startsWith("media/listening/") || objectKey.contains("\\") || unsafeSegment) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        return objectKey;
    }

    private HttpHeaders objectHeaders(
            String objectKey,
            String contentType,
            Long contentLength,
            String contentRange,
            String eTag,
            Instant lastModified) {
        String filename = objectKey.substring(objectKey.lastIndexOf('/') + 1);
        MediaType mediaType = contentType == null || contentType.isBlank()
                ? MediaTypeFactory.getMediaType(filename).orElse(MediaType.APPLICATION_OCTET_STREAM)
                : MediaType.parseMediaType(contentType);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(mediaType);
        if (contentLength != null) {
            headers.setContentLength(contentLength);
        }
        if (contentRange != null && !contentRange.isBlank()) {
            headers.set(HttpHeaders.CONTENT_RANGE, contentRange);
        }
        if (eTag != null && !eTag.isBlank()) {
            headers.setETag(eTag);
        }
        if (lastModified != null) {
            headers.setLastModified(lastModified.toEpochMilli());
        }
        headers.set(HttpHeaders.ACCEPT_RANGES, "bytes");
        headers.setContentDisposition(ContentDisposition.inline().filename(filename, StandardCharsets.UTF_8).build());
        return headers;
    }
}
