package com.example.datn.modules.test.service;

import java.util.Locale;

/** Normalizes a short text answer before comparing it with accepted answers (docs/api/tests.md). */
public final class AnswerNormalizer {

    private AnswerNormalizer() {
    }

    public static String normalize(String value) {
        if (value == null) {
            return "";
        }
        return value.trim()
                .replaceAll("\\s+", " ")
                .toLowerCase(Locale.ROOT)
                .replace('\u2019', '\'');
    }
}
