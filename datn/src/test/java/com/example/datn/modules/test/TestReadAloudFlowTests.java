package com.example.datn.modules.test;

import com.example.datn.common.enums.CefrLevel;
import com.example.datn.modules.test.entity.PronunciationDetails;
import com.example.datn.modules.test.entity.TestQuestion;
import com.example.datn.modules.test.entity.TestQuestionOption;
import com.example.datn.modules.test.enums.TestQuestionType;
import com.example.datn.modules.test.enums.TestSkill;
import com.example.datn.modules.test.enums.TestType;
import com.example.datn.modules.test.exception.PronunciationUnavailableException;
import com.example.datn.modules.test.repository.TestQuestionOptionRepository;
import com.example.datn.modules.test.repository.TestQuestionRepository;
import com.example.datn.modules.test.repository.TestRepository;
import com.example.datn.modules.test.service.PronunciationAssessor;
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

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Read-aloud speaking questions: the answer is a recording, assessed when it is uploaded (the pronunciation service
 * is a mock here); what was heard stays hidden until the attempt is submitted, when the scores become points and the
 * speaking level.
 */
@SpringBootTest
@AutoConfigureMockMvc
class TestReadAloudFlowTests {

    private static final long LEARNER = 42;
    private static final String EASY_SENTENCE = "I usually get up at seven.";
    private static final String HARDER_SENTENCE = "She has lived in Hanoi for five years.";

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private TestRepository testRepository;
    @Autowired
    private TestQuestionRepository questionRepository;
    @Autowired
    private TestQuestionOptionRepository optionRepository;
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @MockitoBean
    private PronunciationAssessor assessor;

    private long testId;
    private long easyQuestionId;
    private long harderQuestionId;
    private long choiceQuestionId;

    @BeforeEach
    void seedTest() {
        jdbcTemplate.update("DELETE FROM test_attempt_answers");
        jdbcTemplate.update("DELETE FROM test_attempts");
        jdbcTemplate.update("DELETE FROM test_question_accepted_answers");
        jdbcTemplate.update("DELETE FROM test_question_options");
        jdbcTemplate.update("DELETE FROM test_questions");
        jdbcTemplate.update("DELETE FROM tests");

        testId = testRepository.save(new com.example.datn.modules.test.entity.Test(
                "Kiểm tra định kỳ", TestType.PERIODIC, null, null, null)).getId();
        easyQuestionId = questionRepository.save(readAloud(CefrLevel.A2, EASY_SENTENCE)).getId();
        harderQuestionId = questionRepository.save(readAloud(CefrLevel.B1, HARDER_SENTENCE)).getId();
        choiceQuestionId = questionRepository.save(new TestQuestion(
                testId, TestQuestionType.MULTIPLE_CHOICE, TestSkill.READING, "She ___ in Hanoi.", 1, null)).getId();
        optionRepository.save(new TestQuestionOption(choiceQuestionId, "lives", true));

        when(assessor.assess(any(), eq(EASY_SENTENCE))).thenReturn(new PronunciationAssessor.Assessment(
                new BigDecimal("80.00"), "i usually get up at seven",
                new PronunciationDetails(new BigDecimal("85.00"), new BigDecimal("100.00"), List.of())));
        when(assessor.assess(any(), eq(HARDER_SENTENCE))).thenReturn(new PronunciationAssessor.Assessment(
                new BigDecimal("40.00"), "she has live in hanoi five years",
                new PronunciationDetails(new BigDecimal("55.00"), new BigDecimal("62.50"),
                        List.of(new PronunciationDetails.WordError("lived", "lɪvd", "lɪv"),
                                new PronunciationDetails.WordError("for", "fɔːr", "")))));
    }

    @Test
    void recordingIsAssessedAtOnceAndBecomesPointsAndALevelOnSubmission() throws Exception {
        mockMvc.perform(get("/api/tests/" + testId).with(TestAuth.learner(LEARNER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.questions[0].referenceText").value(EASY_SENTENCE))
                .andExpect(jsonPath("$.questions[0].maxRecordingSeconds").value(15))
                .andExpect(jsonPath("$.questions[2].referenceText").doesNotExist())
                .andExpect(jsonPath("$.questions[2].maxRecordingSeconds").doesNotExist());

        long attemptId = startAttempt();
        record(attemptId, easyQuestionId, wav()).andExpect(status().isNoContent());
        record(attemptId, harderQuestionId, wav()).andExpect(status().isNoContent());

        // Resuming shows that the questions are answered, not what was heard in the recordings.
        mockMvc.perform(post("/api/tests/" + testId + "/attempts").with(TestAuth.learner(LEARNER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.answers.length()").value(2))
                .andExpect(jsonPath("$.answers[0].recorded").value(true))
                .andExpect(jsonPath("$.answers[0].text").doesNotExist())
                .andExpect(content().string(not(containsString("usually"))));

        mockMvc.perform(post("/api/test-attempts/" + attemptId + "/submit").with(TestAuth.learner(LEARNER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("GRADED"))
                // 80% of 5 points and 40% of 5 points. The A2 sentence is passed, the B1 one is not.
                .andExpect(jsonPath("$.skills.speaking.score").value(60))
                .andExpect(jsonPath("$.skills.speaking.level").value("A2"))
                .andExpect(jsonPath("$.review[0].correct").doesNotExist())
                .andExpect(jsonPath("$.review[0].scoreEarned").value(4.0))
                .andExpect(jsonPath("$.review[0].answerText").value("i usually get up at seven"))
                .andExpect(jsonPath("$.review[0].correctAnswer").value(EASY_SENTENCE))
                .andExpect(jsonPath("$.review[0].pronunciation.score").value(80.0))
                .andExpect(jsonPath("$.review[0].pronunciation.phonemeAccuracy").value(85.0))
                .andExpect(jsonPath("$.review[0].pronunciation.errors.length()").value(0))
                .andExpect(jsonPath("$.review[1].scoreEarned").value(2.0))
                .andExpect(jsonPath("$.review[1].pronunciation.wordAccuracy").value(62.5))
                .andExpect(jsonPath("$.review[1].pronunciation.errors[0].word").value("lived"))
                .andExpect(jsonPath("$.review[1].pronunciation.errors[0].expectedIpa").value("lɪvd"))
                .andExpect(jsonPath("$.review[1].pronunciation.errors[1].heardIpa").value(""))
                // A question that is not read aloud has no pronunciation.
                .andExpect(jsonPath("$.review[2].pronunciation").doesNotExist());

        record(attemptId, easyQuestionId, wav()).andExpect(status().isConflict());
    }

    @Test
    void laterRecordingReplacesTheEarlierOne() throws Exception {
        long attemptId = startAttempt();
        record(attemptId, easyQuestionId, wav()).andExpect(status().isNoContent());

        when(assessor.assess(any(), eq(EASY_SENTENCE))).thenReturn(new PronunciationAssessor.Assessment(
                new BigDecimal("100.00"), "i usually get up at seven",
                new PronunciationDetails(new BigDecimal("100.00"), new BigDecimal("100.00"), List.of())));
        record(attemptId, easyQuestionId, wav()).andExpect(status().isNoContent());

        mockMvc.perform(post("/api/test-attempts/" + attemptId + "/submit").with(TestAuth.learner(LEARNER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.review[0].pronunciation.score").value(100.0))
                .andExpect(jsonPath("$.review[0].scoreEarned").value(5.0));
    }

    @Test
    void recordingAndTypedAnswersAreNotInterchangeable() throws Exception {
        long attemptId = startAttempt();

        // A read-aloud question takes no typed answer, and a choice question takes no recording.
        mockMvc.perform(put("/api/test-attempts/" + attemptId + "/answers/" + easyQuestionId)
                        .with(TestAuth.learner(LEARNER))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"text\":\"I usually get up at seven.\"}"))
                .andExpect(status().isBadRequest());
        record(attemptId, choiceQuestionId, wav()).andExpect(status().isBadRequest());

        // Not a WAV file, and one that is too large.
        record(attemptId, easyQuestionId, "not audio at all, just some text that is long enough to pass".getBytes(
                StandardCharsets.ISO_8859_1)).andExpect(status().isBadRequest());
        byte[] tooLarge = Arrays.copyOf(wav(), 1_000_001);
        record(attemptId, easyQuestionId, tooLarge).andExpect(status().isBadRequest());

        // Another learner's attempt.
        mockMvc.perform(put("/api/test-attempts/" + attemptId + "/answers/" + easyQuestionId + "/recording")
                        .with(TestAuth.learner(43))
                        .contentType("audio/wav")
                        .content(wav()))
                .andExpect(status().isNotFound());
    }

    @Test
    void whenTheServiceIsUnavailableNothingIsSavedAndTheLearnerCanRecordAgain() throws Exception {
        when(assessor.assess(any(), eq(EASY_SENTENCE)))
                .thenThrow(new PronunciationUnavailableException("Pronunciation assessment service is unavailable"));
        long attemptId = startAttempt();

        record(attemptId, easyQuestionId, wav()).andExpect(status().isServiceUnavailable());

        mockMvc.perform(post("/api/tests/" + testId + "/attempts").with(TestAuth.learner(LEARNER)))
                .andExpect(jsonPath("$.answers.length()").value(0));
    }

    private TestQuestion readAloud(CefrLevel level, String sentence) {
        return new TestQuestion(testId, TestQuestionType.SPEAKING, TestSkill.SPEAKING, "Read the sentence aloud.", 5,
                null, level).asReadAloud(sentence);
    }

    private long startAttempt() throws Exception {
        String body = mockMvc.perform(post("/api/tests/" + testId + "/attempts").with(TestAuth.learner(LEARNER)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return Long.parseLong(body.replaceAll(".*\"attemptId\":(\\d+).*", "$1"));
    }

    private ResultActions record(long attemptId, long questionId, byte[] audio) throws Exception {
        return mockMvc.perform(put("/api/test-attempts/" + attemptId + "/answers/" + questionId + "/recording")
                .with(TestAuth.learner(LEARNER))
                .contentType("audio/wav")
                .content(audio));
    }

    /** The smallest thing the API takes for a recording: a RIFF/WAVE header and a little sound. */
    private static byte[] wav() {
        byte[] audio = new byte[64];
        System.arraycopy("RIFF".getBytes(StandardCharsets.ISO_8859_1), 0, audio, 0, 4);
        System.arraycopy("WAVE".getBytes(StandardCharsets.ISO_8859_1), 0, audio, 8, 4);
        return audio;
    }
}
