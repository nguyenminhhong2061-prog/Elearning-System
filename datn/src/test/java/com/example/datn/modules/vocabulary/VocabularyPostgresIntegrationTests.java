package com.example.datn.modules.vocabulary;

import com.example.datn.modules.vocabulary.service.StudyCalendar;
import com.example.datn.support.AbstractPostgresIntegrationTest;
import com.example.datn.support.TestAuth;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The vocabulary API against the real schema and seed migration. H2 cannot show that the lower-case user_vocabulary
 * status is read back through the converter, that the CHECK constraints accept it, or that PostgreSQL accepts the
 * optional (null) filters of the search query.
 */
@Transactional
class VocabularyPostgresIntegrationTests extends AbstractPostgresIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private StudyCalendar calendar;

    @Test
    void seedTopicsCarryTheCountsOfTheCurrentLearner() throws Exception {
        long learner = createLearner();
        long business = topicId("Kinh doanh");
        List<Long> words = jdbcTemplate.queryForList(
                "select id from vocabulary where topic_id = ? order by id limit 3", Long.class, business);
        LocalDate today = calendar.today();
        progress(learner, words.get(0), "learning", today.minusDays(2));
        progress(learner, words.get(1), "mastered", today.plusDays(14));
        progress(learner, words.get(2), "new", null);

        String topics = mockMvc.perform(get("/api/topics").with(TestAuth.learner(learner)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertThat(JsonPath.<List<String>>read(topics, "$[*].name"))
                .containsSubsequence("Kinh doanh", "Du lịch", "Y tế", "Công nghệ", "Giáo dục", "Thể thao");
        String path = "$[?(@.id == " + business + ")]";
        assertThat(JsonPath.<List<Integer>>read(topics, path + ".wordCount")).containsExactly(26);
        assertThat(JsonPath.<List<Integer>>read(topics, path + ".learnedCount")).containsExactly(2);
        assertThat(JsonPath.<List<Integer>>read(topics, path + ".dueCount")).containsExactly(1);

        mockMvc.perform(get("/api/vocabulary/{id}", words.get(1)).with(TestAuth.learner(learner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.learningStatus").value("MASTERED"));
    }

    @Test
    void searchRunsWithAndWithoutEachOptionalFilter() throws Exception {
        long learner = createLearner();
        long business = topicId("Kinh doanh");

        // No filter at all: every parameter of the query is bound as null.
        mockMvc.perform(get("/api/vocabulary").with(TestAuth.learner(learner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].difficultyLevel").value("A1"))
                .andExpect(jsonPath("$.size").value(20));

        String firstPage = mockMvc.perform(get("/api/vocabulary")
                        .param("topicId", String.valueOf(business))
                        .param("size", "20")
                        .with(TestAuth.learner(learner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems").value(26))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.items[0].difficultyLevel").value("A2"))
                .andReturn().getResponse().getContentAsString();
        String secondPage = mockMvc.perform(get("/api/vocabulary")
                        .param("topicId", String.valueOf(business))
                        .param("size", "20")
                        .param("page", "1")
                        .with(TestAuth.learner(learner)))
                .andExpect(jsonPath("$.items.length()").value(6))
                .andReturn().getResponse().getContentAsString();
        List<String> levels = JsonPath.read(firstPage, "$.items[*].difficultyLevel");
        levels.addAll(JsonPath.read(secondPage, "$.items[*].difficultyLevel"));
        assertThat(levels).isSorted().endsWith("C1");

        // Vietnamese meanings match regardless of case.
        mockMvc.perform(get("/api/vocabulary").param("q", "DOANH THU").with(TestAuth.learner(learner)))
                .andExpect(jsonPath("$.items[*].word", contains("revenue")));
        mockMvc.perform(get("/api/vocabulary").param("level", "C1").param("q", "merg").with(TestAuth.learner(learner)))
                .andExpect(jsonPath("$.items[*].word", contains("merger")));
    }

    private long createLearner() {
        return jdbcTemplate.queryForObject(
                "insert into users (full_name, email, password_hash) values ('Learner', ?, 'not-a-real-hash') returning id",
                Long.class, "vocab-" + UUID.randomUUID() + "@example.com");
    }

    private long topicId(String name) {
        return jdbcTemplate.queryForObject("select id from topics where name = ? order by id limit 1", Long.class, name);
    }

    private void progress(long userId, long vocabularyId, String status, LocalDate nextReviewAt) {
        jdbcTemplate.update(
                "insert into user_vocabulary (user_id, vocabulary_id, status, next_review_at) values (?, ?, ?, ?)",
                userId, vocabularyId, status, nextReviewAt);
    }
}
