package com.example.datn.modules.vocabulary;

import com.example.datn.modules.vocabulary.service.StudyCalendar;
import com.example.datn.support.AbstractPostgresIntegrationTest;
import com.example.datn.support.TestAuth;
import com.jayway.jsonpath.JsonPath;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.contains;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The admin vocabulary rules against the real schema, migration V202610041000 and the seed. H2 cannot show that the
 * lower-case status passes the CHECK constraint, that the unique indexes stop duplicates the service checks cannot see
 * (two admins saving at once), or that PostgreSQL types the optional (null) filters of the admin search.
 */
@Transactional
class AdminVocabularyPostgresIntegrationTests extends AbstractPostgresIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private StudyCalendar calendar;

    @Test
    void adminPagesReadTheSeedWithEachOptionalFilter() throws Exception {
        long business = topicId("Kinh doanh");
        String topics = asAdmin(get("/api/admin/topics"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String path = "$[?(@.id == " + business + ")]";
        String visibleInTopic = "from vocabulary where topic_id = " + business + " and created_by is null and status = 'visible'";
        assertThat(JsonPath.<List<Integer>>read(topics, path + ".wordCount"))
                .containsExactly(count("select count(*) " + visibleInTopic));
        assertThat(JsonPath.<List<Integer>>read(topics, path + ".missingExampleCount"))
                .containsExactly(count("select count(*) " + visibleInTopic + " and coalesce(example_sentence, '') = ''"));
        assertThat(JsonPath.<List<Integer>>read(topics, path + ".missingAudioCount"))
                .containsExactly(count("select count(*) " + visibleInTopic + " and coalesce(audio_url, '') = ''"));
        assertThat(JsonPath.<List<String>>read(topics, path + ".minLevel")).containsExactly("A2");
        assertThat(JsonPath.<List<String>>read(topics, path + ".maxLevel")).containsExactly("C1");

        // No filter at all (every parameter bound as null), then each filter on its own.
        String visible = "from vocabulary where created_by is null and status = 'visible'";
        asAdmin(get("/api/admin/vocabulary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems").value(count("select count(*) " + visible)));
        asAdmin(get("/api/admin/vocabulary").param("missing", "AUDIO"))
                .andExpect(jsonPath("$.totalItems").value(count("select count(*) " + visible + " and coalesce(audio_url, '') = ''")));
        asAdmin(get("/api/admin/vocabulary").param("missing", "EXAMPLE"))
                .andExpect(jsonPath("$.totalItems").value(count("select count(*) " + visible + " and coalesce(example_sentence, '') = ''")));
        asAdmin(get("/api/admin/vocabulary").param("missing", "IMAGE"))
                .andExpect(jsonPath("$.totalItems").value(count("select count(*) " + visible + " and coalesce(image_url, '') = ''")));
        asAdmin(get("/api/admin/vocabulary")
                        .param("topicId", String.valueOf(business))
                        .param("level", "C1")
                        .param("q", "MERG"))
                .andExpect(jsonPath("$.items[*].word", contains("merger")))
                .andExpect(jsonPath("$.items[0].learnerCount").value(0))
                .andExpect(jsonPath("$.items[0].questionCount").value(0));
    }

    @Test
    void hidingASeededWordStoresTheLowerCaseStatusAndLearnersStopMeetingIt() throws Exception {
        long learner = createLearner();
        long business = topicId("Kinh doanh");
        long word = jdbcTemplate.queryForObject(
                "select id from vocabulary where topic_id = ? order by id limit 1", Long.class, business);
        int words = count("select count(*) from vocabulary where topic_id = " + business + " and created_by is null");
        Timestamp yesterday = Timestamp.from(Instant.now().minusSeconds(86_400));
        jdbcTemplate.update("""
                insert into user_vocabulary (user_id, vocabulary_id, status, review_count, interval_days,
                                             next_review_at, last_reviewed_at, first_learned_at)
                values (?, ?, 'learning', 1, 1, ?, ?, ?)
                """, learner, word, calendar.today(), yesterday, yesterday);

        asAdmin(delete("/api/vocabulary/{id}", word))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result").value("HIDDEN"));
        entityManager.flush();

        assertThat(jdbcTemplate.queryForObject("select status from vocabulary where id = ?", String.class, word))
                .isEqualTo("hidden");
        assertThat(jdbcTemplate.queryForObject("select updated_at is not null from vocabulary where id = ?", Boolean.class, word))
                .isTrue();
        mockMvc.perform(get("/api/topics/{id}", business).with(TestAuth.learner(learner)))
                .andExpect(jsonPath("$.wordCount").value(words - 1))
                .andExpect(jsonPath("$.dueCount").value(0));
        mockMvc.perform(get("/api/learning/summary").with(TestAuth.learner(learner)))
                .andExpect(jsonPath("$.dueToday").value(0))
                .andExpect(jsonPath("$.learningCount").value(1));
        asAdmin(get("/api/admin/vocabulary").param("topicId", String.valueOf(business)))
                .andExpect(jsonPath("$.totalItems").value(words - 1));
    }

    @Test
    void aQuestionFromASeededWordBlanksItInItsExample() throws Exception {
        long customs = jdbcTemplate.queryForObject(
                "select id from vocabulary where word = 'customs' and created_by is null", Long.class);

        asAdmin(get("/api/admin/vocabulary/{id}/test-question", customs))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("It took an hour to get through ___."))
                .andExpect(jsonPath("$.options.length()").value(4))
                .andExpect(jsonPath("$.options[?(@.correct == true)].text", contains("customs")));
    }

    @Test
    void theTopicNameIndexStopsADuplicateTheServiceCouldNotSee() {
        // As if a second admin saved the same name in the same instant: the service check saw no clash.
        assertThatThrownBy(() -> jdbcTemplate.update("insert into topics (name) values (' KINH DOANH ')"))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void theWordIndexStopsAVisibleDuplicateButLetsHiddenCopiesBe() {
        long topic = jdbcTemplate.queryForObject(
                "select topic_id from vocabulary where word = 'revenue' and created_by is null", Long.class);
        // A hidden copy may repeat the word: hiding is how a word in use leaves, and the admin may add it again.
        jdbcTemplate.update("""
                insert into vocabulary (topic_id, word, meaning, difficulty_level, status)
                values (?, 'Revenue', 'doanh thu', 'B1', 'hidden')
                """, topic);
        // A learner's own word is no system word.
        long learner = createLearner();
        jdbcTemplate.update("""
                insert into vocabulary (topic_id, created_by, word, meaning, difficulty_level)
                values (?, ?, 'revenue', 'doanh thu', 'B1')
                """, topic, learner);

        assertThatThrownBy(() -> jdbcTemplate.update("""
                insert into vocabulary (topic_id, word, meaning, difficulty_level)
                values (?, ' REVENUE', 'doanh thu', 'B1')
                """, topic))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    private ResultActions asAdmin(MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.with(TestAuth.admin()));
    }

    private long createLearner() {
        return jdbcTemplate.queryForObject(
                "insert into users (full_name, email, password_hash) values ('Learner', ?, 'not-a-real-hash') returning id",
                Long.class, "admin-vocab-" + UUID.randomUUID() + "@example.com");
    }

    private long topicId(String name) {
        return jdbcTemplate.queryForObject("select id from topics where name = ? order by id limit 1", Long.class, name);
    }

    private int count(String sql) {
        return jdbcTemplate.queryForObject(sql, Integer.class);
    }
}
