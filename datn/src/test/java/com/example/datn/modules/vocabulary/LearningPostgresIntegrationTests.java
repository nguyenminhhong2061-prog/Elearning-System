package com.example.datn.modules.vocabulary;

import com.example.datn.modules.vocabulary.service.StudyCalendar;
import com.example.datn.support.AbstractPostgresIntegrationTest;
import com.example.datn.support.TestAuth;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.contains;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The flashcard flow against the real schema. H2 cannot show that the lower-case status and review result satisfy the
 * CHECK constraints, that interval_days exists with its constraint, or that PostgreSQL accepts the TIMESTAMPTZ, null
 * and boolean parameters of the summary, history and session queries.
 */
@Transactional
class LearningPostgresIntegrationTests extends AbstractPostgresIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private StudyCalendar calendar;

    @Autowired
    private EntityManager entityManager;

    @Test
    void reviewsAreStoredWithTheValuesOfTheRealSchema() throws Exception {
        long learner = createLearner();
        long topic = topicId("Du lịch");
        List<Long> words = jdbcTemplate.queryForList(
                "select id from vocabulary where topic_id = ? order by id limit 2", Long.class, topic);

        review(learner, words.get(0), "VAGUE").andExpect(status().isOk()).andExpect(jsonPath("$.intervalDays").value(1));
        review(learner, words.get(1), "REMEMBERED").andExpect(status().isOk());
        review(learner, words.get(1), "REMEMBERED").andExpect(status().isOk()).andExpect(jsonPath("$.intervalDays").value(4));
        // The test transaction never commits, so write the pending update before reading the table with plain JDBC.
        entityManager.flush();

        Map<String, Object> row = jdbcTemplate.queryForMap(
                "select * from user_vocabulary where user_id = ? and vocabulary_id = ?", learner, words.get(1));
        assertThat(row.get("status")).isEqualTo("learning");
        assertThat(row.get("last_review_result")).isEqualTo("remembered");
        assertThat(row.get("review_count")).isEqualTo(2);
        assertThat(row.get("interval_days")).isEqualTo(4);
        assertThat(row.get("next_review_at").toString()).isEqualTo(calendar.today().plusDays(4).toString());
        assertThat(row.get("first_learned_at")).isNotNull();

        // Every rating is a review row (V202610021000), written with the lower-case values its CHECK constraint accepts.
        assertThat(jdbcTemplate.queryForList("""
                select r.result from vocabulary_reviews r
                join user_vocabulary uv on uv.id = r.user_vocabulary_id
                where uv.user_id = ? order by r.id
                """, String.class, learner)).containsExactly("vague", "remembered", "remembered");

        // The new column keeps its CHECK constraint.
        assertThatThrownBy(() -> jdbcTemplate.update(
                "update user_vocabulary set interval_days = 0 where user_id = ?", learner))
                .hasMessageContaining("check");
    }

    @Test
    void sessionSummaryAndHistoryRunOnTheRealSchema() throws Exception {
        long learner = createLearner();
        long topic = topicId("Du lịch");
        java.time.Instant since = calendar.now().minusSeconds(1);
        long topicWords = jdbcTemplate.queryForObject("select count(*) from vocabulary where topic_id = ?", Long.class, topic);
        List<Long> words = jdbcTemplate.queryForList(
                "select id from vocabulary where topic_id = ? order by id limit 2", Long.class, topic);
        review(learner, words.get(0), "FORGOT").andExpect(status().isOk());
        review(learner, words.get(1), "REMEMBERED").andExpect(status().isOk());
        // Make the first word due today, as if it had been reviewed yesterday.
        jdbcTemplate.update("update user_vocabulary set next_review_at = ? where user_id = ? and vocabulary_id = ?",
                java.sql.Date.valueOf(calendar.today()), learner, words.get(0));

        mockMvc.perform(get("/api/learning/session").param("topicId", String.valueOf(topic))
                        .with(TestAuth.learner(learner)))
                .andExpect(status().isOk())
                // Every card: the due word and every word not studied yet (the other reviewed word is not due).
                .andExpect(jsonPath("$.cards.length()").value((int) topicWords - 1))
                .andExpect(jsonPath("$.cards[0].id").value(words.get(0)))
                .andExpect(jsonPath("$.cards[0].lastReviewResult").value("FORGOT"))
                .andExpect(jsonPath("$.cards[1].learningStatus").value("NEW"))
                .andExpect(jsonPath("$.cards[1].difficultyLevel").value("A1"));
        mockMvc.perform(get("/api/learning/session").with(TestAuth.learner(learner)))
                .andExpect(jsonPath("$.source.type").value("DUE"))
                .andExpect(jsonPath("$.cards[*].id", contains(words.get(0).intValue())));

        mockMvc.perform(get("/api/learning/summary").with(TestAuth.learner(learner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dueToday").value(1))
                .andExpect(jsonPath("$.learningCount").value(2))
                .andExpect(jsonPath("$.masteredCount").value(0))
                .andExpect(jsonPath("$.reviewedToday").value(2))
                .andExpect(jsonPath("$.upcoming[1].count").value(1));

        mockMvc.perform(get("/api/learning/session-summary").param("since", since.toString()).with(TestAuth.learner(learner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reviewedCount").value(2))
                .andExpect(jsonPath("$.results.FORGOT").value(1))
                .andExpect(jsonPath("$.results.REMEMBERED").value(1))
                // The forgotten word is due today and will still be due tomorrow.
                .andExpect(jsonPath("$.dueTomorrow.count").value(1));

        mockMvc.perform(get("/api/learning/history").with(TestAuth.learner(learner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems").value(2))
                .andExpect(jsonPath("$.items[0].id").value(words.get(1)));
        mockMvc.perform(get("/api/learning/history").param("status", "LEARNING").param("reviewedToday", "true")
                        .with(TestAuth.learner(learner)))
                .andExpect(jsonPath("$.totalItems").value(2));
        mockMvc.perform(get("/api/learning/history").param("status", "MASTERED").with(TestAuth.learner(learner)))
                .andExpect(jsonPath("$.totalItems").value(0));

        // The topic counts of Phase 2 see the reviews.
        mockMvc.perform(get("/api/topics/{id}", topic).with(TestAuth.learner(learner)))
                .andExpect(jsonPath("$.learnedCount").value(2))
                .andExpect(jsonPath("$.dueCount").value(1));
    }

    private ResultActions review(long learner, long vocabularyId, String result) throws Exception {
        return mockMvc.perform(post("/api/learning/reviews")
                .with(TestAuth.learner(learner))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"vocabularyId\": " + vocabularyId + ", \"result\": \"" + result + "\"}"));
    }

    private long createLearner() {
        return jdbcTemplate.queryForObject(
                "insert into users (full_name, email, password_hash) values ('Learner', ?, 'not-a-real-hash') returning id",
                Long.class, "learning-" + UUID.randomUUID() + "@example.com");
    }

    private long topicId(String name) {
        return jdbcTemplate.queryForObject("select id from topics where name = ? order by id limit 1", Long.class, name);
    }
}
