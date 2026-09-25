package com.example.datn.modules.vocabulary;

import com.example.datn.common.event.WordReviewedEvent;
import com.example.datn.modules.vocabulary.service.StudyCalendar;
import com.example.datn.support.TestAuth;
import com.jayway.jsonpath.JsonPath;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.event.ApplicationEvents;
import org.springframework.test.context.event.RecordApplicationEvents;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** API of docs/api/learning.md on H2. VocabularyPostgresIntegrationTests runs the review flow on the real schema. */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@RecordApplicationEvents
class LearningApiTests {

    private static final long LEARNER = 42;
    private static final long OTHER_LEARNER = 43;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private StudyCalendar calendar;

    @Autowired
    private ApplicationEvents events;

    @Autowired
    private EntityManager entityManager;

    @Test
    void topicSessionGivesDueWordsFirstThenNewWordsEasiestFirst() throws Exception {
        LocalDate today = calendar.today();
        long topic = createTopic("Mixed");
        createWord(topic, "zebra", "A1");
        createWord(topic, "apple", "A1");
        createWord(topic, "banana", "A2");
        long cat = createWord(topic, "cat", "B1");
        long dog = createWord(topic, "dog", "B2");
        long goat = createWord(topic, "goat", "A1");
        long egg = createWord(topic, "egg", "C1");
        long fox = createWord(topic, "fox", "A2");
        progress(LEARNER, cat, "learning", "remembered", 3, today.minusDays(3), hoursAgo(80));
        progress(LEARNER, dog, "learning", "vague", 3, today, hoursAgo(72));
        progress(LEARNER, goat, "learning", "remembered", 1, today.minusDays(1), hoursAgo(48));
        progress(LEARNER, egg, "learning", "remembered", 7, today.plusDays(2), hoursAgo(120));   // learned, not due
        progress(LEARNER, fox, "mastered", "remembered", 30, today.plusDays(9), hoursAgo(500)); // learned, not due

        asLearner(get("/api/learning/session").param("topicId", String.valueOf(topic)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source.type").value("TOPIC"))
                .andExpect(jsonPath("$.source.id").value(topic))
                .andExpect(jsonPath("$.source.name").value("Mixed"))
                // Due: VAGUE first, then the longest overdue. New: easiest first, then alphabetically.
                .andExpect(jsonPath("$.cards[*].word", contains("dog", "cat", "goat", "apple", "zebra", "banana")))
                .andExpect(jsonPath("$.cards[0].learningStatus").value("LEARNING"))
                .andExpect(jsonPath("$.cards[0].lastReviewResult").value("VAGUE"))
                .andExpect(jsonPath("$.cards[0].reviewCount").value(1))
                .andExpect(jsonPath("$.cards[0].nextReviewAt").value(today.toString()))
                .andExpect(jsonPath("$.cards[0].lastReviewedAt").isNotEmpty())
                .andExpect(jsonPath("$.cards[3].learningStatus").value("NEW"))
                .andExpect(jsonPath("$.cards[3].lastReviewResult").value(nullValue()))
                .andExpect(jsonPath("$.cards[3].reviewCount").value(0))
                .andExpect(jsonPath("$.cards[3].nextReviewAt").value(nullValue()));

        asLearner(get("/api/learning/session").param("topicId", String.valueOf(topic)).param("size", "4"))
                .andExpect(jsonPath("$.cards[*].word", contains("dog", "cat", "goat", "apple")));

        // Another learner has not studied anything yet: every word is new.
        mockMvc.perform(get("/api/learning/session").param("topicId", String.valueOf(topic))
                        .with(TestAuth.learner(OTHER_LEARNER)))
                .andExpect(jsonPath("$.cards.length()").value(8))
                .andExpect(jsonPath("$.cards[0].word").value("apple"));
    }

    @Test
    void reviewSessionGivesOnlyTheDueWordsOfEveryTopic() throws Exception {
        LocalDate today = calendar.today();
        long travel = createTopic("Travel");
        long work = createTopic("Work");
        long airport = createWord(travel, "airport", "B1");
        createWord(travel, "hotel", "A1");
        long salary = createWord(work, "salary", "A2");
        long invoice = createWord(work, "invoice", "B2");
        progress(LEARNER, airport, "learning", "remembered", 1, today, hoursAgo(24));
        progress(LEARNER, salary, "learning", "forgot", 1, today.minusDays(5), hoursAgo(144));
        progress(LEARNER, invoice, "mastered", "remembered", 30, today.plusDays(20), hoursAgo(240));

        asLearner(get("/api/learning/session"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source.type").value("DUE"))
                .andExpect(jsonPath("$.source.id").value(nullValue()))
                .andExpect(jsonPath("$.source.name").value(nullValue()))
                .andExpect(jsonPath("$.cards[*].word", contains("salary", "airport")));

        mockMvc.perform(get("/api/learning/session").with(TestAuth.learner(OTHER_LEARNER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cards.length()").value(0));
    }

    @Test
    void sessionRejectsInvalidParameters() throws Exception {
        long topic = createTopic("Travel");

        asLearner(get("/api/learning/session").param("topicId", String.valueOf(topic)).param("listId", "1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
        asLearner(get("/api/learning/session").param("size", "0")).andExpect(status().isBadRequest());
        asLearner(get("/api/learning/session").param("size", "51")).andExpect(status().isBadRequest());
        asLearner(get("/api/learning/session").param("size", "50")).andExpect(status().isOk());
        asLearner(get("/api/learning/session").param("topicId", "999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
        // Personal lists arrive with Phase 4: until then, no list exists.
        asLearner(get("/api/learning/session").param("listId", "1")).andExpect(status().isNotFound());
    }

    @Test
    void reviewsMoveAWordThroughTheStepsUntilItIsMastered() throws Exception {
        LocalDate today = calendar.today();
        long topic = createTopic("Travel");
        long word = createWord(topic, "airport", "B1");

        review(word, "REMEMBERED")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.vocabularyId").value(word))
                .andExpect(jsonPath("$.learningStatus").value("LEARNING"))
                .andExpect(jsonPath("$.lastReviewResult").value("REMEMBERED"))
                .andExpect(jsonPath("$.reviewCount").value(1))
                .andExpect(jsonPath("$.intervalDays").value(3))
                .andExpect(jsonPath("$.nextReviewAt").value(today.plusDays(3).toString()));
        Map<String, Object> first = row(LEARNER, word);
        assertThat(first.get("status")).isEqualTo("learning");
        assertThat(first.get("last_review_result")).isEqualTo("remembered");
        assertThat(first.get("first_learned_at")).isNotNull().isEqualTo(first.get("last_reviewed_at"));

        review(word, "VAGUE").andExpect(jsonPath("$.intervalDays").value(3)).andExpect(jsonPath("$.reviewCount").value(2));
        review(word, "FORGOT").andExpect(jsonPath("$.intervalDays").value(1))
                .andExpect(jsonPath("$.nextReviewAt").value(today.plusDays(1).toString()));
        review(word, "REMEMBERED").andExpect(jsonPath("$.intervalDays").value(3));
        review(word, "REMEMBERED").andExpect(jsonPath("$.intervalDays").value(7));
        review(word, "REMEMBERED").andExpect(jsonPath("$.intervalDays").value(14));
        review(word, "REMEMBERED")
                .andExpect(jsonPath("$.intervalDays").value(30))
                .andExpect(jsonPath("$.learningStatus").value("MASTERED"))
                .andExpect(jsonPath("$.reviewCount").value(7));

        // The first review date is kept; the topic now counts the word as learned.
        assertThat(row(LEARNER, word).get("first_learned_at")).isEqualTo(first.get("first_learned_at"));
        asLearner(get("/api/topics/{id}", topic)).andExpect(jsonPath("$.learnedCount").value(1));
        asLearner(get("/api/vocabulary/{id}", word)).andExpect(jsonPath("$.learningStatus").value("MASTERED"));
    }

    @Test
    void eachReviewPublishesAWordReviewedEvent() throws Exception {
        long word = createWord(createTopic("Travel"), "airport", "B1");

        review(word, "VAGUE").andExpect(status().isOk());
        review(word, "REMEMBERED").andExpect(status().isOk());

        List<WordReviewedEvent> published = events.stream(WordReviewedEvent.class).toList();
        assertThat(published).hasSize(2);
        assertThat(published.get(0).userId()).isEqualTo(LEARNER);
        assertThat(published.get(0).vocabularyId()).isEqualTo(word);
        assertThat(published.get(0).result()).isEqualTo("VAGUE");
        assertThat(published.get(0).learningStatus()).isEqualTo("LEARNING");
        assertThat(published.get(0).firstReview()).isTrue();
        assertThat(published.get(0).studyDate()).isEqualTo(calendar.today());
        assertThat(published.get(1).firstReview()).isFalse();
    }

    @Test
    void reviewRejectsInvalidInputAndWordsTheLearnerCannotSee() throws Exception {
        long topic = createTopic("Travel");
        long word = createWord(topic, "airport", "B1");
        long othersWord = createWord(null, "my-word", "A1");
        long ownWord = createWord(null, "own-word", "A1");
        jdbcTemplate.update("update vocabulary set created_by = ? where id = ?", OTHER_LEARNER, othersWord);
        jdbcTemplate.update("update vocabulary set created_by = ? where id = ?", LEARNER, ownWord);
        entityManager.clear(); // the words created above are still cached with created_by NULL

        review(word, "MAYBE").andExpect(status().isBadRequest()).andExpect(jsonPath("$.status").value(400));
        asLearner(post("/api/learning/reviews").contentType(MediaType.APPLICATION_JSON).content("{\"result\": \"VAGUE\"}"))
                .andExpect(status().isBadRequest());
        asLearner(post("/api/learning/reviews").contentType(MediaType.APPLICATION_JSON).content("not json"))
                .andExpect(status().isBadRequest());
        review(999_999L, "VAGUE").andExpect(status().isNotFound());
        // A word typed in by another learner is private to them.
        review(othersWord, "VAGUE").andExpect(status().isNotFound());
        review(ownWord, "VAGUE").andExpect(status().isOk());

        assertThat(jdbcTemplate.queryForObject(
                "select count(*) from user_vocabulary where user_id = ?", Integer.class, LEARNER)).isEqualTo(1);
    }

    @Test
    void summaryCountsTheLearnersWordsWithTodayInVietnamTime() throws Exception {
        LocalDate today = calendar.today();
        Instant startOfToday = calendar.startOf(today);
        long topic = createTopic("Travel");
        long[] words = new long[6];
        for (int i = 0; i < words.length; i++) {
            words[i] = createWord(topic, "word" + i, "A1");
        }
        // Reviewed a minute after midnight in Vietnam: today. A minute before: yesterday, although both are
        // the same UTC date (17:01 and 16:59 UTC).
        progress(LEARNER, words[0], "learning", "vague", 1, today, startOfToday.plusSeconds(60));
        progress(LEARNER, words[1], "mastered", "remembered", 30, today.plusDays(3), startOfToday.minusSeconds(60));
        progress(LEARNER, words[2], "learning", "remembered", 3, today.plusDays(1), hoursAgo(72));
        progress(LEARNER, words[3], "learning", "remembered", 7, today.plusDays(7), hoursAgo(200));
        progress(LEARNER, words[4], "learning", "remembered", 14, today.plusDays(8), hoursAgo(400));
        progress(OTHER_LEARNER, words[5], "learning", "forgot", 1, today, startOfToday.plusSeconds(60));

        String body = asLearner(get("/api/learning/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dueToday").value(1))
                .andExpect(jsonPath("$.learningCount").value(4))
                .andExpect(jsonPath("$.masteredCount").value(1))
                .andExpect(jsonPath("$.reviewedToday").value(1))
                .andExpect(jsonPath("$.upcoming.length()").value(7))
                .andExpect(jsonPath("$.upcoming[0].date").value(today.plusDays(1).toString()))
                .andExpect(jsonPath("$.upcoming[6].date").value(today.plusDays(7).toString()))
                .andReturn().getResponse().getContentAsString();
        List<Integer> upcoming = JsonPath.read(body, "$.upcoming[*].count");
        assertThat(upcoming).containsExactly(1, 0, 1, 0, 0, 0, 1);

        // A learner with no progress gets zeros, not nulls.
        mockMvc.perform(get("/api/learning/summary").with(TestAuth.learner(99)))
                .andExpect(jsonPath("$.dueToday").value(0))
                .andExpect(jsonPath("$.learningCount").value(0))
                .andExpect(jsonPath("$.upcoming[*].count", contains(0, 0, 0, 0, 0, 0, 0)));
    }

    @Test
    void historyListsReviewedWordsLatestFirstAndItsFiltersMatchTheSummary() throws Exception {
        LocalDate today = calendar.today();
        Instant startOfToday = calendar.startOf(today);
        long topic = createTopic("Travel");
        long oldest = createWord(topic, "oldest", "A1");
        long yesterday = createWord(topic, "yesterday", "A1");
        long todayEarly = createWord(topic, "today-early", "A1");
        long todayLate = createWord(topic, "today-late", "A1");
        createWord(topic, "never", "A1");
        progress(LEARNER, oldest, "learning", "remembered", 3, today.plusDays(1), hoursAgo(300));
        progress(LEARNER, yesterday, "mastered", "remembered", 30, today.plusDays(29), startOfToday.minusSeconds(60));
        progress(LEARNER, todayEarly, "learning", "forgot", 1, today.plusDays(1), startOfToday.plusSeconds(60));
        progress(LEARNER, todayLate, "mastered", "remembered", 30, today.plusDays(30), startOfToday.plusSeconds(120));

        asLearner(get("/api/learning/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[*].word", contains("today-late", "today-early", "yesterday", "oldest")))
                .andExpect(jsonPath("$.totalItems").value(4))
                .andExpect(jsonPath("$.items[0].learningStatus").value("MASTERED"))
                .andExpect(jsonPath("$.items[0].lastReviewedAt").isNotEmpty());
        asLearner(get("/api/learning/history").param("size", "3").param("page", "1"))
                .andExpect(jsonPath("$.items[*].word", contains("oldest")))
                .andExpect(jsonPath("$.totalPages").value(2));

        asLearner(get("/api/learning/history").param("status", "LEARNING"))
                .andExpect(jsonPath("$.items[*].word", contains("today-early", "oldest")));
        asLearner(get("/api/learning/history").param("status", "MASTERED"))
                .andExpect(jsonPath("$.items[*].word", contains("today-late", "yesterday")));
        asLearner(get("/api/learning/history").param("reviewedToday", "true"))
                .andExpect(jsonPath("$.items[*].word", contains("today-late", "today-early")));
        asLearner(get("/api/learning/history").param("reviewedToday", "true").param("status", "MASTERED"))
                .andExpect(jsonPath("$.items[*].word", contains("today-late")));
        asLearner(get("/api/learning/history").param("reviewedToday", "false"))
                .andExpect(jsonPath("$.totalItems").value(4));

        // The screen shows these totals next to the summary numbers, so they must agree.
        asLearner(get("/api/learning/summary"))
                .andExpect(jsonPath("$.learningCount").value(2))
                .andExpect(jsonPath("$.masteredCount").value(2))
                .andExpect(jsonPath("$.reviewedToday").value(2));
    }

    @Test
    void historyRejectsUnknownFilterValues() throws Exception {
        asLearner(get("/api/learning/history").param("status", "NEW"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
        asLearner(get("/api/learning/history").param("reviewedToday", "yes")).andExpect(status().isBadRequest());
        asLearner(get("/api/learning/history").param("size", "101")).andExpect(status().isBadRequest());
    }

    @Test
    void learningEndpointsNeedAnAuthenticatedUser() throws Exception {
        mockMvc.perform(get("/api/learning/summary")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/learning/session")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/learning/reviews").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"vocabularyId\": 1, \"result\": \"VAGUE\"}"))
                .andExpect(status().isUnauthorized());
    }

    private ResultActions asLearner(MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.with(TestAuth.learner(LEARNER)));
    }

    private ResultActions review(long vocabularyId, String result) throws Exception {
        return asLearner(post("/api/learning/reviews")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"vocabularyId\": " + vocabularyId + ", \"result\": \"" + result + "\"}"));
    }

    private long createTopic(String name) throws Exception {
        String body = mockMvc.perform(post("/api/topics")
                        .with(TestAuth.admin())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"" + name + "\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(body, "$.id")).longValue();
    }

    private long createWord(Long topicId, String word, String level) throws Exception {
        String topic = topicId == null ? "null" : String.valueOf(topicId);
        String body = mockMvc.perform(post("/api/vocabulary")
                        .with(TestAuth.admin())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"topicId\": " + topic + ", \"word\": \"" + word + "\", \"meaning\": \"nghĩa\", "
                                + "\"difficultyLevel\": \"" + level + "\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(body, "$.id")).longValue();
    }

    /** A user_vocabulary row as a review would have left it, with the lower-case values of the real schema. */
    private void progress(
            long userId,
            long vocabularyId,
            String status,
            String lastResult,
            int intervalDays,
            LocalDate nextReviewAt,
            Instant lastReviewedAt) {
        jdbcTemplate.update("""
                insert into user_vocabulary (user_id, vocabulary_id, status, last_review_result, review_count,
                                             interval_days, next_review_at, last_reviewed_at, first_learned_at)
                values (?, ?, ?, ?, 1, ?, ?, ?, ?)
                """, userId, vocabularyId, status, lastResult, intervalDays, nextReviewAt,
                Timestamp.from(lastReviewedAt), Timestamp.from(lastReviewedAt));
    }

    private Map<String, Object> row(long userId, long vocabularyId) {
        // The test transaction never commits: write pending updates before reading the table with plain JDBC.
        entityManager.flush();
        return jdbcTemplate.queryForMap(
                "select * from user_vocabulary where user_id = ? and vocabulary_id = ?", userId, vocabularyId);
    }

    private Instant hoursAgo(long hours) {
        return calendar.now().minus(Duration.ofHours(hours));
    }
}
