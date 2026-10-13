package com.example.datn.modules.test.service;

import com.example.datn.modules.test.dto.request.AdminTestRequest;
import com.example.datn.modules.test.dto.request.AdminTestRequest.Material;
import com.example.datn.modules.test.dto.request.AdminTestRequest.Option;
import com.example.datn.modules.test.dto.request.AdminTestRequest.Question;
import com.example.datn.modules.test.dto.request.DuplicateTestRequest;
import com.example.datn.modules.test.dto.response.AdminTestResponse;
import com.example.datn.modules.test.dto.response.AdminTestSummaryResponse;
import com.example.datn.modules.test.dto.response.TestDeleteResponse;
import com.example.datn.modules.test.entity.Test;
import com.example.datn.modules.test.entity.TestPassage;
import com.example.datn.modules.test.entity.TestQuestion;
import com.example.datn.modules.test.entity.TestQuestionAcceptedAnswer;
import com.example.datn.modules.test.entity.TestQuestionOption;
import com.example.datn.modules.test.enums.AdminQuestionType;
import com.example.datn.modules.test.enums.TestAttemptStatus;
import com.example.datn.modules.test.enums.TestDeleteResult;
import com.example.datn.modules.test.enums.TestMaterialType;
import com.example.datn.modules.test.enums.TestQuestionType;
import com.example.datn.modules.test.enums.TestStatus;
import com.example.datn.modules.test.exception.InvalidTestException;
import com.example.datn.modules.test.exception.TestLockedException;
import com.example.datn.modules.test.exception.TestNotFoundException;
import com.example.datn.modules.test.repository.AttemptTally;
import com.example.datn.modules.test.repository.TestAttemptRepository;
import com.example.datn.modules.test.repository.TestPassageRepository;
import com.example.datn.modules.test.repository.TestQuestionAcceptedAnswerRepository;
import com.example.datn.modules.test.repository.TestQuestionOptionRepository;
import com.example.datn.modules.test.repository.TestQuestionRepository;
import com.example.datn.modules.test.repository.TestRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * The admin's side of tests (docs/api/admin.md, "Đề kiểm tra"; scenario 24): list them, read one with its answers,
 * write one, hide or delete it, duplicate it. The editor speaks of materials and of four question types; this class
 * and {@link AdminTestViews} turn those into the passages and questions the rest of the module grades.
 */
@Service
@Transactional
public class AdminTestService {

    /** Attempts learners have handed in: from then on the test they were graded on stays as it is. */
    private static final List<TestAttemptStatus> SUBMITTED =
            List.of(TestAttemptStatus.SUBMITTED, TestAttemptStatus.GRADED);

    private final TestRepository testRepository;
    private final TestPassageRepository passageRepository;
    private final TestQuestionRepository questionRepository;
    private final TestQuestionOptionRepository optionRepository;
    private final TestQuestionAcceptedAnswerRepository acceptedAnswerRepository;
    private final TestAttemptRepository attemptRepository;
    private final TestCalendar calendar;

    public AdminTestService(
            TestRepository testRepository,
            TestPassageRepository passageRepository,
            TestQuestionRepository questionRepository,
            TestQuestionOptionRepository optionRepository,
            TestQuestionAcceptedAnswerRepository acceptedAnswerRepository,
            TestAttemptRepository attemptRepository,
            TestCalendar calendar) {
        this.testRepository = testRepository;
        this.passageRepository = passageRepository;
        this.questionRepository = questionRepository;
        this.optionRepository = optionRepository;
        this.acceptedAnswerRepository = acceptedAnswerRepository;
        this.attemptRepository = attemptRepository;
        this.calendar = calendar;
    }

    /** Every test whatever its status, the newest first. */
    @Transactional(readOnly = true)
    public List<AdminTestSummaryResponse> list() {
        List<Test> tests = testRepository.findAllByOrderByIdDesc();
        if (tests.isEmpty()) {
            return List.of();
        }
        List<Long> testIds = tests.stream().map(Test::getId).toList();
        Map<Long, List<TestQuestion>> questions = questionRepository.findByTestIdIn(testIds).stream()
                .collect(Collectors.groupingBy(TestQuestion::getTestId));
        Map<Long, Submissions> submissions = submissionsOf(testIds);
        Instant now = calendar.now();
        return tests.stream()
                .map(test -> AdminTestViews.summary(
                        test,
                        questions.getOrDefault(test.getId(), List.of()),
                        submissions.getOrDefault(test.getId(), Submissions.NONE),
                        now))
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminTestResponse detail(Long testId) {
        return view(find(testId));
    }

    public AdminTestResponse create(AdminTestRequest request) {
        if (request.type() == null) {
            throw new InvalidTestException("type must be PERIODIC or COMPREHENSIVE");
        }
        AdminTestRequest wanted = AdminTestRules.check(request, request.type(), null);

        Test test = new Test(wanted.title(), wanted.type(), null, TestCalendar.startOf(wanted.startDate()),
                TestCalendar.endOf(wanted.endDate()), wanted.status());
        test.describe(wanted.skillText(), wanted.instruction());
        testRepository.save(test);
        writeContent(test.getId(), wanted, TestContent.EMPTY);
        return view(test);
    }

    /**
     * Saves the test as the editor has it. Once learners have submitted it, only its title, its closing date and
     * showing or hiding it may change (scenario 24, branch 2a): anything else, the wording of a question included,
     * is refused, so that their scores always match the test.
     */
    public AdminTestResponse update(Long testId, AdminTestRequest request) {
        Test test = find(testId);
        TestContent content = contentOf(testId);
        AdminTestRequest wanted = AdminTestRules.check(request, test.getType(), test);

        if (attemptRepository.existsByTestIdAndStatusIn(testId, SUBMITTED)) {
            if (wanted.status() == TestStatus.DRAFT || !sameGradedContent(test, content, wanted)) {
                throw new TestLockedException(testId);
            }
        } else {
            test.describe(wanted.skillText(), wanted.instruction());
            writeContent(testId, wanted, content);
        }
        test.rename(wanted.title());
        test.schedule(
                moment(wanted.startDate(), test.getStartDate(), TestCalendar::startOf),
                moment(wanted.endDate(), test.getEndDate(), TestCalendar::endOf));
        test.setStatus(wanted.status());
        return view(test);
    }

    /** Scenario 24, branch 2b: a test learners have submitted is only hidden, so that their results stay. */
    public TestDeleteResponse delete(Long testId) {
        Test test = find(testId);
        if (attemptRepository.existsByTestIdAndStatusIn(testId, SUBMITTED)) {
            test.setStatus(TestStatus.HIDDEN);
            return new TestDeleteResponse(TestDeleteResult.HIDDEN);
        }
        // Its passages, its questions and the attempts nobody submitted go with it (test_id ON DELETE CASCADE).
        testRepository.delete(test);
        return new TestDeleteResponse(TestDeleteResult.DELETED);
    }

    /** A draft with the content of a test under a new name and new dates; no attempt is copied. */
    public AdminTestResponse duplicate(Long testId, DuplicateTestRequest request) {
        Test source = find(testId);
        String title = AdminTestRules.title(request.title());
        AdminTestRules.dates(request.startDate(), request.endDate(), false, false);
        TestContent content = contentOf(testId);

        Test copy = new Test(title, source.getType(), source.getSkill(), TestCalendar.startOf(request.startDate()),
                TestCalendar.endOf(request.endDate()), TestStatus.DRAFT);
        copy.describe(source.getSkillText(), source.getInstruction());
        copy.duplicatedFrom(source.getId());
        Long copyId = testRepository.save(copy).getId();

        Map<Long, Long> passageIds = new HashMap<>();
        for (TestPassage passage : content.passages()) {
            TestPassage copied = passageRepository.save(new TestPassage(
                    copyId, passage.getTitle(), passage.getContent(), passage.getAudioUrl(), passage.getTranscript()));
            passageIds.put(passage.getId(), copied.getId());
        }
        int place = 0;
        for (TestQuestion question : content.questions()) {
            TestQuestion copied = new TestQuestion(copyId, question.getQuestionType(), question.getSkill(),
                    question.getContent(), question.getPoints(), question.getAudioUrl());
            copied.edit(question.getQuestionType(), question.getSkill(), question.getContent(), question.getPoints(),
                    question.getAudioUrl(), question.getLevel(), passageIds.get(question.getPassageId()),
                    question.getReferenceText(), question.getVocabularyId(), place++);
            Long copiedId = questionRepository.save(copied).getId();
            for (TestQuestionOption option : content.optionsOf(question.getId())) {
                optionRepository.save(new TestQuestionOption(copiedId, option.getContent(), option.isCorrect()));
            }
            for (TestQuestionAcceptedAnswer answer : content.acceptedAnswersOf(question.getId())) {
                acceptedAnswerRepository.save(new TestQuestionAcceptedAnswer(
                        copiedId, answer.getAnswerText(), answer.getNormalizedAnswer(), answer.isPrimary()));
            }
        }
        return view(copy);
    }

    /**
     * Makes the passages and questions of a test those of the request: an item with an id is rewritten in place (the
     * answers of an attempt in progress keep pointing at it), one without is added, and what the request no longer
     * has is removed.
     */
    private void writeContent(Long testId, AdminTestRequest wanted, TestContent content) {
        try {
            writePassagesAndQuestions(testId, wanted, content);
            questionRepository.flush();
        } catch (DataIntegrityViolationException exception) {
            // Everything else was checked before writing: what is left is a word the vocabulary bank does not have.
            throw new InvalidTestException("vocabularyId: a question is made from a word that does not exist");
        }
    }

    private void writePassagesAndQuestions(Long testId, AdminTestRequest wanted, TestContent content) {
        // Materials first: a question points at its material by the material's place in the request.
        Map<Long, TestPassage> passagesLeft = byId(content.passages(), TestPassage::getId);
        List<Long> passageIds = new ArrayList<>();
        for (Material material : wanted.materials()) {
            TestPassage passage = claim(passagesLeft, material.id(), "material " + (passageIds.size() + 1));
            String transcript = transcript(material, passage);
            if (passage == null) {
                passage = new TestPassage(testId, material.title(), material.text(), material.audioUrl(), transcript);
            } else {
                passage.edit(material.title(), material.text(), material.audioUrl(), transcript);
            }
            passageIds.add(passageRepository.save(passage).getId());
        }

        Map<Long, TestQuestion> questionsLeft = byId(content.questions(), TestQuestion::getId);
        int place = 0;
        for (Question wantedQuestion : wanted.questions()) {
            String label = "question " + (place + 1);
            TestQuestion question = claim(questionsLeft, wantedQuestion.id(), label);
            List<TestQuestionOption> options = question == null ? List.of() : content.optionsOf(question.getId());
            List<TestQuestionAcceptedAnswer> acceptedAnswers =
                    question == null ? List.of() : content.acceptedAnswersOf(question.getId());

            TestQuestionType type = storedType(wantedQuestion, question, options, acceptedAnswers);
            String referenceText = referenceText(wantedQuestion, question);
            Long passageId = wantedQuestion.materialIndex() == null ? null : passageIds.get(wantedQuestion.materialIndex());
            if (question == null) {
                question = new TestQuestion(testId, type, wantedQuestion.skill(), wantedQuestion.content(),
                        wantedQuestion.points(), wantedQuestion.audioUrl());
            }
            question.edit(type, wantedQuestion.skill(), wantedQuestion.content(), wantedQuestion.points(),
                    wantedQuestion.audioUrl(), wantedQuestion.level(), passageId, referenceText,
                    wantedQuestion.vocabularyId(), place++);
            Long questionId = questionRepository.save(question).getId();

            writeOptions(questionId, wantedQuestion.options(), options, label);
            writeAcceptedAnswers(questionId, wantedQuestion.acceptedAnswers(), acceptedAnswers);
        }

        for (TestQuestion removed : questionsLeft.values()) {
            optionRepository.deleteAll(content.optionsOf(removed.getId()));
            acceptedAnswerRepository.deleteAll(content.acceptedAnswersOf(removed.getId()));
            questionRepository.delete(removed);
        }
        passageRepository.deleteAll(passagesLeft.values());
    }

    private void writeOptions(Long questionId, List<Option> wanted, List<TestQuestionOption> stored, String label) {
        Map<Long, TestQuestionOption> left = byId(stored, TestQuestionOption::getId);
        for (Option wantedOption : wanted) {
            TestQuestionOption option = claim(left, wantedOption.id(), label + ": option");
            if (option == null) {
                option = new TestQuestionOption(questionId, wantedOption.text(), wantedOption.correct());
            } else {
                option.edit(wantedOption.text(), wantedOption.correct());
            }
            optionRepository.save(option);
        }
        optionRepository.deleteAll(left.values());
    }

    /** Accepted answers have no id in the editor: they are written again whenever the list is not the same. */
    private void writeAcceptedAnswers(Long questionId, List<String> wanted, List<TestQuestionAcceptedAnswer> stored) {
        if (AdminTestViews.answerTexts(stored).equals(wanted)) {
            return;
        }
        acceptedAnswerRepository.deleteAll(stored);
        for (int index = 0; index < wanted.size(); index++) {
            String answer = wanted.get(index);
            // The first one is the answer a learner who got it wrong is shown.
            acceptedAnswerRepository.save(new TestQuestionAcceptedAnswer(
                    questionId, answer, AnswerNormalizer.normalize(answer), index == 0));
        }
    }

    /**
     * Whether the request leaves everything learners were graded on as it is: what the test covers and how to take
     * it, the day it opened, and its materials and questions down to their wording, answers and points.
     */
    private static boolean sameGradedContent(Test test, TestContent content, AdminTestRequest wanted) {
        Map<Long, TestPassage> passages = byId(content.passages(), TestPassage::getId);
        Map<Long, TestQuestion> questions = byId(content.questions(), TestQuestion::getId);

        List<AdminTestResponse.Material> wantedMaterials = wanted.materials().stream()
                .map(material -> new AdminTestResponse.Material(
                        material.id(), material.type(), material.title(), material.audioUrl(), material.text(),
                        transcript(material, material.id() == null ? null : passages.get(material.id()))))
                .toList();
        List<AdminTestResponse.Question> wantedQuestions = wanted.questions().stream()
                .map(question -> {
                    TestQuestion stored = question.id() == null ? null : questions.get(question.id());
                    return new AdminTestResponse.Question(
                            question.id(), question.skill(), question.type(), question.points(), question.audioUrl(),
                            question.content(),
                            question.materialIndex() == null ? null : wanted.materials().get(question.materialIndex()).id(),
                            question.vocabularyId(), question.level(), referenceText(question, stored),
                            question.options().stream()
                                    .map(option -> new AdminTestResponse.Option(option.id(), option.text(), option.correct()))
                                    .toList(),
                            question.acceptedAnswers());
                })
                .toList();

        return Objects.equals(AdminTestRules.clean(test.getSkillText()), wanted.skillText())
                && Objects.equals(AdminTestRules.clean(test.getInstruction()), wanted.instruction())
                && Objects.equals(TestCalendar.dayOf(test.getStartDate()), wanted.startDate())
                && AdminTestViews.materials(content).equals(wantedMaterials)
                && AdminTestViews.questions(content).equals(wantedQuestions);
    }

    /**
     * The stored type of a question the editor saved. A question whose skill and type did not change keeps the one
     * it has, which for an older question may be its skill (LISTENING, READING, WRITING).
     */
    private static TestQuestionType storedType(
            Question wanted,
            TestQuestion stored,
            List<TestQuestionOption> options,
            List<TestQuestionAcceptedAnswer> acceptedAnswers) {
        boolean unchanged = stored != null
                && TestGradingService.skillOf(stored) == wanted.skill()
                && AdminTestViews.typeOf(stored, options, acceptedAnswers) == wanted.type();
        return unchanged ? stored.getQuestionType() : AdminTestViews.storedType(wanted.type());
    }

    /** Only a speaking question is read aloud; see {@link #kept} for a sentence the editor did not send. */
    private static String referenceText(Question wanted, TestQuestion stored) {
        if (wanted.type() != AdminQuestionType.SPEAKING) {
            return null;
        }
        return kept(wanted.referenceText(), stored == null ? null : stored.getReferenceText());
    }

    /** Only a recording has a transcript; see {@link #kept} for one the editor did not send. */
    private static String transcript(Material wanted, TestPassage stored) {
        if (wanted.type() != TestMaterialType.LISTENING) {
            return null;
        }
        return kept(wanted.transcript(), stored == null ? null : stored.getTranscript());
    }

    /**
     * A text an older client may not know: not sent (null) keeps what is stored, sent empty clears it, and anything
     * else replaces it.
     */
    private static String kept(String sent, String stored) {
        return sent == null ? AdminTestRules.clean(stored) : AdminTestRules.clean(sent);
    }

    /** The moment of a day the editor sent; the stored moment when it already falls on that day. */
    private static Instant moment(LocalDate day, Instant stored, Function<LocalDate, Instant> ofDay) {
        if (day == null || day.equals(TestCalendar.dayOf(stored))) {
            return stored;
        }
        return ofDay.apply(day);
    }

    /**
     * Takes the stored item an id of the request names, so that what is left afterwards is what the request dropped.
     * No id is a new item (null). An id the test does not have, or the same id twice, is refused.
     */
    private static <T> T claim(Map<Long, T> left, Long id, String label) {
        if (id == null) {
            return null;
        }
        T item = left.remove(id);
        if (item == null) {
            throw new InvalidTestException(label + ": id " + id + " is not one of this test, or is listed twice");
        }
        return item;
    }

    private static <T> Map<Long, T> byId(List<T> items, Function<T, Long> id) {
        Map<Long, T> byId = new LinkedHashMap<>();
        items.forEach(item -> byId.put(id.apply(item), item));
        return byId;
    }

    private AdminTestResponse view(Test test) {
        Long testId = test.getId();
        AdminTestResponse.TestRef duplicatedFrom = test.getDuplicatedFromId() == null
                ? null
                : testRepository.findById(test.getDuplicatedFromId())
                        .map(source -> new AdminTestResponse.TestRef(source.getId(), source.getTitle()))
                        .orElse(null);
        Submissions submissions = submissionsOf(List.of(testId)).getOrDefault(testId, Submissions.NONE);
        return AdminTestViews.detail(test, contentOf(testId), submissions, duplicatedFrom, calendar.now());
    }

    private Test find(Long testId) {
        return testRepository.findById(testId).orElseThrow(() -> new TestNotFoundException(testId));
    }

    private TestContent contentOf(Long testId) {
        List<TestQuestion> questions = questionRepository.findByTestIdOrderBySortOrderAscIdAsc(testId);
        List<Long> questionIds = questions.stream().map(TestQuestion::getId).toList();
        Map<Long, List<TestQuestionOption>> options = questionIds.isEmpty()
                ? Map.of()
                : optionRepository.findByQuestionIdInOrderByIdAsc(questionIds).stream()
                        .collect(Collectors.groupingBy(TestQuestionOption::getQuestionId));
        Map<Long, List<TestQuestionAcceptedAnswer>> acceptedAnswers = questionIds.isEmpty()
                ? Map.of()
                : acceptedAnswerRepository.findByQuestionIdIn(questionIds).stream()
                        .collect(Collectors.groupingBy(TestQuestionAcceptedAnswer::getQuestionId));
        return new TestContent(passageRepository.findByTestIdOrderByIdAsc(testId), questions, options, acceptedAnswers);
    }

    private Map<Long, Submissions> submissionsOf(Collection<Long> testIds) {
        Map<Long, Submissions> byTest = new HashMap<>();
        for (AttemptTally tally : attemptRepository.tally(testIds, SUBMITTED)) {
            byTest.merge(tally.testId(), Submissions.of(tally), Submissions::plus);
        }
        return byTest;
    }
}
