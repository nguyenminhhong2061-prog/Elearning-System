package com.example.datn.modules.test;

import com.example.datn.common.enums.CefrLevel;
import com.example.datn.common.user.LevelRecorder;
import com.example.datn.modules.test.entity.TestQuestion;
import com.example.datn.modules.test.entity.TestQuestionOption;
import com.example.datn.modules.test.enums.TestQuestionType;
import com.example.datn.modules.test.enums.TestSkill;
import com.example.datn.modules.test.enums.TestType;
import com.example.datn.modules.test.repository.TestQuestionOptionRepository;
import com.example.datn.modules.test.repository.TestQuestionRepository;
import com.example.datn.modules.test.repository.TestRepository;
import com.example.datn.modules.test.service.AiAssessment;
import com.example.datn.modules.test.service.PendingTestGradingScheduler;
import com.example.datn.modules.test.service.TestAiGateway;
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

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Grading of a comprehensive test whose questions carry a level, with the AI examiner replaced by a mock: levels come
 * from the levels passed and from the examiner's bands, and an attempt the examiner could not grade is graded later.
 */
@SpringBootTest
@AutoConfigureMockMvc
class TestGradingFlowTests {

    private static final long LEARNER = 42;

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private TestRepository testRepository;
    @Autowired
    private TestQuestionRepository questionRepository;
    @Autowired
    private TestQuestionOptionRepository optionRepository;
    @Autowired
    private PendingTestGradingScheduler scheduler;
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @MockitoBean
    private TestAiGateway aiGateway;
    @MockitoBean
    private LevelRecorder levelRecorder;

    private long testId;
    private final Map<CefrLevel, Long> readingQuestionIds = new LinkedHashMap<>();
    private long writingQuestionId;

    @BeforeEach
    void seedTest() {
        jdbcTemplate.update("DELETE FROM test_attempt_answers");
        jdbcTemplate.update("DELETE FROM test_attempts");
        jdbcTemplate.update("DELETE FROM test_question_accepted_answers");
        jdbcTemplate.update("DELETE FROM test_question_options");
        jdbcTemplate.update("DELETE FROM test_questions");
        jdbcTemplate.update("DELETE FROM tests");

        testId = testRepository.save(new com.example.datn.modules.test.entity.Test(
                "Kiểm tra tổng hợp", TestType.COMPREHENSIVE, null, null, null)).getId();

        readingQuestionIds.clear();
        for (CefrLevel level : new CefrLevel[] {CefrLevel.A1, CefrLevel.A2, CefrLevel.B1}) {
            TestQuestion question = questionRepository.save(new TestQuestion(
                    testId, TestQuestionType.READING, TestSkill.READING, "Reading at " + level, 1, null, level));
            optionRepository.save(new TestQuestionOption(question.getId(), "right", true));
            optionRepository.save(new TestQuestionOption(question.getId(), "wrong", false));
            readingQuestionIds.put(level, question.getId());
        }
        writingQuestionId = questionRepository.save(new TestQuestion(
                testId, TestQuestionType.WRITING, TestSkill.WRITING, "Describe your last holiday.", 6, null,
                CefrLevel.B1)).getId();

        when(aiGateway.suggestRoadmap(any(), any())).thenReturn("Lộ trình đề xuất");
    }

    @Test
    void levelsComeFromTheLevelsPassedAndFromTheExaminer() throws Exception {
        when(aiGateway.assess(any(), eq("Last summer I went to Da Nang."))).thenReturn(Optional.of(new AiAssessment(
                Map.of("task", 4, "coherence", 4, "vocabulary", 4, "grammar", 4), "Bài viết mạch lạc.")));

        long attemptId = startAttemptAndAnswer();

        mockMvc.perform(post("/api/test-attempts/" + attemptId + "/submit").with(TestAuth.learner(LEARNER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("GRADED"))
                // Reading: A1 and A2 passed, B1 failed. Two of three correct is 67 points, but the level is A2.
                .andExpect(jsonPath("$.skills.reading.score").value(67))
                .andExpect(jsonPath("$.skills.reading.level").value("A2"))
                // Writing: the examiner's band 4 is B2 and earns 4/6 of the points.
                .andExpect(jsonPath("$.skills.writing.score").value(67))
                .andExpect(jsonPath("$.skills.writing.level").value("B2"))
                // Overall: the average of A2 and B2.
                .andExpect(jsonPath("$.scorePercent").value(67))
                .andExpect(jsonPath("$.suggestedLevel").value("B1"))
                .andExpect(jsonPath("$.suggestedRoadmap").value("Lộ trình đề xuất"))
                .andExpect(jsonPath("$.review[0].level").value("A1"))
                .andExpect(jsonPath("$.review[3].correct").doesNotExist())
                .andExpect(jsonPath("$.review[3].aiCriteria.grammar").value(4))
                .andExpect(jsonPath("$.review[3].aiComment").value("Bài viết mạch lạc."));

        verify(levelRecorder).recordLevelChange(LEARNER, CefrLevel.B1, attemptId);
    }

    @Test
    void attemptTheExaminerCouldNotGradeIsGradedLater() throws Exception {
        when(aiGateway.assess(any(), any())).thenReturn(Optional.empty());

        long attemptId = startAttemptAndAnswer();

        mockMvc.perform(post("/api/test-attempts/" + attemptId + "/submit").with(TestAuth.learner(LEARNER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUBMITTED"))
                .andExpect(jsonPath("$.scorePercent").doesNotExist())
                .andExpect(jsonPath("$.suggestedLevel").doesNotExist())
                // The skill that needs no examiner already has its result.
                .andExpect(jsonPath("$.skills.reading.level").value("A2"))
                .andExpect(jsonPath("$.skills.writing.score").doesNotExist());
        verify(levelRecorder, never()).recordLevelChange(any(), any(), any());

        // Still unavailable: nothing changes.
        scheduler.gradePendingAttempts();
        mockMvc.perform(get("/api/test-attempts/" + attemptId).with(TestAuth.learner(LEARNER)))
                .andExpect(jsonPath("$.status").value("SUBMITTED"));

        when(aiGateway.assess(any(), any())).thenReturn(Optional.of(new AiAssessment(
                Map.of("task", 2, "coherence", 2, "vocabulary", 2, "grammar", 2), null)));
        scheduler.gradePendingAttempts();

        mockMvc.perform(get("/api/test-attempts/" + attemptId).with(TestAuth.learner(LEARNER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("GRADED"))
                .andExpect(jsonPath("$.skills.writing.level").value("A2"))
                .andExpect(jsonPath("$.suggestedLevel").value("A2"));
        verify(levelRecorder).recordLevelChange(LEARNER, CefrLevel.A2, attemptId);
    }

    /** Answers the A1 and A2 reading questions correctly, the B1 one wrongly, and writes the essay. */
    private long startAttemptAndAnswer() throws Exception {
        String body = mockMvc.perform(post("/api/tests/" + testId + "/attempts").with(TestAuth.learner(LEARNER)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long attemptId = Long.parseLong(body.replaceAll(".*\"attemptId\":(\\d+).*", "$1"));

        for (Map.Entry<CefrLevel, Long> entry : readingQuestionIds.entrySet()) {
            boolean answerCorrectly = entry.getKey() != CefrLevel.B1;
            long optionId = optionRepository.findByQuestionIdInOrderByIdAsc(java.util.List.of(entry.getValue())).stream()
                    .filter(option -> option.isCorrect() == answerCorrectly)
                    .findFirst()
                    .orElseThrow()
                    .getId();
            putAnswer(attemptId, entry.getValue(), "{\"optionId\":" + optionId + "}");
        }
        putAnswer(attemptId, writingQuestionId, "{\"text\":\"Last summer I went to Da Nang.\"}");
        return attemptId;
    }

    private void putAnswer(long attemptId, long questionId, String body) throws Exception {
        mockMvc.perform(put("/api/test-attempts/" + attemptId + "/answers/" + questionId)
                        .with(TestAuth.learner(LEARNER))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNoContent());
    }
}
