package com.example.datn.modules.vocabulary.service;

import com.example.datn.common.security.CurrentUser;
import com.example.datn.modules.vocabulary.dto.request.CheckGameAnswerRequest;
import com.example.datn.modules.vocabulary.dto.request.SubmitGameRequest;
import com.example.datn.modules.vocabulary.dto.response.CheckResponse;
import com.example.datn.modules.vocabulary.dto.response.GameResponse;
import com.example.datn.modules.vocabulary.dto.response.PlayResponse;
import com.example.datn.modules.vocabulary.dto.response.SubmitGameResponse;
import com.example.datn.modules.vocabulary.entity.Game;
import com.example.datn.modules.vocabulary.entity.GameSession;
import com.example.datn.modules.vocabulary.entity.Vocabulary;
import com.example.datn.modules.vocabulary.enums.GameType;
import com.example.datn.modules.vocabulary.enums.GameUnavailableReason;
import com.example.datn.modules.vocabulary.exception.GameNotFoundException;
import com.example.datn.modules.vocabulary.exception.InvalidGameAnswerException;
import com.example.datn.modules.vocabulary.exception.InvalidGameSourceException;
import com.example.datn.modules.vocabulary.exception.InvalidPlayTokenException;
import com.example.datn.modules.vocabulary.exception.NotEnoughWordsException;
import com.example.datn.modules.vocabulary.exception.TopicNotFoundException;
import com.example.datn.modules.vocabulary.repository.GameCounts;
import com.example.datn.modules.vocabulary.repository.GameRepository;
import com.example.datn.modules.vocabulary.repository.GameSessionRepository;
import com.example.datn.modules.vocabulary.repository.TopicRepository;
import com.example.datn.modules.vocabulary.repository.VocabularyRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

/**
 * The vocabulary games (scenario 8, docs/api/games.md). A round is dealt when it starts from the words of the topic
 * or personal list the player chose (the Business model: "trò chơi lấy câu hỏi trực tiếp từ kho từ vựng"): random
 * words, each with three wrong meanings taken from other words of the same topic or list. The browser never learns the
 * right answers in advance: they travel in the encrypted playToken, each choice is checked by {@link #check}, and
 * {@link #submit} grades the whole round again from the answers.
 */
@Service
@Transactional
public class GameService {

    /** Options of a choice question: the right meaning and three wrong ones. */
    static final int OPTIONS_PER_QUESTION = GameType.MIN_WORDS;

    private final GameRepository gameRepository;
    private final GameSessionRepository sessionRepository;
    private final VocabularyRepository vocabularyRepository;
    private final TopicRepository topicRepository;
    private final CustomListService customListService;
    private final PlayTokenService tokens;
    private final CurrentUser currentUser;
    private final StudyCalendar calendar;

    public GameService(
            GameRepository gameRepository,
            GameSessionRepository sessionRepository,
            VocabularyRepository vocabularyRepository,
            TopicRepository topicRepository,
            CustomListService customListService,
            PlayTokenService tokens,
            CurrentUser currentUser,
            StudyCalendar calendar) {
        this.gameRepository = gameRepository;
        this.sessionRepository = sessionRepository;
        this.vocabularyRepository = vocabularyRepository;
        this.topicRepository = topicRepository;
        this.customListService = customListService;
        this.tokens = tokens;
        this.currentUser = currentUser;
        this.calendar = calendar;
    }

    /**
     * Every game, with how many questions a round has with the words chosen, whether they are enough (branch 3a), and
     * the player's best score. Without a topic or list: every system word.
     */
    @Transactional(readOnly = true)
    public List<GameResponse> findAll(Long topicId, Long listId) {
        WordPool pool = poolOf(topicId, listId);
        Map<Long, Long> bestScores = sessionRepository.bestScores(currentUser.id()).stream()
                .collect(Collectors.toMap(GameCounts::gameId, GameCounts::value));
        return gameRepository.findAll(Sort.by("id")).stream()
                .map(game -> {
                    GameType type = game.getGameType();
                    GameUnavailableReason reason = pool.unavailableReason(type);
                    Long best = bestScores.get(game.getId());
                    return new GameResponse(
                            game.getId(),
                            game.getName(),
                            type,
                            game.getTimeLimitSeconds(),
                            reason == null ? pool.questionCount(type) : 0,
                            best == null ? null : Math.toIntExact(best),
                            reason == null,
                            reason);
                })
                .toList();
    }

    /** A new round on the words chosen: 400 when they are not enough for this game. */
    @Transactional(readOnly = true)
    public PlayResponse play(Long gameId, Long topicId, Long listId) {
        Game game = requireGame(gameId);
        GameType type = game.getGameType();
        WordPool pool = poolOf(topicId, listId);
        GameUnavailableReason reason = pool.unavailableReason(type);
        if (reason != null) {
            throw new NotEnoughWordsException(reason);
        }

        Random random = ThreadLocalRandom.current();
        List<Vocabulary> asked = new ArrayList<>(pool.questionCandidates(type));
        Collections.shuffle(asked, random);
        asked = asked.subList(0, pool.questionCount(type));

        List<PlayRound.Question> questions = new ArrayList<>();
        for (Vocabulary word : asked) {
            List<Long> options = List.of();
            if (type.hasOptionsPerQuestion()) {
                List<Long> wrong = pool.words().stream()
                        .map(Vocabulary::getId)
                        .filter(id -> !id.equals(word.getId()))
                        .collect(Collectors.toCollection(ArrayList::new));
                Collections.shuffle(wrong, random);
                List<Long> choices = new ArrayList<>(wrong.subList(0, OPTIONS_PER_QUESTION - 1));
                choices.add(word.getId());
                Collections.shuffle(choices, random);
                options = choices;
            }
            questions.add(new PlayRound.Question(word.getId(), options));
        }
        List<Long> matchIds = new ArrayList<>();
        if (type == GameType.WORD_MATCH) {
            asked.forEach(word -> matchIds.add(word.getId()));
            Collections.shuffle(matchIds, random);
        }

        PlayRound round = tokens.newRound(gameId, currentUser.id(), topicId, listId, questions, matchIds);
        Map<Long, Vocabulary> words = pool.byId();
        List<PlayResponse.Question> shown = IntStream.range(0, questions.size()).mapToObj(index -> {
            PlayRound.Question question = questions.get(index);
            Vocabulary word = words.get(question.vocabularyId());
            return new PlayResponse.Question(
                    (long) index + 1,
                    word.getWord(),
                    word.getPhonetic(),
                    type.needsExample() ? word.getExampleSentence() : null,
                    1,
                    options(question.optionVocabularyIds(), words));
        }).toList();
        return new PlayResponse(
                gameId,
                type,
                game.getTimeLimitSeconds(),
                topicId,
                listId,
                tokens.seal(round),
                shown,
                type == GameType.WORD_MATCH ? options(matchIds, words) : null);
    }

    /** Whether one choice is right, for the immediate right/wrong feedback. Saves nothing. */
    @Transactional(readOnly = true)
    public CheckResponse check(Long gameId, CheckGameAnswerRequest request) {
        GameType type = requireGame(gameId).getGameType();
        PlayRound round = tokens.verify(request.playToken(), gameId, currentUser.id());
        PlayRound.Question question = round.question(request.questionId());
        if (question == null) {
            throw new InvalidGameAnswerException("The question is not part of this round");
        }
        List<Long> offered = offeredFor(question, round, type);
        Long chosen = chosenWord(offered, request.optionId());
        if (chosen == null) {
            throw new InvalidGameAnswerException("Option " + request.optionId() + " was not offered for this question");
        }
        return new CheckResponse(
                chosen.equals(question.vocabularyId()),
                type.hasOptionsPerQuestion() ? (long) offered.indexOf(question.vocabularyId()) + 1 : null);
    }

    /**
     * Grades a finished round from its answers and saves it (game_sessions): the score is 10 points per right answer,
     * the questions not answered are wrong (branch 7a), and the result lists the wrong ones ("Các câu sai"). The
     * answers are checked before the token is marked as handed in, so a malformed request does not cost the round.
     */
    public SubmitGameResponse submit(Long gameId, SubmitGameRequest request) {
        Game game = requireGame(gameId);
        GameType type = game.getGameType();
        Long userId = currentUser.id();
        PlayRound round = tokens.verify(request.playToken(), gameId, userId);
        Map<Long, Long> chosenWords = validAnswers(request.answers(), round, type);
        if (!tokens.markHandedIn(round)) {
            throw new InvalidPlayTokenException("This round was already handed in");
        }

        Instant now = calendar.now();
        Duration elapsed = Duration.between(round.issuedAt(), now);
        boolean inTime = GameScoring.inTime(game.getTimeLimitSeconds(), elapsed);
        Map<Long, Vocabulary> words = wordsOf(round);

        int correctCount = 0;
        List<SubmitGameResponse.WrongAnswer> wrong = new ArrayList<>();
        for (int index = 0; index < round.questions().size(); index++) {
            long questionId = index + 1L;
            Long asked = round.questions().get(index).vocabularyId();
            Long chosen = chosenWords.get(questionId);
            if (inTime && asked.equals(chosen)) {
                correctCount++;
            } else {
                wrong.add(new SubmitGameResponse.WrongAnswer(
                        questionId,
                        wordOf(words, asked),
                        chosen == null ? null : meaningOf(words, chosen),
                        meaningOf(words, asked)));
            }
        }
        int questionCount = round.questions().size();
        int score = GameScoring.score(correctCount, 1);
        int playedSeconds = GameScoring.playedSeconds(game.getTimeLimitSeconds(), elapsed);

        Integer previousBest = sessionRepository.bestScore(userId, gameId);
        GameSession session = sessionRepository.save(new GameSession(
                gameId, userId, round.topicId(), round.listId(), correctCount, questionCount, score, playedSeconds, now));
        return new SubmitGameResponse(
                session.getId(),
                score,
                correctCount,
                questionCount,
                playedSeconds,
                0,
                previousBest == null ? score : Math.max(score, previousBest),
                previousBest == null ? score > 0 : score > previousBest,
                wrong);
    }

    private Game requireGame(Long gameId) {
        return gameRepository.findById(gameId).orElseThrow(() -> new GameNotFoundException(gameId));
    }

    /** The words a round is dealt from: a topic, a personal list of the player, or every system word. */
    private WordPool poolOf(Long topicId, Long listId) {
        if (topicId != null && listId != null) {
            throw new InvalidGameSourceException("Send topicId or listId, not both");
        }
        Long userId = currentUser.id();
        if (topicId != null) {
            topicRepository.findById(topicId).orElseThrow(() -> new TopicNotFoundException(topicId));
            return WordPool.of(vocabularyRepository.findAllVisibleInTopic(topicId, userId));
        }
        if (listId != null) {
            customListService.requireOwnList(listId);
            return WordPool.of(vocabularyRepository.findAllVisibleInList(listId, userId));
        }
        return WordPool.of(vocabularyRepository.findAllSystemWordsInTopics());
    }

    /** The words of a round, read again when it is graded (to name them in the wrong answers). */
    private Map<Long, Vocabulary> wordsOf(PlayRound round) {
        Set<Long> ids = new HashSet<>(round.matchVocabularyIds());
        round.questions().forEach(question -> {
            ids.add(question.vocabularyId());
            ids.addAll(question.optionVocabularyIds());
        });
        return vocabularyRepository.findAllById(ids).stream().collect(Collectors.toMap(Vocabulary::getId, Function.identity()));
    }

    /**
     * The word each answered question was answered with, by question id. One answer per question of the round, with
     * an option the round offered for it (any meaning of the round for WORD_MATCH, since the player may pair a word with
     * the wrong meaning). Anything else answers 400.
     */
    private static Map<Long, Long> validAnswers(List<SubmitGameRequest.Answer> answers, PlayRound round, GameType type) {
        Map<Long, Long> chosen = new HashMap<>();
        Set<Long> seen = new HashSet<>();
        for (SubmitGameRequest.Answer answer : answers) {
            PlayRound.Question question = round.question(answer.questionId());
            if (question == null) {
                throw new InvalidGameAnswerException("Question " + answer.questionId() + " is not part of this round");
            }
            if (!seen.add(answer.questionId())) {
                throw new InvalidGameAnswerException("Question " + answer.questionId() + " is answered twice");
            }
            if (answer.optionId() == null) {
                continue;
            }
            Long word = chosenWord(offeredFor(question, round, type), answer.optionId());
            if (word == null) {
                throw new InvalidGameAnswerException("Option " + answer.optionId() + " was not offered for this question");
            }
            chosen.put(answer.questionId(), word);
        }
        return chosen;
    }

    /** The words whose meanings a question offers, in the order shown (option id = position). */
    private static List<Long> offeredFor(PlayRound.Question question, PlayRound round, GameType type) {
        return type.hasOptionsPerQuestion() ? question.optionVocabularyIds() : round.matchVocabularyIds();
    }

    /** The word behind an option id, or null when the id is not one of the options. */
    private static Long chosenWord(List<Long> offered, Long optionId) {
        return optionId != null && optionId >= 1 && optionId <= offered.size() ? offered.get((int) (long) optionId - 1) : null;
    }

    private static List<PlayResponse.Option> options(List<Long> vocabularyIds, Map<Long, Vocabulary> words) {
        return IntStream.range(0, vocabularyIds.size())
                .mapToObj(index -> new PlayResponse.Option((long) index + 1, words.get(vocabularyIds.get(index)).getMeaning()))
                .toList();
    }

    // A word deleted while the round was played no longer has a text; the answer is still graded by its id.
    private static String wordOf(Map<Long, Vocabulary> words, Long id) {
        Vocabulary word = words.get(id);
        return word == null ? null : word.getWord();
    }

    private static String meaningOf(Map<Long, Vocabulary> words, Long id) {
        Vocabulary word = words.get(id);
        return word == null ? null : word.getMeaning();
    }

    /**
     * The words a round can use: one per meaning (two words sharing a meaning would make two right options), so every
     * option of a question and every meaning of a WORD_MATCH round is different.
     */
    record WordPool(List<Vocabulary> words) {

        static WordPool of(List<Vocabulary> words) {
            Set<String> meanings = new HashSet<>();
            List<Vocabulary> distinct = words.stream()
                    .sorted((a, b) -> Long.compare(a.getId(), b.getId()))
                    .filter(word -> meanings.add(word.getMeaning().trim().toLowerCase(Locale.ROOT)))
                    .toList();
            return new WordPool(distinct);
        }

        /** The words a question may ask about: those with an example sentence for GUESS_MEANING, all of them otherwise. */
        List<Vocabulary> questionCandidates(GameType type) {
            return type.needsExample()
                    ? words.stream().filter(word -> word.getExampleSentence() != null && !word.getExampleSentence().isBlank()).toList()
                    : words;
        }

        /** The questions (pairs) of a round: the game's count, or fewer when there are fewer words. */
        int questionCount(GameType type) {
            return Math.min(type.questionsPerRound(), questionCandidates(type).size());
        }

        /** Why these words cannot make a round, or null when they can. */
        GameUnavailableReason unavailableReason(GameType type) {
            if (words.size() < GameType.MIN_WORDS) {
                return GameUnavailableReason.NOT_ENOUGH_WORDS;
            }
            return questionCandidates(type).isEmpty() ? GameUnavailableReason.NO_EXAMPLES : null;
        }

        Map<Long, Vocabulary> byId() {
            return words.stream().collect(Collectors.toMap(Vocabulary::getId, Function.identity()));
        }
    }
}
