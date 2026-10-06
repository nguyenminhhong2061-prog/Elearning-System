package com.example.datn.modules.test;

import com.example.datn.common.user.LevelRecorder;
import com.example.datn.modules.test.entity.TestPassage;
import com.example.datn.modules.test.entity.TestQuestion;
import com.example.datn.modules.test.entity.TestQuestionOption;
import com.example.datn.modules.test.enums.TestQuestionType;
import com.example.datn.modules.test.enums.TestSkill;
import com.example.datn.modules.test.enums.TestType;
import com.example.datn.modules.test.repository.TestPassageRepository;
import com.example.datn.modules.test.repository.TestQuestionOptionRepository;
import com.example.datn.modules.test.repository.TestQuestionRepository;
import com.example.datn.modules.test.repository.TestRepository;
import com.example.datn.modules.test.service.TestAiGateway;
import com.example.datn.support.TestAuth;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The rules of taking a test: several questions share one passage, the recording of a passage is played at most
 * twice per attempt, the result stays hidden until the attempt is submitted, and a comprehensive test is taken once
 * while a periodic one may be taken again.
 */
@SpringBootTest
@AutoConfigureMockMvc
class TestTakingRulesFlowTests {

    private static final long LEARNER = 42;
    private static final String TRANSCRIPT = "Flight VN209 is now boarding at Gate 5.";

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private TestRepository testRepository;
    @Autowired
    private TestPassageRepository passageRepository;
    @Autowired
    private TestQuestionRepository questionRepository;
    @Autowired
    private TestQuestionOptionRepository optionRepository;
    @Autowired
    private JdbcTemplate jdbcTemplate;

    // Submitting a comprehensive test writes a roadmap and records the level: neither is under test here.
    @MockitoBean
    private TestAiGateway aiGateway;
    @MockitoBean
    private LevelRecorder levelRecorder;

    private long periodicTestId;
    private long comprehensiveTestId;
    private long listeningPassageId;
    private long readingPassageId;
    private long otherTestPassageId;

    @BeforeEach
    void seedTests() {
        jdbcTemplate.update("DELETE FROM test_passage_plays");
        jdbcTemplate.update("DELETE FROM test_attempt_answers");
        jdbcTemplate.update("DELETE FROM test_attempts");
        jdbcTemplate.update("DELETE FROM test_question_accepted_answers");
        jdbcTemplate.update("DELETE FROM test_question_options");
        jdbcTemplate.update("DELETE FROM test_questions");
        jdbcTemplate.update("DELETE FROM test_passages");
        jdbcTemplate.update("DELETE FROM tests");

        periodicTestId = testRepository.save(new com.example.datn.modules.test.entity.Test(
                "Kiểm tra định kỳ", TestType.PERIODIC, null, null, null)).getId();
        listeningPassageId = passageRepository.save(new TestPassage(
                periodicTestId, "At the airport", null, "/media/listening/airport.mp3", TRANSCRIPT)).getId();
        readingPassageId = passageRepository.save(new TestPassage(
                periodicTestId, "The museum", "The museum opens at 9 a.m. every day except Monday.", null, null)).getId();
        choiceQuestion(periodicTestId, TestQuestionType.LISTENING, TestSkill.LISTENING,
                "Which flight is boarding?", listeningPassageId);
        choiceQuestion(periodicTestId, TestQuestionType.LISTENING, TestSkill.LISTENING,
                "Which gate should passengers go to?", listeningPassageId);
        choiceQuestion(periodicTestId, TestQuestionType.READING, TestSkill.READING,
                "When is the museum closed?", readingPassageId);

        comprehensiveTestId = testRepository.save(new com.example.datn.modules.test.entity.Test(
                "Kiểm tra tổng hợp", TestType.COMPREHENSIVE, null, null, null)).getId();
        otherTestPassageId = passageRepository.save(new TestPassage(
                comprehensiveTestId, "At the station", null, "/media/listening/station.mp3", null)).getId();
        choiceQuestion(comprehensiveTestId, TestQuestionType.LISTENING, TestSkill.LISTENING,
                "Which platform does the train leave from?", otherTestPassageId);
    }

    @Test
    void questionsShareAPassageAndItsTranscriptIsHiddenUntilSubmission() throws Exception {
        mockMvc.perform(get("/api/tests/" + periodicTestId).with(TestAuth.learner(LEARNER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.passages.length()").value(2))
                .andExpect(jsonPath("$.passages[0].id").value((int) listeningPassageId))
                .andExpect(jsonPath("$.passages[0].audioUrl").value("/media/listening/airport.mp3"))
                .andExpect(jsonPath("$.passages[0].maxPlays").value(2))
                .andExpect(jsonPath("$.passages[1].content").value("The museum opens at 9 a.m. every day except Monday."))
                .andExpect(jsonPath("$.passages[1].maxPlays").doesNotExist())
                // Two questions about the recording, one about the text.
                .andExpect(jsonPath("$.questions[0].passageId").value((int) listeningPassageId))
                .andExpect(jsonPath("$.questions[1].passageId").value((int) listeningPassageId))
                .andExpect(jsonPath("$.questions[2].passageId").value((int) readingPassageId))
                .andExpect(content().string(not(containsString("Gate 5"))));

        long attemptId = attemptIdOf(start(periodicTestId, false).andExpect(status().isCreated()));

        // The result (correct answers, transcripts) does not exist while the attempt is in progress.
        mockMvc.perform(get("/api/test-attempts/" + attemptId).with(TestAuth.learner(LEARNER)))
                .andExpect(status().isConflict());

        mockMvc.perform(post("/api/test-attempts/" + attemptId + "/submit").with(TestAuth.learner(LEARNER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.passages[0].transcript").value(TRANSCRIPT))
                .andExpect(jsonPath("$.review[0].passageId").value((int) listeningPassageId));
    }

    @Test
    void recordingIsPlayedAtMostTwicePerAttempt() throws Exception {
        long attemptId = attemptIdOf(start(periodicTestId, false).andExpect(status().isCreated()));

        play(attemptId, listeningPassageId)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.playCount").value(1))
                .andExpect(jsonPath("$.maxPlays").value(2));
        play(attemptId, listeningPassageId).andExpect(jsonPath("$.playCount").value(2));
        play(attemptId, listeningPassageId).andExpect(status().isConflict());

        // A text has nothing to play, and a passage of another test is not part of this attempt.
        play(attemptId, readingPassageId).andExpect(status().isNotFound());
        play(attemptId, otherTestPassageId).andExpect(status().isNotFound());

        // Coming back to the attempt does not give the plays back.
        start(periodicTestId, false)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.passagePlays.length()").value(1))
                .andExpect(jsonPath("$.passagePlays[0].passageId").value((int) listeningPassageId))
                .andExpect(jsonPath("$.passagePlays[0].playCount").value(2));

        // Starting a periodic test over is a new attempt, with its own plays.
        long secondAttemptId = attemptIdOf(start(periodicTestId, true)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.passagePlays.length()").value(0)));
        play(secondAttemptId, listeningPassageId).andExpect(jsonPath("$.playCount").value(1));

        mockMvc.perform(post("/api/test-attempts/" + secondAttemptId + "/submit").with(TestAuth.learner(LEARNER)))
                .andExpect(status().isOk());
        play(secondAttemptId, listeningPassageId).andExpect(status().isConflict());
    }

    @Test
    void comprehensiveTestIsTakenOnce() throws Exception {
        mockMvc.perform(get("/api/tests").with(TestAuth.learner(LEARNER)))
                .andExpect(jsonPath("$[?(@.id == " + comprehensiveTestId + ")].retakeAllowed").value(false))
                .andExpect(jsonPath("$[?(@.id == " + periodicTestId + ")].retakeAllowed").value(true));

        long attemptId = attemptIdOf(start(comprehensiveTestId, false).andExpect(status().isCreated()));

        // The attempt in progress is resumed, never thrown away.
        start(comprehensiveTestId, false)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.attemptId").value((int) attemptId));
        start(comprehensiveTestId, true).andExpect(status().isConflict());

        mockMvc.perform(post("/api/test-attempts/" + attemptId + "/submit").with(TestAuth.learner(LEARNER)))
                .andExpect(status().isOk());

        start(comprehensiveTestId, false).andExpect(status().isConflict());
        start(comprehensiveTestId, true).andExpect(status().isConflict());

        // The screens find the one result through the test.
        mockMvc.perform(get("/api/tests/" + comprehensiveTestId).with(TestAuth.learner(LEARNER)))
                .andExpect(jsonPath("$.retakeAllowed").value(false))
                .andExpect(jsonPath("$.hasInProgress").value(false))
                .andExpect(jsonPath("$.lastAttemptId").value((int) attemptId));
        mockMvc.perform(get("/api/tests").with(TestAuth.learner(LEARNER)))
                .andExpect(jsonPath("$[?(@.id == " + comprehensiveTestId + ")].progress.attemptCount").value(1))
                .andExpect(jsonPath("$[?(@.id == " + comprehensiveTestId + ")].progress.lastAttemptId")
                        .value((int) attemptId));

        // Another learner still has their one attempt.
        mockMvc.perform(post("/api/tests/" + comprehensiveTestId + "/attempts").with(TestAuth.learner(43)))
                .andExpect(status().isCreated());
    }

    @Test
    void periodicTestCanBeTakenAgain() throws Exception {
        long firstAttemptId = attemptIdOf(start(periodicTestId, false).andExpect(status().isCreated()));
        mockMvc.perform(post("/api/test-attempts/" + firstAttemptId + "/submit").with(TestAuth.learner(LEARNER)))
                .andExpect(status().isOk());

        long secondAttemptId = attemptIdOf(start(periodicTestId, false)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.resumed").value(false)));
        mockMvc.perform(post("/api/test-attempts/" + secondAttemptId + "/submit").with(TestAuth.learner(LEARNER)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/tests").with(TestAuth.learner(LEARNER)))
                .andExpect(jsonPath("$[?(@.id == " + periodicTestId + ")].progress.attemptCount").value(2))
                .andExpect(jsonPath("$[?(@.id == " + periodicTestId + ")].progress.lastAttemptId")
                        .value((int) secondAttemptId));

        // The history lists the submitted attempts, newest first, and not the one in progress.
        start(periodicTestId, false).andExpect(status().isCreated());
        mockMvc.perform(get("/api/tests/" + periodicTestId + "/attempts").with(TestAuth.learner(LEARNER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].attemptId").value((int) secondAttemptId))
                .andExpect(jsonPath("$[0].status").value("GRADED"))
                .andExpect(jsonPath("$[0].scorePercent").value(0))
                .andExpect(jsonPath("$[0].submittedAt").exists())
                .andExpect(jsonPath("$[1].attemptId").value((int) firstAttemptId));

        // It is the learner's own history, and an unknown test has none.
        mockMvc.perform(get("/api/tests/" + periodicTestId + "/attempts").with(TestAuth.learner(43)))
                .andExpect(jsonPath("$.length()").value(0));
        mockMvc.perform(get("/api/tests/999999/attempts").with(TestAuth.learner(LEARNER)))
                .andExpect(status().isNotFound());
    }

    private void choiceQuestion(long testId, TestQuestionType type, TestSkill skill, String content, long passageId) {
        TestQuestion question = questionRepository.save(
                new TestQuestion(testId, type, skill, content, 1, null, null, passageId));
        optionRepository.save(new TestQuestionOption(question.getId(), "right", true));
        optionRepository.save(new TestQuestionOption(question.getId(), "wrong", false));
    }

    private ResultActions start(long testId, boolean restart) throws Exception {
        return mockMvc.perform(post("/api/tests/" + testId + "/attempts")
                .param("restart", String.valueOf(restart))
                .with(TestAuth.learner(LEARNER)));
    }

    private ResultActions play(long attemptId, long passageId) throws Exception {
        return mockMvc.perform(post("/api/test-attempts/" + attemptId + "/passages/" + passageId + "/plays")
                .with(TestAuth.learner(LEARNER)));
    }

    private static long attemptIdOf(ResultActions result) throws Exception {
        String body = result.andReturn().getResponse().getContentAsString();
        return Long.parseLong(body.replaceAll(".*\"attemptId\":(\\d+).*", "$1"));
    }
}
