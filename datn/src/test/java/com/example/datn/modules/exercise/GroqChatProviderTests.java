package com.example.datn.modules.exercise;

import com.example.datn.modules.exercise.config.GroqProperties;
import com.example.datn.modules.exercise.service.ChatProvider;
import com.example.datn.modules.exercise.service.GroqChatProvider;
import com.example.datn.modules.exercise.exception.AiServiceUnavailableException;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import static org.assertj.core.api.Assertions.*;

class GroqChatProviderTests {
    @Test
    void rateLimitUsesBackupAndReadsUsage() throws Exception {
        List<String> keys = new ArrayList<>();
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/chat/completions", exchange -> {
            String key = exchange.getRequestHeaders().getFirst("Authorization");
            keys.add(key);
            String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
            assertThat(body).contains("max_completion_tokens");
            boolean primary = key.equals("Bearer primary-test");
            byte[] response = (primary ? "{}" : "{\"choices\":[{\"message\":{\"content\":\"Xin chào\"}}],\"usage\":{\"prompt_tokens\":10,\"completion_tokens\":5}}").getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(primary ? 429 : 200, response.length);
            exchange.getResponseBody().write(response);
            exchange.close();
        });
        server.start();
        try {
            var provider = new GroqChatProvider(new GroqProperties("http://127.0.0.1:" + server.getAddress().getPort(),
                    "test-model", "primary-test", "backup-test", Duration.ofSeconds(2), Duration.ofSeconds(2)));
            var reply = provider.reply(List.of(new ChatProvider.PromptMessage("user", "Hello")));
            assertThat(reply.content()).isEqualTo("Xin chào");
            assertThat(reply.promptTokens()).isEqualTo(10);
            assertThat(reply.completionTokens()).isEqualTo(5);
            assertThat(keys).containsExactly("Bearer primary-test", "Bearer backup-test");
        } finally { server.stop(0); }
    }

    @Test
    void missingKeysReturnSafeError() {
        var provider = new GroqChatProvider(new GroqProperties("http://localhost", "test", "", "",
                Duration.ofSeconds(2), Duration.ofSeconds(2)));
        assertThatThrownBy(() -> provider.reply(List.of()))
                .isInstanceOf(AiServiceUnavailableException.class).hasMessage("Groq API key is not configured");
    }
}
