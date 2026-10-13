package com.example.datn.modules.test.service;

import com.example.datn.modules.test.dto.request.AdminTestRequest;
import com.example.datn.modules.test.dto.request.AdminTestRequest.Material;
import com.example.datn.modules.test.dto.request.AdminTestRequest.Option;
import com.example.datn.modules.test.dto.request.AdminTestRequest.Question;
import com.example.datn.modules.test.entity.Test;
import com.example.datn.modules.test.enums.AdminQuestionType;
import com.example.datn.modules.test.enums.TestMaterialType;
import com.example.datn.modules.test.enums.TestSkill;
import com.example.datn.modules.test.enums.TestStatus;
import com.example.datn.modules.test.enums.TestType;
import com.example.datn.modules.test.exception.InvalidTestException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * The rules of a test the admin editor saves (docs/api/admin.md, "Đề kiểm tra"; scenario 24, step 9). Checking a
 * request also tidies it, so that what is stored and what is compared with a test learners have submitted is the
 * same text the editor will read back.
 */
final class AdminTestRules {

    static final int MAX_TITLE = 200;
    static final int MAX_SKILL_TEXT = 200;
    static final int MAX_MATERIAL_TITLE = 255;
    static final int MAX_URL = 500;
    static final int MAX_OPTION = 500;
    static final int MAX_ACCEPTED_ANSWER = 255;
    static final int MIN_OPTIONS = 2;
    static final int MAX_OPTIONS = 6;

    /** How each skill may be answered: listening and reading are never the examiner's, speaking always is spoken. */
    private static final Map<TestSkill, Set<AdminQuestionType>> TYPES_BY_SKILL = Map.of(
            TestSkill.LISTENING, EnumSet.of(AdminQuestionType.MULTIPLE_CHOICE, AdminQuestionType.FILL_BLANK),
            TestSkill.READING, EnumSet.of(AdminQuestionType.MULTIPLE_CHOICE, AdminQuestionType.FILL_BLANK),
            TestSkill.WRITING, EnumSet.of(
                    AdminQuestionType.MULTIPLE_CHOICE, AdminQuestionType.FILL_BLANK, AdminQuestionType.ESSAY),
            TestSkill.SPEAKING, EnumSet.of(AdminQuestionType.SPEAKING));

    private AdminTestRules() {
    }

    /**
     * Checks a test and returns it tidied: texts trimmed, empty ones null, lists never null, and each material and
     * question left with only the fields its kind uses. {@code transcript} and {@code referenceText} keep the
     * difference between null (not sent) and empty (cleared).
     *
     * @param type the kind of the test: the one sent when creating, the stored one when updating
     * @param stored the test being updated, null when creating
     */
    static AdminTestRequest check(AdminTestRequest request, TestType type, Test stored) {
        String title = title(request.title());
        String skillText = shortText(request.skillText(), "skillText", MAX_SKILL_TEXT);

        // An older test without dates ("always open") may stay so; every other test has both.
        LocalDate startDate = request.startDate();
        LocalDate endDate = request.endDate();
        dates(startDate, endDate, stored != null && stored.getStartDate() == null,
                stored != null && stored.getEndDate() == null);

        TestStatus status = request.status();
        if (stored == null) {
            status = status == null ? TestStatus.DRAFT : status;
            if (status == TestStatus.HIDDEN) {
                throw new InvalidTestException("status: a new test is DRAFT or VISIBLE");
            }
        } else if (status == null) {
            status = stored.getStatus();
        }

        List<Material> materials = new ArrayList<>();
        for (Material material : orEmpty(request.materials())) {
            materials.add(material(material, "material " + (materials.size() + 1)));
        }

        List<Question> questions = new ArrayList<>();
        for (Question question : orEmpty(request.questions())) {
            questions.add(question(question, materials, "question " + (questions.size() + 1)));
        }
        if (questions.isEmpty()) {
            throw new InvalidTestException("A test needs at least one question");
        }
        if (type == TestType.COMPREHENSIVE) {
            Set<TestSkill> skills = EnumSet.noneOf(TestSkill.class);
            questions.forEach(question -> skills.add(question.skill()));
            if (skills.size() < TestSkill.values().length) {
                throw new InvalidTestException("A comprehensive test needs all four skills");
            }
        }

        return new AdminTestRequest(type, title, skillText, clean(request.instruction()), startDate, endDate, status,
                List.copyOf(materials), List.copyOf(questions));
    }

    static String title(String value) {
        String title = clean(value);
        if (title == null || title.length() > MAX_TITLE) {
            throw new InvalidTestException("title must be 1-" + MAX_TITLE + " characters");
        }
        return title;
    }

    /** Both dates are there (unless the test may go without) and the test closes after it opens. */
    static void dates(LocalDate startDate, LocalDate endDate, boolean startOptional, boolean endOptional) {
        if ((startDate == null && !startOptional) || (endDate == null && !endOptional)) {
            throw new InvalidTestException("startDate and endDate are required");
        }
        if (startDate != null && endDate != null && !endDate.isAfter(startDate)) {
            throw new InvalidTestException("endDate must be after startDate");
        }
    }

    private static Material material(Material material, String label) {
        if (material == null || material.type() == null) {
            throw new InvalidTestException(label + ": type must be LISTENING or READING");
        }
        String title = shortText(material.title(), label + ": title", MAX_MATERIAL_TITLE);
        if (material.type() == TestMaterialType.LISTENING) {
            String audioUrl = shortText(material.audioUrl(), label + ": audioUrl", MAX_URL);
            if (audioUrl == null) {
                throw new InvalidTestException(label + ": a listening material needs its audio");
            }
            return new Material(material.id(), material.type(), title, audioUrl, null, strip(material.transcript()));
        }
        String text = clean(material.text());
        if (text == null) {
            throw new InvalidTestException(label + ": a reading material needs its text");
        }
        return new Material(material.id(), material.type(), title, null, text, null);
    }

    private static Question question(Question question, List<Material> materials, String label) {
        if (question == null) {
            throw new InvalidTestException(label + ": the question is empty");
        }
        String content = clean(question.content());
        if (content == null) {
            throw new InvalidTestException(label + ": the prompt is empty");
        }
        if (question.points() == null || question.points() < 1) {
            throw new InvalidTestException(label + ": points must be at least 1");
        }
        TestSkill skill = question.skill();
        AdminQuestionType type = question.type();
        if (skill == null) {
            throw new InvalidTestException(label + ": skill is not valid");
        }
        if (type == null || !TYPES_BY_SKILL.get(skill).contains(type)) {
            throw new InvalidTestException(label + ": " + skill + " allows " + TYPES_BY_SKILL.get(skill));
        }

        List<Option> options = type == AdminQuestionType.MULTIPLE_CHOICE ? options(question.options(), label) : List.of();
        List<String> acceptedAnswers =
                type == AdminQuestionType.FILL_BLANK ? acceptedAnswers(question.acceptedAnswers(), label) : List.of();

        Integer materialIndex = question.materialIndex();
        if (materialIndex != null) {
            boolean sameKind = materialIndex >= 0 && materialIndex < materials.size()
                    && materials.get(materialIndex).type().name().equals(skill.name());
            if (!sameKind) {
                throw new InvalidTestException(
                        label + ": materialIndex must point at a " + skill + " material of this test");
            }
        }

        String referenceText = strip(question.referenceText());
        if (type != AdminQuestionType.SPEAKING) {
            if (referenceText != null && !referenceText.isEmpty()) {
                throw new InvalidTestException(label + ": only a speaking question has a sentence to read aloud");
            }
            referenceText = null;
        }

        String audioUrl = skill == TestSkill.LISTENING ? shortText(question.audioUrl(), label + ": audioUrl", MAX_URL) : null;
        return new Question(question.id(), skill, type, question.points(), audioUrl, content, materialIndex,
                question.vocabularyId(), question.level(), referenceText, options, acceptedAnswers);
    }

    private static List<Option> options(List<Option> options, String label) {
        List<Option> cleaned = new ArrayList<>();
        for (Option option : orEmpty(options)) {
            String text = option == null ? null : shortText(option.text(), label + ": option", MAX_OPTION);
            if (text == null) {
                throw new InvalidTestException(label + ": an option is empty");
            }
            cleaned.add(new Option(option.id(), text, Boolean.TRUE.equals(option.correct())));
        }
        if (cleaned.size() < MIN_OPTIONS || cleaned.size() > MAX_OPTIONS) {
            throw new InvalidTestException(label + ": " + MIN_OPTIONS + "-" + MAX_OPTIONS + " options");
        }
        if (cleaned.stream().filter(Option::correct).count() != 1) {
            throw new InvalidTestException(label + ": exactly one correct option");
        }
        return List.copyOf(cleaned);
    }

    private static List<String> acceptedAnswers(List<String> answers, String label) {
        List<String> cleaned = orEmpty(answers).stream()
                .map(answer -> shortText(answer, label + ": accepted answer", MAX_ACCEPTED_ANSWER))
                .filter(Objects::nonNull)
                .toList();
        if (cleaned.isEmpty()) {
            throw new InvalidTestException(label + ": an accepted answer is required");
        }
        return cleaned;
    }

    /** The text trimmed, null when there is nothing in it. */
    static String clean(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }

    private static String strip(String value) {
        return value == null ? null : value.strip();
    }

    private static String shortText(String value, String name, int max) {
        String text = clean(value);
        if (text != null && text.length() > max) {
            throw new InvalidTestException(name + " must be at most " + max + " characters");
        }
        return text;
    }

    private static <T> List<T> orEmpty(List<T> list) {
        return list == null ? List.of() : list;
    }
}
