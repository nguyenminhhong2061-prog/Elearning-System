package com.example.datn.modules.test;

import com.example.datn.modules.test.service.TestAiGateway;
import com.example.datn.modules.test.service.TestCalendar;
import com.example.datn.support.AbstractPostgresIntegrationTest;
import com.example.datn.support.TestAuth;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The admin test pages against the real schema, migration V202610112215 and the seeded tests. H2 cannot show that the
 * seeded tests stay shown to learners, that the status passes its CHECK, that deleting a test takes its content and
 * unsubmitted attempts with it (ON DELETE CASCADE), that a question cannot name a word the bank does not have, or
 * that the tally of submissions runs on PostgreSQL. The seeded tests themselves are only read: other test classes
 * share the database.
 */
class AdminTestPostgresIntegrationTests extends AbstractPostgresIntegrationTest {

    private static final long OCTOBER_TEST_ID = 201;

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private JdbcTemplate jdbcTemplate;

    // Handing in a test asks the AI for a roadmap, which is not under test here and must not reach the real service.
    @MockitoBean
    private TestAiGateway aiGateway;

    private final ObjectMapper json = new ObjectMapper();
    private final LocalDate today = LocalDate.now(TestCalendar.ZONE);

    @Test
    void theSeededTestsStayShownAndReadInTheEditorsWords() throws Exception {
        Integer notShown = jdbcTemplate.queryForObject(
                "select count(*) from tests where id in (100, 101, 200, 201) and status <> 'VISIBLE'", Integer.class);
        assertThat(notShown).isZero();

        asAdmin(get("/api/admin/tests"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == 201)].status").value("VISIBLE"))
                .andExpect(jsonPath("$[?(@.id == 201)].startDate").value("2026-10-01"))
                .andExpect(jsonPath("$[?(@.id == 201)].questionCount").value(23))
                .andExpect(jsonPath("$[?(@.id == 201)].type").value("COMPREHENSIVE"))
                .andExpect(jsonPath("$[?(@.id == 100)].title").value("Kiểm tra định kỳ — tuần 40"));

        JsonNode october = read(asAdmin(get("/api/admin/tests/" + OCTOBER_TEST_ID)).andExpect(status().isOk()));
        assertThat(texts(october.get("skills"))).containsExactly("LISTENING", "SPEAKING", "READING", "WRITING");
        // Both comprehensive tests were "always open"; V202610122125 dated them October 2026 for the editor. Another
        // test class may push their closing date forward, never their opening date.
        assertThat(october.get("startDate").asString()).isEqualTo("2026-10-01");
        assertThat(october.get("endDate").isNull()).isFalse();
        assertThat(jdbcTemplate.queryForList("""
                select (start_date at time zone 'Asia/Ho_Chi_Minh')::date::text from tests
                where id in (200, 201) and end_date is not null
                """, String.class)).containsExactly("2026-10-01", "2026-10-01");
        assertThat(october.get("materials").get(0).get("type").asString()).isEqualTo("LISTENING");
        assertThat(october.get("materials").get(0).get("transcript").asString()).isNotBlank();
        JsonNode questions = october.get("questions");
        assertThat(questions.size()).isEqualTo(23);
        assertThat(count(questions, "type", "MULTIPLE_CHOICE")).isEqualTo(14);
        assertThat(count(questions, "type", "FILL_BLANK")).isEqualTo(2);
        assertThat(count(questions, "type", "ESSAY")).isEqualTo(2);
        assertThat(count(questions, "type", "SPEAKING")).isEqualTo(5);
        assertThat(readAloud(questions)).isEqualTo(3);
        assertThat(withLevel(questions)).isEqualTo(23);
    }

    @Test
    void aCopyOfASeededTestIsSavedUnchangedAndDeletedWithItsContent() throws Exception {
        ObjectNode copyOf = json.createObjectNode();
        copyOf.put("title", "Kiểm tra tổng hợp tháng 11");
        copyOf.put("startDate", today.plusDays(20).toString());
        copyOf.put("endDate", today.plusDays(50).toString());
        JsonNode copy = read(asAdmin(post("/api/admin/tests/" + OCTOBER_TEST_ID + "/duplicate"), copyOf)
                .andExpect(status().isCreated()));
        long copyId = copy.get("id").asLong();
        assertThat(copy.get("status").asString()).isEqualTo("DRAFT");
        assertThat(copy.get("duplicatedFrom").get("id").asLong()).isEqualTo(OCTOBER_TEST_ID);
        assertThat(copy.get("questions").size()).isEqualTo(23);

        // Saved the way the editor sends it, without the fields it does not have: nothing of the copy is lost.
        JsonNode saved = read(asAdmin(put("/api/admin/tests/" + copyId), editorBody(copy)).andExpect(status().isOk()));
        assertThat(withLevel(saved.get("questions"))).isEqualTo(23);
        assertThat(readAloud(saved.get("questions"))).isEqualTo(3);
        assertThat(saved.get("materials").get(0).get("transcript").asString()).isNotBlank();
        assertThat(jdbcTemplate.queryForList(
                "select question_type from test_questions where test_id = ? order by sort_order, id", String.class, copyId))
                .isEqualTo(jdbcTemplate.queryForList(
                        "select question_type from test_questions where test_id = ? order by sort_order, id",
                        String.class, OCTOBER_TEST_ID));

        asAdmin(delete("/api/admin/tests/" + copyId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result").value("DELETED"));
        assertThat(rows("test_questions", copyId)).isZero();
        assertThat(rows("test_passages", copyId)).isZero();
        // The seeded test is as it was and no longer has a copy pointing at it.
        assertThat(rows("test_questions", OCTOBER_TEST_ID)).isEqualTo(23);
        assertThat(rows("test_passages", OCTOBER_TEST_ID)).isPositive();
    }

    @Test
    void aTestIsWrittenReorderedAndHiddenOnTheRealSchema() throws Exception {
        Map<String, Object> word = jdbcTemplate.queryForMap("""
                select id, word, topic_id from vocabulary
                where created_by is null and status = 'visible' and topic_id is not null
                order by id limit 1
                """);
        long wordId = ((Number) word.get("id")).longValue();
        String title = "Kiểm tra " + UUID.randomUUID();

        ObjectNode body = comprehensiveTest(title, wordId);
        body.put("status", "VISIBLE");
        JsonNode created = read(asAdmin(post("/api/admin/tests"), body).andExpect(status().isCreated()));
        long testId = created.get("id").asLong();
        assertThat(created.get("questions").get(0).get("vocabularyId").asLong()).isEqualTo(wordId);
        assertThat(texts(created.get("skills"))).containsExactly("LISTENING", "SPEAKING", "READING", "WRITING");

        // The vocabulary module now sees the question made from the word and the open test it is in.
        asAdmin(get("/api/admin/vocabulary").param("topicId", word.get("topic_id").toString())
                        .param("q", word.get("word").toString()).param("size", "50"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[?(@.id == " + wordId + ")].questionCount").value(1))
                .andExpect(jsonPath("$.items[?(@.id == " + wordId + ")].openTests[0].title").value(title));

        // The last question first, and the test hidden: both pass the constraints of the real tables.
        ObjectNode edited = editorBody(created);
        ArrayNode questions = (ArrayNode) edited.get("questions");
        JsonNode last = questions.remove(questions.size() - 1);
        questions.insert(0, last);
        edited.put("status", "HIDDEN");
        JsonNode saved = read(asAdmin(put("/api/admin/tests/" + testId), edited).andExpect(status().isOk()));
        assertThat(saved.get("status").asString()).isEqualTo("HIDDEN");
        assertThat(saved.get("questions").get(0).get("id").asLong()).isEqualTo(last.get("id").asLong());
        assertThat(jdbcTemplate.queryForList(
                "select sort_order from test_questions where test_id = ? order by sort_order", Integer.class, testId))
                .containsExactly(0, 1, 2, 3);
        asAdmin(get("/api/admin/vocabulary").param("topicId", word.get("topic_id").toString())
                        .param("q", word.get("word").toString()).param("size", "50"))
                .andExpect(jsonPath("$.items[?(@.id == " + wordId + ")].questionCount").value(1))
                .andExpect(jsonPath("$.items[?(@.id == " + wordId + ")].openTests[0]").doesNotExist());

        asAdmin(delete("/api/admin/tests/" + testId)).andExpect(jsonPath("$.result").value("DELETED"));

        // A word the bank does not have: refused, and nothing of the test is kept.
        String refusedTitle = "Kiểm tra " + UUID.randomUUID();
        asAdmin(post("/api/admin/tests"), comprehensiveTest(refusedTitle, 999_999_999L))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("vocabularyId")));
        assertThat(jdbcTemplate.queryForObject("select count(*) from tests where title = ?", Integer.class, refusedTitle))
                .isZero();
    }

    @Test
    void aSubmittedTestIsHiddenAndAnUnsubmittedOneGoesWithItsAttempt() throws Exception {
        String token = registerAndLogin();
        ObjectNode body = json.createObjectNode();
        body.put("type", "PERIODIC");
        body.put("title", "Kiểm tra " + UUID.randomUUID());
        body.put("startDate", today.minusDays(1).toString());
        body.put("endDate", today.plusDays(5).toString());
        body.put("status", "VISIBLE");
        body.putArray("questions").add(choice("READING", "She ___ in Hanoi.", "lives", "live"));

        JsonNode submitted = read(asAdmin(post("/api/admin/tests"), body).andExpect(status().isCreated()));
        long submittedId = submitted.get("id").asLong();
        long attemptId = startAttempt(token, submittedId);
        answer(token, attemptId, submitted.get("questions").get(0));
        mockMvc.perform(post("/api/test-attempts/" + attemptId + "/submit").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("GRADED"));

        asAdmin(get("/api/admin/tests"))
                .andExpect(jsonPath("$[?(@.id == " + submittedId + ")].submissions").value(1))
                .andExpect(jsonPath("$[?(@.id == " + submittedId + ")].averageScore").value(100));
        ObjectNode reworded = editorBody(submitted);
        ((ObjectNode) reworded.get("questions").get(0)).put("content", "She ___ in Hue.");
        asAdmin(put("/api/admin/tests/" + submittedId), reworded).andExpect(status().isConflict());
        asAdmin(delete("/api/admin/tests/" + submittedId)).andExpect(jsonPath("$.result").value("HIDDEN"));
        assertThat(jdbcTemplate.queryForObject("select status from tests where id = ?", String.class, submittedId))
                .isEqualTo("HIDDEN");
        mockMvc.perform(get("/api/test-attempts/" + attemptId).header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk());

        // Started and answered, but never handed in: the test is deleted and the attempt with it.
        body.put("title", "Kiểm tra " + UUID.randomUUID());
        JsonNode started = read(asAdmin(post("/api/admin/tests"), body).andExpect(status().isCreated()));
        long startedId = started.get("id").asLong();
        answer(token, startAttempt(token, startedId), started.get("questions").get(0));
        asAdmin(delete("/api/admin/tests/" + startedId)).andExpect(jsonPath("$.result").value("DELETED"));
        assertThat(rows("test_attempts", startedId)).isZero();
        assertThat(rows("test_questions", startedId)).isZero();
    }

    // --- Bodies of the editor ---------------------------------------------------------------------------------------

    /** One question of each skill; the first one is made from the given word of the vocabulary bank. */
    private ObjectNode comprehensiveTest(String title, long vocabularyId) {
        ObjectNode test = json.createObjectNode();
        test.put("type", "COMPREHENSIVE");
        test.put("title", title);
        test.put("skillText", "Nghe, nói, đọc, viết");
        test.put("startDate", today.minusDays(1).toString());
        test.put("endDate", today.plusDays(20).toString());
        ObjectNode recording = json.createObjectNode();
        recording.put("type", "LISTENING");
        recording.put("audioUrl", "/media/r2/media/listening/airport.mp3");
        test.putArray("materials").add(recording);
        ObjectNode reading = choice("READING", "___ officers checked our bags.", "Customs", "Luggage");
        reading.put("vocabularyId", vocabularyId);
        ObjectNode listening = choice("LISTENING", "Which gate?", "Gate 5", "Gate 9");
        listening.put("materialIndex", 0);
        test.putArray("questions")
                .add(reading)
                .add(listening)
                .add(question("SPEAKING", "SPEAKING", "Talk about your home town.", 6))
                .add(question("WRITING", "ESSAY", "Write an email to a friend.", 6));
        return test;
    }

    private ObjectNode question(String skill, String type, String content, int points) {
        ObjectNode question = json.createObjectNode();
        question.put("skill", skill);
        question.put("type", type);
        question.put("points", points);
        question.put("content", content);
        return question;
    }

    /** A one-point choice question whose first option is the right one. */
    private ObjectNode choice(String skill, String content, String... options) {
        ObjectNode question = question(skill, "MULTIPLE_CHOICE", content, 1);
        ArrayNode list = question.putArray("options");
        for (int index = 0; index < options.length; index++) {
            ObjectNode option = json.createObjectNode();
            option.put("text", options[index]);
            option.put("correct", index == 0);
            list.add(option);
        }
        return question;
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

    // --- Requests and what they left in the database ----------------------------------------------------------------

    private ResultActions asAdmin(MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.with(TestAuth.admin()));
    }

    private ResultActions asAdmin(MockHttpServletRequestBuilder request, JsonNode body) throws Exception {
        return mockMvc.perform(request.with(TestAuth.admin())
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(body)));
    }

    private JsonNode read(ResultActions result) throws Exception {
        return json.readTree(result.andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8));
    }

    private long startAttempt(String token, long testId) throws Exception {
        return read(mockMvc.perform(post("/api/tests/" + testId + "/attempts")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isCreated()))
                .get("attemptId").asLong();
    }

    /** Picks the first option of a choice question, the right one. */
    private void answer(String token, long attemptId, JsonNode choice) throws Exception {
        mockMvc.perform(put("/api/test-attempts/" + attemptId + "/answers/" + choice.get("id").asLong())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"optionId\":" + choice.get("options").get(0).get("id").asLong() + "}"))
                .andExpect(status().isNoContent());
    }

    private String registerAndLogin() throws Exception {
        String email = "test-" + UUID.randomUUID() + "@example.com";
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Nguyen Van A\",\"email\":\"" + email + "\",\"password\":\"password123\"}"))
                .andExpect(status().isCreated());
        return read(mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"password123\"}"))
                .andExpect(status().isOk()))
                .get("accessToken").asString();
    }

    private int rows(String table, long testId) {
        return jdbcTemplate.queryForObject("select count(*) from " + table + " where test_id = ?", Integer.class, testId);
    }

    private static long count(JsonNode questions, String field, String value) {
        long count = 0;
        for (int index = 0; index < questions.size(); index++) {
            if (value.equals(questions.get(index).get(field).asString())) {
                count++;
            }
        }
        return count;
    }

    private static long readAloud(JsonNode questions) {
        long count = 0;
        for (int index = 0; index < questions.size(); index++) {
            if (!questions.get(index).get("referenceText").isNull()) {
                count++;
            }
        }
        return count;
    }

    private static long withLevel(JsonNode questions) {
        long count = 0;
        for (int index = 0; index < questions.size(); index++) {
            if (!questions.get(index).get("level").isNull()) {
                count++;
            }
        }
        return count;
    }

    private List<String> texts(JsonNode array) {
        List<String> texts = new ArrayList<>();
        for (int index = 0; index < array.size(); index++) {
            texts.add(array.get(index).asString());
        }
        return texts;
    }
}
