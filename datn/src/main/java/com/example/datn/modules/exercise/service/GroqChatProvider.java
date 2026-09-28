package com.example.datn.modules.exercise.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.example.datn.modules.exercise.config.GroqProperties;
import com.example.datn.modules.exercise.exception.AiServiceUnavailableException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.net.http.HttpClient;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Component
public class GroqChatProvider implements ChatProvider {
    private final GroqProperties properties;
    private final RestClient client;

    public GroqChatProvider(GroqProperties properties) {
        this.properties = properties;
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(properties.connectTimeout())
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(properties.readTimeout());
        this.client = RestClient.builder()
                .baseUrl(properties.baseUrl())
                .requestFactory(requestFactory)
                .build();
    }

    @Override
    public Reply reply(List<PromptMessage> messages) {
        Set<String> keys = new LinkedHashSet<>();
        addIfPresent(keys, properties.primaryKey());
        addIfPresent(keys, properties.backupKey());
        if (keys.isEmpty()) {
            throw new AiServiceUnavailableException("Groq API key is not configured");
        }

        RestClientException lastFailure = null;
        int index = 0;
        for (String key : keys) {
            index++;
            try {
                return call(key, messages);
            } catch (RestClientResponseException exception) {
                lastFailure = exception;
                boolean canFallback = index < keys.size() && shouldFallback(exception.getStatusCode());
                if (!canFallback) break;
            } catch (RestClientException exception) {
                lastFailure = exception;
                if (index >= keys.size()) break;
            }
        }
        throw new AiServiceUnavailableException("Groq is temporarily unavailable"
                + (lastFailure == null ? "" : "; please try again later"));
    }

    private Reply call(String key, List<PromptMessage> messages) {
        GroqResponse response = client.post()
                .uri("/chat/completions")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + key)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new GroqRequest(properties.model(), messages, 0.3, 700))
                .retrieve()
                .body(GroqResponse.class);
        if (response == null || response.choices() == null || response.choices().isEmpty()
                || response.choices().getFirst().message() == null
                || response.choices().getFirst().message().content() == null) {
            throw new AiServiceUnavailableException("Groq returned an empty response");
        }
        Usage usage = response.usage();
        return new Reply(response.choices().getFirst().message().content(), "groq", properties.model(),
                usage == null ? null : usage.promptTokens(),
                usage == null ? null : usage.completionTokens());
    }

    private static boolean shouldFallback(HttpStatusCode status) {
        return status.value() == 401 || status.value() == 403 || status.value() == 429 || status.is5xxServerError();
    }

    private static void addIfPresent(Set<String> keys, String key) {
        if (key != null && !key.isBlank()) keys.add(key.strip());
    }

    private record GroqRequest(
            String model,
            List<PromptMessage> messages,
            double temperature,
            @JsonProperty("max_completion_tokens") int maxCompletionTokens) {}
    private record GroqResponse(List<Choice> choices, Usage usage) {}
    private record Choice(ResponseMessage message) {}
    private record ResponseMessage(String role, String content) {}
    private record Usage(
            @JsonProperty("prompt_tokens") Integer promptTokens,
            @JsonProperty("completion_tokens") Integer completionTokens,
            @JsonProperty("total_tokens") Integer totalTokens) {}
}
