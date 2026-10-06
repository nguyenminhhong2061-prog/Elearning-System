package com.example.datn.modules.test.service;

import com.example.datn.modules.test.entity.PronunciationDetails;
import com.example.datn.modules.test.exception.PronunciationUnavailableException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import tools.jackson.databind.JsonNode;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

/**
 * {@link PronunciationAssessor} on the self-hosted OpenPronounce service (docs/api/pronunciation.md), the same
 * service and settings ({@code app.pronunciation.openpronounce.*}) the pronunciation exercises of module B use.
 * Module C has its own client because modules do not depend on each other.
 */
@Component
public class OpenPronounceAssessor implements PronunciationAssessor {

    private static final int MAX_ERRORS = 20;

    private final RestClient client;

    public OpenPronounceAssessor(
            @Value("${app.pronunciation.openpronounce.base-url:http://localhost:8001}") String baseUrl,
            @Value("${app.pronunciation.openpronounce.connect-timeout:5s}") Duration connectTimeout,
            @Value("${app.pronunciation.openpronounce.read-timeout:600s}") Duration readTimeout) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(connectTimeout);
        requestFactory.setReadTimeout(readTimeout);
        this.client = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .build();
    }

    @Override
    public Assessment assess(byte[] wav, String referenceText) {
        MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
        form.add("file", new ByteArrayResource(wav) {
            @Override
            public String getFilename() {
                return "recording.wav";
            }
        });
        form.add("expected_text", referenceText);
        form.add("lang", "en");

        JsonNode response;
        try {
            response = client.post()
                    .uri("/pronunciation")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(form)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException exception) {
            throw new PronunciationUnavailableException("Pronunciation assessment service is unavailable");
        }
        if (response == null || !response.path("score").isNumber() || !response.path("differences").isObject()) {
            throw new PronunciationUnavailableException("Pronunciation assessment service returned an invalid result");
        }

        JsonNode differences = response.path("differences");
        return new Assessment(
                percent(response.path("score").asDouble()),
                response.path("transcribe").asText("").strip(),
                new PronunciationDetails(
                        accuracy(differences.path("phoneme_error_rate")),
                        accuracy(differences.path("word_error_rate")),
                        wordErrors(differences.path("errors"))));
    }

    /** An error rate (0 is perfect) as the share that matches; a missing rate counts as nothing matching. */
    private static BigDecimal accuracy(JsonNode errorRate) {
        return percent((1.0 - (errorRate.isNumber() ? errorRate.asDouble() : 1.0)) * 100.0);
    }

    private static BigDecimal percent(double value) {
        return BigDecimal.valueOf(Math.max(0.0, Math.min(100.0, value))).setScale(2, RoundingMode.HALF_UP);
    }

    private static List<PronunciationDetails.WordError> wordErrors(JsonNode errorNodes) {
        List<PronunciationDetails.WordError> errors = new ArrayList<>();
        if (!errorNodes.isArray()) {
            return errors;
        }
        for (JsonNode error : errorNodes) {
            if (errors.size() == MAX_ERRORS) {
                break;
            }
            errors.add(new PronunciationDetails.WordError(
                    error.path("word").asText(""),
                    error.path("expected").asText(""),
                    error.path("actual").asText("")));
        }
        return errors;
    }
}
