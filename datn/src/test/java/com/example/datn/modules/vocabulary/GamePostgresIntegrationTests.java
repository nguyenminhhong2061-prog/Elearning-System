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
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The games against the real schema and seed migration: the question banks, a round played and handed in, and the
 * leaderboard cache with its quoted "rank" column and its all-games rows (game_id NULL).
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
    void theSeedGivesEachGameAQuestionPerSystemWordWithOneRightOption() {
        List<Map<String, Object>> games = jdbcTemplate.queryForList("""
                select g.game_type, count(distinct q.id) as questions,
                       min(o.options) as min_options, max(o.options) as max_options,
                       min(o.right_options) as min_right, max(o.right_options) as max_right,
                       min(o.distinct_contents) as min_distinct
                from games g
                join game_questions q on q.game_id = g.id
                join (select game_question_id, count(*) as options,
                             count(*) filter (where is_correct) as right_options,
                             count(distinct content) as distinct_contents
                      from game_question_options group by game_question_id) o on o.game_question_id = q.id
                group by g.game_type
                order by g.game_type
                """);
        long systemWords = jdbcTemplate.queryForObject(
                "select count(*) from vocabulary where created_by is null and topic_id is not null", Long.class);

        assertThat(games).extracting(row -> row.get("game_type"))
                .containsExactly("GUESS_MEANING", "QUICK_QUIZ", "WORD_MATCH");
        for (Map<String, Object> game : games) {
            boolean match = "WORD_MATCH".equals(game.get("game_type"));
            int expectedOptions = match ? 1 : 4;
            assertThat(((Number) game.get("questions")).longValue()).as("questions").isEqualTo(systemWords);
            assertThat(((Number) game.get("min_options")).intValue()).as("options").isEqualTo(expectedOptions);
            assertThat(((Number) game.get("max_options")).intValue()).as("options").isEqualTo(expectedOptions);
            assertThat(((Number) game.get("min_right")).intValue()).as("right options").isEqualTo(1);
            assertThat(((Number) game.get("max_right")).intValue()).as("right options").isEqualTo(1);
            // No two options of a question read the same, so there is never more than one right-looking answer.
            assertThat(((Number) game.get("min_distinct")).intValue()).as("distinct options").isEqualTo(expectedOptions);
        }
    }

    @Test
    void aRoundIsPlayedHandedInAndRankedOnTheRealSchema() throws Exception {
        long player = createPlayer("Nguyễn Văn Bình");
        long guess = jdbcTemplate.queryForObject("select id from games where game_type = 'GUESS_MEANING'", Long.class);

        String round = mockMvc.perform(get("/api/games/{id}/play", guess).with(TestAuth.learner(player)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.questions.length()").value(10))
                .andReturn().getResponse().getContentAsString();
        String token = JsonPath.read(round, "$.playToken");
        List<Object> questionIds = JsonPath.read(round, "$.questions[*].id");
        List<String> answers = new ArrayList<>();
        for (Object id : questionIds) {
            long right = jdbcTemplate.queryForObject(
                    "select id from game_question_options where game_question_id = ? and is_correct",
                    Long.class, ((Number) id).longValue());
            answers.add("{\"questionId\": " + id + ", \"optionId\": " + right + ", \"responseTimeMs\": 1200}");
        }
        String result = mockMvc.perform(post("/api/games/{id}/sessions", guess).with(TestAuth.learner(player))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"playToken\": \"" + token + "\", \"answers\": [" + String.join(",", answers) + "]}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.correctCount").value(10))
                .andReturn().getResponse().getContentAsString();
        int score = JsonPath.read(result, "$.score");

        // Refreshed twice: PostgreSQL does not enforce the unique constraint on the all-games rows (game_id NULL),
        // so only deleting the period before writing it keeps them single.
        leaderboardService.refresh();
        leaderboardService.refresh();
        assertThat(jdbcTemplate.queryForObject(
                "select count(*) from leaderboard where user_id = ? and game_id is null", Integer.class, player))
                .isEqualTo(2); // one for the week, one for the month
        assertThat(jdbcTemplate.queryForObject(
                "select \"rank\" from leaderboard where user_id = ? and game_id = ? and period_type = 'week'",
                Integer.class, player, guess)).isPositive();

        mockMvc.perform(get("/api/games/leaderboard").with(TestAuth.learner(player)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.me.totalScore").value(score));
        String board = mockMvc.perform(get("/api/games/leaderboard").param("gameId", String.valueOf(guess))
                        .param("period", "MONTH").with(TestAuth.learner(player)))
                .andExpect(jsonPath("$.me.totalScore").value(score))
                .andReturn().getResponse().getContentAsString();
        assertThat(JsonPath.<List<String>>read(board, "$.entries[*].displayName")).contains("Bình");
        assertThat(board).doesNotContain("Nguyễn Văn");

        mockMvc.perform(get("/api/games").with(TestAuth.learner(player)))
                .andExpect(jsonPath("$[0].myBestScore").value(score))
                .andExpect(jsonPath("$[0].questionCount").value(10));
    }

    private long createPlayer(String fullName) {
        return jdbcTemplate.queryForObject(
                "insert into users (full_name, email, password_hash) values (?, ?, 'not-a-real-hash') returning id",
                Long.class, fullName, "games-" + UUID.randomUUID() + "@example.com");
    }
}
