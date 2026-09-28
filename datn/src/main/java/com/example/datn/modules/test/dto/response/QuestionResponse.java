package com.example.datn.modules.test.dto.response;

import com.example.datn.modules.test.enums.TestQuestionType;
import com.example.datn.modules.test.enums.TestSkill;

import java.util.List;

/** A question of a test, without answers (they are only revealed after submission). */
public record QuestionResponse(
        Long id,
        TestQuestionType type,
        TestSkill skill,
        String content,
        int points,
        String audioUrl,
        List<OptionResponse> options) {
}
