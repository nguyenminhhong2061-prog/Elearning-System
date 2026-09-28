package com.example.datn.modules.exercise.service;

import java.util.Locale;

public final class AnswerNormalizer {
    private AnswerNormalizer() {}

    public static String normalize(String answer) {
        if (answer == null) return null;
        return answer.strip().replace('\u2019', '\'').replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
    }
}
