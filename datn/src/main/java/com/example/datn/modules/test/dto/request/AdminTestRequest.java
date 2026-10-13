package com.example.datn.modules.test.dto.request;

import com.example.datn.common.enums.CefrLevel;
import com.example.datn.modules.test.enums.AdminQuestionType;
import com.example.datn.modules.test.enums.TestMaterialType;
import com.example.datn.modules.test.enums.TestSkill;
import com.example.datn.modules.test.enums.TestStatus;
import com.example.datn.modules.test.enums.TestType;

import java.time.LocalDate;
import java.util.List;

/**
 * A test as the admin editor saves it (docs/api/admin.md, POST and PUT /api/admin/tests). {@code type} only counts
 * when the test is created. Dates are Vietnamese days. A material or a question with an {@code id} is one the test
 * already has; without, a new one. The rules are checked by the service, not by annotations: most of them compare
 * several fields.
 */
public record AdminTestRequest(
        TestType type,
        String title,
        String skillText,
        String instruction,
        LocalDate startDate,
        LocalDate endDate,
        TestStatus status,
        List<Material> materials,
        List<Question> questions) {

    /**
     * A recording or a text several questions are asked about. A null {@code transcript} keeps what the material
     * has, an empty text clears it.
     */
    public record Material(
            Long id,
            TestMaterialType type,
            String title,
            String audioUrl,
            String text,
            String transcript) {
    }

    /**
     * {@code materialIndex} is the place of the question's material in {@code materials} of the same body: a new
     * material has no id to point at. {@code level} is saved as sent: null leaves the question without a level. A
     * null {@code referenceText} (the sentence of a read-aloud question) keeps what the question has, an empty one
     * clears it.
     */
    public record Question(
            Long id,
            TestSkill skill,
            AdminQuestionType type,
            Integer points,
            String audioUrl,
            String content,
            Integer materialIndex,
            Long vocabularyId,
            CefrLevel level,
            String referenceText,
            List<Option> options,
            List<String> acceptedAnswers) {
    }

    public record Option(Long id, String text, Boolean correct) {
    }
}
