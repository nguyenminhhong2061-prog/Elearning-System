package com.example.datn.modules.test;

import com.example.datn.modules.test.entity.PronunciationDetails;
import com.example.datn.modules.test.service.AiAssessment;
import com.example.datn.modules.test.service.PronunciationAssessor;
import com.example.datn.modules.test.service.TestAiGateway;
import com.example.datn.support.AbstractPostgresIntegrationTest;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Runs the test module against a real PostgreSQL with the Flyway seed data. Proves that the upper-case enum values
 * satisfy the CHECK constraints, that the JSONB columns (skill scores and levels, the examiner's bands) round-trip, and
 * that a comprehensive test records a level change in users and user_level_history. The AI examiner is a mock.
 */
class TestModulePostgresIntegrationTests extends AbstractPostgresIntegrationTest {

    private static final long PERIODIC_TEST_ID = 100;
    private static final long COMPREHENSIVE_TEST_ID = 200;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @MockitoBean
    private TestAiGateway aiGateway;

    @MockitoBean
    private PronunciationAssessor pronunciationAssessor;

    @BeforeEach
    void examinerAndAssessorGradeEverything() {
        when(aiGateway.assess(any(), any())).thenReturn(Optional.of(new AiAssessment(
                Map.of("task", 3, "coherence", 3, "vocabulary", 3, "grammar", 3), "Ý rõ ràng.")));
        when(aiGateway.suggestRoadmap(any(), any())).thenReturn("Lộ trình đề xuất");
        when(pronunciationAssessor.assess(any(), any())).thenReturn(new PronunciationAssessor.Assessment(
                new BigDecimal("75.00"), "sustainability is a shared responsibility",
                new PronunciationDetails(new BigDecimal("90.00"), new BigDecimal("100.00"),
                        List.of(new PronunciationDetails.WordError("shared", "ʃɛrd", "ʃɛd")))));
    }

    @Test
    void periodicTestGradesAndStoresUpperCaseEnumsAndJsonb() throws Exception {
        Account account = registerAndLogin();

        mockMvc.perform(get("/api/tests").header(HttpHeaders.AUTHORIZATION, "Bearer " + account.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == 100)].title").value("Kiểm tra định kỳ — tuần 40"));

        long attemptId = startAttempt(account.token(), PERIODIC_TEST_ID);
        answerPeriodicCorrectly(account.token(), attemptId);

        MvcResult result = mockMvc.perform(post("/api/test-attempts/" + attemptId + "/submit")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + account.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("GRADED"))
                .andExpect(jsonPath("$.scorePercent").value(100))
                .andReturn();

        // The DB stores the upper-case values required by the CHECK constraints, and skill_scores as JSONB.
        Map<String, Object> row = jdbcTemplate.queryForMap(
                "select status, skill_scores::text as skill_scores, submitted_at from test_attempts where id = ?", attemptId);
        assertThat(row.get("status")).isEqualTo("GRADED");
        assertThat(row.get("submitted_at")).isNotNull();
        assertThat((String) row.get("skill_scores")).contains("\"doc\"").contains("\"viet\"");
    }

    @Test
    void comprehensiveTestRecordsLevelChange() throws Exception {
        Account account = registerAndLogin();

        long attemptId = startAttempt(account.token(), COMPREHENSIVE_TEST_ID);
        answerComprehensive(account.token(), attemptId);

        mockMvc.perform(post("/api/test-attempts/" + attemptId + "/submit")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + account.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("GRADED"))
                .andExpect(jsonPath("$.suggestedLevel").exists());

        // The comprehensive test updated users.current_level and appended a level-history row.
        Map<String, Object> user = jdbcTemplate.queryForMap(
                "select current_level from users where id = ?", account.userId());
        assertThat(user.get("current_level")).isNotNull();

        Integer historyRows = jdbcTemplate.queryForObject(
                "select count(*) from user_level_history where user_id = ? and test_attempt_id = ?",
                Integer.class, account.userId(), attemptId);
        assertThat(historyRows).isEqualTo(1);

        // The skill levels are stored as JSONB. The seeded speaking question is read aloud at B2: 75 passes it.
        String skillLevels = jdbcTemplate.queryForObject(
                "select skill_levels::text from test_attempts where id = ?", String.class, attemptId);
        assertThat(skillLevels).contains("\"noi\": \"B2\"");

        // The recording left its score, what was heard and the details (JSONB), read back in the result.
        Map<String, Object> recorded = jdbcTemplate.queryForMap(
                "select answer_content, pronunciation_score, pronunciation_details::text as details"
                        + " from test_attempt_answers where attempt_id = ? and pronunciation_score is not null",
                attemptId);
        assertThat(recorded.get("answer_content")).isEqualTo("sustainability is a shared responsibility");
        assertThat((String) recorded.get("details")).contains("\"phonemeAccuracy\"").contains("shared");
        mockMvc.perform(get("/api/test-attempts/" + attemptId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + account.token()))
                .andExpect(jsonPath("$.skills.speaking.score").value(75))
                .andExpect(jsonPath("$.review[?(@.questionId == 2004)].pronunciation.errors[0].heardIpa").value("ʃɛd"))
                .andExpect(jsonPath("$.review[?(@.questionId == 2004)].correctAnswer")
                        .value("Sustainability is a shared responsibility."));
    }

    @Test
    void examinerBandsAreStoredAsJsonb() throws Exception {
        Account account = registerAndLogin();
        Long testId = jdbcTemplate.queryForObject(
                "insert into tests (title, type) values ('Kiểm tra viết', 'PERIODIC') returning id", Long.class);
        Long questionId = jdbcTemplate.queryForObject(
                "insert into test_questions (test_id, question_type, skill, level, content, points)"
                        + " values (?, 'WRITING', 'writing', 'B1', 'Describe your last holiday.', 6) returning id",
                Long.class, testId);

        long attemptId = startAttempt(account.token(), testId);
        putAnswer(account.token(), attemptId, questionId, "{\"text\":\"Last summer I went to Da Nang.\"}");
        mockMvc.perform(post("/api/test-attempts/" + attemptId + "/submit")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + account.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("GRADED"))
                .andExpect(jsonPath("$.skills.writing.level").value("B1"))
                .andExpect(jsonPath("$.review[0].aiCriteria.grammar").value(3));

        String criteria = jdbcTemplate.queryForObject(
                "select ai_criteria::text from test_attempt_answers where attempt_id = ? and ai_criteria is not null",
                String.class, attemptId);
        assertThat(criteria).contains("\"grammar\"");
    }

    @Test
    void seededTestsCanBeTakenAndEveryQuestionCanBeGraded() throws Exception {
        Account account = registerAndLogin();

        mockMvc.perform(get("/api/tests/101").header(HttpHeaders.AUTHORIZATION, "Bearer " + account.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("PERIODIC"))
                .andExpect(jsonPath("$.passages.length()").value(1))
                .andExpect(jsonPath("$.questions.length()").value(11));
        mockMvc.perform(get("/api/tests/201").header(HttpHeaders.AUTHORIZATION, "Bearer " + account.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("COMPREHENSIVE"))
                .andExpect(jsonPath("$.retakeAllowed").value(false))
                .andExpect(jsonPath("$.passages.length()").value(5))
                .andExpect(jsonPath("$.passages[0].maxPlays").value(2))
                .andExpect(jsonPath("$.questions.length()").value(23));

        // A choice question has exactly one correct option.
        Integer badChoiceQuestions = jdbcTemplate.queryForObject(
                "select count(*) from (select question_id from test_question_options"
                        + " group by question_id having count(*) filter (where is_correct) <> 1) broken",
                Integer.class);
        assertThat(badChoiceQuestions).isZero();

        // Every question has a way to be graded: options, accepted answers, a sentence to read, or the examiner.
        Integer ungradable = jdbcTemplate.queryForObject(
                "select count(*) from test_questions q where q.test_id in (101, 201)"
                        + " and not exists (select 1 from test_question_options o where o.question_id = q.id)"
                        + " and not exists (select 1 from test_question_accepted_answers a where a.question_id = q.id)"
                        + " and q.reference_text is null and q.question_type not in ('WRITING', 'SPEAKING')",
                Integer.class);
        assertThat(ungradable).isZero();

        // A question and its passage belong to the same test.
        Integer strayPassages = jdbcTemplate.queryForObject(
                "select count(*) from test_questions q join test_passages p on p.id = q.passage_id"
                        + " where p.test_id <> q.test_id",
                Integer.class);
        assertThat(strayPassages).isZero();
    }

    @Test
    void playsOfAPassageAreCountedAndDeletedWithTheirAttempt() throws Exception {
        Account account = registerAndLogin();
        Long testId = jdbcTemplate.queryForObject(
                "insert into tests (title, type) values ('Kiểm tra nghe', 'PERIODIC') returning id", Long.class);
        Long passageId = jdbcTemplate.queryForObject(
                "insert into test_passages (test_id, title, audio_url, transcript)"
                        + " values (?, 'At the airport', '/media/listening/airport.mp3', 'Flight VN209 is boarding.')"
                        + " returning id",
                Long.class, testId);
        jdbcTemplate.update(
                "insert into test_questions (test_id, passage_id, question_type, skill, level, content, points)"
                        + " values (?, ?, 'LISTENING', 'listening', 'A2', 'Which flight is boarding?', 1)",
                testId, passageId);

        mockMvc.perform(get("/api/tests/" + testId).header(HttpHeaders.AUTHORIZATION, "Bearer " + account.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.passages[0].maxPlays").value(2))
                .andExpect(jsonPath("$.questions[0].passageId").value(passageId.intValue()));

        long attemptId = startAttempt(account.token(), testId);
        String playsUrl = "/api/test-attempts/" + attemptId + "/passages/" + passageId + "/plays";
        mockMvc.perform(post(playsUrl).header(HttpHeaders.AUTHORIZATION, "Bearer " + account.token()))
                .andExpect(status().isOk());
        mockMvc.perform(post(playsUrl).header(HttpHeaders.AUTHORIZATION, "Bearer " + account.token()))
                .andExpect(jsonPath("$.playCount").value(2));
        mockMvc.perform(post(playsUrl).header(HttpHeaders.AUTHORIZATION, "Bearer " + account.token()))
                .andExpect(status().isConflict());

        // Starting over deletes the attempt, and the database deletes its plays with it.
        mockMvc.perform(post("/api/tests/" + testId + "/attempts").param("restart", "true")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + account.token()))
                .andExpect(status().isCreated());
        Integer plays = jdbcTemplate.queryForObject(
                "select count(*) from test_passage_plays where passage_id = ?", Integer.class, passageId);
        assertThat(plays).isZero();
    }

    private long startAttempt(String token, long testId) throws Exception {
        String body = mockMvc.perform(post("/api/tests/" + testId + "/attempts")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(body, "$.attemptId")).longValue();
    }

    private void answerPeriodicCorrectly(String token, long attemptId) throws Exception {
        for (Map<String, Object> question : questionsOf(PERIODIC_TEST_ID)) {
            long questionId = ((Number) question.get("id")).longValue();
            String type = (String) question.get("question_type");
            if ("MULTIPLE_CHOICE".equals(type)) {
                long correctOption = correctOptionId(questionId);
                putAnswer(token, attemptId, questionId, "{\"optionId\":" + correctOption + "}");
            } else {
                putAnswer(token, attemptId, questionId, "{\"text\":\"" + acceptedAnswer(questionId) + "\"}");
            }
        }
    }

    private void answerComprehensive(String token, long attemptId) throws Exception {
        for (Map<String, Object> question : questionsOf(COMPREHENSIVE_TEST_ID)) {
            long questionId = ((Number) question.get("id")).longValue();
            String type = (String) question.get("question_type");
            if ("SPEAKING".equals(type)) {
                // The seeded speaking question is read aloud: its answer is a recording.
                mockMvc.perform(put("/api/test-attempts/" + attemptId + "/answers/" + questionId + "/recording")
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                                .contentType("audio/wav")
                                .content(wav()))
                        .andExpect(status().isNoContent());
            } else if ("WRITING".equals(type)) {
                putAnswer(token, attemptId, questionId, "{\"text\":\"" + acceptedAnswer(questionId) + "\"}");
            } else {
                putAnswer(token, attemptId, questionId, "{\"optionId\":" + correctOptionId(questionId) + "}");
            }
        }
    }

    private static byte[] wav() {
        byte[] audio = new byte[64];
        System.arraycopy("RIFF".getBytes(StandardCharsets.ISO_8859_1), 0, audio, 0, 4);
        System.arraycopy("WAVE".getBytes(StandardCharsets.ISO_8859_1), 0, audio, 8, 4);
        return audio;
    }

    private void putAnswer(String token, long attemptId, long questionId, String body) throws Exception {
        mockMvc.perform(put("/api/test-attempts/" + attemptId + "/answers/" + questionId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNoContent());
    }

    private List<Map<String, Object>> questionsOf(long testId) {
        return jdbcTemplate.queryForList(
                "select id, question_type from test_questions where test_id = ? order by id", testId);
    }

    private long correctOptionId(long questionId) {
        return jdbcTemplate.queryForObject(
                "select id from test_question_options where question_id = ? and is_correct order by id limit 1",
                Long.class, questionId);
    }

    private String acceptedAnswer(long questionId) {
        return jdbcTemplate.queryForObject(
                "select answer_text from test_question_accepted_answers where question_id = ? and is_primary order by id limit 1",
                String.class, questionId);
    }

    private Account registerAndLogin() throws Exception {
        String email = "test-" + UUID.randomUUID() + "@example.com";
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Nguyen Van A\",\"email\":\"" + email + "\",\"password\":\"password123\"}"))
                .andExpect(status().isCreated());

        String loginBody = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"password123\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String token = JsonPath.read(loginBody, "$.accessToken");
        long userId = ((Number) JsonPath.read(loginBody, "$.user.id")).longValue();
        return new Account(token, userId);
    }

    private record Account(String token, long userId) {
    }
}
