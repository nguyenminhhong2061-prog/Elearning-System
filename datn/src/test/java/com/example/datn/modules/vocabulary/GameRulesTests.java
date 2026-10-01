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

/** The pure rules of docs/api/games.md (scenario 8): scoring, the playToken and the leaderboard ranking. */
class GameRulesTests {

    @Nested
    class Scoring {

        @Test
        void eachRightAnswerEarnsTenPointsWithoutATimeBonus() {
            // Scenario 8, step 8: 8 right answers out of 10, 8 seconds left: 80 points.
            assertThat(GameScoring.score(8, 1)).isEqualTo(80);
            assertThat(GameScoring.score(0, 1)).isZero();
            assertThat(GameScoring.score(3, 2)).isEqualTo(60);
        }

        @Test
        void theTimePlayedIsRoundedAndNeverMoreThanTheLimit() {
            assertThat(GameScoring.playedSeconds(60, Duration.ofMillis(51_600))).isEqualTo(52);
            assertThat(GameScoring.playedSeconds(60, Duration.ofSeconds(62))).isEqualTo(60);
            assertThat(GameScoring.playedSeconds(null, Duration.ofSeconds(125))).isEqualTo(125);
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

        private PlayRound round(Long topicId, Long listId) {
            return tokens.newRound(1L, 42L, topicId, listId, List.of(
                    new PlayRound.Question(11L, List.of(14L, 11L, 12L, 13L)),
                    new PlayRound.Question(12L, List.of(12L, 13L, 14L, 11L))), List.of());
        }

        @Test
        void aSealedRoundComesBackIdentical() {
            PlayRound round = round(7L, null);
            PlayRound match = tokens.newRound(3L, 42L, null, 9L,
                    List.of(new PlayRound.Question(11L, List.of()), new PlayRound.Question(12L, List.of())), List.of(12L, 11L));

            assertThat(tokens.verify(tokens.seal(round), 1L, 42L)).isEqualTo(round);
            assertThat(tokens.verify(tokens.seal(match), 3L, 42L)).isEqualTo(match);
            assertThat(tokens.verify(tokens.seal(round(null, null)), 1L, 42L).topicId()).isNull();
        }

        @Test
        void theTokenDoesNotShowTheAnswers() {
            String token = tokens.seal(round(7L, null));

            // The round is encrypted: none of its word ids can be read from the token.
            for (String part : token.split("\\.")) {
                String decoded = new String(java.util.Base64.getUrlDecoder().decode(part), java.nio.charset.StandardCharsets.ISO_8859_1);
                assertThat(decoded).doesNotContain("11,").doesNotContain("42:");
            }
        }

        @Test
        void aChangedTokenIsRejected() {
            String token = tokens.seal(round(7L, null));
            String[] parts = token.split("\\.");
            byte[] ciphertext = java.util.Base64.getUrlDecoder().decode(parts[1]);
            ciphertext[0] ^= 1;
            String flipped = parts[0] + "." + java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(ciphertext);

            assertThatThrownBy(() -> tokens.verify(flipped, 1L, 42L)).isInstanceOf(InvalidPlayTokenException.class);
            assertThatThrownBy(() -> tokens.verify(parts[0] + "." + parts[1].substring(1), 1L, 42L))
                    .isInstanceOf(InvalidPlayTokenException.class);
            assertThatThrownBy(() -> tokens.verify("not-a-token", 1L, 42L)).isInstanceOf(InvalidPlayTokenException.class);
            assertThatThrownBy(() -> tokens.verify("a.b.c", 1L, 42L)).isInstanceOf(InvalidPlayTokenException.class);
        }

        @Test
        void aTokenOnlyWorksForItsGameItsPlayerAndThisServer() {
            String token = tokens.seal(round(7L, null));
            PlayTokenService otherServer = new PlayTokenService(new StudyCalendar(clock));

            assertThatThrownBy(() -> tokens.verify(token, 2L, 42L)).isInstanceOf(InvalidPlayTokenException.class);
            assertThatThrownBy(() -> tokens.verify(token, 1L, 43L)).isInstanceOf(InvalidPlayTokenException.class);
            assertThatThrownBy(() -> otherServer.verify(token, 1L, 42L)).isInstanceOf(InvalidPlayTokenException.class);
        }

        @Test
        void aTokenExpiresAfterAnHour() {
            String token = tokens.seal(round(7L, null));

            clock.advance(Duration.ofMinutes(59));
            assertThat(tokens.verify(token, 1L, 42L).gameId()).isEqualTo(1L);
            clock.advance(Duration.ofMinutes(2));
            assertThatThrownBy(() -> tokens.verify(token, 1L, 42L)).isInstanceOf(InvalidPlayTokenException.class);
        }

        @Test
        void aRoundIsHandedInOnlyOnce() {
            PlayRound first = round(7L, null);
            PlayRound another = round(7L, null);

            assertThat(tokens.markHandedIn(first)).isTrue();
            assertThat(tokens.markHandedIn(first)).isFalse();
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
