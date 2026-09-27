package com.example.datn.modules.test;

import com.example.datn.modules.test.entity.TestQuestion;
import com.example.datn.modules.test.entity.TestQuestionAcceptedAnswer;
import com.example.datn.modules.test.entity.TestQuestionOption;
import com.example.datn.modules.test.enums.TestQuestionType;
import com.example.datn.modules.test.enums.TestSkill;
import com.example.datn.modules.test.enums.TestType;
import com.example.datn.modules.test.repository.TestQuestionAcceptedAnswerRepository;
import com.example.datn.modules.test.repository.TestQuestionOptionRepository;
import com.example.datn.modules.test.repository.TestQuestionRepository;
import com.example.datn.modules.test.repository.TestRepository;
import com.example.datn.support.TestAuth;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Runs the test-taking flow against H2 (schema created from entities, no Flyway). */
@SpringBootTest
@AutoConfigureMockMvc
class TestModuleFlowTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TestRepository testRepository;
    @Autowired
    private TestQuestionRepository questionRepository;
    @Autowired
    private TestQuestionOptionRepository optionRepository;
    @Autowired
    private TestQuestionAcceptedAnswerRepository acceptedAnswerRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private long testId;
    private long choiceQuestionId;
    private long fillQuestionId;

    @BeforeEach
    void seedTest() {
        // The H2 context is shared between test methods; clear the module's tables first for a clean slate.
        jdbcTemplate.update("DELETE FROM test_attempt_answers");
        jdbcTemplate.update("DELETE FROM test_attempts");
        jdbcTemplate.update("DELETE FROM test_question_accepted_answers");
        jdbcTemplate.update("DELETE FROM test_question_options");
        jdbcTemplate.update("DELETE FROM test_questions");
        jdbcTemplate.update("DELETE FROM tests");

        var test = testRepository.save(new com.example.datn.modules.test.entity.Test(
                "Kiểm tra định kỳ", TestType.PERIODIC, null, null, null));
        testId = test.getId();

        TestQuestion choice = questionRepository.save(new TestQuestion(
                testId, TestQuestionType.MULTIPLE_CHOICE, TestSkill.READING,
                "She ___ (live) in Hanoi for five years.", 1, null));
        choiceQuestionId = choice.getId();
        optionRepository.save(new TestQuestionOption(choiceQuestionId, "lives", false));
        optionRepository.save(new TestQuestionOption(choiceQuestionId, "has lived", true));

        TestQuestion fill = questionRepository.save(new TestQuestion(
                testId, TestQuestionType.FILL_BLANK, TestSkill.WRITING,
                "I have never ___ (see) such a beach.", 1, null));
        fillQuestionId = fill.getId();
        acceptedAnswerRepository.save(new TestQuestionAcceptedAnswer(fillQuestionId, "seen", "seen", true));
    }

    @Test
    void detailHidesCorrectnessAndListReportsZeroProgress() throws Exception {
        mockMvc.perform(get("/api/tests").with(TestAuth.learner(42)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type").value("PERIODIC"))
                .andExpect(jsonPath("$[0].questionCount").value(2))
                .andExpect(jsonPath("$[0].progress.attemptCount").value(0));

        mockMvc.perform(get("/api/tests/" + testId).with(TestAuth.learner(42)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.questions.length()").value(2))
                .andExpect(jsonPath("$.questions[0].options.length()").value(2))
                .andExpect(jsonPath("$.questions[0].options[0].is_correct").doesNotExist())
                .andExpect(jsonPath("$.questions[0].options[0].id").exists());
    }

    @Test
    void answerSubmitAndReadResult() throws Exception {
        long attemptId = startAttempt();

        mockMvc.perform(put("/api/test-attempts/" + attemptId + "/answers/" + choiceQuestionId)
                        .with(TestAuth.learner(42))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"optionId\":" + correctOptionId() + "}"))
                .andExpect(status().isNoContent());

        mockMvc.perform(put("/api/test-attempts/" + attemptId + "/answers/" + fillQuestionId)
                        .with(TestAuth.learner(42))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"text\":\"  Seen \"}"))
                .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/test-attempts/" + attemptId + "/submit").with(TestAuth.learner(42)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("GRADED"))
                .andExpect(jsonPath("$.correctCount").value(2))
                .andExpect(jsonPath("$.scorePercent").value(100))
                .andExpect(jsonPath("$.skills.reading.score").value(100))
                .andExpect(jsonPath("$.skills.writing.score").value(100))
                .andExpect(jsonPath("$.review[0].correctAnswer").value("has lived"));

        mockMvc.perform(get("/api/test-attempts/" + attemptId).with(TestAuth.learner(42)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("GRADED"));
    }

    @Test
    void answerIsValidatedAgainstTheQuestion() throws Exception {
        long attemptId = startAttempt();

        // An option of a different question (or a malformed body) is rejected with 400.
        mockMvc.perform(put("/api/test-attempts/" + attemptId + "/answers/" + fillQuestionId)
                        .with(TestAuth.learner(42))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"optionId\":999}"))
                .andExpect(status().isBadRequest());

        // Resubmitting after submit is rejected with 409.
        mockMvc.perform(put("/api/test-attempts/" + attemptId + "/answers/" + choiceQuestionId)
                        .with(TestAuth.learner(42))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"optionId\":" + correctOptionId() + "}"))
                .andExpect(status().isNoContent());
        mockMvc.perform(post("/api/test-attempts/" + attemptId + "/submit").with(TestAuth.learner(42)))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/test-attempts/" + attemptId + "/submit").with(TestAuth.learner(42)))
                .andExpect(status().isConflict());
    }

    private long startAttempt() throws Exception {
        String body = mockMvc.perform(post("/api/tests/" + testId + "/attempts").with(TestAuth.learner(42)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.resumed").value(false))
                .andReturn().getResponse().getContentAsString();
        return Long.parseLong(body.replaceAll(".*\"attemptId\":(\\d+).*", "$1"));
    }

    private long correctOptionId() {
        return optionRepository.findByQuestionIdInOrderByIdAsc(java.util.List.of(choiceQuestionId)).stream()
                .filter(TestQuestionOption::isCorrect)
                .findFirst()
                .orElseThrow()
                .getId();
    }
}
