package com.example.datn.modules.vocabulary;

import com.example.datn.modules.vocabulary.entity.LeaderboardEntry;
import com.example.datn.modules.vocabulary.enums.LeaderboardPeriod;
import com.example.datn.modules.vocabulary.exception.InvalidPlayTokenException;
import com.example.datn.modules.vocabulary.repository.ScoreTotal;
import com.example.datn.modules.vocabulary.service.GameScoring;
import com.example.datn.modules.vocabulary.service.LeaderboardService;
import com.example.datn.modules.vocabulary.service.PlayRound;
import com.example.datn.modules.vocabulary.service.PlayTokenService;
import com.example.datn.modules.vocabulary.service.StudyCalendar;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** The pure rules of docs/api/games.md: scoring, the playToken and the leaderboard ranking. */
class GameRulesTests {

    @Nested
    class Scoring {

        // The cases of frontend/mock/routes/games.test.js.
        @Test
        void theTimeBonusScalesTheRemainingSecondsByTheShareOfRightAnswers() {
            assertThat(GameScoring.timeBonus(90, Duration.ofSeconds(17), 10, 10)).isEqualTo(73);
            assertThat(GameScoring.timeBonus(90, Duration.ofSeconds(17), 5, 10)).isEqualTo(36);
        }

        @Test
        void answeringEverythingWrongEarnsNoBonusHoweverFast() {
            assertThat(GameScoring.timeBonus(90, Duration.ofSeconds(5), 0, 10)).isZero();
        }

        @Test
        void thereIsNoBonusWithoutATimeLimitOrOnceTheTimeIsOver() {
            assertThat(GameScoring.timeBonus(null, Duration.ofSeconds(10), 10, 10)).isZero();
            assertThat(GameScoring.timeBonus(60, Duration.ofSeconds(61), 6, 6)).isZero();
        }

        @Test
        void answersCountUntilThreeSecondsAfterTheLimit() {
            assertThat(GameScoring.inTime(60, Duration.ofSeconds(63))).isTrue();
            assertThat(GameScoring.inTime(60, Duration.ofMillis(63_001))).isFalse();
            assertThat(GameScoring.inTime(null, Duration.ofDays(1))).isTrue();
        }
    }

    @Nested
    class PlayTokens {

        private final MovableClock clock = new MovableClock(Instant.parse("2026-09-25T03:00:00Z"));
        private final PlayTokenService tokens = new PlayTokenService(new StudyCalendar(clock));

        @Test
        void aSignedRoundComesBackIdentical() {
            PlayRound round = tokens.newRound(1L, 42L, List.of(11L, 12L, 13L));

            PlayRound verified = tokens.verify(tokens.sign(round), 1L, 42L);

            assertThat(verified).isEqualTo(round);
        }

        @Test
        void aChangedTokenIsRejected() {
            String token = tokens.sign(tokens.newRound(1L, 42L, List.of(11L, 12L)));
            String[] parts = token.split("\\.");
            // Same signature, but a payload with an extra question the server never handed out.
            String forgedPayload = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(
                    new String(java.util.Base64.getUrlDecoder().decode(parts[0])).concat(",99").getBytes());

            assertThatThrownBy(() -> tokens.verify(forgedPayload + "." + parts[1], 1L, 42L))
                    .isInstanceOf(InvalidPlayTokenException.class);
            assertThatThrownBy(() -> tokens.verify(parts[0] + "." + parts[1].substring(1), 1L, 42L))
                    .isInstanceOf(InvalidPlayTokenException.class);
            assertThatThrownBy(() -> tokens.verify("not-a-token", 1L, 42L)).isInstanceOf(InvalidPlayTokenException.class);
            assertThatThrownBy(() -> tokens.verify("a.b.c", 1L, 42L)).isInstanceOf(InvalidPlayTokenException.class);
        }

        @Test
        void aTokenOnlyWorksForItsGameItsPlayerAndThisServer() {
            String token = tokens.sign(tokens.newRound(1L, 42L, List.of(11L)));
            PlayTokenService otherServer = new PlayTokenService(new StudyCalendar(clock));

            assertThatThrownBy(() -> tokens.verify(token, 2L, 42L)).isInstanceOf(InvalidPlayTokenException.class);
            assertThatThrownBy(() -> tokens.verify(token, 1L, 43L)).isInstanceOf(InvalidPlayTokenException.class);
            assertThatThrownBy(() -> otherServer.verify(token, 1L, 42L)).isInstanceOf(InvalidPlayTokenException.class);
        }

        @Test
        void aTokenExpiresAfterAnHour() {
            String token = tokens.sign(tokens.newRound(1L, 42L, List.of(11L)));

            clock.advance(Duration.ofMinutes(59));
            assertThat(tokens.verify(token, 1L, 42L).gameId()).isEqualTo(1L);
            clock.advance(Duration.ofMinutes(2));
            assertThatThrownBy(() -> tokens.verify(token, 1L, 42L)).isInstanceOf(InvalidPlayTokenException.class);
        }

        @Test
        void aRoundIsHandedInOnlyOnce() {
            PlayRound round = tokens.newRound(1L, 42L, List.of(11L));
            PlayRound another = tokens.newRound(1L, 42L, List.of(11L));

            assertThat(tokens.markHandedIn(round)).isTrue();
            assertThat(tokens.markHandedIn(round)).isFalse();
            assertThat(tokens.markHandedIn(another)).isTrue();
        }
    }

    @Nested
    class Ranking {

        @Test
        void onEqualTotalsWhoeverReachedTheTotalFirstRanksHigher() {
            Instant monday = Instant.parse("2026-09-21T02:00:00Z");
            List<ScoreTotal> totals = List.of(
                    new ScoreTotal(null, 5L, 120L, monday.plusSeconds(60)),
                    new ScoreTotal(null, 3L, 300L, monday),
                    new ScoreTotal(null, 4L, 120L, monday.plusSeconds(3600)),
                    new ScoreTotal(null, 8L, 120L, monday.plusSeconds(60)),
                    new ScoreTotal(null, 9L, 0L, monday),
                    new ScoreTotal(null, 7L, 90L, monday));

            List<LeaderboardEntry> rows =
                    LeaderboardService.rank(null, LeaderboardPeriod.WEEK, LocalDate.of(2026, 9, 21), totals);

            // 5, 8 and 4 tie on 120: 5 and 8 got there first (5 before 8 by id), 4 an hour later. Player 9 has no
            // points. Ranks are never shared: the frontend draws one podium place per rank.
            assertThat(rows).extracting(LeaderboardEntry::getUserId).containsExactly(3L, 5L, 8L, 4L, 7L);
            assertThat(rows).extracting(LeaderboardEntry::getRank).containsExactly(1, 2, 3, 4, 5);
            assertThat(rows).extracting(LeaderboardEntry::getTotalScore).containsExactly(300, 120, 120, 120, 90);
        }

        @Test
        void weeksStartOnMondayAndMonthsOnTheFirst() {
            LocalDate friday = LocalDate.of(2026, 9, 25);

            assertThat(LeaderboardPeriod.WEEK.startOf(friday)).isEqualTo(LocalDate.of(2026, 9, 21));
            assertThat(LeaderboardPeriod.WEEK.startOf(LocalDate.of(2026, 9, 21))).isEqualTo(LocalDate.of(2026, 9, 21));
            assertThat(LeaderboardPeriod.WEEK.startOf(LocalDate.of(2026, 9, 27))).isEqualTo(LocalDate.of(2026, 9, 21));
            assertThat(LeaderboardPeriod.MONTH.startOf(friday)).isEqualTo(LocalDate.of(2026, 9, 1));
            assertThat(LeaderboardPeriod.MONTH.nextStart(LocalDate.of(2026, 12, 1))).isEqualTo(LocalDate.of(2027, 1, 1));
        }
    }

    /** A clock the test moves forward by hand. */
    static final class MovableClock extends Clock {

        private Instant now;

        MovableClock(Instant start) {
            this.now = start;
        }

        void advance(Duration duration) {
            now = now.plus(duration);
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return Clock.fixed(now, zone);
        }

        @Override
        public Instant instant() {
            return now;
        }
    }
}
