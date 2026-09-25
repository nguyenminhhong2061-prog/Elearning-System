package com.example.datn.modules.vocabulary;

import com.example.datn.modules.vocabulary.service.StudyCalendar;
import com.example.datn.support.TestAuth;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** API of docs/api/vocabulary.md on H2. The same flows run on the real schema in VocabularyPostgresIntegrationTests. */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class VocabularyApiTests {

    private static final long LEARNER = 42;
    private static final long OTHER_LEARNER = 43;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private StudyCalendar calendar;

    // Every API except register/login needs an authenticated user; these helpers write as an admin.
    private ResultActions asAdmin(MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.with(TestAuth.admin()));
    }

    private ResultActions asLearner(long userId, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.with(TestAuth.learner(userId)));
    }

    @Test
    void createsVocabularyInTopicAndFiltersByTopic() throws Exception {
        long topicId = createTopic("Travel");
        createVocabulary(topicId, "airport", "sân bay", "B1");
        createVocabulary(null, "hello", "xin chào", "A1");

        asAdmin(get("/api/vocabulary").param("topicId", String.valueOf(topicId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems").value(1))
                .andExpect(jsonPath("$.items[0].word").value("airport"))
                .andExpect(jsonPath("$.items[0].topicId").value(topicId))
                .andExpect(jsonPath("$.items[0].difficultyLevel").value("B1"))
                .andExpect(jsonPath("$.items[0].createdBy").value(nullValue()))
                .andExpect(jsonPath("$.items[0].learningStatus").value("NEW"));

        asAdmin(get("/api/vocabulary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems").value(2));
    }

    @Test
    void topicsCarryTheWordCountsOfTheCurrentUser() throws Exception {
        long travel = createTopic("Travel");
        long empty = createTopic("Empty");
        long airport = createVocabulary(travel, "airport", "sân bay", "B1");
        long hotel = createVocabulary(travel, "hotel", "khách sạn", "A1");
        long passport = createVocabulary(travel, "passport", "hộ chiếu", "A2");
        LocalDate today = calendar.today();
        progress(LEARNER, airport, "learning", today);                 // learned, due today
        progress(LEARNER, hotel, "mastered", today.plusDays(10));      // learned, not due
        progress(LEARNER, passport, "new", null);                      // seen but not learned
        progress(OTHER_LEARNER, airport, "learning", today.minusDays(1));

        asLearner(LEARNER, get("/api/topics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", contains((int) travel, (int) empty)))
                .andExpect(jsonPath("$[0].name").value("Travel"))
                .andExpect(jsonPath("$[0].wordCount").value(3))
                .andExpect(jsonPath("$[0].learnedCount").value(2))
                .andExpect(jsonPath("$[0].dueCount").value(1))
                .andExpect(jsonPath("$[1].wordCount").value(0))
                .andExpect(jsonPath("$[1].learnedCount").value(0))
                .andExpect(jsonPath("$[1].dueCount").value(0));

        asLearner(LEARNER, get("/api/topics/{id}", travel))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.wordCount").value(3))
                .andExpect(jsonPath("$.learnedCount").value(2))
                .andExpect(jsonPath("$.dueCount").value(1));

        // Another learner's progress is not mixed in.
        asLearner(OTHER_LEARNER + 1, get("/api/topics/{id}", travel))
                .andExpect(jsonPath("$.wordCount").value(3))
                .andExpect(jsonPath("$.learnedCount").value(0))
                .andExpect(jsonPath("$.dueCount").value(0));
    }

    @Test
    void listsWordsEasiestFirstThenAlphabeticallyAcrossPages() throws Exception {
        long topic = createTopic("Mixed");
        createVocabulary(topic, "cat", "con mèo", "C2");
        createVocabulary(topic, "Zebra", "ngựa vằn", "A1");
        createVocabulary(topic, "Dog", "con chó", "B1");
        createVocabulary(topic, "banana", "quả chuối", "A2");
        createVocabulary(topic, "apple", "quả táo", "A1");

        String topicId = String.valueOf(topic);
        asLearner(LEARNER, get("/api/vocabulary").param("topicId", topicId).param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[*].word", contains("apple", "Zebra")))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(2))
                .andExpect(jsonPath("$.totalItems").value(5))
                .andExpect(jsonPath("$.totalPages").value(3));
        asLearner(LEARNER, get("/api/vocabulary").param("topicId", topicId).param("size", "2").param("page", "1"))
                .andExpect(jsonPath("$.items[*].word", contains("banana", "Dog")))
                .andExpect(jsonPath("$.page").value(1));
        asLearner(LEARNER, get("/api/vocabulary").param("topicId", topicId).param("size", "2").param("page", "2"))
                .andExpect(jsonPath("$.items[*].word", contains("cat")));
    }

    @Test
    void searchesWordAndMeaningIgnoringCaseAndFiltersByLevel() throws Exception {
        long topic = createTopic("Travel");
        createVocabulary(topic, "airport", "sân bay", "B1");
        createVocabulary(topic, "Airline", "hãng hàng không", "B2");
        createVocabulary(topic, "ticket", "vé", "A1");
        createVocabulary(null, "discount", "giảm giá 50% off", "B1");

        asLearner(LEARNER, get("/api/vocabulary").param("q", "  AIR "))
                .andExpect(jsonPath("$.items[*].word", contains("airport", "Airline")));
        asLearner(LEARNER, get("/api/vocabulary").param("q", "BAY"))
                .andExpect(jsonPath("$.items[*].word", contains("airport")));
        asLearner(LEARNER, get("/api/vocabulary").param("q", "air").param("level", "B2"))
                .andExpect(jsonPath("$.items[*].word", contains("Airline")));
        asLearner(LEARNER, get("/api/vocabulary").param("q", "   "))
                .andExpect(jsonPath("$.totalItems").value(4));

        // '%' and '_' are matched literally, not as LIKE wildcards.
        asLearner(LEARNER, get("/api/vocabulary").param("q", "50%"))
                .andExpect(jsonPath("$.items[*].word", contains("discount")));
        asLearner(LEARNER, get("/api/vocabulary").param("q", "%"))
                .andExpect(jsonPath("$.items[*].word", contains("discount")));
        asLearner(LEARNER, get("/api/vocabulary").param("q", "_"))
                .andExpect(jsonPath("$.totalItems").value(0));
    }

    @Test
    void learningStatusBelongsToTheCurrentUser() throws Exception {
        long topic = createTopic("Travel");
        long airport = createVocabulary(topic, "airport", "sân bay", "B1");
        long hotel = createVocabulary(topic, "hotel", "khách sạn", "A1");
        createVocabulary(topic, "passport", "hộ chiếu", "A2");
        progress(LEARNER, airport, "learning", calendar.today());
        progress(LEARNER, hotel, "mastered", calendar.today().plusDays(30));

        asLearner(LEARNER, get("/api/vocabulary").param("topicId", String.valueOf(topic)))
                .andExpect(jsonPath("$.items[*].word", contains("hotel", "passport", "airport")))
                .andExpect(jsonPath("$.items[*].learningStatus", contains("MASTERED", "NEW", "LEARNING")));
        asLearner(OTHER_LEARNER, get("/api/vocabulary").param("topicId", String.valueOf(topic)))
                .andExpect(jsonPath("$.items[*].learningStatus", contains("NEW", "NEW", "NEW")));

        asLearner(LEARNER, get("/api/vocabulary/{id}", airport))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.learningStatus").value("LEARNING"));
    }

    @Test
    void rejectsInvalidListParametersWithTheCommonErrorBody() throws Exception {
        asLearner(LEARNER, get("/api/vocabulary").param("level", "Z9"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").exists());
        asLearner(LEARNER, get("/api/vocabulary").param("page", "-1")).andExpect(status().isBadRequest());
        asLearner(LEARNER, get("/api/vocabulary").param("page", "abc")).andExpect(status().isBadRequest());
        asLearner(LEARNER, get("/api/vocabulary").param("size", "0")).andExpect(status().isBadRequest());
        asLearner(LEARNER, get("/api/vocabulary").param("size", "101"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
        asLearner(LEARNER, get("/api/vocabulary").param("size", "100")).andExpect(status().isOk());
    }

    @Test
    void learnersCanReadButOnlyAdminsCanWrite() throws Exception {
        long topic = createTopic("Travel");
        long word = createVocabulary(topic, "airport", "sân bay", "B1");

        asLearner(LEARNER, get("/api/topics")).andExpect(status().isOk());
        asLearner(LEARNER, get("/api/vocabulary")).andExpect(status().isOk());

        asLearner(LEARNER, post("/api/topics")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"Hacked\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
        asLearner(LEARNER, put("/api/topics/{id}", topic)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"Hacked\"}"))
                .andExpect(status().isForbidden());
        asLearner(LEARNER, delete("/api/topics/{id}", topic)).andExpect(status().isForbidden());
        asLearner(LEARNER, post("/api/vocabulary")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(vocabularyJson(topic, "hacked", "nghĩa", "A1")))
                .andExpect(status().isForbidden());
        asLearner(LEARNER, put("/api/vocabulary/{id}", word)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(vocabularyJson(topic, "hacked", "nghĩa", "A1")))
                .andExpect(status().isForbidden());
        asLearner(LEARNER, delete("/api/vocabulary/{id}", word)).andExpect(status().isForbidden());

        // Nothing was changed by the refused requests.
        asLearner(LEARNER, get("/api/vocabulary/{id}", word)).andExpect(jsonPath("$.word").value("airport"));
        asLearner(LEARNER, get("/api/topics/{id}", topic)).andExpect(jsonPath("$.name").value("Travel"));
    }

    @Test
    void rejectsVocabularyWithUnknownTopic() throws Exception {
        asAdmin(post("/api/vocabulary")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(vocabularyJson(999_999L, "airport", "sân bay", "B1")))
                .andExpect(status().isNotFound());
    }

    @Test
    void rejectsVocabularyWithBlankWordOrMissingLevel() throws Exception {
        asAdmin(post("/api/vocabulary")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"word": " ", "meaning": "sân bay", "difficultyLevel": "B1"}
                                """))
                .andExpect(status().isBadRequest());

        asAdmin(post("/api/vocabulary")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"word": "airport", "meaning": "sân bay"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updatesAndDeletesVocabulary() throws Exception {
        long id = createVocabulary(null, "airport", "sân bay", "B1");

        asAdmin(put("/api/vocabulary/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(vocabularyJson(null, "airplane", "máy bay", "A2")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.word").value("airplane"))
                .andExpect(jsonPath("$.difficultyLevel").value("A2"))
                .andExpect(jsonPath("$.learningStatus").value("NEW"));

        asAdmin(delete("/api/vocabulary/{id}", id))
                .andExpect(status().isNoContent());

        asAdmin(get("/api/vocabulary/{id}", id))
                .andExpect(status().isNotFound());
    }

    @Test
    void managesTopics() throws Exception {
        long id = createTopic("Business");

        asAdmin(put("/api/topics/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name": "Business English", "description": "Office vocabulary"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Business English"))
                .andExpect(jsonPath("$.wordCount").value(0));

        asAdmin(delete("/api/topics/{id}", id))
                .andExpect(status().isNoContent());

        asAdmin(get("/api/topics/{id}", id))
                .andExpect(status().isNotFound());
    }

    private long createTopic(String name) throws Exception {
        String body = asAdmin(post("/api/topics")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"" + name + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.wordCount").value(0))
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(body, "$.id")).longValue();
    }

    private long createVocabulary(Long topicId, String word, String meaning, String level) throws Exception {
        String body = asAdmin(post("/api/vocabulary")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(vocabularyJson(topicId, word, meaning, level)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(body, "$.id")).longValue();
    }

    /** A user_vocabulary row; words already studied count one review. */
    private void progress(long userId, long vocabularyId, String status, LocalDate nextReviewAt) {
        jdbcTemplate.update("""
                insert into user_vocabulary (user_id, vocabulary_id, status, review_count, next_review_at)
                values (?, ?, ?, ?, ?)
                """, userId, vocabularyId, status, "new".equals(status) ? 0 : 1, nextReviewAt);
    }

    private String vocabularyJson(Long topicId, String word, String meaning, String level) {
        String topic = topicId == null ? "null" : String.valueOf(topicId);
        return "{\"topicId\": " + topic + ", \"word\": \"" + word + "\", \"meaning\": \"" + meaning + "\", "
                + "\"difficultyLevel\": \"" + level + "\"}";
    }
}
