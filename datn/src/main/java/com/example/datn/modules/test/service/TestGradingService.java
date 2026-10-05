package com.example.datn.modules.test.service;

import com.example.datn.common.enums.CefrLevel;
import com.example.datn.common.user.LevelRecorder;
import com.example.datn.modules.test.entity.Test;
import com.example.datn.modules.test.entity.TestAttempt;
import com.example.datn.modules.test.entity.TestAttemptAnswer;
import com.example.datn.modules.test.entity.TestQuestion;
import com.example.datn.modules.test.entity.TestQuestionAcceptedAnswer;
import com.example.datn.modules.test.entity.TestQuestionOption;
import com.example.datn.modules.test.enums.TestAttemptStatus;
import com.example.datn.modules.test.enums.TestQuestionType;
import com.example.datn.modules.test.enums.TestSkill;
import com.example.datn.modules.test.enums.TestType;
import com.example.datn.modules.test.repository.TestAttemptAnswerRepository;
import com.example.datn.modules.test.repository.TestAttemptRepository;
import com.example.datn.modules.test.repository.TestQuestionAcceptedAnswerRepository;
import com.example.datn.modules.test.repository.TestQuestionOptionRepository;
import com.example.datn.modules.test.repository.TestQuestionRepository;
import com.example.datn.modules.test.repository.TestRepository;
import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Grades a submitted attempt (docs/api/tests.md): choice and short-text answers at once, spoken and written answers
 * through the AI examiner. While the examiner has not graded every answer the attempt stays SUBMITTED, and
 * {@link PendingTestGradingScheduler} comes back to it; once nothing is pending it becomes GRADED with its scores,
 * levels and roadmap.
 */
@Service
public class TestGradingService {

    private static final int PENDING_BATCH = 20;

    private final TestRepository testRepository;
    private final TestQuestionRepository questionRepository;
    private final TestQuestionOptionRepository optionRepository;
    private final TestQuestionAcceptedAnswerRepository acceptedAnswerRepository;
    private final TestAttemptRepository attemptRepository;
    private final TestAttemptAnswerRepository answerRepository;
    private final TestAiGateway aiGateway;
    private final LevelRecorder levelRecorder;

    public TestGradingService(
            TestRepository testRepository,
            TestQuestionRepository questionRepository,
            TestQuestionOptionRepository optionRepository,
            TestQuestionAcceptedAnswerRepository acceptedAnswerRepository,
            TestAttemptRepository attemptRepository,
            TestAttemptAnswerRepository answerRepository,
            TestAiGateway aiGateway,
            LevelRecorder levelRecorder) {
        this.testRepository = testRepository;
        this.questionRepository = questionRepository;
        this.optionRepository = optionRepository;
        this.acceptedAnswerRepository = acceptedAnswerRepository;
        this.attemptRepository = attemptRepository;
        this.answerRepository = answerRepository;
        this.aiGateway = aiGateway;
        this.levelRecorder = levelRecorder;
    }

    /** Grades everything that can be graded now and stores the outcome on the attempt (SUBMITTED or GRADED). */
    @Transactional
    public void grade(TestAttempt attempt, Instant submittedAt) {
        List<TestQuestion> questions = questionRepository.findByTestIdOrderByIdAsc(attempt.getTestId());
        List<Long> questionIds = questions.stream().map(TestQuestion::getId).toList();
        Map<Long, List<TestQuestionOption>> optionsByQuestion = questionIds.isEmpty()
                ? Map.of()
                : optionRepository.findByQuestionIdInOrderByIdAsc(questionIds).stream()
                        .collect(Collectors.groupingBy(TestQuestionOption::getQuestionId));
        Map<Long, List<TestQuestionAcceptedAnswer>> acceptedByQuestion = questionIds.isEmpty()
                ? Map.of()
                : acceptedAnswerRepository.findByQuestionIdIn(questionIds).stream()
                        .collect(Collectors.groupingBy(TestQuestionAcceptedAnswer::getQuestionId));
        Map<Long, TestAttemptAnswer> answerByQuestion = answerRepository.findByAttemptId(attempt.getId()).stream()
                .collect(Collectors.toMap(TestAttemptAnswer::getQuestionId, Function.identity()));

        Map<TestSkill, List<SkillAssessor.Item>> itemsBySkill = new EnumMap<>(TestSkill.class);
        Set<TestSkill> pendingSkills = EnumSet.noneOf(TestSkill.class);
        // After one failed call the examiner is not asked again in this pass: the rest waits for the next one.
        boolean examinerAvailable = true;

        for (TestQuestion question : questions) {
            TestSkill skill = skillOf(question);
            List<TestQuestionOption> options = optionsByQuestion.getOrDefault(question.getId(), List.of());
            List<TestQuestionAcceptedAnswer> accepted = acceptedByQuestion.getOrDefault(question.getId(), List.of());
            boolean aiGraded = isAiGraded(question, options, accepted);
            TestAttemptAnswer answer = answerByQuestion.get(question.getId());
            Double aiBand = null;
            BigDecimal earned = BigDecimal.ZERO;

            if (answer == null) {
                // Unanswered: 0 points, nothing stored. For the examiner's skills it counts as the lowest band.
                aiBand = aiGraded ? 0.0 : null;
            } else {
                if (!options.isEmpty()) {
                    boolean correct = options.stream()
                            .anyMatch(option -> option.isCorrect() && option.getId().equals(answer.getSelectedOptionId()));
                    answer.grade(correct, correct ? BigDecimal.valueOf(question.getPoints()) : BigDecimal.ZERO);
                } else if (!accepted.isEmpty()) {
                    String normalized = AnswerNormalizer.normalize(answer.getAnswerContent());
                    boolean correct = accepted.stream().anyMatch(item -> item.getNormalizedAnswer().equals(normalized));
                    answer.grade(correct, correct ? BigDecimal.valueOf(question.getPoints()) : BigDecimal.ZERO);
                } else if (aiGraded) {
                    if (answer.getAiCriteria() == null && examinerAvailable) {
                        Optional<AiAssessment> assessment = aiGateway.assess(question, answer.getAnswerContent());
                        if (assessment.isPresent()) {
                            answer.gradeByAi(
                                    bandPoints(question.getPoints(), AiAssessment.band(assessment.get().criteria())),
                                    assessment.get().criteria(),
                                    assessment.get().comment());
                        } else {
                            examinerAvailable = false;
                        }
                    }
                    if (answer.getAiCriteria() == null) {
                        pendingSkills.add(skill);
                    } else {
                        aiBand = AiAssessment.band(answer.getAiCriteria());
                    }
                }
                answerRepository.save(answer);
                earned = answer.getScoreEarned();
            }

            itemsBySkill.computeIfAbsent(skill, key -> new ArrayList<>())
                    .add(new SkillAssessor.Item(question.getLevel(), question.getPoints(), earned, aiBand));
        }

        // A skill still waiting for the examiner has no score yet; the others are final and are stored already.
        Map<TestSkill, Integer> scores = new EnumMap<>(TestSkill.class);
        Map<String, Integer> storedScores = new LinkedHashMap<>();
        Map<String, CefrLevel> storedLevels = new LinkedHashMap<>();
        itemsBySkill.forEach((skill, items) -> {
            if (pendingSkills.contains(skill)) {
                return;
            }
            SkillAssessor.Result result = SkillAssessor.assess(items);
            scores.put(skill, result.score());
            storedScores.put(skill.dbKey(), result.score());
            storedLevels.put(skill.dbKey(), result.level());
        });

        if (!pendingSkills.isEmpty()) {
            attempt.grade(BigDecimal.ZERO, TestAttemptStatus.SUBMITTED, storedScores, storedLevels, null, null,
                    submittedAt);
        } else {
            int overallScore = (int) Math.round(scores.values().stream().mapToInt(Integer::intValue).average().orElse(0));
            CefrLevel overallLevel = SkillAssessor.overall(storedLevels.values());
            attempt.grade(BigDecimal.valueOf(overallScore), TestAttemptStatus.GRADED, storedScores, storedLevels,
                    overallLevel, aiGateway.suggestRoadmap(overallLevel, scores), submittedAt);
        }
        attemptRepository.save(attempt);
    }

    /** The attempts still waiting for the examiner, newest first, a batch at a time. */
    @Transactional(readOnly = true)
    public List<Long> pendingAttemptIds() {
        return attemptRepository.findByStatusOrderBySubmittedAtDesc(
                        TestAttemptStatus.SUBMITTED, Limit.of(PENDING_BATCH)).stream()
                .map(TestAttempt::getId)
                .toList();
    }

    /**
     * Tries again to grade an attempt that was left SUBMITTED. Runs outside a request, so unlike a submission it does
     * not know the learner's level before the test: a comprehensive test graded here always records its level.
     */
    @Transactional
    public void gradePending(Long attemptId) {
        TestAttempt attempt = attemptRepository.findById(attemptId).orElse(null);
        if (attempt == null || attempt.getStatus() != TestAttemptStatus.SUBMITTED) {
            return;
        }
        grade(attempt, attempt.getSubmittedAt());

        if (attempt.getStatus() == TestAttemptStatus.GRADED && isComprehensive(attempt.getTestId())) {
            levelRecorder.recordLevelChange(attempt.getUserId(), attempt.getSuggestedLevel(), attemptId);
        }
    }

    /** The skill a question counts toward: its own, or the one its type implies. */
    static TestSkill skillOf(TestQuestion question) {
        if (question.getSkill() != null) {
            return question.getSkill();
        }
        return switch (question.getQuestionType()) {
            case LISTENING -> TestSkill.LISTENING;
            case SPEAKING -> TestSkill.SPEAKING;
            case WRITING -> TestSkill.WRITING;
            case FILL_BLANK -> TestSkill.WRITING;
            case READING, MULTIPLE_CHOICE -> TestSkill.READING;
        };
    }

    /** A spoken or written answer with nothing to compare it with is the examiner's to grade. */
    static boolean isAiGraded(
            TestQuestion question, List<TestQuestionOption> options, List<TestQuestionAcceptedAnswer> accepted) {
        return options.isEmpty() && accepted.isEmpty()
                && (question.getQuestionType() == TestQuestionType.SPEAKING
                        || question.getQuestionType() == TestQuestionType.WRITING);
    }

    /** The points an examiner's band earns: the top band earns them all. */
    private static BigDecimal bandPoints(int points, double band) {
        return BigDecimal.valueOf(points)
                .multiply(BigDecimal.valueOf(band))
                .divide(BigDecimal.valueOf(AiAssessment.MAX_BAND), 2, RoundingMode.HALF_UP);
    }

    private boolean isComprehensive(Long testId) {
        return testRepository.findById(testId).map(Test::getType).orElse(null) == TestType.COMPREHENSIVE;
    }
}
