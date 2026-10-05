package com.example.datn.modules.exercise;

import com.example.datn.modules.exercise.service.OpenPronounceClient;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

class OpenPronounceClientTests {
    @Test
    void sendsFileAndFormFieldsAsMultipart() throws Exception {
        AtomicReference<String> contentType = new AtomicReference<>();
        AtomicReference<String> requestBody = new AtomicReference<>();
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/pronunciation", exchange -> {
            contentType.set(exchange.getRequestHeaders().getFirst("Content-Type"));
            requestBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.ISO_8859_1));
            byte[] response = "{\"score\":90,\"differences\":{}}".getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, response.length);
            exchange.getResponseBody().write(response);
            exchange.close();
        });
        server.start();
        try {
            OpenPronounceClient client = new OpenPronounceClient(
                    "http://127.0.0.1:" + server.getAddress().getPort(),
                    Duration.ofSeconds(2), Duration.ofSeconds(2));
            client.assess(new byte[] {'R', 'I', 'F', 'F'}, "hello world");
        } finally {
            server.stop(0);
        }

        assertThat(contentType.get()).startsWith("multipart/form-data;").contains("boundary=");
        String boundary = contentType.get().substring(contentType.get().indexOf("boundary=") + 9)
                .replace("\"", "");
        assertThat(requestBody.get()).startsWith("--" + boundary + "\r\n").endsWith("--" + boundary + "--\r\n")
                .contains("name=\"file\"; filename=\"recording.wav\"")
                .contains("name=\"expected_text\"")
                .contains("hello world")
                .contains("name=\"lang\"")
                .contains("en");
    }
}
