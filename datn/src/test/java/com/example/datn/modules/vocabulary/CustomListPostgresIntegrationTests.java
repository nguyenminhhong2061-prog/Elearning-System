package com.example.datn.modules.vocabulary;

import com.example.datn.support.AbstractPostgresIntegrationTest;
import com.example.datn.support.TestAuth;
import com.jayway.jsonpath.JsonPath;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Personal lists against the real schema: the composite key of custom_vocabulary_list_items, the learner's level read
 * from users.current_level, the list queries with their optional (null) parameters on PostgreSQL, and the unique list
 * name of each learner (V202610031100).
 */
@Transactional
class CustomListPostgresIntegrationTests extends AbstractPostgresIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private EntityManager entityManager;

    @Test
    void theDatabaseRefusesTwoListsOfOneLearnerWithTheSameNameInAnyCase() throws Exception {
        long learner = createLearner("A2");
        long other = createLearner("A2");
        mockMvc.perform(post("/api/custom-lists").with(TestAuth.learner(learner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"Từ khó tuần này\"}"))
                .andExpect(status().isCreated());
        entityManager.flush();

        // Another learner may use the same name; the same learner may not, even in another case (scenario 7, 11a).
        jdbcTemplate.update("insert into custom_vocabulary_lists (user_id, name) values (?, 'Từ khó tuần này')", other);
        assertThatThrownBy(() -> jdbcTemplate.update(
                "insert into custom_vocabulary_lists (user_id, name) values (?, 'TỪ KHÓ TUẦN NÀY')", learner))
                .hasMessageContaining("uq_cvl_user_name");
    }

    @Test
    void aListIsCreatedStudiedAndDeletedOnTheRealSchema() throws Exception {
        long learner = createLearner("B2");
        List<Long> seedWords = jdbcTemplate.queryForList("""
                select v.id from vocabulary v join topics t on t.id = v.topic_id
                where t.name = 'Kinh doanh' order by v.id limit 3
                """, Long.class);

        String created = mockMvc.perform(post("/api/custom-lists").with(TestAuth.learner(learner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name": "Phỏng vấn", "vocabularyIds": [%d, %d, %d],
                                 "newWords": [{"word": "shortlist", "meaning": "danh sách rút gọn"}]}
                                """.formatted(seedWords.get(0), seedWords.get(1), seedWords.get(2))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.wordCount").value(4))
                .andReturn().getResponse().getContentAsString();
        long list = ((Number) JsonPath.read(created, "$.id")).longValue();

        // The typed-in word took the learner's level from users.current_level and belongs to them.
        entityManager.flush();
        assertThat(jdbcTemplate.queryForMap(
                "select difficulty_level, created_by, topic_id from vocabulary where word = 'shortlist' and created_by = ?",
                learner))
                .containsEntry("difficulty_level", "B2")
                .containsEntry("created_by", learner)
                .containsEntry("topic_id", null);

        mockMvc.perform(get("/api/custom-lists/{id}/words", list).param("size", "3").with(TestAuth.learner(learner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems").value(4))
                .andExpect(jsonPath("$.totalPages").value(2));

        // Review one word, then study the list: the rest are new words, easiest first.
        mockMvc.perform(post("/api/learning/reviews").with(TestAuth.learner(learner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"vocabularyId\": " + seedWords.get(0) + ", \"result\": \"REMEMBERED\"}"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/learning/session").param("listId", String.valueOf(list)).with(TestAuth.learner(learner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source.type").value("LIST"))
                .andExpect(jsonPath("$.source.name").value("Phỏng vấn"))
                .andExpect(jsonPath("$.cards.length()").value(3));
        mockMvc.perform(get("/api/custom-lists").with(TestAuth.learner(learner)))
                .andExpect(jsonPath("$[0].learnedCount").value(1))
                .andExpect(jsonPath("$[0].dueCount").value(0));

        // Only the author finds the typed-in word.
        mockMvc.perform(get("/api/vocabulary").param("q", "shortlist").with(TestAuth.learner(learner)))
                .andExpect(jsonPath("$.totalItems").value(1));
        mockMvc.perform(get("/api/vocabulary").param("q", "shortlist").with(TestAuth.learner(createLearner(null))))
                .andExpect(jsonPath("$.totalItems").value(0));

        mockMvc.perform(delete("/api/custom-lists/{id}", list).with(TestAuth.learner(learner)))
                .andExpect(status().isNoContent());
        entityManager.flush();
        assertThat(jdbcTemplate.queryForObject(
                "select count(*) from custom_vocabulary_list_items where list_id = ?", Integer.class, list)).isZero();
        assertThat(jdbcTemplate.queryForObject(
                "select count(*) from vocabulary where created_by = ?", Integer.class, learner)).isEqualTo(1);
    }

    private long createLearner(String level) {
        return jdbcTemplate.queryForObject("""
                insert into users (full_name, email, password_hash, current_level)
                values ('Learner', ?, 'not-a-real-hash', ?) returning id
                """, Long.class, "lists-" + UUID.randomUUID() + "@example.com", level);
    }
}
