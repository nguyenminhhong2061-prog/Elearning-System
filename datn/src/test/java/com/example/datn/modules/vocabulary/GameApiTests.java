package com.example.datn.modules.vocabulary;

import com.example.datn.common.enums.CefrLevel;
import com.example.datn.modules.vocabulary.entity.Game;
import com.example.datn.modules.vocabulary.entity.GameQuestion;
import com.example.datn.modules.vocabulary.entity.GameQuestionOption;
import com.example.datn.modules.vocabulary.entity.GameSession;
import com.example.datn.modules.vocabulary.entity.Vocabulary;
import com.example.datn.modules.vocabulary.enums.GameType;
import com.example.datn.modules.vocabulary.enums.LeaderboardPeriod;
import com.example.datn.modules.vocabulary.repository.GameQuestionOptionRepository;
import com.example.datn.modules.vocabulary.repository.GameQuestionRepository;
import com.example.datn.modules.vocabulary.repository.GameRepository;
import com.example.datn.modules.vocabulary.repository.GameSessionRepository;
import com.example.datn.modules.vocabulary.repository.VocabularyRepository;
import com.example.datn.modules.vocabulary.service.LeaderboardService;
import com.example.datn.modules.vocabulary.service.PlayRound;
import com.example.datn.modules.vocabulary.service.PlayTokenService;
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

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.function.BiFunction;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.nullValue;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * API of docs/api/games.md on H2, with a small question bank built by each test (the seed migration only runs on
 * PostgreSQL, see GamePostgresIntegrationTests).
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class GameApiTests {

    private static final long PLAYER = 42;
    private static final long OTHER_PLAYER = 43;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private GameRepository gameRepository;

    @Autowired
    private GameQuestionRepository questionRepository;

    @Autowired
    private GameQuestionOptionRepository optionRepository;

    @Autowired
    private GameSessionRepository sessionRepository;

    @Autowired
    private VocabularyRepository vocabularyRepository;

    @Autowired
    private PlayTokenService tokens;

    @Autowired
    private LeaderboardService leaderboardService;

    @Autowired
    private StudyCalendar calendar;

    @Test
    void listsTheGamesWithTheirQuestionsPerRoundAndTheBestScore() throws Exception {
        Game guess = createGame("Đoán nghĩa", GameType.GUESS_MEANING, 90, 12);
        createGame("Ghép từ", GameType.WORD_MATCH, 60, 4);

        as(PLAYER, get("/api/games"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].name", contains("Đoán nghĩa", "Ghép từ")))
                .andExpect(jsonPath("$[0].gameType").value("GUESS_MEANING"))
                .andExpect(jsonPath("$[0].timeLimitSeconds").value(90))
                .andExpect(jsonPath("$[0].questionCount").value(10))
                // A bank smaller than a round: the round has every question of the bank.
                .andExpect(jsonPath("$[1].questionCount").value(4))
                .andExpect(jsonPath("$[0].myBestScore").value(nullValue()));

        Round round = play(PLAYER, guess);
        submit(PLAYER, guess, round.token(), round.answers(this::rightOption)).andExpect(status().isCreated());

        as(PLAYER, get("/api/games"))
                .andExpect(jsonPath("$[0].myBestScore").isNumber())
                .andExpect(jsonPath("$[1].myBestScore").value(nullValue()));
        as(OTHER_PLAYER, get("/api/games")).andExpect(jsonPath("$[0].myBestScore").value(nullValue()));
    }

    @Test
    void aRoundNeverRevealsTheAnswers() throws Exception {
        Game guess = createGame("Đoán nghĩa", GameType.GUESS_MEANING, 90, 12);
        Game quiz = createGame("Trắc nghiệm nhanh", GameType.QUICK_QUIZ, 60, 14);
        Game match = createGame("Ghép từ", GameType.WORD_MATCH, 60, 8);

        String guessBody = as(PLAYER, get("/api/games/{id}/play", guess.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.gameType").value("GUESS_MEANING"))
                .andExpect(jsonPath("$.timeLimitSeconds").value(90))
                .andExpect(jsonPath("$.playToken").isNotEmpty())
                .andExpect(jsonPath("$.questions.length()").value(10))
                .andExpect(jsonPath("$.questions[0].options.length()").value(4))
                .andExpect(jsonPath("$.questions[0].prompt").value(startsWith("word")))
                .andExpect(jsonPath("$.questions[0].phonetic").isNotEmpty())
                .andExpect(jsonPath("$.questions[0].points").value(1))
                .andExpect(jsonPath("$.matchOptions").value(nullValue()))
                .andReturn().getResponse().getContentAsString();
        assertThat(guessBody).doesNotContainIgnoringCase("correct");
        List<Integer> ids = JsonPath.read(guessBody, "$.questions[*].id");
        assertThat(new HashSet<>(ids)).hasSize(10);

        as(PLAYER, get("/api/games/{id}/play", quiz.getId()))
                .andExpect(jsonPath("$.questions.length()").value(12))
                .andExpect(jsonPath("$.questions[0].prompt").value(startsWith("nghĩa")))
                .andExpect(jsonPath("$.questions[0].phonetic").value(nullValue()))
                .andExpect(jsonPath("$.questions[0].options[0].content").value(startsWith("word")));

        String matchBody = as(PLAYER, get("/api/games/{id}/play", match.getId()))
                .andExpect(jsonPath("$.questions.length()").value(6))
                .andExpect(jsonPath("$.questions[0].options.length()").value(0))
                .andExpect(jsonPath("$.matchOptions.length()").value(6))
                .andReturn().getResponse().getContentAsString();
        assertThat(matchBody).doesNotContainIgnoringCase("correct");
        // The meanings offered are exactly the right options of the round's questions.
        List<Long> questionIds = longs(JsonPath.read(matchBody, "$.questions[*].id"));
        List<Long> matchOptionIds = longs(JsonPath.read(matchBody, "$.matchOptions[*].id"));
        assertThat(matchOptionIds).containsExactlyInAnyOrderElementsOf(
                questionIds.stream().map(this::rightOption).toList());
    }

    @Test
    void checkTellsWhetherAChoiceIsRightAndSavesNothing() throws Exception {
        Game guess = createGame("Đoán nghĩa", GameType.GUESS_MEANING, 90, 12);
        Game match = createGame("Ghép từ", GameType.WORD_MATCH, 60, 6);
        Round round = play(PLAYER, guess);
        long question = round.questionIds().get(0);
        long right = rightOption(question);

        check(PLAYER, guess, round.token(), question, right)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.correct").value(true))
                .andExpect(jsonPath("$.correctOptionId").value(right));
        check(PLAYER, guess, round.token(), question, wrongOption(question))
                .andExpect(jsonPath("$.correct").value(false))
                .andExpect(jsonPath("$.correctOptionId").value(right));

        // WORD_MATCH never tells the right pair, or one wrong try would give it away.
        Round matchRound = play(PLAYER, match);
        long matchQuestion = matchRound.questionIds().get(0);
        check(PLAYER, match, matchRound.token(), matchQuestion, rightOption(matchRound.questionIds().get(1)))
                .andExpect(jsonPath("$.correct").value(false))
                .andExpect(jsonPath("$.correctOptionId").value(nullValue()));

        check(PLAYER, guess, round.token(), 999_999, right).andExpect(status().isBadRequest());
        check(OTHER_PLAYER, guess, round.token(), question, right).andExpect(status().isBadRequest());
        check(PLAYER, match, round.token(), question, right).andExpect(status().isBadRequest());
        check(PLAYER, guess, round.token() + "x", question, right).andExpect(status().isBadRequest());
        as(PLAYER, get("/api/games/{id}/play", 999_999)).andExpect(status().isNotFound());

        assertThat(sessionRepository.count()).isZero();
    }

    @Test
    void theServerGradesTheRoundFromTheAnswers() throws Exception {
        Game guess = createGame("Đoán nghĩa", GameType.GUESS_MEANING, 90, 12);

        Round perfect = play(PLAYER, guess);
        String body = submit(PLAYER, guess, perfect.token(), perfect.answers(this::rightOption))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sessionId").isNumber())
                .andExpect(jsonPath("$.correctCount").value(10))
                .andExpect(jsonPath("$.questionCount").value(10))
                .andExpect(jsonPath("$.isPersonalBest").value(true))
                .andReturn().getResponse().getContentAsString();
        int bonus = JsonPath.read(body, "$.timeBonus");
        int best = JsonPath.read(body, "$.score");
        // All right within seconds: nearly the whole 90 seconds are left.
        assertThat(bonus).isBetween(85, 90);
        assertThat(best).isEqualTo(100 + bonus);
        assertThat(JsonPath.<Integer>read(body, "$.bestScore")).isEqualTo(best);

        long sessionId = ((Number) JsonPath.read(body, "$.sessionId")).longValue();
        assertThat(jdbcTemplate.queryForObject(
                "select count(*) from game_session_answers where session_id = ? and is_correct = true",
                Integer.class, sessionId)).isEqualTo(10);

        // Everything wrong, however fast: no points and no bonus.
        Round wrong = play(PLAYER, guess);
        submit(PLAYER, guess, wrong.token(), wrong.answers(this::wrongOption))
                .andExpect(jsonPath("$.correctCount").value(0))
                .andExpect(jsonPath("$.score").value(0))
                .andExpect(jsonPath("$.timeBonus").value(0))
                .andExpect(jsonPath("$.bestScore").value(best))
                .andExpect(jsonPath("$.isPersonalBest").value(false));

        // Half answered: the right answers count, but there is no bonus without every answer.
        Round half = play(PLAYER, guess);
        submit(PLAYER, guess, half.token(), half.answers((question, index) -> index % 2 == 0 ? rightOption(question) : null))
                .andExpect(jsonPath("$.correctCount").value(5))
                .andExpect(jsonPath("$.score").value(50))
                .andExpect(jsonPath("$.timeBonus").value(0));
    }

    @Test
    void answersHandedInAfterTheTimeLimitCountAsWrong() throws Exception {
        Game guess = createGame("Đoán nghĩa", GameType.GUESS_MEANING, 90, 12);
        List<Long> questionIds = play(PLAYER, guess).questionIds();

        // Started 100 seconds ago: past the 90 seconds and the 3 seconds of grace.
        String late = tokens.sign(new PlayRound(guess.getId(), PLAYER, calendar.now().minusSeconds(100), "late", questionIds));
        submit(PLAYER, guess, late, answers(questionIds, this::rightOption))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.correctCount").value(0))
                .andExpect(jsonPath("$.score").value(0));

        // Started 92 seconds ago: within the grace, the answers count but no second is left for a bonus.
        String grace = tokens.sign(new PlayRound(guess.getId(), PLAYER, calendar.now().minusSeconds(92), "grace", questionIds));
        submit(PLAYER, guess, grace, answers(questionIds, this::rightOption))
                .andExpect(jsonPath("$.correctCount").value(10))
                .andExpect(jsonPath("$.timeBonus").value(0))
                .andExpect(jsonPath("$.score").value(100));
    }

    @Test
    void aRoundIsHandedInOnceAndOnlyWithItsOwnAnswers() throws Exception {
        Game guess = createGame("Đoán nghĩa", GameType.GUESS_MEANING, 90, 12);
        Round round = play(PLAYER, guess);
        long first = round.questionIds().get(0);

        // Refused answers do not use the round up...
        submit(PLAYER, guess, round.token(), "[{\"questionId\": 999999, \"optionId\": null}]")
                .andExpect(status().isBadRequest());
        submit(PLAYER, guess, round.token(), "[{\"questionId\": " + first + ", \"optionId\": " + rightOption(round.questionIds().get(1)) + "}]")
                .andExpect(status().isBadRequest());
        submit(PLAYER, guess, round.token(), "[{\"questionId\": " + first + ", \"optionId\": null},"
                        + " {\"questionId\": " + first + ", \"optionId\": null}]")
                .andExpect(status().isBadRequest());
        submit(PLAYER, guess, round.token(), "[{\"questionId\": " + first + ", \"optionId\": null, \"responseTimeMs\": -1}]")
                .andExpect(status().isBadRequest());
        submit(OTHER_PLAYER, guess, round.token(), round.answers(this::rightOption)).andExpect(status().isBadRequest());

        // ...so the round can still be handed in, once.
        submit(PLAYER, guess, round.token(), round.answers(this::rightOption)).andExpect(status().isCreated());
        submit(PLAYER, guess, round.token(), round.answers(this::rightOption))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
        assertThat(sessionRepository.count()).isEqualTo(1);
    }

    @Test
    void theLeaderboardRanksPlayersByPeriodWithOnlyTheirGivenNames() throws Exception {
        Game guess = createGame("Đoán nghĩa", GameType.GUESS_MEANING, 90, 12);
        Game quiz = createGame("Trắc nghiệm nhanh", GameType.QUICK_QUIZ, 60, 14);
        user(501, "Nguyễn Văn An");
        user(502, "Trần Thị Bình");
        user(503, "Lê Châu");
        Instant now = calendar.now();
        session(guess, 501, 120, now);
        session(quiz, 501, 60, now);
        session(guess, 502, 180, now);
        session(guess, 503, 180, now.minusSeconds(60)); // reached 180 a minute before the others
        // Before this week: in this month's board only if the week started after the 1st.
        LocalDate weekStart = LeaderboardPeriod.WEEK.startOf(calendar.today());
        Instant beforeThisWeek = calendar.startOf(weekStart).minusSeconds(3600);
        session(guess, 503, 500, beforeThisWeek);
        leaderboardService.refresh();

        as(502, get("/api/games/leaderboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.periodType").value("WEEK"))
                .andExpect(jsonPath("$.periodStart").value(weekStart.toString()))
                .andExpect(jsonPath("$.updatedAt").isNotEmpty())
                // Everyone has 180 (501 over two games). 503 got there first; 501 and 502 at the same time, so by id.
                // Ranks are never shared: the frontend draws one podium place per rank.
                .andExpect(jsonPath("$.entries[*].userId", contains(503, 501, 502)))
                .andExpect(jsonPath("$.entries[*].rank", contains(1, 2, 3)))
                .andExpect(jsonPath("$.entries[*].displayName", contains("Châu", "An", "Bình")))
                .andExpect(jsonPath("$.me.rank").value(3))
                .andExpect(jsonPath("$.me.totalScore").value(180));
        String weekBody = as(502, get("/api/games/leaderboard")).andReturn().getResponse().getContentAsString();
        assertThat(weekBody).doesNotContain("Nguyễn", "Trần", "Lê", "@");

        as(502, get("/api/games/leaderboard").param("gameId", String.valueOf(guess.getId())))
                .andExpect(jsonPath("$.entries[*].userId", contains(503, 502, 501)))
                .andExpect(jsonPath("$.entries[*].rank", contains(1, 2, 3)))
                .andExpect(jsonPath("$.entries[*].totalScore", contains(180, 180, 120)));

        boolean monthIncludesEarlier = !beforeThisWeek.isBefore(calendar.startOf(LeaderboardPeriod.MONTH.startOf(calendar.today())));
        as(503, get("/api/games/leaderboard").param("period", "MONTH"))
                .andExpect(jsonPath("$.periodType").value("MONTH"))
                .andExpect(jsonPath("$.me.totalScore").value(monthIncludesEarlier ? 680 : 180));

        as(PLAYER, get("/api/games/leaderboard")).andExpect(jsonPath("$.me").value(nullValue()));
        as(PLAYER, get("/api/games/leaderboard").param("period", "YEAR")).andExpect(status().isBadRequest());
        as(PLAYER, get("/api/games/leaderboard").param("gameId", "999999")).andExpect(status().isNotFound());
    }

    // --- helpers ---

    private record Round(String token, List<Long> questionIds) {
        String answers(BiFunction<Long, Integer, Long> choose) {
            return GameApiTests.answers(questionIds, choose);
        }

        String answers(Function<Long, Long> choose) {
            return answers((question, index) -> choose.apply(question));
        }
    }

    private static String answers(List<Long> questionIds, Function<Long, Long> choose) {
        return answers(questionIds, (question, index) -> choose.apply(question));
    }

    private static String answers(List<Long> questionIds, BiFunction<Long, Integer, Long> choose) {
        List<String> items = new ArrayList<>();
        for (int index = 0; index < questionIds.size(); index++) {
            Long option = choose.apply(questionIds.get(index), index);
            items.add("{\"questionId\": " + questionIds.get(index) + ", \"optionId\": " + option + ", \"responseTimeMs\": 1500}");
        }
        return "[" + String.join(",", items) + "]";
    }

    private ResultActions as(long userId, MockHttpServletRequestBuilder request)
            throws Exception {
        return mockMvc.perform(request.with(TestAuth.learner(userId)));
    }

    private Round play(long userId, Game game) throws Exception {
        String body = as(userId, get("/api/games/{id}/play", game.getId())).andReturn().getResponse().getContentAsString();
        return new Round(JsonPath.read(body, "$.playToken"), longs(JsonPath.read(body, "$.questions[*].id")));
    }

    private ResultActions check(long userId, Game game, String token, long questionId, long optionId) throws Exception {
        return as(userId, post("/api/games/{id}/check", game.getId()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"playToken\": \"" + token + "\", \"questionId\": " + questionId + ", \"optionId\": " + optionId + "}"));
    }

    private ResultActions submit(long userId, Game game, String token, String answers) throws Exception {
        return as(userId, post("/api/games/{id}/sessions", game.getId()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"playToken\": \"" + token + "\", \"answers\": " + answers + "}"));
    }

    private long rightOption(long questionId) {
        return optionsOf(questionId).stream().filter(GameQuestionOption::isCorrect).findFirst().orElseThrow().getId();
    }

    private long wrongOption(long questionId) {
        return optionsOf(questionId).stream().filter(option -> !option.isCorrect()).findFirst().orElseThrow().getId();
    }

    private List<GameQuestionOption> optionsOf(long questionId) {
        return optionRepository.findAllByGameQuestionIdIn(List.of(questionId));
    }

    /**
     * A game whose bank has one question per new word "word{n}" (meaning "nghĩa {n}"): the right option, plus three
     * wrong ones taken from the other words for the choice games.
     */
    private Game createGame(String name, GameType type, Integer timeLimit, int bankSize) {
        Game game = gameRepository.save(new Game(name, type, timeLimit));
        List<Vocabulary> words = new ArrayList<>();
        for (int n = 0; n < bankSize; n++) {
            words.add(vocabularyRepository.save(new Vocabulary(
                    null, null, "word" + game.getId() + "-" + n, "nghĩa " + game.getId() + "-" + n,
                    null, "/wɜːd/", null, null, CefrLevel.A1)));
        }
        for (int n = 0; n < words.size(); n++) {
            Vocabulary word = words.get(n);
            GameQuestion question = questionRepository.save(new GameQuestion(game.getId(), word.getId(), 1));
            boolean quiz = type == GameType.QUICK_QUIZ;
            optionRepository.save(new GameQuestionOption(question.getId(), quiz ? word.getWord() : word.getMeaning(), true));
            if (type.hasOptionsPerQuestion()) {
                for (int d = 1; d <= 3; d++) {
                    Vocabulary other = words.get((n + d) % words.size());
                    optionRepository.save(new GameQuestionOption(
                            question.getId(), quiz ? other.getWord() : other.getMeaning(), false));
                }
            }
        }
        return game;
    }

    private void user(long id, String fullName) {
        jdbcTemplate.update("""
                insert into users (id, full_name, email, password_hash, role, status, created_at)
                values (?, ?, ?, 'hash', 'learner', 'active', ?)
                """, id, fullName, "player" + id + "@example.com", Timestamp.from(Instant.now()));
    }

    private void session(Game game, long userId, int score, Instant playedAt) {
        sessionRepository.save(new GameSession(game.getId(), userId, score, playedAt));
    }

    private static List<Long> longs(List<Object> numbers) {
        return numbers.stream().map(number -> ((Number) number).longValue()).collect(Collectors.toList());
    }
}
