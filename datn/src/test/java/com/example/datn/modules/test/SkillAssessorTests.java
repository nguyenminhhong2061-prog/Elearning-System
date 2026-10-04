package com.example.datn.modules.test;

import com.example.datn.common.enums.CefrLevel;
import com.example.datn.modules.test.service.SkillAssessor;
import com.example.datn.modules.test.service.SkillAssessor.Item;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class SkillAssessorTests {

    @Test
    void levelIsTheHighestOnePassedWithEveryLevelBelowIt() {
        List<Item> items = new ArrayList<>();
        items.addAll(questions(CefrLevel.A1, 3, 3));
        items.addAll(questions(CefrLevel.A2, 3, 2)); // 67%: passed
        items.addAll(questions(CefrLevel.B1, 3, 1)); // 33%: failed
        items.addAll(questions(CefrLevel.B2, 3, 3)); // lucky guesses above a failed level do not count

        SkillAssessor.Result result = SkillAssessor.assess(items);

        assertThat(result.level()).isEqualTo(CefrLevel.A2);
        assertThat(result.score()).isEqualTo(75);
    }

    @Test
    void easyQuestionsAllCorrectDoNotGiveAHighLevel() {
        SkillAssessor.Result result = SkillAssessor.assess(questions(CefrLevel.A1, 5, 5));

        assertThat(result.score()).isEqualTo(100);
        assertThat(result.level()).isEqualTo(CefrLevel.A1);
    }

    @Test
    void failingTheEasiestLevelOfTheTestPlacesOneLevelBelowIt() {
        assertThat(SkillAssessor.assess(questions(CefrLevel.B1, 3, 1)).level()).isEqualTo(CefrLevel.A2);
        assertThat(SkillAssessor.assess(questions(CefrLevel.A1, 3, 0)).level()).isEqualTo(CefrLevel.A1);
    }

    @Test
    void examinerBandsDecideTheLevelOfASkillTheyGrade() {
        List<Item> items = List.of(
                new Item(CefrLevel.B1, 6, new BigDecimal("4.00"), 4.0),
                new Item(CefrLevel.B2, 6, new BigDecimal("3.00"), 3.0),
                // A short-answer question of the same skill counts toward the score only.
                new Item(CefrLevel.A1, 1, BigDecimal.ONE, null));

        SkillAssessor.Result result = SkillAssessor.assess(items);

        assertThat(result.level()).isEqualTo(CefrLevel.B2); // (4 + 3) / 2 = 3.5, rounded up
        assertThat(result.score()).isEqualTo(62);
    }

    @Test
    void unansweredExaminerQuestionCountsAsTheLowestBand() {
        List<Item> items = List.of(
                new Item(null, 5, new BigDecimal("5.00"), 6.0),
                new Item(null, 5, BigDecimal.ZERO, 0.0));

        assertThat(SkillAssessor.assess(items).level()).isEqualTo(CefrLevel.B1);
    }

    @Test
    void questionsWithoutALevelFallBackToTheScoreThresholds() {
        List<Item> items = List.of(
                new Item(null, 1, BigDecimal.ONE, null),
                new Item(null, 1, BigDecimal.ZERO, null));

        SkillAssessor.Result result = SkillAssessor.assess(items);

        assertThat(result.score()).isEqualTo(50);
        assertThat(result.level()).isEqualTo(CefrLevel.B1);
    }

    @Test
    void overallLevelIsTheRoundedAverageOfTheSkills() {
        assertThat(SkillAssessor.overall(List.of(CefrLevel.B2, CefrLevel.A2, CefrLevel.B1, CefrLevel.B1)))
                .isEqualTo(CefrLevel.B1);
        assertThat(SkillAssessor.overall(List.of(CefrLevel.B2, CefrLevel.B1))).isEqualTo(CefrLevel.B2);
    }

    private static List<Item> questions(CefrLevel level, int count, int correct) {
        List<Item> items = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            items.add(new Item(level, 1, i < correct ? BigDecimal.ONE : BigDecimal.ZERO, null));
        }
        return items;
    }
}
