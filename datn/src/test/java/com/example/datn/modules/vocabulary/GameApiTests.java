package com.example.datn.modules.vocabulary;

import com.example.datn.common.enums.CefrLevel;
import com.example.datn.modules.vocabulary.entity.Game;
import com.example.datn.modules.vocabulary.entity.GameSession;
import com.example.datn.modules.vocabulary.entity.Topic;
import com.example.datn.modules.vocabulary.entity.Vocabulary;
import com.example.datn.modules.vocabulary.enums.GameType;
import com.example.datn.modules.vocabulary.enums.LeaderboardPeriod;
import com.example.datn.modules.vocabulary.repository.GameRepository;
import com.example.datn.modules.vocabulary.repository.GameSessionRepository;
import com.example.datn.modules.vocabulary.repository.TopicRepository;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.BiFunction;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * API of docs/api/games.md (scenario 8) on H2: rounds dealt from the words of a topic or a personal list. Each test
 * makes its own games and words; a word "{prefix}{n}" means "nghĩa {prefix}{n}", so a test finds the right option by
 * its text, as a player who knows the words would.
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
    private GameSessionRepository sessionRepository;

    @Autowired
    private TopicRepository topicRepository;

    @Autowired
    private VocabularyRepository vocabularyRepository;

    @Autowired
    private PlayTokenService tokens;

    @Autowired
    private LeaderboardService leaderboardService;

    @Autowired
    private StudyCalendar calendar;

    @Test
    void listsTheGamesForTheWordsChosenWithTheBestScore() throws Exception {
        Games games = createGames();
        long travel = topicWithWords("trip", 12, 6);
        long small = topicWithWords("tiny", 3, 3);
        long noExamples = topicWithWords("bare", 6, 0);

        as(PLAYER, get("/api/games").param("topicId", String.valueOf(travel)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].name", contains("Đoán nghĩa", "Trắc nghiệm nhanh", "Ghép từ")))
                .andExpect(jsonPath("$[*].timeLimitSeconds", contains(90, 60, 60)))
                // Scenario 8: 5 sentences, 10 words, 8 pairs.
                .andExpect(jsonPath("$[*].questionCount", contains(5, 10, 8)))
                .andExpect(jsonPath("$[*].available", contains(true, true, true)))
                .andExpect(jsonPath("$[0].unavailableReason").value(nullValue()))
                .andExpect(jsonPath("$[0].myBestScore").value(nullValue()));

        // Branch 3a: fewer than 4 words cannot make four options.
        as(PLAYER, get("/api/games").param("topicId", String.valueOf(small)))
                .andExpect(jsonPath("$[*].available", contains(false, false, false)))
                .andExpect(jsonPath("$[*].unavailableReason", contains("NOT_ENOUGH_WORDS", "NOT_ENOUGH_WORDS", "NOT_ENOUGH_WORDS")))
                .andExpect(jsonPath("$[*].questionCount", contains(0, 0, 0)));
        // A topic smaller than a round plays every word; GUESS_MEANING needs example sentences.
        as(PLAYER, get("/api/games").param("topicId", String.valueOf(noExamples)))
                .andExpect(jsonPath("$[*].available", contains(false, true, true)))
                .andExpect(jsonPath("$[0].unavailableReason").value("NO_EXAMPLES"))
                .andExpect(jsonPath("$[*].questionCount", contains(0, 6, 6)));

        Round round = play(PLAYER, games.quiz(), travel, null);
        submit(PLAYER, games.quiz(), round.token(), round.answers(this::right)).andExpect(status().isCreated());
        as(PLAYER, get("/api/games").param("topicId", String.valueOf(small)))
                .andExpect(jsonPath("$[1].myBestScore").value(100))
                .andExpect(jsonPath("$[0].myBestScore").value(nullValue()));
        as(OTHER_PLAYER, get("/api/games")).andExpect(jsonPath("$[1].myBestScore").value(nullValue()));

        as(PLAYER, get("/api/games").param("topicId", String.valueOf(travel)).param("listId", "1"))
                .andExpect(status().isBadRequest());
        as(PLAYER, get("/api/games").param("topicId", "999999")).andExpect(status().isNotFound());
        as(PLAYER, get("/api/games").param("listId", "999999")).andExpect(status().isNotFound());
    }

    @Test
    void aRoundIsDealtFromTheTopicWithoutTheAnswers() throws Exception {
        Games games = createGames();
        long travel = topicWithWords("trip", 12, 6);
        long other = topicWithWords("work", 12, 12);
        Map<String, String> meanings = meaningsOf(travel);

        // Scenario 8, step 4: 10 words of the topic, each with its meaning and 3 wrong ones from the same topic.
        String quiz = as(PLAYER, get("/api/games/{id}/play", games.quiz().getId()).param("topicId", String.valueOf(travel)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.gameType").value("QUICK_QUIZ"))
                .andExpect(jsonPath("$.timeLimitSeconds").value(60))
                .andExpect(jsonPath("$.topicId").value(travel))
                .andExpect(jsonPath("$.listId").value(nullValue()))
                .andExpect(jsonPath("$.playToken").isNotEmpty())
                .andExpect(jsonPath("$.questions[*].id", contains(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)))
                .andExpect(jsonPath("$.questions[0].options[*].id", contains(1, 2, 3, 4)))
                .andExpect(jsonPath("$.questions[0].phonetic").value("/trɪp/"))
                .andExpect(jsonPath("$.questions[0].example").value(nullValue()))
                .andExpect(jsonPath("$.questions[0].points").value(1))
                .andExpect(jsonPath("$.matchOptions").value(nullValue()))
                .andReturn().getResponse().getContentAsString();
        assertThat(quiz).doesNotContainIgnoringCase("correct");
        List<String> prompts = JsonPath.read(quiz, "$.questions[*].prompt");
        assertThat(meanings.keySet()).containsAll(prompts);
        assertThat(new HashSet<>(prompts)).hasSize(10);
        for (int index = 0; index < prompts.size(); index++) {
            List<String> options = JsonPath.read(quiz, "$.questions[" + index + "].options[*].content");
            assertThat(options).hasSize(4).doesNotHaveDuplicates().contains(meanings.get(prompts.get(index)));
            assertThat(meanings.values()).containsAll(options);
        }

        // GUESS_MEANING: 5 words with their example sentence (only 6 of the topic have one).
        String guess = as(PLAYER, get("/api/games/{id}/play", games.guess().getId()).param("topicId", String.valueOf(travel)))
                .andExpect(jsonPath("$.questions.length()").value(5))
                .andReturn().getResponse().getContentAsString();
        List<String> guessPrompts = JsonPath.read(guess, "$.questions[*].prompt");
        List<String> examples = JsonPath.read(guess, "$.questions[*].example");
        for (int index = 0; index < guessPrompts.size(); index++) {
            assertThat(examples.get(index)).isEqualTo("I like the " + guessPrompts.get(index) + " here.");
        }

        // WORD_MATCH: 8 words, and exactly their 8 meanings, shuffled.
        String match = as(PLAYER, get("/api/games/{id}/play", games.match().getId()).param("topicId", String.valueOf(travel)))
                .andExpect(jsonPath("$.questions.length()").value(8))
                .andExpect(jsonPath("$.questions[0].options.length()").value(0))
                .andExpect(jsonPath("$.matchOptions[*].id", contains(1, 2, 3, 4, 5, 6, 7, 8)))
                .andReturn().getResponse().getContentAsString();
        List<String> matchPrompts = JsonPath.read(match, "$.questions[*].prompt");
        List<String> matchMeanings = JsonPath.read(match, "$.matchOptions[*].content");
        assertThat(matchMeanings).containsExactlyInAnyOrderElementsOf(matchPrompts.stream().map(meanings::get).toList());

        // Branch 3a: not enough words.
        long small = topicWithWords("tiny", 3, 3);
        as(PLAYER, get("/api/games/{id}/play", games.quiz().getId()).param("topicId", String.valueOf(small)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
        as(PLAYER, get("/api/games/{id}/play", 999_999).param("topicId", String.valueOf(other))).andExpect(status().isNotFound());
    }

    @Test
    void aRoundCanBeDealtFromThePlayersOwnList() throws Exception {
        Games games = createGames();
        long travel = topicWithWords("trip", 6, 6);
        List<Long> ids = topicWords(travel).stream().map(Vocabulary::getId).toList();
        String body = as(PLAYER, post("/api/custom-lists").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"Phỏng vấn\", \"vocabularyIds\": " + ids
                                + ", \"newWords\": [{\"word\": \"icebreaker\", \"meaning\": \"câu mở đầu\"}]}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long listId = ((Number) JsonPath.read(body, "$.id")).longValue();

        String round = as(PLAYER, get("/api/games/{id}/play", games.match().getId()).param("listId", String.valueOf(listId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.listId").value(listId))
                .andExpect(jsonPath("$.questions.length()").value(7))
                .andReturn().getResponse().getContentAsString();
        assertThat(JsonPath.<List<String>>read(round, "$.questions[*].prompt")).contains("icebreaker");

        // Someone else's list does not exist for this player.
        as(OTHER_PLAYER, get("/api/games/{id}/play", games.match().getId()).param("listId", String.valueOf(listId)))
                .andExpect(status().isNotFound());
    }

    @Test
    void checkTellsWhetherAChoiceIsRightAndSavesNothing() throws Exception {
        Games games = createGames();
        long travel = topicWithWords("trip", 12, 6);
        Round round = play(PLAYER, games.quiz(), travel, null);
        long right = right(round, 1);
        long wrong = wrong(round, 1);

        check(PLAYER, games.quiz(), round.token(), 1, right)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.correct").value(true))
                .andExpect(jsonPath("$.correctOptionId").value(right));
        check(PLAYER, games.quiz(), round.token(), 1, wrong)
                .andExpect(jsonPath("$.correct").value(false))
                .andExpect(jsonPath("$.correctOptionId").value(right));

        // WORD_MATCH never tells the right pair, or one wrong try would give it away.
        Round match = play(PLAYER, games.match(), travel, null);
        check(PLAYER, games.match(), match.token(), 1, right(match, 2))
                .andExpect(jsonPath("$.correct").value(false))
                .andExpect(jsonPath("$.correctOptionId").value(nullValue()));
        check(PLAYER, games.match(), match.token(), 1, right(match, 1)).andExpect(jsonPath("$.correct").value(true));

        check(PLAYER, games.quiz(), round.token(), 11, right).andExpect(status().isBadRequest());
        check(PLAYER, games.quiz(), round.token(), 1, 5).andExpect(status().isBadRequest());
        check(OTHER_PLAYER, games.quiz(), round.token(), 1, right).andExpect(status().isBadRequest());
        check(PLAYER, games.match(), round.token(), 1, right).andExpect(status().isBadRequest());
        check(PLAYER, games.quiz(), round.token() + "x", 1, right).andExpect(status().isBadRequest());

        assertThat(sessionRepository.count()).isZero();
    }

    @Test
    void theServerGradesTheRoundAndListsTheWrongAnswers() throws Exception {
        Games games = createGames();
        long travel = topicWithWords("trip", 12, 6);

        Round perfect = play(PLAYER, games.quiz(), travel, null);
        String body = submit(PLAYER, games.quiz(), perfect.token(), perfect.answers(this::right))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sessionId").isNumber())
                .andExpect(jsonPath("$.correctCount").value(10))
                .andExpect(jsonPath("$.questionCount").value(10))
                .andExpect(jsonPath("$.score").value(100))
                .andExpect(jsonPath("$.timeBonus").value(0))
                .andExpect(jsonPath("$.durationSeconds").isNumber())
                .andExpect(jsonPath("$.bestScore").value(100))
                .andExpect(jsonPath("$.isPersonalBest").value(true))
                .andExpect(jsonPath("$.wrongAnswers.length()").value(0))
                .andReturn().getResponse().getContentAsString();
        long sessionId = ((Number) JsonPath.read(body, "$.sessionId")).longValue();
        Map<String, Object> saved = jdbcTemplate.queryForMap("select * from game_sessions where id = ?", sessionId);
        assertThat(saved.get("topic_id")).isEqualTo(travel);
        assertThat(saved.get("custom_list_id")).isNull();
        assertThat(saved.get("correct_count")).isEqualTo(10);
        assertThat(saved.get("question_count")).isEqualTo(10);
        assertThat(saved.get("score")).isEqualTo(100);
        assertThat(saved.get("duration_seconds")).isNotNull();

        // Scenario 8: 8 right out of 10 make 80 points; the two wrong ones are listed with what was chosen.
        Round eight = play(PLAYER, games.quiz(), travel, null);
        submit(PLAYER, games.quiz(), eight.token(), eight.answers((round, question) -> question <= 8 ? right(round, question) : wrong(round, question)))
                .andExpect(jsonPath("$.correctCount").value(8))
                .andExpect(jsonPath("$.score").value(80))
                .andExpect(jsonPath("$.bestScore").value(100))
                .andExpect(jsonPath("$.isPersonalBest").value(false))
                .andExpect(jsonPath("$.wrongAnswers[*].questionId", contains(9, 10)))
                .andExpect(jsonPath("$.wrongAnswers[0].word").value(eight.prompt(9)))
                .andExpect(jsonPath("$.wrongAnswers[0].correct").value("nghĩa " + eight.prompt(9)))
                .andExpect(jsonPath("$.wrongAnswers[0].chosen").value(eight.content(9, wrong(eight, 9))));

        // Branch 7a: the time ran out after 5 questions; the others are wrong, with nothing chosen.
        Round half = play(PLAYER, games.quiz(), travel, null);
        submit(PLAYER, games.quiz(), half.token(), half.answers((round, question) -> question <= 5 ? right(round, question) : null))
                .andExpect(jsonPath("$.correctCount").value(5))
                .andExpect(jsonPath("$.score").value(50))
                .andExpect(jsonPath("$.wrongAnswers.length()").value(5))
                .andExpect(jsonPath("$.wrongAnswers[0].chosen").value(nullValue()));
    }

    @Test
    void answersHandedInAfterTheTimeLimitCountAsWrong() throws Exception {
        Games games = createGames();
        long travel = topicWithWords("trip", 12, 6);
        List<Long> ids = topicWords(travel).stream().map(Vocabulary::getId).toList();
        // Each question offers its own word first: option 1 is always right.
        List<PlayRound.Question> questions = ids.subList(0, 10).stream()
                .map(id -> new PlayRound.Question(id, List.of(id, ids.get(10), ids.get(11), ids.get((int) (id % 10)))))
                .toList();
        String allFirst = "[" + java.util.stream.IntStream.rangeClosed(1, 10)
                .mapToObj(n -> "{\"questionId\": " + n + ", \"optionId\": 1}").collect(Collectors.joining(",")) + "]";
        Long gameId = games.quiz().getId();

        // Started 100 seconds ago: past the 60 seconds and the 3 seconds of grace.
        String late = tokens.seal(new PlayRound(gameId, PLAYER, calendar.now().minusSeconds(100), "late", travel, null, questions, List.of()));
        submit(PLAYER, games.quiz(), late, allFirst)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.correctCount").value(0))
                .andExpect(jsonPath("$.score").value(0))
                .andExpect(jsonPath("$.durationSeconds").value(60));

        // Started 62 seconds ago: within the grace, the answers count; the time played stops at the limit.
        String grace = tokens.seal(new PlayRound(gameId, PLAYER, calendar.now().minusSeconds(62), "grace", travel, null, questions, List.of()));
        submit(PLAYER, games.quiz(), grace, allFirst)
                .andExpect(jsonPath("$.correctCount").value(10))
                .andExpect(jsonPath("$.score").value(100))
                .andExpect(jsonPath("$.durationSeconds").value(60));
    }

    @Test
    void aRoundIsHandedInOnceAndOnlyWithItsOwnAnswers() throws Exception {
        Games games = createGames();
        long travel = topicWithWords("trip", 12, 6);
        Round round = play(PLAYER, games.quiz(), travel, null);

        // Refused answers do not use the round up...
        submit(PLAYER, games.quiz(), round.token(), "[{\"questionId\": 11, \"optionId\": null}]").andExpect(status().isBadRequest());
        submit(PLAYER, games.quiz(), round.token(), "[{\"questionId\": 1, \"optionId\": 5}]").andExpect(status().isBadRequest());
        submit(PLAYER, games.quiz(), round.token(), "[{\"questionId\": 1, \"optionId\": null}, {\"questionId\": 1, \"optionId\": null}]")
                .andExpect(status().isBadRequest());
        submit(PLAYER, games.quiz(), round.token(), "[{\"questionId\": 1, \"optionId\": null, \"responseTimeMs\": -1}]")
                .andExpect(status().isBadRequest());
        submit(OTHER_PLAYER, games.quiz(), round.token(), round.answers(this::right)).andExpect(status().isBadRequest());

        // ...so the round can still be handed in, once.
        submit(PLAYER, games.quiz(), round.token(), round.answers(this::right)).andExpect(status().isCreated());
        submit(PLAYER, games.quiz(), round.token(), round.answers(this::right))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
        assertThat(sessionRepository.count()).isEqualTo(1);
    }

    @Test
    void withoutATopicOrListARoundUsesEverySystemWord() throws Exception {
        Games games = createGames();
        topicWithWords("trip", 3, 3);
        topicWithWords("work", 3, 3);

        // Six system words over two topics: enough for a round (the screens of before 02/10 choose no topic).
        as(PLAYER, get("/api/games")).andExpect(jsonPath("$[1].questionCount").value(6));
        as(PLAYER, get("/api/games/{id}/play", games.quiz().getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.topicId").value(nullValue()))
                .andExpect(jsonPath("$.questions.length()").value(6));
    }

    @Test
    void theLeaderboardRanksPlayersByPeriodWithOnlyTheirGivenNames() throws Exception {
        Games games = createGames();
        Game guess = games.guess();
        Game quiz = games.quiz();
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

    private record Games(Game guess, Game quiz, Game match) {
    }

    /**
     * A round as played: its token, each question's prompt and options (id → text), and the WORD_MATCH meanings.
     * Question n is at index n - 1.
     */
    private record Round(String token, List<String> prompts, List<Map<Long, String>> options, Map<Long, String> matchOptions) {

        String prompt(long question) {
            return prompts.get((int) question - 1);
        }

        Map<Long, String> optionsOf(long question) {
            return matchOptions.isEmpty() ? options.get((int) question - 1) : matchOptions;
        }

        String content(long question, long option) {
            return optionsOf(question).get(option);
        }

        String answers(BiFunction<Round, Long, Long> choose) {
            List<String> items = new ArrayList<>();
            for (long question = 1; question <= prompts.size(); question++) {
                Long option = choose.apply(this, question);
                items.add("{\"questionId\": " + question + ", \"optionId\": " + option + ", \"responseTimeMs\": 1500}");
            }
            return "[" + String.join(",", items) + "]";
        }
    }

    /** The option holding the question word's meaning. */
    private long right(Round round, long question) {
        String meaning = "nghĩa " + round.prompt(question);
        return round.optionsOf(question).entrySet().stream()
                .filter(entry -> entry.getValue().equals(meaning)).findFirst().orElseThrow().getKey();
    }

    private long wrong(Round round, long question) {
        long right = right(round, question);
        return round.optionsOf(question).keySet().stream().filter(id -> id != right).findFirst().orElseThrow();
    }

    private ResultActions as(long userId, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.with(TestAuth.learner(userId)));
    }

    private Round play(long userId, Game game, Long topicId, Long listId) throws Exception {
        MockHttpServletRequestBuilder request = get("/api/games/{id}/play", game.getId());
        if (topicId != null) {
            request.param("topicId", String.valueOf(topicId));
        }
        if (listId != null) {
            request.param("listId", String.valueOf(listId));
        }
        String body = as(userId, request).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        List<String> prompts = JsonPath.read(body, "$.questions[*].prompt");
        List<Map<Long, String>> options = new ArrayList<>();
        for (int index = 0; index < prompts.size(); index++) {
            options.add(optionMap(JsonPath.read(body, "$.questions[" + index + "].options")));
        }
        List<Map<String, Object>> match = JsonPath.read(body, "$.matchOptions");
        return new Round(JsonPath.read(body, "$.playToken"), prompts, options, match == null ? Map.of() : optionMap(match));
    }

    private static Map<Long, String> optionMap(List<Map<String, Object>> options) {
        Map<Long, String> map = new LinkedHashMap<>();
        options.forEach(option -> map.put(((Number) option.get("id")).longValue(), (String) option.get("content")));
        return map;
    }

    private ResultActions check(long userId, Game game, String token, long questionId, long optionId) throws Exception {
        return as(userId, post("/api/games/{id}/check", game.getId()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"playToken\": \"" + token + "\", \"questionId\": " + questionId + ", \"optionId\": " + optionId + "}"));
    }

    private ResultActions submit(long userId, Game game, String token, String answers) throws Exception {
        return as(userId, post("/api/games/{id}/sessions", game.getId()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"playToken\": \"" + token + "\", \"answers\": " + answers + "}"));
    }

    /** The three games, with the time limits of the seed migration (H2 does not run migrations). */
    private Games createGames() {
        return new Games(
                gameRepository.save(new Game("Đoán nghĩa", GameType.GUESS_MEANING, 90)),
                gameRepository.save(new Game("Trắc nghiệm nhanh", GameType.QUICK_QUIZ, 60)),
                gameRepository.save(new Game("Ghép từ", GameType.WORD_MATCH, 60)));
    }

    /** A topic of system words "{prefix}{n}" meaning "nghĩa {prefix}{n}"; the first {@code withExamples} have an example. */
    private long topicWithWords(String prefix, int words, int withExamples) {
        Topic topic = topicRepository.save(new Topic(prefix + " topic", null, null));
        for (int n = 0; n < words; n++) {
            String word = prefix + n;
            vocabularyRepository.save(new Vocabulary(
                    topic.getId(), null, word, "nghĩa " + word,
                    n < withExamples ? "I like the " + word + " here." : null,
                    "/" + (prefix.equals("trip") ? "trɪp" : prefix) + "/", null, null, CefrLevel.A1));
        }
        return topic.getId();
    }

    private List<Vocabulary> topicWords(long topicId) {
        return vocabularyRepository.findAllVisibleInTopic(topicId, PLAYER).stream()
                .sorted((a, b) -> Long.compare(a.getId(), b.getId())).toList();
    }

    private Map<String, String> meaningsOf(long topicId) {
        return topicWords(topicId).stream().collect(Collectors.toMap(Vocabulary::getWord, Vocabulary::getMeaning));
    }

    private void user(long id, String fullName) {
        jdbcTemplate.update("""
                insert into users (id, full_name, email, password_hash, role, status, created_at)
                values (?, ?, ?, 'hash', 'learner', 'active', ?)
                """, id, fullName, "player" + id + "@example.com", Timestamp.from(Instant.now()));
    }

    private void session(Game game, long userId, int score, Instant playedAt) {
        sessionRepository.save(new GameSession(game.getId(), userId, null, null, score / 10, Math.max(10, score / 10), score, 30, playedAt));
    }
}
