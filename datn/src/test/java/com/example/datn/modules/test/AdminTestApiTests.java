package com.example.datn.modules.test;

import com.example.datn.common.enums.CefrLevel;
import com.example.datn.common.test.WordQuestionLookup;
import com.example.datn.modules.test.entity.TestPassage;
import com.example.datn.modules.test.entity.TestQuestion;
import com.example.datn.modules.test.entity.TestQuestionAcceptedAnswer;
import com.example.datn.modules.test.entity.TestQuestionOption;
import com.example.datn.modules.test.enums.TestQuestionType;
import com.example.datn.modules.test.enums.TestSkill;
import com.example.datn.modules.test.enums.TestStatus;
import com.example.datn.modules.test.enums.TestType;
import com.example.datn.modules.test.repository.TestPassageRepository;
import com.example.datn.modules.test.repository.TestQuestionAcceptedAnswerRepository;
import com.example.datn.modules.test.repository.TestQuestionOptionRepository;
import com.example.datn.modules.test.repository.TestQuestionRepository;
import com.example.datn.modules.test.repository.TestRepository;
import com.example.datn.modules.test.service.TestAiGateway;
import com.example.datn.modules.test.service.TestCalendar;
import com.example.datn.support.TestAuth;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The admin test pages (docs/api/admin.md, "Đề kiểm tra"; scenario 24) against H2: what the editor reads and saves,
 * what learners then see, and the rules once a test has been submitted.
 */
@SpringBootTest
@AutoConfigureMockMvc
class AdminTestApiTests {

    private static final long LEARNER = 42;

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private JdbcTemplate jdbcTemplate;
    @Autowired
    private TestRepository testRepository;
    @Autowired
    private TestPassageRepository passageRepository;
    @Autowired
    private TestQuestionRepository questionRepository;
    @Autowired
    private TestQuestionOptionRepository optionRepository;
    @Autowired
    private TestQuestionAcceptedAnswerRepository acceptedAnswerRepository;
    @Autowired
    private WordQuestionLookup wordQuestionLookup;

    // Handing in a test asks the AI for a roadmap, which is not under test here and must not reach the real service.
    @MockitoBean
    private TestAiGateway aiGateway;

    private final ObjectMapper json = new ObjectMapper();
    private final LocalDate today = LocalDate.now(TestCalendar.ZONE);

    @BeforeEach
    void clearTests() {
        // The H2 context is shared between test classes and has no foreign keys to cascade a delete.
        for (String table : List.of("test_passage_plays", "test_attempt_answers", "test_attempts",
                "test_question_accepted_answers", "test_question_options", "test_questions", "test_passages", "tests")) {
            jdbcTemplate.update("DELETE FROM " + table);
        }
    }

    @Test
    void onlyAdminsReachTheAdminTestPages() throws Exception {
        mockMvc.perform(get("/api/admin/tests").with(TestAuth.learner(LEARNER))).andExpect(status().isForbidden());
        mockMvc.perform(post("/api/admin/tests").with(TestAuth.learner(LEARNER))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(weeklyTest())))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/tests")).andExpect(status().isUnauthorized());
        assertThat(testRepository.count()).isZero();
    }

    @Test
    void aNewTestIsADraftLearnersOnlySeeOnceItIsShown() throws Exception {
        JsonNode created = read(asAdmin(post("/api/admin/tests"), weeklyTest()).andExpect(status().isCreated()));

        assertThat(created.get("status").asString()).isEqualTo("DRAFT");
        assertThat(created.get("phase").asString()).isEqualTo("OPEN");
        assertThat(created.get("type").asString()).isEqualTo("PERIODIC");
        assertThat(created.get("skillText").asString()).isEqualTo("Từ vựng và ngữ pháp");
        assertThat(created.get("instruction").asString()).isEqualTo("Câu bỏ trống tính là sai.");
        assertThat(created.get("startDate").asString()).isEqualTo(today.minusDays(1).toString());
        assertThat(created.get("endDate").asString()).isEqualTo(today.plusDays(5).toString());
        assertThat(created.get("questionCount").asInt()).isEqualTo(3);
        assertThat(texts(created.get("skills"))).containsExactly("READING", "WRITING");
        assertThat(created.get("submissions").asInt()).isZero();
        assertThat(created.get("averageScore").isNull()).isTrue();
        assertThat(created.get("duplicatedFrom").isNull()).isTrue();

        JsonNode material = created.get("materials").get(0);
        assertThat(material.get("type").asString()).isEqualTo("READING");
        assertThat(material.get("text").asString()).isEqualTo("Hanoi is the capital of Vietnam.");
        assertThat(material.get("audioUrl").isNull()).isTrue();

        JsonNode choice = created.get("questions").get(0);
        assertThat(choice.get("type").asString()).isEqualTo("MULTIPLE_CHOICE");
        assertThat(choice.get("skill").asString()).isEqualTo("READING");
        assertThat(choice.get("materialId").asLong()).isEqualTo(material.get("id").asLong());
        assertThat(choice.get("options").size()).isEqualTo(3);
        assertThat(choice.get("options").get(0).get("correct").asBoolean()).isTrue();
        assertThat(choice.get("options").get(1).get("correct").asBoolean()).isFalse();
        JsonNode blank = created.get("questions").get(1);
        assertThat(blank.get("type").asString()).isEqualTo("FILL_BLANK");
        assertThat(texts(blank.get("acceptedAnswers"))).containsExactly("seen", "Seen it");
        assertThat(blank.get("options").size()).isZero();
        JsonNode essay = created.get("questions").get(2);
        assertThat(essay.get("type").asString()).isEqualTo("ESSAY");
        assertThat(essay.get("points").asInt()).isEqualTo(5);

        // The examiner grades a written answer with nothing to compare it with: stored as a WRITING question.
        TestQuestion storedEssay = questionRepository.findById(essay.get("id").asLong()).orElseThrow();
        assertThat(storedEssay.getQuestionType()).isEqualTo(TestQuestionType.WRITING);
        assertThat(storedEssay.getSkill()).isEqualTo(TestSkill.WRITING);
        // The first accepted answer is the one shown as the right answer; all are compared in their normal form.
        assertThat(acceptedAnswerRepository.findByQuestionIdIn(List.of(blank.get("id").asLong())))
                .extracting(TestQuestionAcceptedAnswer::getNormalizedAnswer, TestQuestionAcceptedAnswer::isPrimary)
                .containsExactlyInAnyOrder(
                        tuple("seen", true),
                        tuple("seen it", false));

        long testId = created.get("id").asLong();
        asLearner(get("/api/tests")).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
        asLearner(get("/api/tests/" + testId)).andExpect(status().isNotFound());
        asLearner(post("/api/tests/" + testId + "/attempts")).andExpect(status().isNotFound());

        ObjectNode shown = editorBody(created);
        shown.put("status", "VISIBLE");
        asAdmin(put("/api/admin/tests/" + testId), shown)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("VISIBLE"));

        asLearner(get("/api/tests")).andExpect(jsonPath("$[0].id").value(testId));
        asLearner(get("/api/tests/" + testId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.skillText").value("Từ vựng và ngữ pháp"))
                .andExpect(jsonPath("$.instruction").value("Câu bỏ trống tính là sai."))
                .andExpect(jsonPath("$.passages[0].content").value("Hanoi is the capital of Vietnam."))
                .andExpect(jsonPath("$.questions[0].passageId").value(material.get("id").asLong()))
                .andExpect(jsonPath("$.questions[0].options.length()").value(3))
                .andExpect(jsonPath("$.questions[2].content").value("Write three sentences about your last holiday."));
    }

    @Test
    void aTestThatBreaksARuleIsRefused() throws Exception {
        refused(test -> test.put("title", "  "), "title must be 1-200 characters");
        refused(test -> test.put("title", "x".repeat(201)), "title must be 1-200 characters");
        refused(test -> test.remove("type"), "type must be PERIODIC or COMPREHENSIVE");
        refused(test -> test.remove("endDate"), "startDate and endDate are required");
        refused(test -> test.put("endDate", test.get("startDate").asString()), "endDate must be after startDate");
        refused(test -> test.put("status", "HIDDEN"), "a new test is DRAFT or VISIBLE");
        refused(test -> test.putArray("questions"), "A test needs at least one question");
        refused(test -> test.put("type", "COMPREHENSIVE"), "A comprehensive test needs all four skills");

        refused(test -> question(test, 0).put("content", " "), "question 1: the prompt is empty");
        refused(test -> question(test, 0).put("points", 0), "question 1: points must be at least 1");
        refused(test -> ((ObjectNode) question(test, 0).get("options").get(1)).put("correct", true),
                "question 1: exactly one correct option");
        refused(test -> {
            ArrayNode options = (ArrayNode) question(test, 0).get("options");
            options.remove(2);
            options.remove(1);
        }, "question 1: 2-6 options");
        refused(test -> ((ObjectNode) question(test, 0).get("options").get(1)).put("text", ""),
                "question 1: an option is empty");
        refused(test -> question(test, 1).putArray("acceptedAnswers").add("  "),
                "question 2: an accepted answer is required");
        refused(test -> question(test, 0).put("skill", "SPEAKING"), "question 1: SPEAKING allows [SPEAKING]");
        refused(test -> question(test, 0).put("type", "ESSAY"), "question 1: READING allows");
        refused(test -> question(test, 1).put("materialIndex", 0),
                "question 2: materialIndex must point at a WRITING material of this test");
        refused(test -> question(test, 0).put("materialIndex", 3),
                "question 1: materialIndex must point at a READING material of this test");
        refused(test -> question(test, 2).put("referenceText", "Read me."),
                "question 3: only a speaking question has a sentence to read aloud");
        refused(test -> ((ObjectNode) test.get("materials").get(0)).put("text", " "),
                "material 1: a reading material needs its text");
        refused(test -> ((ObjectNode) test.get("materials").get(0)).put("type", "LISTENING"),
                "material 1: a listening material needs its audio");
        refused(test -> question(test, 0).put("id", 999_999), "question 1: id 999999 is not one of this test");

        // A value outside an enum never reaches the rules.
        refused(test -> test.put("status", "OPEN"), "Request body is not valid");
        assertThat(testRepository.count()).isZero();
    }

    @Test
    void savingRewritesTheQuestionsInPlaceAndInTheEditorsOrder() throws Exception {
        ObjectNode body = weeklyTest();
        body.put("status", "VISIBLE");
        JsonNode created = read(asAdmin(post("/api/admin/tests"), body).andExpect(status().isCreated()));
        long testId = created.get("id").asLong();
        long choiceId = created.get("questions").get(0).get("id").asLong();
        long essayId = created.get("questions").get(2).get("id").asLong();
        long keptOptionId = created.get("questions").get(0).get("options").get(1).get("id").asLong();

        // The essay first, the fill-in gone, the choice question reworded and off its reading text (which is removed),
        // and a new listening part: a recording with one question about it.
        ObjectNode edited = editorBody(created);
        ObjectNode choice = (ObjectNode) edited.get("questions").get(0);
        choice.put("content", "What is the capital of Vietnam?");
        choice.putNull("materialIndex");
        ArrayNode options = (ArrayNode) choice.get("options");
        options.remove(2);
        options.remove(0);
        ((ObjectNode) options.get(0)).put("text", "Hanoi").put("correct", true);
        options.add(option("Hue", false));
        ObjectNode essay = (ObjectNode) edited.get("questions").get(2);
        ArrayNode questions = edited.putArray("questions");
        questions.add(essay);
        questions.add(choice);
        ObjectNode listening = choice("LISTENING", "Which gate?", "Gate 5", "Gate 9");
        listening.put("materialIndex", 0);
        questions.add(listening);
        edited.putArray("materials").add(material("LISTENING", "At the airport", "/media/tests/airport.mp3"));

        JsonNode saved = read(asAdmin(put("/api/admin/tests/" + testId), edited).andExpect(status().isOk()));

        assertThat(saved.get("questions").size()).isEqualTo(3);
        assertThat(saved.get("questions").get(0).get("id").asLong()).isEqualTo(essayId);
        JsonNode savedChoice = saved.get("questions").get(1);
        assertThat(savedChoice.get("id").asLong()).isEqualTo(choiceId);
        assertThat(savedChoice.get("content").asString()).isEqualTo("What is the capital of Vietnam?");
        assertThat(savedChoice.get("materialId").isNull()).isTrue();
        assertThat(savedChoice.get("options").size()).isEqualTo(2);
        assertThat(savedChoice.get("options").get(0).get("id").asLong()).isEqualTo(keptOptionId);
        assertThat(savedChoice.get("options").get(0).get("text").asString()).isEqualTo("Hanoi");
        assertThat(savedChoice.get("options").get(0).get("correct").asBoolean()).isTrue();
        assertThat(savedChoice.get("options").get(1).get("text").asString()).isEqualTo("Hue");
        assertThat(saved.get("materials").size()).isEqualTo(1);
        JsonNode recording = saved.get("materials").get(0);
        assertThat(recording.get("type").asString()).isEqualTo("LISTENING");
        assertThat(recording.get("audioUrl").asString()).isEqualTo("/media/tests/airport.mp3");
        assertThat(saved.get("questions").get(2).get("materialId").asLong()).isEqualTo(recording.get("id").asLong());
        assertThat(texts(saved.get("skills"))).containsExactly("LISTENING", "READING", "WRITING");
        assertThat(questionRepository.findByTestIdIn(List.of(testId))).hasSize(3);
        assertThat(passageRepository.findByTestIdOrderByIdAsc(testId)).hasSize(1);

        // Learners get the questions in the order the admin left them, and the recording with its two plays.
        asLearner(get("/api/tests/" + testId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.questions[0].id").value(essayId))
                .andExpect(jsonPath("$.questions[1].id").value(choiceId))
                .andExpect(jsonPath("$.questions[2].content").value("Which gate?"))
                .andExpect(jsonPath("$.passages[0].maxPlays").value(2));

        // A question of another test cannot be pulled into this one.
        JsonNode other = read(asAdmin(post("/api/admin/tests"), weeklyTest()).andExpect(status().isCreated()));
        ObjectNode stolen = editorBody(saved);
        ((ObjectNode) stolen.get("questions").get(0)).put("id", other.get("questions").get(0).get("id").asLong());
        asAdmin(put("/api/admin/tests/" + testId), stolen)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("is not one of this test")));
        asAdmin(put("/api/admin/tests/999999"), edited).andExpect(status().isNotFound());
    }

    @Test
    void anOlderTestReadsInTheEditorsWordsAndKeepsWhatTheEditorDoesNotSend() throws Exception {
        // A test as the seed migrations write them: no dates, a skill as the type of a question, levels, a transcript.
        long testId = testRepository.save(new com.example.datn.modules.test.entity.Test(
                "Kiểm tra tổng hợp", TestType.PERIODIC, null, null, null)).getId();
        TestPassage passage = passageRepository.save(new TestPassage(
                testId, "At the airport", null, "/media/tests/airport.mp3", "Flight VN209 is boarding at Gate 5."));
        TestQuestion listening = questionRepository.save(new TestQuestion(testId, TestQuestionType.LISTENING,
                TestSkill.LISTENING, "Which gate?", 1, null, CefrLevel.A2, passage.getId()));
        optionRepository.save(new TestQuestionOption(listening.getId(), "Gate 5", true));
        optionRepository.save(new TestQuestionOption(listening.getId(), "Gate 9", false));
        TestQuestion readAloud = questionRepository.save(new TestQuestion(testId, TestQuestionType.SPEAKING,
                TestSkill.SPEAKING, "Read the sentence aloud.", 3, null, CefrLevel.B1)
                .asReadAloud("My sister works in a small hospital."));
        TestQuestion blank = questionRepository.save(new TestQuestion(testId, TestQuestionType.WRITING,
                TestSkill.WRITING, "I stayed home ___ it was raining.", 2, null));
        acceptedAnswerRepository.save(new TestQuestionAcceptedAnswer(blank.getId(), "because", "because", true));
        TestQuestion essay = questionRepository.save(new TestQuestion(testId, TestQuestionType.WRITING,
                TestSkill.WRITING, "Describe your last holiday.", 6, null, CefrLevel.B1));

        JsonNode read = read(asAdmin(get("/api/admin/tests/" + testId)).andExpect(status().isOk()));

        assertThat(read.get("status").asString()).isEqualTo("VISIBLE");
        assertThat(read.get("startDate").isNull()).isTrue();
        assertThat(read.get("endDate").isNull()).isTrue();
        assertThat(read.get("phase").asString()).isEqualTo("OPEN");
        assertThat(read.get("materials").get(0).get("type").asString()).isEqualTo("LISTENING");
        assertThat(read.get("materials").get(0).get("transcript").asString()).isEqualTo("Flight VN209 is boarding at Gate 5.");
        assertThat(read.get("materials").get(0).get("text").isNull()).isTrue();
        JsonNode questions = read.get("questions");
        assertThat(List.of(type(questions, 0), type(questions, 1), type(questions, 2), type(questions, 3)))
                .containsExactly("MULTIPLE_CHOICE", "SPEAKING", "FILL_BLANK", "ESSAY");
        assertThat(questions.get(0).get("skill").asString()).isEqualTo("LISTENING");
        assertThat(questions.get(0).get("level").asString()).isEqualTo("A2");
        assertThat(questions.get(0).get("materialId").asLong()).isEqualTo(passage.getId());
        assertThat(questions.get(1).get("referenceText").asString()).isEqualTo("My sister works in a small hospital.");
        assertThat(texts(questions.get(2).get("acceptedAnswers"))).containsExactly("because");
        assertThat(questions.get(3).get("level").asString()).isEqualTo("B1");

        // Saving without the sentence to read or the transcript loses neither, and a question nobody retyped keeps
        // the type it was stored with. The test may stay without dates.
        ObjectNode unchanged = editorBody(read);
        unchanged.put("title", "Kiểm tra tổng hợp tháng 10");
        JsonNode saved = read(asAdmin(put("/api/admin/tests/" + testId), unchanged).andExpect(status().isOk()));

        assertThat(saved.get("title").asString()).isEqualTo("Kiểm tra tổng hợp tháng 10");
        assertThat(saved.get("startDate").isNull()).isTrue();
        assertThat(saved.get("questions").get(0).get("level").asString()).isEqualTo("A2");
        assertThat(saved.get("questions").get(1).get("referenceText").asString())
                .isEqualTo("My sister works in a small hospital.");
        assertThat(saved.get("materials").get(0).get("transcript").asString())
                .isEqualTo("Flight VN209 is boarding at Gate 5.");
        assertThat(questionRepository.findById(listening.getId()).orElseThrow().getQuestionType())
                .isEqualTo(TestQuestionType.LISTENING);
        assertThat(questionRepository.findById(essay.getId()).orElseThrow().getQuestionType())
                .isEqualTo(TestQuestionType.WRITING);
        assertThat(questionRepository.findById(readAloud.getId()).orElseThrow().isReadAloud()).isTrue();

        // Sent, they are saved: a new level, a level taken off, the sentence and the transcript cleared, an essay
        // turned into a fill-in.
        ObjectNode changed = editorBody(saved);
        ((ObjectNode) changed.get("questions").get(0)).put("level", "B2");
        ((ObjectNode) changed.get("questions").get(2)).putNull("level");
        ((ObjectNode) changed.get("questions").get(3)).putNull("level");
        ((ObjectNode) changed.get("questions").get(1)).put("referenceText", "");
        ((ObjectNode) changed.get("materials").get(0)).put("transcript", "");
        ObjectNode retyped = (ObjectNode) changed.get("questions").get(3);
        retyped.put("type", "FILL_BLANK");
        retyped.putArray("acceptedAnswers").add("Da Nang");
        JsonNode changedBack = read(asAdmin(put("/api/admin/tests/" + testId), changed).andExpect(status().isOk()));

        assertThat(changedBack.get("questions").get(0).get("level").asString()).isEqualTo("B2");
        assertThat(changedBack.get("questions").get(1).get("referenceText").isNull()).isTrue();
        assertThat(changedBack.get("questions").get(1).get("level").asString()).isEqualTo("B1");
        assertThat(changedBack.get("questions").get(3).get("level").isNull()).isTrue();
        assertThat(questionRepository.findById(essay.getId()).orElseThrow().getLevel()).isNull();
        assertThat(changedBack.get("materials").get(0).get("transcript").isNull()).isTrue();
        assertThat(type(changedBack.get("questions"), 3)).isEqualTo("FILL_BLANK");
        assertThat(questionRepository.findById(readAloud.getId()).orElseThrow().isReadAloud()).isFalse();
        assertThat(questionRepository.findById(essay.getId()).orElseThrow().getQuestionType())
                .isEqualTo(TestQuestionType.FILL_BLANK);
        assertThat(passageRepository.findById(passage.getId()).orElseThrow().getTranscript()).isNull();
    }

    @Test
    void aSubmittedTestOnlyChangesItsTitleItsClosingDateAndWhetherItIsShown() throws Exception {
        ObjectNode body = weeklyTest();
        body.put("status", "VISIBLE");
        ((ArrayNode) body.get("questions")).remove(2); // without the essay the attempt is graded at once
        JsonNode created = read(asAdmin(post("/api/admin/tests"), body).andExpect(status().isCreated()));
        long testId = created.get("id").asLong();
        long attemptId = submitWithTheRightChoice(testId, created.get("questions").get(0));

        // One of two points: the choice question is right, the fill-in was left empty.
        JsonNode read = read(asAdmin(get("/api/admin/tests/" + testId)).andExpect(status().isOk()));
        assertThat(read.get("submissions").asInt()).isEqualTo(1);
        assertThat(read.get("averageScore").asInt()).isEqualTo(50);
        asAdmin(get("/api/admin/tests"))
                .andExpect(jsonPath("$[0].submissions").value(1))
                .andExpect(jsonPath("$[0].averageScore").value(50));

        locked(testId, read, test -> question(test, 0).put("content", "What is Hanoi?"));
        locked(testId, read, test -> question(test, 0).put("points", 2));
        locked(testId, read, test -> ((ObjectNode) question(test, 0).get("options").get(1)).put("text", "Saigon"));
        locked(testId, read, test -> question(test, 1).putArray("acceptedAnswers").add("seen").add("saw"));
        locked(testId, read, test -> ((ArrayNode) test.get("questions")).remove(1));
        locked(testId, read, test -> ((ArrayNode) test.get("questions")).add(choice("READING", "New?", "a", "b")));
        locked(testId, read, test -> ((ObjectNode) test.get("materials").get(0)).put("text", "Another text."));
        locked(testId, read, test -> question(test, 0).putNull("materialIndex"));
        locked(testId, read, test -> question(test, 0).put("level", "B1"));
        locked(testId, read, test -> test.put("instruction", "Làm trong 10 phút."));
        locked(testId, read, test -> test.put("skillText", "Ngữ pháp"));
        locked(testId, read, test -> test.put("startDate", today.minusDays(2).toString()));
        locked(testId, read, test -> test.put("status", "DRAFT"));

        ObjectNode allowed = editorBody(read);
        allowed.put("title", "Kiểm tra định kỳ — tuần 42");
        allowed.put("endDate", today.plusDays(9).toString());
        allowed.put("status", "HIDDEN");
        asAdmin(put("/api/admin/tests/" + testId), allowed)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Kiểm tra định kỳ — tuần 42"))
                .andExpect(jsonPath("$.endDate").value(today.plusDays(9).toString()))
                .andExpect(jsonPath("$.status").value("HIDDEN"))
                .andExpect(jsonPath("$.questions[0].content").value("What is Hanoi known for?"));

        // Hidden: gone from the learner's list, but what they did stays readable.
        asLearner(get("/api/tests")).andExpect(jsonPath("$.length()").value(0));
        asLearner(post("/api/tests/" + testId + "/attempts")).andExpect(status().isNotFound());
        asLearner(get("/api/test-attempts/" + attemptId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Kiểm tra định kỳ — tuần 42"));
        asLearner(get("/api/tests/" + testId + "/attempts")).andExpect(jsonPath("$[0].attemptId").value(attemptId));

        allowed.put("status", "VISIBLE");
        asAdmin(put("/api/admin/tests/" + testId), allowed).andExpect(status().isOk());
        asLearner(get("/api/tests")).andExpect(jsonPath("$[0].id").value(testId));
    }

    @Test
    void deletingHidesATestLearnersSubmittedAndRemovesAnyOther() throws Exception {
        ObjectNode body = weeklyTest();
        body.put("status", "VISIBLE");
        ((ArrayNode) body.get("questions")).remove(2);
        JsonNode submitted = read(asAdmin(post("/api/admin/tests"), body).andExpect(status().isCreated()));
        long submittedId = submitted.get("id").asLong();
        submitWithTheRightChoice(submittedId, submitted.get("questions").get(0));
        // An attempt nobody handed in does not keep a test.
        long startedId = read(asAdmin(post("/api/admin/tests"), body).andExpect(status().isCreated())).get("id").asLong();
        asLearner(post("/api/tests/" + startedId + "/attempts")).andExpect(status().isCreated());

        asAdmin(delete("/api/admin/tests/" + submittedId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result").value("HIDDEN"));
        asAdmin(get("/api/admin/tests/" + submittedId)).andExpect(jsonPath("$.status").value("HIDDEN"));

        asAdmin(delete("/api/admin/tests/" + startedId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result").value("DELETED"));
        asAdmin(get("/api/admin/tests/" + startedId)).andExpect(status().isNotFound());
        asAdmin(delete("/api/admin/tests/" + startedId)).andExpect(status().isNotFound());
        asAdmin(get("/api/admin/tests")).andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void duplicatingMakesADraftWithTheSameContent() throws Exception {
        long sourceId = testRepository.save(new com.example.datn.modules.test.entity.Test(
                "Kiểm tra định kỳ — tuần 41", TestType.PERIODIC, null, TestCalendar.startOf(today.minusDays(3)),
                TestCalendar.endOf(today.plusDays(3)), TestStatus.VISIBLE)).getId();
        TestPassage passage = passageRepository.save(new TestPassage(
                sourceId, "At the airport", null, "/media/tests/airport.mp3", "Flight VN209 is boarding."));
        TestQuestion listening = new TestQuestion(sourceId, TestQuestionType.LISTENING, TestSkill.LISTENING,
                "Which gate?", 1, null, CefrLevel.A2, passage.getId());
        listening.edit(TestQuestionType.LISTENING, TestSkill.LISTENING, "Which gate?", 1, null, CefrLevel.A2,
                passage.getId(), null, 356L, 1);
        listening = questionRepository.save(listening);
        optionRepository.save(new TestQuestionOption(listening.getId(), "Gate 5", true));
        optionRepository.save(new TestQuestionOption(listening.getId(), "Gate 9", false));
        // Placed first by the admin although it was written last.
        TestQuestion readAloud = questionRepository.save(new TestQuestion(sourceId, TestQuestionType.SPEAKING,
                TestSkill.SPEAKING, "Read the sentence aloud.", 3, null, CefrLevel.B1)
                .asReadAloud("My sister works in a small hospital."));

        ObjectNode copyOf = json.createObjectNode();
        copyOf.put("title", "Kiểm tra định kỳ — tuần 42");
        copyOf.put("startDate", today.plusDays(4).toString());
        copyOf.put("endDate", today.plusDays(10).toString());
        JsonNode copy = read(asAdmin(post("/api/admin/tests/" + sourceId + "/duplicate"), copyOf)
                .andExpect(status().isCreated()));

        assertThat(copy.get("id").asLong()).isNotEqualTo(sourceId);
        assertThat(copy.get("title").asString()).isEqualTo("Kiểm tra định kỳ — tuần 42");
        assertThat(copy.get("type").asString()).isEqualTo("PERIODIC");
        assertThat(copy.get("status").asString()).isEqualTo("DRAFT");
        assertThat(copy.get("phase").asString()).isEqualTo("UPCOMING");
        assertThat(copy.get("startDate").asString()).isEqualTo(today.plusDays(4).toString());
        assertThat(copy.get("duplicatedFrom").get("id").asLong()).isEqualTo(sourceId);
        assertThat(copy.get("duplicatedFrom").get("title").asString()).isEqualTo("Kiểm tra định kỳ — tuần 41");
        assertThat(copy.get("submissions").asInt()).isZero();
        JsonNode material = copy.get("materials").get(0);
        assertThat(material.get("id").asLong()).isNotEqualTo(passage.getId());
        assertThat(material.get("transcript").asString()).isEqualTo("Flight VN209 is boarding.");
        JsonNode first = copy.get("questions").get(0);
        assertThat(first.get("id").asLong()).isNotEqualTo(readAloud.getId());
        assertThat(first.get("referenceText").asString()).isEqualTo("My sister works in a small hospital.");
        assertThat(first.get("level").asString()).isEqualTo("B1");
        JsonNode second = copy.get("questions").get(1);
        assertThat(second.get("materialId").asLong()).isEqualTo(material.get("id").asLong());
        assertThat(second.get("vocabularyId").asLong()).isEqualTo(356);
        assertThat(second.get("level").asString()).isEqualTo("A2");
        assertThat(second.get("options").size()).isEqualTo(2);
        assertThat(second.get("options").get(0).get("correct").asBoolean()).isTrue();

        // The source is as it was, and the copy opens to learners only once it is shown.
        asAdmin(get("/api/admin/tests/" + sourceId))
                .andExpect(jsonPath("$.questions.length()").value(2))
                .andExpect(jsonPath("$.duplicatedFrom").isEmpty());
        asLearner(get("/api/tests")).andExpect(jsonPath("$.length()").value(1));

        copyOf.remove("endDate");
        asAdmin(post("/api/admin/tests/" + sourceId + "/duplicate"), copyOf).andExpect(status().isBadRequest());
        copyOf.put("endDate", today.plusDays(10).toString());
        asAdmin(post("/api/admin/tests/999999/duplicate"), copyOf).andExpect(status().isNotFound());
    }

    @Test
    void theListTellsWhereEachTestIsInItsSchedule() throws Exception {
        long closed = testRepository.save(new com.example.datn.modules.test.entity.Test(
                "Tuần trước", TestType.PERIODIC, null, TestCalendar.startOf(today.minusDays(10)),
                TestCalendar.endOf(today.minusDays(4)), TestStatus.VISIBLE)).getId();
        long open = testRepository.save(new com.example.datn.modules.test.entity.Test(
                "Tuần này", TestType.PERIODIC, null, TestCalendar.startOf(today),
                TestCalendar.endOf(today), TestStatus.HIDDEN)).getId();
        long upcoming = testRepository.save(new com.example.datn.modules.test.entity.Test(
                "Tuần sau", TestType.COMPREHENSIVE, null, TestCalendar.startOf(today.plusDays(1)),
                TestCalendar.endOf(today.plusDays(7)), TestStatus.DRAFT)).getId();
        questionRepository.save(new TestQuestion(open, TestQuestionType.FILL_BLANK, TestSkill.WRITING, "___", 1, null));

        // The newest first; a test that opens and closes today is open all day.
        asAdmin(get("/api/admin/tests"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(upcoming))
                .andExpect(jsonPath("$[0].phase").value("UPCOMING"))
                .andExpect(jsonPath("$[0].status").value("DRAFT"))
                .andExpect(jsonPath("$[0].type").value("COMPREHENSIVE"))
                .andExpect(jsonPath("$[0].questionCount").value(0))
                .andExpect(jsonPath("$[1].id").value(open))
                .andExpect(jsonPath("$[1].phase").value("OPEN"))
                .andExpect(jsonPath("$[1].status").value("HIDDEN"))
                .andExpect(jsonPath("$[1].questionCount").value(1))
                .andExpect(jsonPath("$[1].skills[0]").value("WRITING"))
                .andExpect(jsonPath("$[1].startDate").value(today.toString()))
                .andExpect(jsonPath("$[1].endDate").value(today.toString()))
                .andExpect(jsonPath("$[2].id").value(closed))
                .andExpect(jsonPath("$[2].phase").value("CLOSED"))
                .andExpect(jsonPath("$[2].submissions").value(0))
                .andExpect(jsonPath("$[2].averageScore").isEmpty());
    }

    @Test
    void theVocabularyModuleLearnsWhichWordsQuestionsWereMadeFrom() {
        long open = testRepository.save(new com.example.datn.modules.test.entity.Test(
                "Đang mở", TestType.PERIODIC, null, null, null)).getId();
        long draft = testRepository.save(new com.example.datn.modules.test.entity.Test(
                "Nháp", TestType.PERIODIC, null, TestCalendar.startOf(today), TestCalendar.endOf(today), TestStatus.DRAFT)).getId();
        long closed = testRepository.save(new com.example.datn.modules.test.entity.Test(
                "Đã đóng", TestType.PERIODIC, null, TestCalendar.startOf(today.minusDays(9)),
                TestCalendar.endOf(today.minusDays(2)), TestStatus.VISIBLE)).getId();
        questionFrom(open, 501L);
        questionFrom(open, 501L);
        questionFrom(open, 502L);
        questionFrom(draft, 501L);
        questionFrom(closed, 502L);
        questionFrom(open, null);

        assertThat(wordQuestionLookup.countQuestionsByWord(List.of(501L, 502L, 503L)))
                .isEqualTo(Map.of(501L, 3L, 502L, 2L));
        assertThat(wordQuestionLookup.openTestsByWord(List.of(501L, 502L, 503L)))
                .isEqualTo(Map.of(
                        501L, List.of(new WordQuestionLookup.TestRef(open, "Đang mở")),
                        502L, List.of(new WordQuestionLookup.TestRef(open, "Đang mở"))));
        assertThat(wordQuestionLookup.countQuestionsByWord(List.of())).isEmpty();
        assertThat(wordQuestionLookup.openTestsByWord(List.of())).isEmpty();
    }

    // --- Bodies of the editor ---------------------------------------------------------------------------------------

    /** A weekly test open today: a reading text with a choice question about it, a fill-in and an essay. */
    private ObjectNode weeklyTest() {
        ObjectNode test = json.createObjectNode();
        test.put("type", "PERIODIC");
        test.put("title", "  Kiểm tra định kỳ — tuần 41 ");
        test.put("skillText", "Từ vựng và ngữ pháp");
        test.put("instruction", "Câu bỏ trống tính là sai.");
        test.put("startDate", today.minusDays(1).toString());
        test.put("endDate", today.plusDays(5).toString());
        test.putArray("materials").add(material("READING", "Hanoi", "Hanoi is the capital of Vietnam."));
        ObjectNode choice = choice("READING", "What is Hanoi known for?", "Its Old Quarter", "Its beaches", "Its desert");
        choice.put("materialIndex", 0);
        ObjectNode blank = question("WRITING", "FILL_BLANK", "I have never ___ (see) such a beach.", 1);
        blank.putArray("acceptedAnswers").add("seen").add(" Seen it ").add("");
        ObjectNode essay = question("WRITING", "ESSAY", "Write three sentences about your last holiday.", 5);
        test.putArray("questions").add(choice).add(blank).add(essay);
        return test;
    }

    private ObjectNode material(String type, String title, String audioOrText) {
        ObjectNode material = json.createObjectNode();
        material.put("type", type);
        material.put("title", title);
        material.put(type.equals("LISTENING") ? "audioUrl" : "text", audioOrText);
        return material;
    }

    private ObjectNode question(String skill, String type, String content, int points) {
        ObjectNode question = json.createObjectNode();
        question.put("skill", skill);
        question.put("type", type);
        question.put("points", points);
        question.put("content", content);
        question.putNull("materialIndex");
        question.putNull("vocabularyId");
        question.putArray("options");
        question.putArray("acceptedAnswers");
        return question;
    }

    /** A one-point choice question whose first option is the right one. */
    private ObjectNode choice(String skill, String content, String... options) {
        ObjectNode question = question(skill, "MULTIPLE_CHOICE", content, 1);
        ArrayNode list = question.putArray("options");
        for (int index = 0; index < options.length; index++) {
            list.add(option(options[index], index == 0));
        }
        return question;
    }

    private ObjectNode option(String text, boolean correct) {
        ObjectNode option = json.createObjectNode();
        option.put("text", text);
        option.put("correct", correct);
        return option;
    }

    private static ObjectNode question(ObjectNode test, int index) {
        return (ObjectNode) test.get("questions").get(index);
    }

    /**
     * What the admin editor sends to save a test it has read: ids kept, a question's material named by its place
     * among the materials. The sentence to read and the transcript are left out, as an older client would.
     */
    private ObjectNode editorBody(JsonNode read) {
        ObjectNode body = (ObjectNode) read.deepCopy();
        List<Long> materialIds = new ArrayList<>();
        for (int index = 0; index < body.get("materials").size(); index++) {
            ObjectNode material = (ObjectNode) body.get("materials").get(index);
            materialIds.add(material.get("id").asLong());
            material.remove("transcript");
        }
        for (int index = 0; index < body.get("questions").size(); index++) {
            ObjectNode question = (ObjectNode) body.get("questions").get(index);
            JsonNode materialId = question.remove("materialId");
            if (materialId == null || materialId.isNull()) {
                question.putNull("materialIndex");
            } else {
                question.put("materialIndex", materialIds.indexOf(materialId.asLong()));
            }
            question.remove("referenceText");
        }
        return body;
    }

    // --- Requests ---------------------------------------------------------------------------------------------------

    private ResultActions asAdmin(MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.with(TestAuth.admin()));
    }

    private ResultActions asAdmin(MockHttpServletRequestBuilder request, JsonNode body) throws Exception {
        return mockMvc.perform(request.with(TestAuth.admin())
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(body)));
    }

    private ResultActions asLearner(MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.with(TestAuth.learner(LEARNER)));
    }

    private JsonNode read(ResultActions result) throws Exception {
        return json.readTree(result.andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8));
    }

    /** Creating the weekly test with one thing wrong answers 400 with the rule that was broken. */
    private void refused(Consumer<ObjectNode> mistake, String message) throws Exception {
        ObjectNode body = weeklyTest();
        mistake.accept(body);
        asAdmin(post("/api/admin/tests"), body)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString(message)));
    }

    /** Saving a submitted test with one thing changed that learners were graded on answers 409. */
    private void locked(long testId, JsonNode read, Consumer<ObjectNode> change) throws Exception {
        ObjectNode body = editorBody(read);
        change.accept(body);
        asAdmin(put("/api/admin/tests/" + testId), body)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("The test has submissions")));
    }

    /** The learner takes the test, picks the right option of the choice question and hands it in. */
    private long submitWithTheRightChoice(long testId, JsonNode choice) throws Exception {
        long attemptId = read(asLearner(post("/api/tests/" + testId + "/attempts")).andExpect(status().isCreated()))
                .get("attemptId").asLong();
        long rightOption = choice.get("options").get(0).get("id").asLong();
        mockMvc.perform(put("/api/test-attempts/" + attemptId + "/answers/" + choice.get("id").asLong())
                        .with(TestAuth.learner(LEARNER))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"optionId\":" + rightOption + "}"))
                .andExpect(status().isNoContent());
        asLearner(post("/api/test-attempts/" + attemptId + "/submit"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("GRADED"));
        return attemptId;
    }

    private void questionFrom(long testId, Long vocabularyId) {
        TestQuestion question = new TestQuestion(testId, TestQuestionType.MULTIPLE_CHOICE, TestSkill.READING, "___", 1, null);
        question.edit(TestQuestionType.MULTIPLE_CHOICE, TestSkill.READING, "___", 1, null, null, null, null, vocabularyId, 0);
        questionRepository.save(question);
    }

    private static String type(JsonNode questions, int index) {
        return questions.get(index).get("type").asString();
    }

    private List<String> texts(JsonNode array) {
        List<String> texts = new ArrayList<>();
        for (int index = 0; index < array.size(); index++) {
            texts.add(array.get(index).asString());
        }
        return texts;
    }
}
