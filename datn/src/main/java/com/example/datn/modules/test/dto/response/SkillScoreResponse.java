package com.example.datn.modules.test.dto.response;

import com.example.datn.common.enums.CefrLevel;

/** The 0-100 score and CEFR level of one skill; both null while the skill is still being AI-graded. */
public record SkillScoreResponse(Integer score, CefrLevel level) {
}
