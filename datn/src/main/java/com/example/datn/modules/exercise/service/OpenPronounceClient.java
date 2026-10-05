package com.example.datn.modules.exercise.service;

import com.example.datn.modules.exercise.exception.AiServiceUnavailableException;
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

import java.time.Duration;

@Component
public class OpenPronounceClient {
    private final RestClient client;

    public OpenPronounceClient(
            @Value("${app.pronunciation.openpronounce.base-url}") String baseUrl,
            @Value("${app.pronunciation.openpronounce.connect-timeout}") Duration connectTimeout,
            @Value("${app.pronunciation.openpronounce.read-timeout}") Duration readTimeout) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(connectTimeout);
        requestFactory.setReadTimeout(readTimeout);
        this.client = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .build();
    }

    public JsonNode assess(byte[] wav, String expectedText) {
        MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
        form.add("file", new ByteArrayResource(wav) {
            @Override
            public String getFilename() {
                return "recording.wav";
            }
        });
        form.add("expected_text", expectedText);
        form.add("lang", "en");

        try {
            JsonNode response = client.post()
                    .uri("/pronunciation")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(form)
                    .retrieve()
                    .body(JsonNode.class);
            if (response == null || !response.path("score").isNumber()
                    || !response.path("differences").isObject()) {
                throw new AiServiceUnavailableException("OpenPronounce returned an invalid assessment");
            }
            return response;
        } catch (RestClientException exception) {
            throw new AiServiceUnavailableException("Pronunciation assessment service is unavailable");
        }
    }
}
