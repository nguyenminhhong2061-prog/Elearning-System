package com.example.datn.modules.test;

import com.example.datn.modules.test.exception.PronunciationUnavailableException;
import com.example.datn.modules.test.service.OpenPronounceAssessor;
import com.example.datn.modules.test.service.PronunciationAssessor;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class OpenPronounceAssessorTests {

    private static final byte[] WAV = "RIFF....WAVEfmt ".getBytes(StandardCharsets.ISO_8859_1);
    private static final String SENTENCE = "Sustainability is a shared responsibility.";

    private HttpServer server;
    private final List<String> requests = new ArrayList<>();

    @AfterEach
    void stopServer() {
        if (server != null) {
            server.stop(0);
        }
    }

    @Test
    void readsTheScoreWhatWasHeardAndTheWordsThatDiffer() throws Exception {
        PronunciationAssessor assessor = assessorReplying(200, """
                {"score": 82.456, "transcribe": " sustainability is a shared responsibility ",
                 "differences": {"phoneme_error_rate": 0.12, "word_error_rate": 0.2, "errors": [
                   {"word": "sustainability", "expected": "səsteɪnəbɪlɪti", "actual": "səsteɪnbɪlɪti", "confidence": 0.6},
                   {"word": "shared", "expected": "ʃɛrd", "actual": ""}]}}
                """);

        PronunciationAssessor.Assessment assessment = assessor.assess(WAV, SENTENCE);

        assertThat(assessment.score()).isEqualByComparingTo("82.46");
        assertThat(assessment.recognizedText()).isEqualTo("sustainability is a shared responsibility");
        assertThat(assessment.details().phonemeAccuracy()).isEqualByComparingTo("88");
        assertThat(assessment.details().wordAccuracy()).isEqualByComparingTo("80");
        assertThat(assessment.details().errors()).hasSize(2);
        assertThat(assessment.details().errors().get(0).word()).isEqualTo("sustainability");
        assertThat(assessment.details().errors().get(0).heardIpa()).isEqualTo("səsteɪnbɪlɪti");
        // A word that was left out has nothing heard.
        assertThat(assessment.details().errors().get(1).heardIpa()).isEmpty();

        // The recording goes with the sentence it should say.
        assertThat(requests).hasSize(1);
        assertThat(requests.getFirst())
                .contains("name=\"expected_text\"")
                .contains(SENTENCE)
                .contains("filename=\"recording.wav\"")
                .contains("RIFF....WAVE");
    }

    @Test
    void serviceErrorOrUnusableReplyScoresNothing() throws Exception {
        assertThatThrownBy(() -> assessorReplying(500, "{}").assess(WAV, SENTENCE))
                .isInstanceOf(PronunciationUnavailableException.class);
        stopServer();
        // A reply without a score is not turned into one.
        assertThatThrownBy(() -> assessorReplying(200, "{\"transcribe\": \"hello\"}").assess(WAV, SENTENCE))
                .isInstanceOf(PronunciationUnavailableException.class);
    }

    @Test
    void serviceThatIsNotRunningScoresNothing() {
        PronunciationAssessor assessor = new OpenPronounceAssessor(
                "http://127.0.0.1:1", Duration.ofSeconds(1), Duration.ofSeconds(1));

        assertThatThrownBy(() -> assessor.assess(WAV, SENTENCE))
                .isInstanceOf(PronunciationUnavailableException.class);
    }

    private PronunciationAssessor assessorReplying(int status, String body) throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/pronunciation", exchange -> {
            requests.add(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.ISO_8859_1));
            byte[] response = body.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(status, response.length);
            exchange.getResponseBody().write(response);
            exchange.close();
        });
        server.start();
        return new OpenPronounceAssessor(
                "http://127.0.0.1:" + server.getAddress().getPort(), Duration.ofSeconds(2), Duration.ofSeconds(2));
    }
}
