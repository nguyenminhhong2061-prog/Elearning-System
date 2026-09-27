package com.example.datn.modules.test.service;

import com.example.datn.common.enums.CefrLevel;

/** Maps a 0-100 score to a CEFR level using the fixed EF SET thresholds (docs/api/progress.md). */
public final class CefrLevels {

    private CefrLevels() {
    }

    public static CefrLevel fromScore(int score) {
        if (score <= 30) {
            return CefrLevel.A1;
        }
        if (score <= 40) {
            return CefrLevel.A2;
        }
        if (score <= 50) {
            return CefrLevel.B1;
        }
        if (score <= 60) {
            return CefrLevel.B2;
        }
        if (score <= 70) {
            return CefrLevel.C1;
        }
        return CefrLevel.C2;
    }
}
