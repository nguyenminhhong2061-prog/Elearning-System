package com.example.datn.modules.vocabulary;

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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.stream.Collectors;
import java.util.stream.LongStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** API of docs/api/custom-lists.md on H2. CustomListPostgresIntegrationTests runs it on the real schema. */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CustomListApiTests {

    private static final long LEARNER = 42;
    private static final long OTHER_LEARNER = 43;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private StudyCalendar calendar;

    @Test
    void createsAListWithExistingAndTypedInWordsInOneRequest() throws Exception {
        long topic = createTopic("Business");
        long invoice = createWord(topic, "invoice", "B2");
        long salary = createWord(topic, "salary", "A2");

        String body = as(LEARNER, post("/api/custom-lists").contentType(MediaType.APPLICATION_JSON).content("""
                        {"name": "  Phỏng vấn xin việc  ",
                         "vocabularyIds": [%d, %d, %d],
                         "newWords": [
                           {"word": " negotiate ", "meaning": " thương lượng ", "phonetic": "  ", "difficultyLevel": "B2"},
                           {"word": "resume", "meaning": "sơ yếu lý lịch", "exampleSentence": "Send your resume."}
                         ]}
                        """.formatted(invoice, salary, invoice)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Phỏng vấn xin việc"))
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.wordCount").value(4))
                .andExpect(jsonPath("$.learnedCount").value(0))
                .andExpect(jsonPath("$.dueCount").value(0))
                .andReturn().getResponse().getContentAsString();
        long listId = ((Number) JsonPath.read(body, "$.id")).longValue();

        // The duplicate id was ignored; words come easiest first, like every word list.
        as(LEARNER, get("/api/custom-lists/{id}/words", listId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems").value(4))
                .andExpect(jsonPath("$.items[*].word", contains("resume", "salary", "invoice", "negotiate")))
                .andExpect(jsonPath("$.items[0].difficultyLevel").value("A1"))
                .andExpect(jsonPath("$.items[0].createdBy").value(LEARNER))
                .andExpect(jsonPath("$.items[0].topicId").doesNotExist())
                .andExpect(jsonPath("$.items[0].exampleSentence").value("Send your resume."))
                .andExpect(jsonPath("$.items[3].meaning").value("thương lượng"))
                .andExpect(jsonPath("$.items[3].phonetic").doesNotExist())
                .andExpect(jsonPath("$.items[3].learningStatus").value("NEW"));
    }

    @Test
    void aTypedInWordWithoutLevelTakesTheLearnersCurrentLevel() throws Exception {
        long placed = 77;
        jdbcTemplate.update("""
                insert into users (id, full_name, email, password_hash, role, current_level, status, created_at)
                values (?, 'Placed', 'placed@example.com', 'hash', 'learner', 'B2', 'active', ?)
                """, placed, Timestamp.from(Instant.now()));

        long placedList = createList(placed, "Mine", "[]", "[{\"word\": \"leverage\", \"meaning\": \"đòn bẩy\"}]");
        as(placed, get("/api/custom-lists/{id}/words", placedList))
                .andExpect(jsonPath("$.items[0].difficultyLevel").value("B2"));

        // Learner 42 has no level yet (no placement test): A1.
        long list = createList(LEARNER, "Mine", "[]", "[]");
        as(LEARNER, post("/api/custom-lists/{id}/words/new", list).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"word\": \"hello\", \"meaning\": \"xin chào\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.difficultyLevel").value("A1"))
                .andExpect(jsonPath("$.createdBy").value(LEARNER));
    }

    @Test
    void creatingAListIsAllOrNothing() throws Exception {
        long word = createWord(createTopic("Business"), "invoice", "B2");
        long othersWord = createWord(null, "secret", "A1");
        jdbcTemplate.update("update vocabulary set created_by = ? where id = ?", OTHER_LEARNER, othersWord);
        entityManager.clear();

        // An unknown word, or a word typed in by someone else, refuses the whole list.
        as(LEARNER, post("/api/custom-lists").contentType(MediaType.APPLICATION_JSON).content("""
                        {"name": "Mine", "vocabularyIds": [%d, 999999], "newWords": [{"word": "a", "meaning": "b"}]}
                        """.formatted(word)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
        as(LEARNER, post("/api/custom-lists").contentType(MediaType.APPLICATION_JSON).content("""
                        {"name": "Mine", "vocabularyIds": [%d]}
                        """.formatted(othersWord)))
                .andExpect(status().isBadRequest());
        // An invalid typed-in word refuses it too.
        as(LEARNER, post("/api/custom-lists").contentType(MediaType.APPLICATION_JSON).content("""
                        {"name": "Mine", "vocabularyIds": [%d],
                         "newWords": [{"word": "ok", "meaning": "được"}, {"word": "broken", "meaning": "  "}]}
                        """.formatted(word)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("newWords[1].meaning: Meaning is required"));

        assertThat(count("select count(*) from custom_vocabulary_lists")).isZero();
        assertThat(count("select count(*) from custom_vocabulary_list_items")).isZero();
        assertThat(count("select count(*) from vocabulary where created_by = " + LEARNER)).isZero();
    }

    @Test
    void rejectsInvalidNamesAndTooManyWords() throws Exception {
        as(LEARNER, post("/api/custom-lists").contentType(MediaType.APPLICATION_JSON).content("{\"name\": \"   \"}"))
                .andExpect(status().isBadRequest());
        as(LEARNER, post("/api/custom-lists").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"" + "x".repeat(151) + "\"}"))
                .andExpect(status().isBadRequest());
        String tooMany = LongStream.rangeClosed(1, 101).mapToObj(Long::toString).collect(Collectors.joining(","));
        as(LEARNER, post("/api/custom-lists").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"Big\", \"vocabularyIds\": [" + tooMany + "]}"))
                .andExpect(status().isBadRequest());

        long list = createList(LEARNER, "Mine", "[]", "[]");
        as(LEARNER, put("/api/custom-lists/{id}", list).contentType(MediaType.APPLICATION_JSON).content("{\"name\": \"\"}"))
                .andExpect(status().isBadRequest());
        as(LEARNER, post("/api/custom-lists/{id}/words/new", list).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"word\": \"" + "w".repeat(151) + "\", \"meaning\": \"m\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void aLearnerCannotHaveTwoListsWithTheSameName() throws Exception {
        long interview = createList(LEARNER, "Phỏng vấn", "[]", "[]");
        long travel = createList(LEARNER, "Du lịch", "[]", "[]");

        // Scenario 7, branch 11a: the same name, ignoring case and spaces around it, is refused on create and rename.
        as(LEARNER, post("/api/custom-lists").contentType(MediaType.APPLICATION_JSON).content("{\"name\": \"  phỏng VẤN \"}"))
                .andExpect(status().isConflict());
        as(LEARNER, put("/api/custom-lists/{id}", travel).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"PHỎNG VẤN\"}"))
                .andExpect(status().isConflict());

        // Keeping a list's own name, and another learner using the same name, are fine.
        as(LEARNER, put("/api/custom-lists/{id}", interview).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"Phỏng vấn\"}"))
                .andExpect(status().isOk());
        assertThat(createList(OTHER_LEARNER, "Phỏng vấn", "[]", "[]")).isPositive();
    }

    @Test
    void aListIsOnlyReachableByItsOwner() throws Exception {
        long word = createWord(createTopic("Business"), "invoice", "B2");
        long list = createList(LEARNER, "Mine", "[" + word + "]", "[]");

        // Someone else's list answers exactly like a missing one, so its existence is not revealed.
        as(OTHER_LEARNER, get("/api/custom-lists/{id}", list)).andExpect(status().isNotFound());
        as(OTHER_LEARNER, get("/api/custom-lists/{id}/words", list)).andExpect(status().isNotFound());
        as(OTHER_LEARNER, put("/api/custom-lists/{id}", list).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"Stolen\"}"))
                .andExpect(status().isNotFound());
        as(OTHER_LEARNER, post("/api/custom-lists/{id}/words", list).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"vocabularyId\": " + word + "}"))
                .andExpect(status().isNotFound());
        as(OTHER_LEARNER, delete("/api/custom-lists/{id}/words/{word}", list, word)).andExpect(status().isNotFound());
        as(OTHER_LEARNER, delete("/api/custom-lists/{id}", list)).andExpect(status().isNotFound());
        as(OTHER_LEARNER, get("/api/learning/session").param("listId", String.valueOf(list)))
                .andExpect(status().isNotFound());
        as(OTHER_LEARNER, get("/api/custom-lists")).andExpect(jsonPath("$.length()").value(0));

        as(LEARNER, get("/api/custom-lists/{id}", list))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Mine"))
                .andExpect(jsonPath("$.wordCount").value(1));
    }

    @Test
    void aTypedInWordIsOnlyVisibleToItsAuthor() throws Exception {
        long list = createList(LEARNER, "Mine", "[]", "[{\"word\": \"quixotic\", \"meaning\": \"viển vông\"}]");
        long word = ((Number) JsonPath.read(as(LEARNER, get("/api/custom-lists/{id}/words", list))
                .andReturn().getResponse().getContentAsString(), "$.items[0].id")).longValue();

        as(LEARNER, get("/api/vocabulary").param("q", "quixotic")).andExpect(jsonPath("$.totalItems").value(1));
        as(LEARNER, get("/api/vocabulary/{id}", word)).andExpect(status().isOk());

        as(OTHER_LEARNER, get("/api/vocabulary").param("q", "quixotic")).andExpect(jsonPath("$.totalItems").value(0));
        as(OTHER_LEARNER, get("/api/vocabulary/{id}", word)).andExpect(status().isNotFound());
        as(OTHER_LEARNER, post("/api/learning/reviews").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"vocabularyId\": " + word + ", \"result\": \"VAGUE\"}"))
                .andExpect(status().isNotFound());
        long othersList = createList(OTHER_LEARNER, "Theirs", "[]", "[]");
        as(OTHER_LEARNER, post("/api/custom-lists/{id}/words", othersList).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"vocabularyId\": " + word + "}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void managesTheWordsOfAList() throws Exception {
        long topic = createTopic("Business");
        long invoice = createWord(topic, "invoice", "B2");
        long salary = createWord(topic, "salary", "A2");
        long list = createList(LEARNER, "Mine", "[" + invoice + "]", "[]");

        as(LEARNER, post("/api/custom-lists/{id}/words", list).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"vocabularyId\": " + salary + "}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(salary))
                .andExpect(jsonPath("$.word").value("salary"))
                .andExpect(jsonPath("$.learningStatus").value("NEW"));
        as(LEARNER, post("/api/custom-lists/{id}/words", list).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"vocabularyId\": " + salary + "}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
        as(LEARNER, post("/api/custom-lists/{id}/words", list).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"vocabularyId\": 999999}"))
                .andExpect(status().isNotFound());
        as(LEARNER, post("/api/custom-lists/{id}/words/new", list).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"word\": \"deadline\", \"meaning\": \"hạn chót\", \"difficultyLevel\": \"B1\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.word").value("deadline"))
                .andExpect(jsonPath("$.difficultyLevel").value("B1"));

        as(LEARNER, get("/api/custom-lists/{id}/words", list))
                .andExpect(jsonPath("$.items[*].word", contains("salary", "deadline", "invoice")));

        as(LEARNER, delete("/api/custom-lists/{id}/words/{word}", list, invoice)).andExpect(status().isNoContent());
        // Removing a word that is not in the list is not an error.
        as(LEARNER, delete("/api/custom-lists/{id}/words/{word}", list, invoice)).andExpect(status().isNoContent());
        as(LEARNER, get("/api/custom-lists/{id}/words", list))
                .andExpect(jsonPath("$.items[*].word", contains("salary", "deadline")));

        as(LEARNER, put("/api/custom-lists/{id}", list).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"  Công việc  \"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Công việc"))
                .andExpect(jsonPath("$.wordCount").value(2));
    }

    @Test
    void removingAWordOrDeletingTheListKeepsTheWordsAndTheProgress() throws Exception {
        long list = createList(LEARNER, "Mine", "[]", "[{\"word\": \"quixotic\", \"meaning\": \"viển vông\"}]");
        long word = ((Number) JsonPath.read(as(LEARNER, get("/api/custom-lists/{id}/words", list))
                .andReturn().getResponse().getContentAsString(), "$.items[0].id")).longValue();
        as(LEARNER, post("/api/learning/reviews").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"vocabularyId\": " + word + ", \"result\": \"REMEMBERED\"}"))
                .andExpect(status().isOk());
        as(LEARNER, get("/api/custom-lists/{id}", list)).andExpect(jsonPath("$.learnedCount").value(1));

        as(LEARNER, delete("/api/custom-lists/{id}/words/{word}", list, word)).andExpect(status().isNoContent());
        as(LEARNER, delete("/api/custom-lists/{id}", list)).andExpect(status().isNoContent());

        as(LEARNER, get("/api/custom-lists/{id}", list)).andExpect(status().isNotFound());
        entityManager.flush();
        assertThat(count("select count(*) from custom_vocabulary_list_items")).isZero();
        // The typed-in word and the learner's progress on it stay: the learning history still shows them.
        as(LEARNER, get("/api/vocabulary/{id}", word)).andExpect(jsonPath("$.learningStatus").value("LEARNING"));
        as(LEARNER, get("/api/learning/history")).andExpect(jsonPath("$.items[*].word", contains("quixotic")));
    }

    @Test
    void listsComeNewestFirstWithTheCountsOfTheirOwner() throws Exception {
        LocalDate today = calendar.today();
        long topic = createTopic("Business");
        long invoice = createWord(topic, "invoice", "B2");
        long salary = createWord(topic, "salary", "A2");
        long budget = createWord(topic, "budget", "B1");
        long older = createList(LEARNER, "Older", "[" + invoice + "," + salary + "]", "[]");
        long newer = createList(LEARNER, "Newer", "[" + salary + "," + budget + "]", "[]");
        createList(LEARNER, "Empty", "[]", "[]");
        progress(LEARNER, salary, "learning", today);                 // learned and due
        progress(LEARNER, budget, "mastered", today.plusDays(30));    // learned, not due
        progress(OTHER_LEARNER, invoice, "learning", today);

        as(LEARNER, get("/api/custom-lists"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].name", contains("Empty", "Newer", "Older")))
                .andExpect(jsonPath("$[0].wordCount").value(0))
                .andExpect(jsonPath("$[1].id").value(newer))
                .andExpect(jsonPath("$[1].wordCount").value(2))
                .andExpect(jsonPath("$[1].learnedCount").value(2))
                .andExpect(jsonPath("$[1].dueCount").value(1))
                .andExpect(jsonPath("$[2].id").value(older))
                .andExpect(jsonPath("$[2].learnedCount").value(1))
                .andExpect(jsonPath("$[2].dueCount").value(1));
    }

    @Test
    void aListIsStudiedLikeATopic() throws Exception {
        LocalDate today = calendar.today();
        long topic = createTopic("Business");
        long invoice = createWord(topic, "invoice", "B2");
        long salary = createWord(topic, "salary", "A2");
        long budget = createWord(topic, "budget", "B1");
        long outside = createWord(topic, "outside", "A1");
        long list = createList(LEARNER, "Mine", "[" + invoice + "," + salary + "," + budget + "]",
                "[{\"word\": \"agenda\", \"meaning\": \"chương trình họp\", \"difficultyLevel\": \"A2\"}]");
        progress(LEARNER, invoice, "learning", today);                // due
        progress(LEARNER, budget, "mastered", today.plusDays(30));    // learned, not due
        progress(LEARNER, outside, "learning", today);                // due, but not in the list

        as(LEARNER, get("/api/learning/session").param("listId", String.valueOf(list)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source.type").value("LIST"))
                .andExpect(jsonPath("$.source.id").value(list))
                .andExpect(jsonPath("$.source.name").value("Mine"))
                .andExpect(jsonPath("$.cards[*].word", contains("invoice", "agenda", "salary")));

        // The review mode picks up every due word, from topics and lists alike.
        as(LEARNER, get("/api/learning/session"))
                .andExpect(jsonPath("$.cards[*].word", containsInAnyOrder("invoice", "outside")));
    }

    private ResultActions as(long userId, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.with(TestAuth.learner(userId)));
    }

    private long createList(long userId, String name, String vocabularyIds, String newWords) throws Exception {
        String body = as(userId, post("/api/custom-lists").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"" + name + "\", \"vocabularyIds\": " + vocabularyIds
                                + ", \"newWords\": " + newWords + "}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(body, "$.id")).longValue();
    }

    private long createTopic(String name) throws Exception {
        String body = mockMvc.perform(post("/api/topics").with(TestAuth.admin())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"" + name + "\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(body, "$.id")).longValue();
    }

    private long createWord(Long topicId, String word, String level) throws Exception {
        String topic = topicId == null ? "null" : String.valueOf(topicId);
        String body = mockMvc.perform(post("/api/vocabulary").with(TestAuth.admin())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"topicId\": " + topic + ", \"word\": \"" + word + "\", \"meaning\": \"nghĩa\", "
                                + "\"difficultyLevel\": \"" + level + "\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(body, "$.id")).longValue();
    }

    private void progress(long userId, long vocabularyId, String status, LocalDate nextReviewAt) {
        jdbcTemplate.update("""
                insert into user_vocabulary (user_id, vocabulary_id, status, review_count, interval_days,
                                             next_review_at, last_reviewed_at, first_learned_at)
                values (?, ?, ?, 1, 1, ?, ?, ?)
                """, userId, vocabularyId, status, nextReviewAt,
                Timestamp.from(Instant.now()), Timestamp.from(Instant.now()));
    }

    private int count(String sql) {
        return jdbcTemplate.queryForObject(sql, Integer.class);
    }
}
