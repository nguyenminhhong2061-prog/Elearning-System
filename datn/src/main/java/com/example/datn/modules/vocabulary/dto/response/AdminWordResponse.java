package com.example.datn.modules.vocabulary.dto.response;

import com.example.datn.common.enums.CefrLevel;
import com.example.datn.common.test.WordQuestionLookup.TestRef;

import java.time.Instant;
import java.util.List;

/**
 * A system word with what uses it (docs/api/admin.md, GET /api/admin/vocabulary): learners studying it, personal lists
 * holding it, test questions made from it and the open tests among those (scenario 21).
 */
public record AdminWordResponse(
        Long id,
        Long topicId,
        String word,
        String phonetic,
        String meaning,
        String exampleSentence,
        String audioUrl,
        String imageUrl,
        CefrLevel difficultyLevel,
        long learnerCount,
        long listCount,
        long questionCount,
        List<TestRef> openTests,
        Instant updatedAt) {
}
