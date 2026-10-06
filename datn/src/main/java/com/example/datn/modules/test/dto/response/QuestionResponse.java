package com.example.datn.modules.test.dto.response;

import com.example.datn.modules.test.enums.TestQuestionType;
import com.example.datn.modules.test.enums.TestSkill;

import java.util.List;

/**
 * A question of a test, without answers (they are only revealed after submission). A read-aloud question carries the
 * sentence to read ({@code referenceText}) and how long its recording may be; both are null for other questions.
 */
public record QuestionResponse(
        Long id,
        Long passageId,
        TestQuestionType type,
        TestSkill skill,
        String content,
        int points,
        String audioUrl,
        String referenceText,
        Integer maxRecordingSeconds,
        List<OptionResponse> options) {
}
