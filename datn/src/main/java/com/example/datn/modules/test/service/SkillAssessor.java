package com.example.datn.modules.test.service;

import com.example.datn.common.enums.CefrLevel;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Collection;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Turns the graded questions of one skill into a 0-100 score and a CEFR level (docs/api/tests.md, "Đánh giá trình
 * độ"). Pure functions, so the rules are unit-tested without a database.
 *
 * The score is the share of points earned. The level does not come from the score, because a percentage says nothing
 * about a level unless the difficulty of the questions is known:
 * <ol>
 *   <li>a skill with AI-graded answers (speaking, writing) takes the average band the examiner gave; when it
 *       also has read-aloud answers, their level counts as a fifth criterion, pronunciation, beside the
 *       examiner's four;</li>
 *   <li>otherwise, a skill whose questions carry a level takes the highest level the learner passed, having passed
 *       every level below it;</li>
 *   <li>otherwise (no question has a level) the score is converted with the fixed thresholds of
 *       {@link CefrLevels}.</li>
 * </ol>
 */
public final class SkillAssessor {

    /** The share of a level's points a learner must earn to pass that level. */
    static final double PASS_RATIO = 0.6;

    /** The criteria behind an examiner's band (task, coherence, vocabulary, grammar). */
    private static final int EXAMINER_CRITERIA = 4;

    private SkillAssessor() {
    }

    /**
     * One graded question.
     *
     * @param level the level the question tests, or null
     * @param points the points the question is worth
     * @param earned the points the learner earned
     * @param aiBand the band 0-6 the examiner gave an AI-graded question (0 when it was not answered), null for an
     *               auto-graded question
     * @param readAloud a recorded read-aloud answer, whose points are its pronunciation score
     */
    public record Item(CefrLevel level, int points, BigDecimal earned, Double aiBand, boolean readAloud) {

        public Item(CefrLevel level, int points, BigDecimal earned, Double aiBand) {
            this(level, points, earned, aiBand, false);
        }
    }

    public record Result(int score, CefrLevel level) {
    }

    public static Result assess(List<Item> items) {
        int score = score(items);

        List<Double> bands = items.stream().map(Item::aiBand).filter(Objects::nonNull).toList();
        if (bands.isEmpty()) {
            return new Result(score, autoGradedLevel(items));
        }

        double band = bands.stream().mapToDouble(Double::doubleValue).average().orElse(0);
        List<Item> readAloud = items.stream().filter(Item::readAloud).toList();
        if (!readAloud.isEmpty()) {
            int pronunciation = autoGradedLevel(readAloud).ordinal() + 1;
            band = (band * EXAMINER_CRITERIA + pronunciation) / (EXAMINER_CRITERIA + 1);
        }
        return new Result(score, fromBand(band));
    }

    /** The level of auto-graded questions: by the levels passed when they carry one, else from their score. */
    private static CefrLevel autoGradedLevel(List<Item> items) {
        if (items.stream().anyMatch(item -> item.level() != null)) {
            return highestLevelPassed(items);
        }
        return CefrLevels.fromScore(score(items));
    }

    /** The overall level: the average of the skill levels (A1 = 1 ... C2 = 6), rounded. */
    public static CefrLevel overall(Collection<CefrLevel> skillLevels) {
        return fromBand(skillLevels.stream().mapToInt(level -> level.ordinal() + 1).average().orElse(1));
    }

    /** The level of a band 0-6, rounded; anything below A1 is A1, the lowest level there is. */
    public static CefrLevel fromBand(double band) {
        CefrLevel[] levels = CefrLevel.values();
        int index = (int) Math.round(band);
        return levels[Math.max(1, Math.min(levels.length, index)) - 1];
    }

    private static int score(List<Item> items) {
        int points = items.stream().mapToInt(Item::points).sum();
        if (points <= 0) {
            return 0;
        }
        BigDecimal earned = items.stream().map(Item::earned).reduce(BigDecimal.ZERO, BigDecimal::add);
        return earned.multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(points), 0, RoundingMode.HALF_UP)
                .intValue();
    }

    /**
     * Walks the levels that have questions from the easiest up and stops at the first one failed. Failing the easiest
     * level of the test places the learner one level below it.
     */
    private static CefrLevel highestLevelPassed(List<Item> items) {
        Map<CefrLevel, Integer> points = new EnumMap<>(CefrLevel.class);
        Map<CefrLevel, BigDecimal> earned = new EnumMap<>(CefrLevel.class);
        for (Item item : items) {
            if (item.level() == null) {
                continue;
            }
            points.merge(item.level(), item.points(), Integer::sum);
            earned.merge(item.level(), item.earned(), BigDecimal::add);
        }

        CefrLevel passed = null;
        CefrLevel easiest = null;
        for (CefrLevel level : CefrLevel.values()) {
            Integer levelPoints = points.get(level);
            if (levelPoints == null || levelPoints <= 0) {
                continue;
            }
            if (easiest == null) {
                easiest = level;
            }
            if (earned.get(level).doubleValue() / levelPoints < PASS_RATIO) {
                break;
            }
            passed = level;
        }

        if (passed != null) {
            return passed;
        }
        return CefrLevel.values()[Math.max(0, easiest.ordinal() - 1)];
    }
}
