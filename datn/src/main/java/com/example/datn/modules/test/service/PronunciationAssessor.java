package com.example.datn.modules.test.service;

import com.example.datn.modules.test.entity.PronunciationDetails;

import java.math.BigDecimal;

/**
 * Scores how a recording of a reference sentence was pronounced. Module C talks only to this contract, so the
 * service behind it can change (and tests can replace it) without touching the test-taking flow.
 */
public interface PronunciationAssessor {

    /**
     * @param wav the learner's recording (WAV)
     * @param referenceText the sentence the learner was asked to read
     * @throws com.example.datn.modules.test.exception.PronunciationUnavailableException when the service cannot
     *         assess now; nothing is scored, the learner records again later
     */
    Assessment assess(byte[] wav, String referenceText);

    /**
     * @param score the overall pronunciation score, 0-100
     * @param recognizedText what the service heard
     */
    record Assessment(BigDecimal score, String recognizedText, PronunciationDetails details) {
    }
}
