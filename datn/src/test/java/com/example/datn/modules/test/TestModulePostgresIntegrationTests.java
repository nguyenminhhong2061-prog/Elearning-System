package com.example.datn.modules.test;

import com.example.datn.support.AbstractPostgresIntegrationTest;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Runs the test module against a real PostgreSQL with the Flyway seed data. Proves that the upper-case enum values
 * satisfy the CHECK constraints, that skill_scores round-trips through JSONB, and that a comprehensive test records a
 * level change in users and user_level_history.
 */
class TestModulePostgresIntegrationTests extends AbstractPostgresIntegrationTest {

    private static final long PERIODIC_TEST_ID = 100;
    private static final long COMPREHENSIVE_TEST_ID = 200;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

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
                putAnswer(token, attemptId, questionId, "{\"text\":\"Sustainability is a shared responsibility.\"}");
            } else if ("WRITING".equals(type)) {
                putAnswer(token, attemptId, questionId, "{\"text\":\"" + acceptedAnswer(questionId) + "\"}");
            } else {
                putAnswer(token, attemptId, questionId, "{\"optionId\":" + correctOptionId(questionId) + "}");
            }
        }
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
