package com.example.datn.modules.vocabulary;

import com.example.datn.common.test.WordQuestionLookup;
import com.example.datn.common.test.WordQuestionLookup.TestRef;
import com.example.datn.modules.vocabulary.entity.Game;
import com.example.datn.modules.vocabulary.enums.GameType;
import com.example.datn.modules.vocabulary.repository.GameRepository;
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
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Admin rules for topics and words of docs/api/admin.md (scenarios 19–22 and step 6 of scenario 24) on H2. The unique
 * indexes and the lower-case status column run on the real schema in AdminVocabularyPostgresIntegrationTests.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AdminVocabularyApiTests {

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

    @Autowired
    private GameRepository gameRepository;

    // The test module does not implement the lookup yet; a test that needs questions says which words they use.
    @MockitoBean
    private WordQuestionLookup questionLookup;

    @Test
    void adminTopicsCountTheVisibleSystemWordsAndTheirLearners() throws Exception {
        long travel = createTopic("Travel");
        long empty = createTopic("Empty");
        long airport = createWord(travel, "airport", "sân bay", "B1", "The airport is busy.", "/media/airport.mp3");
        createWord(travel, "hotel", "khách sạn", "A2", null, null);
        long visa = createWord(travel, "visa", "thị thực", "C1", "I need a visa.", null);
        LocalDate today = calendar.today();
        studied(LEARNER, airport, today);
        studied(OTHER_LEARNER, airport, today);
        studied(LEARNER, visa, today);
        expectHidden(visa);

        asAdmin(get("/api/admin/topics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", contains((int) travel, (int) empty)))
                .andExpect(jsonPath("$[0].name").value("Travel"))
                .andExpect(jsonPath("$[0].wordCount").value(2))
                .andExpect(jsonPath("$[0].minLevel").value("A2"))
                .andExpect(jsonPath("$[0].maxLevel").value("B1"))
                .andExpect(jsonPath("$[0].missingAudioCount").value(1))
                .andExpect(jsonPath("$[0].missingExampleCount").value(1))
                .andExpect(jsonPath("$[0].learnerCount").value(2))
                .andExpect(jsonPath("$[0].updatedAt").isNotEmpty())
                .andExpect(jsonPath("$[1].wordCount").value(0))
                .andExpect(jsonPath("$[1].minLevel").value(nullValue()))
                .andExpect(jsonPath("$[1].maxLevel").value(nullValue()))
                .andExpect(jsonPath("$[1].learnerCount").value(0));

        as(LEARNER, get("/api/admin/topics")).andExpect(status().isForbidden());
    }

    @Test
    void adminWordListFiltersVisibleSystemWordsAndShowsWhatUsesEach() throws Exception {
        long travel = createTopic("Travel");
        long food = createTopic("Food");
        long airport = createWord(travel, "airport", "sân bay", "B1", "The airport is busy.", "/media/airport.mp3");
        long hotel = createWord(travel, "hotel", "khách sạn", "A2", null, null);
        createWord(travel, "Airline", "hãng hàng không", "B2", "Which airline do you fly with?", null);
        long visa = createWord(travel, "visa", "thị thực", "C1", null, null);
        createWord(food, "apple", "quả táo", "A1", "An apple a day.", null);
        LocalDate today = calendar.today();
        studied(LEARNER, airport, today);
        studied(OTHER_LEARNER, airport, today);
        studied(LEARNER, visa, today);
        expectHidden(visa);
        createList(LEARNER, "Trip", "[" + airport + ", " + hotel + "]",
                "[{\"word\": \"souvenir\", \"meaning\": \"quà lưu niệm\"}]");
        when(questionLookup.countQuestionsByWord(anyCollection())).thenReturn(Map.of(hotel, 2L));
        when(questionLookup.openTestsByWord(anyCollection()))
                .thenReturn(Map.of(hotel, List.of(new TestRef(100L, "Kiểm tra định kỳ — tuần 40"))));

        // Neither the hidden "visa" nor the learner's own "souvenir"; easiest first, like the learners' list.
        asAdmin(get("/api/admin/vocabulary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[*].word", contains("apple", "hotel", "airport", "Airline")))
                .andExpect(jsonPath("$.size").value(10))
                .andExpect(jsonPath("$.totalItems").value(4));

        asAdmin(get("/api/admin/vocabulary").param("topicId", String.valueOf(travel)))
                .andExpect(jsonPath("$.items[*].word", contains("hotel", "airport", "Airline")))
                .andExpect(jsonPath("$.items[0].learnerCount").value(0))
                .andExpect(jsonPath("$.items[0].listCount").value(1))
                .andExpect(jsonPath("$.items[0].questionCount").value(2))
                .andExpect(jsonPath("$.items[0].openTests[0].id").value(100))
                .andExpect(jsonPath("$.items[0].openTests[0].title").value("Kiểm tra định kỳ — tuần 40"))
                .andExpect(jsonPath("$.items[1].learnerCount").value(2))
                .andExpect(jsonPath("$.items[1].listCount").value(1))
                .andExpect(jsonPath("$.items[1].questionCount").value(0))
                .andExpect(jsonPath("$.items[1].openTests").isEmpty())
                .andExpect(jsonPath("$.items[1].audioUrl").value("/media/airport.mp3"))
                .andExpect(jsonPath("$.items[1].updatedAt").isNotEmpty());

        asAdmin(get("/api/admin/vocabulary").param("q", " AIR "))
                .andExpect(jsonPath("$.items[*].word", contains("airport", "Airline")));
        asAdmin(get("/api/admin/vocabulary").param("q", "khách"))
                .andExpect(jsonPath("$.items[*].word", contains("hotel")));
        asAdmin(get("/api/admin/vocabulary").param("level", "B2"))
                .andExpect(jsonPath("$.items[*].word", contains("Airline")));
        asAdmin(get("/api/admin/vocabulary").param("missing", "AUDIO"))
                .andExpect(jsonPath("$.items[*].word", contains("apple", "hotel", "Airline")));
        asAdmin(get("/api/admin/vocabulary").param("missing", "EXAMPLE"))
                .andExpect(jsonPath("$.items[*].word", contains("hotel")));
        asAdmin(get("/api/admin/vocabulary").param("missing", "IMAGE"))
                .andExpect(jsonPath("$.totalItems").value(4));
        asAdmin(get("/api/admin/vocabulary").param("size", "2").param("page", "1"))
                .andExpect(jsonPath("$.items[*].word", contains("airport", "Airline")))
                .andExpect(jsonPath("$.totalPages").value(2));
    }

    @Test
    void rejectsInvalidAdminListParametersAndLearners() throws Exception {
        asAdmin(get("/api/admin/vocabulary").param("missing", "VIDEO"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
        asAdmin(get("/api/admin/vocabulary").param("level", "Z9")).andExpect(status().isBadRequest());
        asAdmin(get("/api/admin/vocabulary").param("page", "-1")).andExpect(status().isBadRequest());
        asAdmin(get("/api/admin/vocabulary").param("size", "0")).andExpect(status().isBadRequest());
        asAdmin(get("/api/admin/vocabulary").param("size", "51")).andExpect(status().isBadRequest());
        asAdmin(get("/api/admin/vocabulary").param("size", "50")).andExpect(status().isOk());

        as(LEARNER, get("/api/admin/vocabulary")).andExpect(status().isForbidden());
        as(LEARNER, get("/api/admin/vocabulary/{id}/test-question", 1)).andExpect(status().isForbidden());
    }

    @Test
    void deletingAWordInUseHidesItFromLearnersButKeepsTheirProgress() throws Exception {
        long travel = createTopic("Travel");
        long airport = createWord(travel, "airport", "sân bay", "B1");
        createWord(travel, "hotel", "khách sạn", "A1");
        createWord(travel, "ticket", "vé", "A2");
        studied(LEARNER, airport, calendar.today());
        as(LEARNER, get("/api/learning/summary"))
                .andExpect(jsonPath("$.dueToday").value(1))
                .andExpect(jsonPath("$.learningCount").value(1));

        expectHidden(airport);

        // Scenario 21, step 8: learners no longer meet the word anywhere...
        String topic = String.valueOf(travel);
        as(LEARNER, get("/api/vocabulary").param("topicId", topic))
                .andExpect(jsonPath("$.items[*].word", contains("hotel", "ticket")));
        as(LEARNER, get("/api/vocabulary").param("q", "airport")).andExpect(jsonPath("$.totalItems").value(0));
        as(LEARNER, get("/api/vocabulary/{id}", airport)).andExpect(status().isNotFound());
        as(LEARNER, get("/api/topics/{id}", travel))
                .andExpect(jsonPath("$.wordCount").value(2))
                .andExpect(jsonPath("$.dueCount").value(0));
        as(LEARNER, get("/api/learning/session").param("topicId", topic))
                .andExpect(jsonPath("$.cards[*].word", contains("hotel", "ticket")));
        as(LEARNER, get("/api/learning/session")).andExpect(jsonPath("$.cards").isEmpty());
        as(LEARNER, post("/api/learning/reviews")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"vocabularyId\": " + airport + ", \"result\": \"VAGUE\"}"))
                .andExpect(status().isNotFound());

        // ...but what they did with it stays: still learned, never due again.
        as(LEARNER, get("/api/learning/summary"))
                .andExpect(jsonPath("$.dueToday").value(0))
                .andExpect(jsonPath("$.learningCount").value(1));
        as(LEARNER, get("/api/learning/history")).andExpect(jsonPath("$.items[*].word", contains("airport")));
        entityManager.flush();
        assertThat(count("select count(*) from user_vocabulary where vocabulary_id = " + airport)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("select status from vocabulary where id = ?", String.class, airport))
                .isEqualTo("hidden");

        // The admin area does not list it any more, nor edit or delete it again.
        asAdmin(get("/api/admin/vocabulary").param("topicId", topic))
                .andExpect(jsonPath("$.items[*].word", contains("hotel", "ticket")));
        asAdmin(put("/api/vocabulary/{id}", airport)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(wordJson(travel, "airport", "sân bay", "B1", null, null)))
                .andExpect(status().isNotFound());
        asAdmin(delete("/api/vocabulary/{id}", airport)).andExpect(status().isNotFound());
    }

    @Test
    void aWordInAListOrATestQuestionIsHiddenAndAnUnusedWordDeleted() throws Exception {
        long travel = createTopic("Travel");
        long passport = createWord(travel, "passport", "hộ chiếu", "A2");
        long customs = createWord(travel, "customs", "hải quan", "B1");
        long souvenir = createWord(travel, "souvenir", "quà lưu niệm", "B1");
        long list = createList(OTHER_LEARNER, "Trip", "[" + passport + "]", "[]");
        when(questionLookup.countQuestionsByWord(anyCollection())).thenReturn(Map.of(customs, 1L));

        expectHidden(passport);
        as(OTHER_LEARNER, get("/api/custom-lists/{id}", list)).andExpect(jsonPath("$.wordCount").value(0));
        as(OTHER_LEARNER, get("/api/custom-lists/{id}/words", list)).andExpect(jsonPath("$.totalItems").value(0));
        as(OTHER_LEARNER, post("/api/custom-lists/{id}/words", list)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"vocabularyId\": " + passport + "}"))
                .andExpect(status().isNotFound());

        expectHidden(customs);

        asAdmin(delete("/api/vocabulary/{id}", souvenir))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result").value("DELETED"));
        entityManager.flush();
        assertThat(count("select count(*) from vocabulary where id = " + souvenir)).isZero();
        assertThat(count("select count(*) from vocabulary where id in (" + passport + ", " + customs + ")")).isEqualTo(2);
    }

    @Test
    void hiddenWordsLeaveTheGameRoundsOfTheirTopic() throws Exception {
        gameRepository.save(new Game("Trắc nghiệm nhanh", GameType.QUICK_QUIZ, 60));
        long topic = createTopic("Numbers");
        long one = createWord(topic, "one", "một", "A1");
        createWord(topic, "two", "hai", "A1");
        createWord(topic, "three", "ba", "A1");
        createWord(topic, "four", "bốn", "A1");
        as(LEARNER, get("/api/games").param("topicId", String.valueOf(topic)))
                .andExpect(jsonPath("$[0].available").value(true));

        studied(OTHER_LEARNER, one, calendar.today());
        expectHidden(one);

        // Three words left, fewer than the four choices of a question.
        as(LEARNER, get("/api/games").param("topicId", String.valueOf(topic)))
                .andExpect(jsonPath("$[0].available").value(false))
                .andExpect(jsonPath("$[0].unavailableReason").value("NOT_ENOUGH_WORDS"));
    }

    @Test
    void topicNamesAndWordsInATopicAreUniqueIgnoringCase() throws Exception {
        long travel = createTopic("Du lịch");
        asAdmin(post("/api/topics").contentType(MediaType.APPLICATION_JSON).content("{\"name\": \"  du LỊCH \"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
        long shopping = createTopic("Mua sắm");
        asAdmin(put("/api/topics/{id}", shopping).contentType(MediaType.APPLICATION_JSON).content("{\"name\": \"DU LỊCH\"}"))
                .andExpect(status().isConflict());
        // Renaming a topic to its own name in other letters is no clash.
        asAdmin(put("/api/topics/{id}", shopping).contentType(MediaType.APPLICATION_JSON).content("{\"name\": \" MUA SẮM \"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("MUA SẮM"));

        long airport = createWord(travel, "airport", "sân bay", "B1");
        postWord(travel, "  AIRPORT ", "sân bay", "B1").andExpect(status().isConflict());
        postWord(shopping, "airport", "sân bay", "B1").andExpect(status().isCreated());
        long hotel = createWord(travel, "hotel", "khách sạn", "A1");
        putWord(hotel, travel, "Airport", "khách sạn", "A1").andExpect(status().isConflict());
        putWord(hotel, travel, "HOTEL", "khách sạn", "A1")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.word").value("HOTEL"));

        // A hidden word no longer takes its text: the admin can add the word again.
        studied(LEARNER, airport, calendar.today());
        expectHidden(airport);
        postWord(travel, "airport", "sân bay", "B1").andExpect(status().isCreated());
    }

    @Test
    void aTopicThatStillHasWordsIsNotDeleted() throws Exception {
        long travel = createTopic("Travel");
        long airport = createWord(travel, "airport", "sân bay", "B1");
        asAdmin(delete("/api/topics/{id}", travel))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Topic still has 1 words"));

        // A hidden word still belongs to its topic, where the learners' history shows it.
        studied(LEARNER, airport, calendar.today());
        expectHidden(airport);
        asAdmin(delete("/api/topics/{id}", travel)).andExpect(status().isConflict());
        asAdmin(get("/api/topics/{id}", travel)).andExpect(status().isOk());

        long empty = createTopic("Empty");
        asAdmin(delete("/api/topics/{id}", empty)).andExpect(status().isNoContent());
        asAdmin(get("/api/topics/{id}", empty)).andExpect(status().isNotFound());
    }

    @Test
    void savesTrimmedTextBlanksAsNothingAndStampsTheChange() throws Exception {
        String topic = asAdmin(post("/api/topics")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"  Mua sắm  \", \"description\": \"   \", \"imageUrl\": \"\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Mua sắm"))
                .andExpect(jsonPath("$.description").value(nullValue()))
                .andExpect(jsonPath("$.imageUrl").value(nullValue()))
                .andReturn().getResponse().getContentAsString();
        long topicId = ((Number) JsonPath.read(topic, "$.id")).longValue();

        asAdmin(post("/api/vocabulary")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"topicId": %d, "word": "  receipt ", "meaning": " hóa đơn ", "phonetic": "",
                                 "exampleSentence": "   ", "audioUrl": " ", "difficultyLevel": "B1"}
                                """.formatted(topicId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.word").value("receipt"))
                .andExpect(jsonPath("$.meaning").value("hóa đơn"))
                .andExpect(jsonPath("$.phonetic").value(nullValue()))
                .andExpect(jsonPath("$.exampleSentence").value(nullValue()))
                .andExpect(jsonPath("$.audioUrl").value(nullValue()));

        asAdmin(get("/api/admin/topics"))
                .andExpect(jsonPath("$[0].updatedAt").isNotEmpty())
                .andExpect(jsonPath("$[0].missingAudioCount").value(1))
                .andExpect(jsonPath("$[0].missingExampleCount").value(1));
        asAdmin(get("/api/admin/vocabulary")).andExpect(jsonPath("$.items[0].updatedAt").isNotEmpty());
    }

    @Test
    void makesAMultipleChoiceQuestionFromAWord() throws Exception {
        long travel = createTopic("Travel");
        long customs = createWord(travel, "customs", "hải quan", "B1", "Customs officers checked our bags at the airport.", null);
        long luggage = createWord(travel, "luggage", "hành lý", "A2", "My luggage is heavy.", null);
        createWord(travel, "baggage", "hành lý", "A2", null, null);
        createWord(travel, "departure", "sự khởi hành", "B1", null, null);
        createWord(travel, "itinerary", "lịch trình", "B2", null, null);
        long art = createWord(travel, "art", "nghệ thuật", "A2", "We start the art tour at nine.", null);
        long hotel = createWord(travel, "hotel", "khách sạn", "A1", null, null);

        // The blank replaces the word in its example; a blank that starts the sentence takes capitalised choices.
        String question = asAdmin(get("/api/admin/vocabulary/{id}/test-question", customs))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.skill").value("READING"))
                .andExpect(jsonPath("$.type").value("MULTIPLE_CHOICE"))
                .andExpect(jsonPath("$.points").value(1))
                .andExpect(jsonPath("$.audioUrl").value(nullValue()))
                .andExpect(jsonPath("$.vocabularyId").value(customs))
                .andExpect(jsonPath("$.materialIndex").value(nullValue()))
                .andExpect(jsonPath("$.acceptedAnswers").isEmpty())
                .andExpect(jsonPath("$.content").value("___ officers checked our bags at the airport."))
                .andExpect(jsonPath("$.options.length()").value(4))
                .andExpect(jsonPath("$.options[?(@.correct == true)].text", contains("Customs")))
                .andReturn().getResponse().getContentAsString();
        assertThat(JsonPath.<List<String>>read(question, "$.options[*].text"))
                .doesNotHaveDuplicates()
                .allSatisfy(text -> assertThat(Character.isUpperCase(text.charAt(0))).as(text).isTrue());
        // The same word gives the same question each time.
        asAdmin(get("/api/admin/vocabulary/{id}/test-question", customs)).andExpect(content().string(question));

        // No wrong choice shares the word's meaning: "baggage" also means "hành lý".
        String luggageQuestion = asAdmin(get("/api/admin/vocabulary/{id}/test-question", luggage))
                .andExpect(jsonPath("$.content").value("My ___ is heavy."))
                .andExpect(jsonPath("$.options[?(@.correct == true)].text", contains("luggage")))
                .andReturn().getResponse().getContentAsString();
        assertThat(JsonPath.<List<String>>read(luggageQuestion, "$.options[*].text")).hasSize(4).doesNotContain("baggage");

        // Only the whole word is blanked, not the "art" inside "start".
        asAdmin(get("/api/admin/vocabulary/{id}/test-question", art))
                .andExpect(jsonPath("$.content").value("We start the ___ tour at nine."));
        // Without an example sentence the question asks for the word with that meaning.
        asAdmin(get("/api/admin/vocabulary/{id}/test-question", hotel))
                .andExpect(jsonPath("$.content").value("Which word means “khách sạn”?"));
    }

    @Test
    void aQuestionNeedsAVisibleSystemWordAndThreeOtherWordsInItsTopic() throws Exception {
        long animals = createTopic("Animals");
        long cat = createWord(animals, "cat", "con mèo", "A1");
        createWord(animals, "dog", "con chó", "A1");
        createWord(animals, "bird", "con chim", "A1");
        asAdmin(get("/api/admin/vocabulary/{id}/test-question", cat))
                .andExpect(status().is(422))
                .andExpect(jsonPath("$.status").value(422));
        long fish = createWord(animals, "fish", "con cá", "A1");
        asAdmin(get("/api/admin/vocabulary/{id}/test-question", cat)).andExpect(status().isOk());

        long withoutTopic = createWord(null, "hello", "xin chào", "A1");
        asAdmin(get("/api/admin/vocabulary/{id}/test-question", withoutTopic)).andExpect(status().is(422));

        studied(LEARNER, cat, calendar.today());
        expectHidden(cat);
        asAdmin(get("/api/admin/vocabulary/{id}/test-question", cat)).andExpect(status().isNotFound());

        createList(LEARNER, "Mine", "[]", "[{\"word\": \"kite\", \"meaning\": \"con diều\"}]");
        entityManager.flush();
        long own = jdbcTemplate.queryForObject("select id from vocabulary where created_by = ?", Long.class, LEARNER);
        asAdmin(get("/api/admin/vocabulary/{id}/test-question", own)).andExpect(status().isNotFound());
        asAdmin(get("/api/admin/vocabulary/{id}/test-question", 999_999)).andExpect(status().isNotFound());
        // The hidden "cat" is no wrong choice either: "fish" is left with two other words.
        asAdmin(get("/api/admin/vocabulary/{id}/test-question", fish)).andExpect(status().is(422));
    }

    private ResultActions asAdmin(MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.with(TestAuth.admin()));
    }

    private ResultActions as(long userId, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.with(TestAuth.learner(userId)));
    }

    /** Deletes a word that something uses: it must be hidden, not removed. */
    private void expectHidden(long vocabularyId) throws Exception {
        asAdmin(delete("/api/vocabulary/{id}", vocabularyId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result").value("HIDDEN"));
    }

    private long createTopic(String name) throws Exception {
        String body = asAdmin(post("/api/topics")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"" + name + "\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(body, "$.id")).longValue();
    }

    private long createWord(Long topicId, String word, String meaning, String level) throws Exception {
        return createWord(topicId, word, meaning, level, null, null);
    }

    private long createWord(Long topicId, String word, String meaning, String level, String example, String audioUrl)
            throws Exception {
        String body = asAdmin(post("/api/vocabulary")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(wordJson(topicId, word, meaning, level, example, audioUrl)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(body, "$.id")).longValue();
    }

    private ResultActions postWord(Long topicId, String word, String meaning, String level) throws Exception {
        return asAdmin(post("/api/vocabulary")
                .contentType(MediaType.APPLICATION_JSON)
                .content(wordJson(topicId, word, meaning, level, null, null)));
    }

    private ResultActions putWord(long id, Long topicId, String word, String meaning, String level) throws Exception {
        return asAdmin(put("/api/vocabulary/{id}", id)
                .contentType(MediaType.APPLICATION_JSON)
                .content(wordJson(topicId, word, meaning, level, null, null)));
    }

    private long createList(long userId, String name, String vocabularyIds, String newWords) throws Exception {
        String body = as(userId, post("/api/custom-lists")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"" + name + "\", \"vocabularyIds\": " + vocabularyIds
                                + ", \"newWords\": " + newWords + "}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(body, "$.id")).longValue();
    }

    /** A word the learner reviewed yesterday, due again on {@code nextReviewAt}. */
    private void studied(long userId, long vocabularyId, LocalDate nextReviewAt) {
        Timestamp yesterday = Timestamp.from(calendar.now().minus(Duration.ofDays(1)));
        jdbcTemplate.update("""
                insert into user_vocabulary (user_id, vocabulary_id, status, last_review_result, review_count,
                                             interval_days, next_review_at, last_reviewed_at, first_learned_at)
                values (?, ?, 'learning', 'vague', 1, 1, ?, ?, ?)
                """, userId, vocabularyId, nextReviewAt, yesterday, yesterday);
    }

    private int count(String sql) {
        return jdbcTemplate.queryForObject(sql, Integer.class);
    }

    private static String wordJson(Long topicId, String word, String meaning, String level, String example, String audioUrl) {
        return "{\"topicId\": " + topicId + ", \"word\": " + quote(word) + ", \"meaning\": " + quote(meaning)
                + ", \"exampleSentence\": " + quote(example) + ", \"audioUrl\": " + quote(audioUrl)
                + ", \"difficultyLevel\": \"" + level + "\"}";
    }

    private static String quote(String value) {
        return value == null ? "null" : "\"" + value.replace("\"", "\\\"") + "\"";
    }
}
