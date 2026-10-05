package com.example.datn.modules.test;

import com.example.datn.common.enums.CefrLevel;
import com.example.datn.modules.test.config.TestAiProperties;
import com.example.datn.modules.test.entity.TestQuestion;
import com.example.datn.modules.test.enums.TestQuestionType;
import com.example.datn.modules.test.enums.TestSkill;
import com.example.datn.modules.test.service.AiAssessment;
import com.example.datn.modules.test.service.GroqTestAiGateway;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class GroqTestAiGatewayTests {

    private static final TestQuestion WRITING = new TestQuestion(
            1L, TestQuestionType.WRITING, TestSkill.WRITING, "Describe your last holiday.", 6, null, CefrLevel.B1);

    private HttpServer server;
    private final List<String> requests = new ArrayList<>();

    @AfterEach
    void stopServer() {
        if (server != null) {
            server.stop(0);
        }
    }

    @Test
    void readsTheBandsAndCommentOfTheExaminer() throws Exception {
        GroqTestAiGateway gateway = gatewayReplying(200, chatReply(
                "Here is my rating: {\\\"task\\\": 4, \\\"coherence\\\": 3, \\\"vocabulary\\\": 3, \\\"grammar\\\": 2,"
                        + " \\\"comment\\\": \\\"Ý rõ ràng; cần ôn thì quá khứ.\\\"}"));

        Optional<AiAssessment> assessment = gateway.assess(WRITING, "Last summer I go to Da Nang with my family.");

        assertThat(assessment).isPresent();
        assertThat(assessment.get().criteria())
                .containsExactlyInAnyOrderEntriesOf(Map.of("task", 4, "coherence", 3, "vocabulary", 3, "grammar", 2));
        assertThat(assessment.get().comment()).isEqualTo("Ý rõ ràng; cần ôn thì quá khứ.");
        assertThat(AiAssessment.band(assessment.get().criteria())).isEqualTo(3.0);

        // The request carries the task, its level and the learner's answer, and asks for a repeatable rating.
        assertThat(requests).hasSize(1);
        assertThat(requests.getFirst())
                .contains("Describe your last holiday.")
                .contains("Level of the task: B1")
                .contains("Last summer I go to Da Nang")
                .contains("\"temperature\":0");
    }

    @Test
    void replyThatIsNotTheExpectedJsonLeavesTheAnswerUngraded() throws Exception {
        assertThat(gatewayReplying(200, chatReply("I cannot rate this.")).assess(WRITING, "text")).isEmpty();
        stopServer();
        assertThat(gatewayReplying(200, chatReply("{\\\"task\\\": 9, \\\"coherence\\\": 3, \\\"vocabulary\\\": 3}"))
                .assess(WRITING, "text")).isEmpty();
    }

    @Test
    void serviceErrorLeavesTheAnswerUngraded() throws Exception {
        assertThat(gatewayReplying(503, "{}").assess(WRITING, "text")).isEmpty();
    }

    @Test
    void withoutAKeyNothingIsSentAndTheRoadmapIsTheFixedOne() {
        GroqTestAiGateway gateway = new GroqTestAiGateway(new TestAiProperties(
                "http://127.0.0.1:1", "test-model", "", "", Duration.ofSeconds(2), Duration.ofSeconds(2)));

        assertThat(gateway.assess(WRITING, "text")).isEmpty();
        assertThat(gateway.suggestRoadmap(CefrLevel.B1, Map.of(TestSkill.SPEAKING, 30, TestSkill.READING, 70)))
                .contains("kỹ năng Nói")
                .contains("B1");
    }

    private GroqTestAiGateway gatewayReplying(int status, String body) throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/chat/completions", exchange -> {
            requests.add(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            byte[] response = body.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(status, response.length);
            exchange.getResponseBody().write(response);
            exchange.close();
        });
        server.start();
        return new GroqTestAiGateway(new TestAiProperties(
                "http://127.0.0.1:" + server.getAddress().getPort(), "test-model", "key-test", "",
                Duration.ofSeconds(2), Duration.ofSeconds(2)));
    }

    /** A chat completion whose message content is {@code content} (already escaped for a JSON string). */
    private static String chatReply(String content) {
        return "{\"choices\":[{\"message\":{\"role\":\"assistant\",\"content\":\"" + content + "\"}}]}";
    }
}
