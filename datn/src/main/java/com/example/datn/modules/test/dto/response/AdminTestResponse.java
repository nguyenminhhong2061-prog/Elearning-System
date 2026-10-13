package com.example.datn.modules.test.dto.response;

import com.example.datn.common.enums.CefrLevel;
import com.example.datn.modules.test.enums.AdminQuestionType;
import com.example.datn.modules.test.enums.TestMaterialType;
import com.example.datn.modules.test.enums.TestPhase;
import com.example.datn.modules.test.enums.TestSkill;
import com.example.datn.modules.test.enums.TestStatus;
import com.example.datn.modules.test.enums.TestType;

import java.time.LocalDate;
import java.util.List;

/**
 * A test with everything the admin editor shows (docs/api/admin.md, GET /api/admin/tests/{id}): the fields of
 * {@link AdminTestSummaryResponse} plus its instruction, its materials and its questions with their answers.
 */
public record AdminTestResponse(
        Long id,
        String title,
        TestType type,
        String skillText,
        LocalDate startDate,
        LocalDate endDate,
        TestStatus status,
        TestPhase phase,
        int questionCount,
        List<TestSkill> skills,
        long submissions,
        Integer averageScore,
        String instruction,
        TestRef duplicatedFrom,
        List<Material> materials,
        List<Question> questions) {

    /** The test this one was duplicated from. */
    public record TestRef(Long id, String title) {
    }

    /** A passage of the test: a listening one has {@code audioUrl} and maybe a transcript, a reading one has {@code text}. */
    public record Material(
            Long id,
            TestMaterialType type,
            String title,
            String audioUrl,
            String text,
            String transcript) {
    }

    /**
     * {@code options} is only filled for MULTIPLE_CHOICE and {@code acceptedAnswers} for FILL_BLANK. {@code level} is
     * the CEFR level the question tests and {@code referenceText} the sentence of a read-aloud question; both may be
     * null.
     */
    public record Question(
            Long id,
            TestSkill skill,
            AdminQuestionType type,
            int points,
            String audioUrl,
            String content,
            Long materialId,
            Long vocabularyId,
            CefrLevel level,
            String referenceText,
            List<Option> options,
            List<String> acceptedAnswers) {
    }

    public record Option(Long id, String text, boolean correct) {
    }
}
