package com.example.datn.modules.test.service;

import com.example.datn.modules.test.dto.response.AdminTestResponse;
import com.example.datn.modules.test.dto.response.AdminTestSummaryResponse;
import com.example.datn.modules.test.entity.Test;
import com.example.datn.modules.test.entity.TestPassage;
import com.example.datn.modules.test.entity.TestQuestion;
import com.example.datn.modules.test.entity.TestQuestionAcceptedAnswer;
import com.example.datn.modules.test.entity.TestQuestionOption;
import com.example.datn.modules.test.enums.AdminQuestionType;
import com.example.datn.modules.test.enums.TestMaterialType;
import com.example.datn.modules.test.enums.TestPhase;
import com.example.datn.modules.test.enums.TestQuestionType;
import com.example.datn.modules.test.enums.TestSkill;

import java.time.Instant;
import java.util.Collection;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

/**
 * A stored test in the words of the admin editor (docs/api/admin.md): passages are "materials" with a kind, and a
 * question has a skill and one of four types, where test_questions also uses a skill as the type. Texts are tidied
 * the way {@link AdminTestRules} tidies a request, so that a test read and sent back unchanged compares as equal.
 */
final class AdminTestViews {

    private AdminTestViews() {
    }

    static AdminTestSummaryResponse summary(Test test, Collection<TestQuestion> questions, Submissions submissions, Instant now) {
        return new AdminTestSummaryResponse(
                test.getId(),
                test.getTitle(),
                test.getType(),
                test.getSkillText(),
                TestCalendar.dayOf(test.getStartDate()),
                TestCalendar.dayOf(test.getEndDate()),
                test.getStatus(),
                phase(test, now),
                questions.size(),
                skills(questions),
                submissions.count(),
                submissions.averageScore());
    }

    static AdminTestResponse detail(
            Test test, TestContent content, Submissions submissions, AdminTestResponse.TestRef duplicatedFrom, Instant now) {
        return new AdminTestResponse(
                test.getId(),
                test.getTitle(),
                test.getType(),
                test.getSkillText(),
                TestCalendar.dayOf(test.getStartDate()),
                TestCalendar.dayOf(test.getEndDate()),
                test.getStatus(),
                phase(test, now),
                content.questions().size(),
                skills(content.questions()),
                submissions.count(),
                submissions.averageScore(),
                test.getInstruction(),
                duplicatedFrom,
                materials(content),
                questions(content));
    }

    static List<AdminTestResponse.Material> materials(TestContent content) {
        return content.passages().stream().map(AdminTestViews::material).toList();
    }

    static List<AdminTestResponse.Question> questions(TestContent content) {
        return content.questions().stream()
                .map(question -> question(question, content.optionsOf(question.getId()),
                        content.acceptedAnswersOf(question.getId())))
                .toList();
    }

    /** Before its first day, after its last, or between them; a missing date is no bound. */
    static TestPhase phase(Test test, Instant now) {
        if (test.getStartDate() != null && test.getStartDate().isAfter(now)) {
            return TestPhase.UPCOMING;
        }
        if (test.getEndDate() != null && test.getEndDate().isBefore(now)) {
            return TestPhase.CLOSED;
        }
        return TestPhase.OPEN;
    }

    /** The editor's type of a stored question: by what it is answered with, not by the skill kept as its type. */
    static AdminQuestionType typeOf(
            TestQuestion question, List<TestQuestionOption> options, List<TestQuestionAcceptedAnswer> acceptedAnswers) {
        return switch (question.getQuestionType()) {
            case MULTIPLE_CHOICE -> AdminQuestionType.MULTIPLE_CHOICE;
            case FILL_BLANK -> AdminQuestionType.FILL_BLANK;
            case SPEAKING -> AdminQuestionType.SPEAKING;
            case LISTENING, READING ->
                    options.isEmpty() ? AdminQuestionType.FILL_BLANK : AdminQuestionType.MULTIPLE_CHOICE;
            case WRITING -> {
                if (!options.isEmpty()) {
                    yield AdminQuestionType.MULTIPLE_CHOICE;
                }
                yield acceptedAnswers.isEmpty() ? AdminQuestionType.ESSAY : AdminQuestionType.FILL_BLANK;
            }
        };
    }

    /** What test_questions stores for a type of the editor; the skill goes to its own column. */
    static TestQuestionType storedType(AdminQuestionType type) {
        return switch (type) {
            case MULTIPLE_CHOICE -> TestQuestionType.MULTIPLE_CHOICE;
            case FILL_BLANK -> TestQuestionType.FILL_BLANK;
            case SPEAKING -> TestQuestionType.SPEAKING;
            case ESSAY -> TestQuestionType.WRITING;
        };
    }

    private static AdminTestResponse.Material material(TestPassage passage) {
        boolean listening = passage.hasAudio();
        return new AdminTestResponse.Material(
                passage.getId(),
                listening ? TestMaterialType.LISTENING : TestMaterialType.READING,
                AdminTestRules.clean(passage.getTitle()),
                passage.getAudioUrl(),
                listening ? null : AdminTestRules.clean(passage.getContent()),
                listening ? AdminTestRules.clean(passage.getTranscript()) : null);
    }

    private static AdminTestResponse.Question question(
            TestQuestion question, List<TestQuestionOption> options, List<TestQuestionAcceptedAnswer> acceptedAnswers) {
        TestSkill skill = TestGradingService.skillOf(question);
        AdminQuestionType type = typeOf(question, options, acceptedAnswers);
        return new AdminTestResponse.Question(
                question.getId(),
                skill,
                type,
                question.getPoints(),
                skill == TestSkill.LISTENING ? AdminTestRules.clean(question.getAudioUrl()) : null,
                AdminTestRules.clean(question.getContent()),
                question.getPassageId(),
                question.getVocabularyId(),
                question.getLevel(),
                type == AdminQuestionType.SPEAKING ? AdminTestRules.clean(question.getReferenceText()) : null,
                type == AdminQuestionType.MULTIPLE_CHOICE
                        ? options.stream()
                                .map(option -> new AdminTestResponse.Option(
                                        option.getId(), option.getContent().strip(), option.isCorrect()))
                                .toList()
                        : List.of(),
                type == AdminQuestionType.FILL_BLANK ? answerTexts(acceptedAnswers) : List.of());
    }

    /** The accepted answers of a question as the editor lists them: in the order they were saved. */
    static List<String> answerTexts(List<TestQuestionAcceptedAnswer> acceptedAnswers) {
        return acceptedAnswers.stream()
                .sorted(Comparator.comparing(TestQuestionAcceptedAnswer::getId))
                .map(answer -> answer.getAnswerText().strip())
                .toList();
    }

    /** The skills the questions cover, in the order of a comprehensive test. */
    private static List<TestSkill> skills(Collection<TestQuestion> questions) {
        Set<TestSkill> skills = EnumSet.noneOf(TestSkill.class);
        questions.forEach(question -> skills.add(TestGradingService.skillOf(question)));
        return List.copyOf(skills);
    }
}
