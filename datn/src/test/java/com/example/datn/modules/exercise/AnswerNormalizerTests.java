package com.example.datn.modules.exercise;

import com.example.datn.modules.exercise.service.AnswerNormalizer;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AnswerNormalizerTests {
    @Test
    void normalizesWhitespaceCaseAndCurlyApostrophe() {
        assertThat(AnswerNormalizer.normalize("  I\u2019M   Ready  ")).isEqualTo("i'm ready");
    }
}
