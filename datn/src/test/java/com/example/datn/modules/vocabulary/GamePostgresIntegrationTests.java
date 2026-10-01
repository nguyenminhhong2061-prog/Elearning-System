package com.example.datn.modules.vocabulary;

import com.example.datn.modules.vocabulary.service.LeaderboardService;
import com.example.datn.support.AbstractPostgresIntegrationTest;
import com.example.datn.support.TestAuth;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.contains;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The games against the real schema and seed (scenario 8): rounds dealt from a seeded topic and from a personal list,
 * the new game_sessions columns with their CHECK constraints (V202610021010), and the leaderboard cache with its quoted
 * "rank" column and its all-games rows (game_id NULL).
 */
@Transactional
class GamePostgresIntegrationTests extends AbstractPostgresIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private LeaderboardService leaderboardService;

    @Test
    void aRoundIsDealtFromATopicHandedInAndRankedOnTheRealSchema() throws Exception {
        long player = createPlayer("Nguyễn Văn Bình");
        long topic = topicId("Du lịch");
        long quiz = gameId("QUICK_QUIZ");
        Map<String, String> meanings = meaningsOf(topic);

        mockMvc.perform(get("/api/games").param("topicId", String.valueOf(topic)).with(TestAuth.learner(player)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.gameType == 'QUICK_QUIZ')].questionCount", contains(10)))
                .andExpect(jsonPath("$[?(@.gameType == 'WORD_MATCH')].questionCount", contains(8)))
                .andExpect(jsonPath("$[?(@.gameType == 'GUESS_MEANING')].available", contains(true)));

        String round = mockMvc.perform(get("/api/games/{id}/play", quiz).param("topicId", String.valueOf(topic))
                        .with(TestAuth.learner(player)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.topicId").value(topic))
                .andExpect(jsonPath("$.questions.length()").value(10))
                .andReturn().getResponse().getContentAsString();
        // Every question asks about a word of the topic, with four different meanings of the topic as options.
        List<Map<String, Object>> questions = JsonPath.read(round, "$.questions");
        List<String> answers = new ArrayList<>();
        for (int index = 0; index < questions.size(); index++) {
            Map<String, Object> question = questions.get(index);
            String rightMeaning = meanings.get((String) question.get("prompt"));
            List<Map<String, Object>> options = JsonPath.read(round, "$.questions[" + index + "].options");
            assertThat(rightMeaning).as("a word of the topic").isNotNull();
            assertThat(options).extracting(option -> option.get("content")).doesNotHaveDuplicates().contains(rightMeaning)
                    .allSatisfy(content -> assertThat(meanings).containsValue((String) content));
            // The first question is answered wrong, the others right.
            boolean answerWrong = index == 0;
            Object chosen = options.stream()
                    .filter(option -> option.get("content").equals(rightMeaning) != answerWrong)
                    .findFirst().orElseThrow().get("id");
            answers.add("{\"questionId\": " + question.get("id") + ", \"optionId\": " + chosen + "}");
        }

        String result = submit(player, quiz, round, answers)
                .andExpect(jsonPath("$.correctCount").value(9))
                .andExpect(jsonPath("$.questionCount").value(10))
                .andExpect(jsonPath("$.score").value(90))
                .andExpect(jsonPath("$.wrongAnswers.length()").value(1))
                .andExpect(jsonPath("$.wrongAnswers[0].questionId").value(1))
                .andReturn().getResponse().getContentAsString();
        long sessionId = ((Number) JsonPath.read(result, "$.sessionId")).longValue();

        Map<String, Object> saved = jdbcTemplate.queryForMap("select * from game_sessions where id = ?", sessionId);
        assertThat(saved.get("topic_id")).isEqualTo(topic);
        assertThat(saved.get("custom_list_id")).isNull();
        assertThat(saved.get("correct_count")).isEqualTo(9);
        assertThat(saved.get("question_count")).isEqualTo(10);
        assertThat(saved.get("score")).isEqualTo(90);
        assertThat(saved.get("duration_seconds")).isNotNull();

        // Refreshed twice: PostgreSQL does not enforce the unique constraint on the all-games rows (game_id NULL),
        // so only deleting the period before writing it keeps them single.
        leaderboardService.refresh();
        leaderboardService.refresh();
        assertThat(jdbcTemplate.queryForObject(
                "select count(*) from leaderboard where user_id = ? and game_id is null", Integer.class, player))
                .isEqualTo(2); // one for the week, one for the month
        assertThat(jdbcTemplate.queryForObject(
                "select \"rank\" from leaderboard where user_id = ? and game_id = ? and period_type = 'week'",
                Integer.class, player, quiz)).isPositive();

        mockMvc.perform(get("/api/games/leaderboard").with(TestAuth.learner(player)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.me.totalScore").value(90));
        String board = mockMvc.perform(get("/api/games/leaderboard").param("gameId", String.valueOf(quiz))
                        .param("period", "MONTH").with(TestAuth.learner(player)))
                .andExpect(jsonPath("$.me.totalScore").value(90))
                .andReturn().getResponse().getContentAsString();
        assertThat(JsonPath.<List<String>>read(board, "$.entries[*].displayName")).contains("Bình");
        assertThat(board).doesNotContain("Nguyễn Văn");

        mockMvc.perform(get("/api/games").with(TestAuth.learner(player)))
                .andExpect(jsonPath("$[?(@.gameType == 'QUICK_QUIZ')].myBestScore", contains(90)));
    }

    @Test
    void aWordMatchRoundIsDealtFromAPersonalListOnTheRealSchema() throws Exception {
        long player = createPlayer("Trần Thị Lan");
        long topic = topicId("Du lịch");
        long match = gameId("WORD_MATCH");
        Map<String, String> meanings = meaningsOf(topic);
        List<Long> words = jdbcTemplate.queryForList(
                "select id from vocabulary where topic_id = ? order by id limit 8", Long.class, topic);
        String list = mockMvc.perform(post("/api/custom-lists").with(TestAuth.learner(player))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"Ôn du lịch\", \"vocabularyIds\": " + words + "}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long listId = ((Number) JsonPath.read(list, "$.id")).longValue();

        String round = mockMvc.perform(get("/api/games/{id}/play", match).param("listId", String.valueOf(listId))
                        .with(TestAuth.learner(player)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.listId").value(listId))
                .andExpect(jsonPath("$.questions.length()").value(8))
                .andExpect(jsonPath("$.matchOptions.length()").value(8))
                .andReturn().getResponse().getContentAsString();
        Map<String, Object> optionIdByMeaning = JsonPath.<List<Map<String, Object>>>read(round, "$.matchOptions").stream()
                .collect(Collectors.toMap(option -> (String) option.get("content"), option -> option.get("id")));
        List<String> answers = new ArrayList<>();
        for (Map<String, Object> question : JsonPath.<List<Map<String, Object>>>read(round, "$.questions")) {
            Object optionId = optionIdByMeaning.get(meanings.get((String) question.get("prompt")));
            assertThat(optionId).as("the meaning of " + question.get("prompt")).isNotNull();
            answers.add("{\"questionId\": " + question.get("id") + ", \"optionId\": " + optionId + "}");
        }

        String result = submit(player, match, round, answers)
                .andExpect(jsonPath("$.correctCount").value(8))
                .andExpect(jsonPath("$.score").value(80))
                .andExpect(jsonPath("$.wrongAnswers.length()").value(0))
                .andReturn().getResponse().getContentAsString();
        long sessionId = ((Number) JsonPath.read(result, "$.sessionId")).longValue();

        Map<String, Object> saved = jdbcTemplate.queryForMap("select * from game_sessions where id = ?", sessionId);
        assertThat(saved.get("custom_list_id")).isEqualTo(listId);
        assertThat(saved.get("topic_id")).isNull();
        assertThat(saved.get("question_count")).isEqualTo(8);

        // A round comes from a topic or a list, never both (the only failing statement: it aborts the transaction).
        assertThatThrownBy(() -> jdbcTemplate.update("update game_sessions set topic_id = ? where id = ?", topic, sessionId))
                .hasMessageContaining("chk_gs_one_source");
    }

    private org.springframework.test.web.servlet.ResultActions submit(long player, long gameId, String round, List<String> answers)
            throws Exception {
        String token = JsonPath.read(round, "$.playToken");
        return mockMvc.perform(post("/api/games/{id}/sessions", gameId).with(TestAuth.learner(player))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"playToken\": \"" + token + "\", \"answers\": [" + String.join(",", answers) + "]}"))
                .andExpect(status().isCreated());
    }

    /** The meaning of each word of a topic, by word. */
    private Map<String, String> meaningsOf(long topic) {
        Map<String, String> meanings = new HashMap<>();
        jdbcTemplate.queryForList("select word, meaning from vocabulary where topic_id = ? order by id", topic)
                .forEach(row -> meanings.putIfAbsent((String) row.get("word"), (String) row.get("meaning")));
        return meanings;
    }

    private long gameId(String type) {
        return jdbcTemplate.queryForObject("select id from games where game_type = ?", Long.class, type);
    }

    private long topicId(String name) {
        return jdbcTemplate.queryForObject("select id from topics where name = ? order by id limit 1", Long.class, name);
    }

    private long createPlayer(String fullName) {
        return jdbcTemplate.queryForObject(
                "insert into users (full_name, email, password_hash) values (?, ?, 'not-a-real-hash') returning id",
                Long.class, fullName, "games-" + UUID.randomUUID() + "@example.com");
    }
}
