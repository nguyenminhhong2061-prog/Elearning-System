package com.example.datn.modules.vocabulary.service;

import com.example.datn.common.security.CurrentUser;
import com.example.datn.modules.vocabulary.dto.request.CheckGameAnswerRequest;
import com.example.datn.modules.vocabulary.dto.request.SubmitGameRequest;
import com.example.datn.modules.vocabulary.dto.response.CheckResponse;
import com.example.datn.modules.vocabulary.dto.response.GameResponse;
import com.example.datn.modules.vocabulary.dto.response.PlayResponse;
import com.example.datn.modules.vocabulary.dto.response.SubmitGameResponse;
import com.example.datn.modules.vocabulary.entity.Game;
import com.example.datn.modules.vocabulary.entity.GameQuestion;
import com.example.datn.modules.vocabulary.entity.GameQuestionOption;
import com.example.datn.modules.vocabulary.entity.GameSession;
import com.example.datn.modules.vocabulary.entity.GameSessionAnswer;
import com.example.datn.modules.vocabulary.entity.Vocabulary;
import com.example.datn.modules.vocabulary.enums.GameType;
import com.example.datn.modules.vocabulary.exception.GameNotFoundException;
import com.example.datn.modules.vocabulary.exception.InvalidGameAnswerException;
import com.example.datn.modules.vocabulary.exception.InvalidPlayTokenException;
import com.example.datn.modules.vocabulary.repository.GameCounts;
import com.example.datn.modules.vocabulary.repository.GameQuestionOptionRepository;
import com.example.datn.modules.vocabulary.repository.GameQuestionRepository;
import com.example.datn.modules.vocabulary.repository.GameRepository;
import com.example.datn.modules.vocabulary.repository.GameSessionAnswerRepository;
import com.example.datn.modules.vocabulary.repository.GameSessionRepository;
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
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * The vocabulary games (A4, docs/api/games.md). The browser never learns the right answers in advance: a round is
 * handed out without them, each choice is checked by {@link #check}, and {@link #submit} grades the whole round again
 * from the answers, with the same {@link RoundKey}.
 */
@Service
@Transactional
public class GameService {

    private final GameRepository gameRepository;
    private final GameQuestionRepository questionRepository;
    private final GameQuestionOptionRepository optionRepository;
    private final GameSessionRepository sessionRepository;
    private final GameSessionAnswerRepository answerRepository;
    private final VocabularyRepository vocabularyRepository;
    private final PlayTokenService tokens;
    private final CurrentUser currentUser;
    private final StudyCalendar calendar;

    public GameService(
            GameRepository gameRepository,
            GameQuestionRepository questionRepository,
            GameQuestionOptionRepository optionRepository,
            GameSessionRepository sessionRepository,
            GameSessionAnswerRepository answerRepository,
            VocabularyRepository vocabularyRepository,
            PlayTokenService tokens,
            CurrentUser currentUser,
            StudyCalendar calendar) {
        this.gameRepository = gameRepository;
        this.questionRepository = questionRepository;
        this.optionRepository = optionRepository;
        this.sessionRepository = sessionRepository;
        this.answerRepository = answerRepository;
        this.vocabularyRepository = vocabularyRepository;
        this.tokens = tokens;
        this.currentUser = currentUser;
        this.calendar = calendar;
    }

    /** Every game, with the questions per round and the current player's best score (two grouped queries). */
    @Transactional(readOnly = true)
    public List<GameResponse> findAll() {
        Map<Long, Long> bankSizes = toMap(questionRepository.countByGame());
        Map<Long, Long> bestScores = toMap(sessionRepository.bestScores(currentUser.id()));
        return gameRepository.findAll(Sort.by("id")).stream()
                .map(game -> new GameResponse(
                        game.getId(),
                        game.getName(),
                        game.getGameType(),
                        game.getTimeLimitSeconds(),
                        (int) Math.min(game.getGameType().questionsPerRound(), bankSizes.getOrDefault(game.getId(), 0L)),
                        bestScores.containsKey(game.getId()) ? Math.toIntExact(bestScores.get(game.getId())) : null))
                .toList();
    }

    /**
     * A new round: questions drawn at random from the game's bank, options shuffled, no answers. No two questions share
     * the same right answer, which would make a WORD_MATCH round ambiguous.
     */
    @Transactional(readOnly = true)
    public PlayResponse play(Long gameId) {
        Game game = requireGame(gameId);
        GameType type = game.getGameType();

        List<GameQuestionOption> rightOptions = new ArrayList<>(optionRepository.findCorrectInGame(gameId));
        Collections.shuffle(rightOptions, ThreadLocalRandom.current());
        Set<String> answersSeen = new HashSet<>();
        List<GameQuestionOption> drawn = rightOptions.stream()
                .filter(option -> answersSeen.add(option.getContent()))
                .limit(type.questionsPerRound())
                .toList();
        List<Long> questionIds = drawn.stream().map(GameQuestionOption::getGameQuestionId).toList();

        Map<Long, GameQuestion> questions = byId(questionRepository.findAllById(questionIds), GameQuestion::getId);
        Map<Long, Vocabulary> words = byId(
                vocabularyRepository.findAllById(questions.values().stream().map(GameQuestion::getVocabularyId).toList()),
                Vocabulary::getId);
        Map<Long, List<GameQuestionOption>> options = optionRepository.findAllByGameQuestionIdIn(questionIds).stream()
                .collect(Collectors.groupingBy(GameQuestionOption::getGameQuestionId));

        List<PlayResponse.Question> roundQuestions = questionIds.stream().map(id -> {
            GameQuestion question = questions.get(id);
            Vocabulary word = words.get(question.getVocabularyId());
            List<PlayResponse.Option> choices = type.hasOptionsPerQuestion() ? shuffled(options.get(id)) : List.of();
            return new PlayResponse.Question(
                    id,
                    type == GameType.QUICK_QUIZ ? word.getMeaning() : word.getWord(),
                    type == GameType.GUESS_MEANING ? word.getPhonetic() : null,
                    question.getPoints(),
                    choices);
        }).toList();
        List<PlayResponse.Option> matchOptions = type == GameType.WORD_MATCH ? shuffled(drawn) : null;

        PlayRound round = tokens.newRound(gameId, currentUser.id(), questionIds);
        return new PlayResponse(
                gameId, type, game.getTimeLimitSeconds(), tokens.sign(round), roundQuestions, matchOptions);
    }

    /** Whether one choice is right, for the immediate right/wrong feedback. Saves nothing. */
    @Transactional(readOnly = true)
    public CheckResponse check(Long gameId, CheckGameAnswerRequest request) {
        Game game = requireGame(gameId);
        PlayRound round = tokens.verify(request.playToken(), gameId, currentUser.id());
        if (!round.questionIds().contains(request.questionId())) {
            throw new InvalidGameAnswerException("The question is not part of this round");
        }
        RoundKey key = keyOf(round);
        Long rightOptionId = key.rightOptionId(request.questionId());
        return new CheckResponse(
                rightOptionId.equals(request.optionId()),
                game.getGameType().hasOptionsPerQuestion() ? rightOptionId : null);
    }

    /**
     * Grades a finished round from its answers and saves it (game_sessions and game_session_answers). The answers are
     * checked before the token is marked as handed in, so a malformed request does not cost the player the round.
     */
    public SubmitGameResponse submit(Long gameId, SubmitGameRequest request) {
        Game game = requireGame(gameId);
        Long userId = currentUser.id();
        PlayRound round = tokens.verify(request.playToken(), gameId, userId);
        RoundKey key = keyOf(round);
        Map<Long, SubmitGameRequest.Answer> given = validAnswers(request.answers(), round, key, game.getGameType());
        if (!tokens.markHandedIn(round)) {
            throw new InvalidPlayTokenException("This round was already handed in");
        }

        Instant now = calendar.now();
        Duration elapsed = Duration.between(round.issuedAt(), now);
        boolean inTime = GameScoring.inTime(game.getTimeLimitSeconds(), elapsed);
        Map<Long, GameQuestion> questions = byId(questionRepository.findAllById(round.questionIds()), GameQuestion::getId);

        int correctCount = 0;
        int score = 0;
        boolean allAnswered = true;
        List<Graded> graded = new ArrayList<>();
        for (Long questionId : round.questionIds()) {
            SubmitGameRequest.Answer answer = given.get(questionId);
            Long optionId = answer == null ? null : answer.optionId();
            allAnswered &= optionId != null;
            boolean correct = inTime && optionId != null && optionId.equals(key.rightOptionId(questionId));
            if (correct) {
                correctCount++;
                score += questions.get(questionId).getPoints() * GameScoring.POINTS_PER_UNIT;
            }
            graded.add(new Graded(questionId, optionId, correct, answer == null ? null : answer.responseTimeMs()));
        }
        int questionCount = round.questionIds().size();
        int timeBonus = inTime && allAnswered
                ? GameScoring.timeBonus(game.getTimeLimitSeconds(), elapsed, correctCount, questionCount)
                : 0;
        score += timeBonus;

        Integer previousBest = sessionRepository.bestScore(userId, gameId);
        GameSession session = sessionRepository.save(new GameSession(gameId, userId, score, now));
        answerRepository.saveAll(graded.stream()
                .map(answer -> new GameSessionAnswer(
                        session.getId(), answer.questionId(), answer.optionId(), answer.correct(), answer.responseTimeMs()))
                .toList());

        return new SubmitGameResponse(
                session.getId(),
                score,
                correctCount,
                questionCount,
                timeBonus,
                previousBest == null ? score : Math.max(score, previousBest),
                previousBest == null ? score > 0 : score > previousBest);
    }

    private Game requireGame(Long gameId) {
        return gameRepository.findById(gameId).orElseThrow(() -> new GameNotFoundException(gameId));
    }

    /**
     * One answer per question of the round, with an option the round offered for it (any meaning of the round for
     * WORD_MATCH, since the player may pair a word with the wrong meaning). Anything else answers 400.
     */
    private static Map<Long, SubmitGameRequest.Answer> validAnswers(
            List<SubmitGameRequest.Answer> answers, PlayRound round, RoundKey key, GameType type) {
        Map<Long, SubmitGameRequest.Answer> byQuestion = new HashMap<>();
        for (SubmitGameRequest.Answer answer : answers) {
            if (!round.questionIds().contains(answer.questionId())) {
                throw new InvalidGameAnswerException("Question " + answer.questionId() + " is not part of this round");
            }
            if (byQuestion.putIfAbsent(answer.questionId(), answer) != null) {
                throw new InvalidGameAnswerException("Question " + answer.questionId() + " is answered twice");
            }
            Long optionId = answer.optionId();
            boolean offered = type.hasOptionsPerQuestion()
                    ? key.optionIdsOf(answer.questionId()).contains(optionId)
                    : key.rightOptionIds().contains(optionId);
            if (optionId != null && !offered) {
                throw new InvalidGameAnswerException("Option " + optionId + " was not offered for this question");
            }
        }
        return byQuestion;
    }

    /** The options of the round's questions: what {@link #check} and {@link #submit} both grade against. */
    private RoundKey keyOf(PlayRound round) {
        return new RoundKey(optionRepository.findAllByGameQuestionIdIn(round.questionIds()));
    }

    private static List<PlayResponse.Option> shuffled(List<GameQuestionOption> options) {
        List<GameQuestionOption> copy = new ArrayList<>(options);
        Collections.shuffle(copy, ThreadLocalRandom.current());
        return copy.stream().map(option -> new PlayResponse.Option(option.getId(), option.getContent())).toList();
    }

    private static Map<Long, Long> toMap(List<GameCounts> counts) {
        return counts.stream().collect(Collectors.toMap(GameCounts::gameId, GameCounts::value));
    }

    private static <T> Map<Long, T> byId(List<T> items, Function<T, Long> id) {
        return items.stream().collect(Collectors.toMap(id, Function.identity()));
    }

    private record Graded(Long questionId, Long optionId, boolean correct, Integer responseTimeMs) {
    }

    /** The right option and the offered options of each question of a round. */
    private static final class RoundKey {

        private final Map<Long, Long> rightOptionIds = new HashMap<>();
        private final Map<Long, Set<Long>> optionIds = new HashMap<>();

        RoundKey(List<GameQuestionOption> options) {
            for (GameQuestionOption option : options) {
                optionIds.computeIfAbsent(option.getGameQuestionId(), id -> new HashSet<>()).add(option.getId());
                if (option.isCorrect()) {
                    rightOptionIds.put(option.getGameQuestionId(), option.getId());
                }
            }
        }

        Long rightOptionId(Long questionId) {
            return rightOptionIds.get(questionId);
        }

        Set<Long> optionIdsOf(Long questionId) {
            return optionIds.getOrDefault(questionId, Set.of());
        }

        Set<Long> rightOptionIds() {
            return new HashSet<>(rightOptionIds.values());
        }
    }
}
