package com.example.datn.modules.vocabulary.service;

import com.example.datn.common.security.CurrentUser;
import com.example.datn.common.user.UserDirectory;
import com.example.datn.modules.vocabulary.dto.response.LeaderboardResponse;
import com.example.datn.modules.vocabulary.entity.LeaderboardEntry;
import com.example.datn.modules.vocabulary.enums.LeaderboardPeriod;
import com.example.datn.modules.vocabulary.exception.GameNotFoundException;
import com.example.datn.modules.vocabulary.repository.GameRepository;
import com.example.datn.modules.vocabulary.repository.GameSessionRepository;
import com.example.datn.modules.vocabulary.repository.LeaderboardEntryRepository;
import com.example.datn.modules.vocabulary.repository.ScoreTotal;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * The leaderboard cache (decision of 23/09/2026): {@link #refresh} rebuilds it from game_sessions, run by
 * LeaderboardScheduler; {@link #board} only reads it, so a round just played shows after the next refresh.
 */
@Service
@Transactional
public class LeaderboardService {

    /** Players listed on a board. */
    static final int TOP = 10;

    private final LeaderboardEntryRepository entryRepository;
    private final GameSessionRepository sessionRepository;
    private final GameRepository gameRepository;
    private final UserDirectory userDirectory;
    private final CurrentUser currentUser;
    private final StudyCalendar calendar;

    private volatile Instant refreshedAt;

    public LeaderboardService(
            LeaderboardEntryRepository entryRepository,
            GameSessionRepository sessionRepository,
            GameRepository gameRepository,
            UserDirectory userDirectory,
            CurrentUser currentUser,
            StudyCalendar calendar) {
        this.entryRepository = entryRepository;
        this.sessionRepository = sessionRepository;
        this.gameRepository = gameRepository;
        this.userDirectory = userDirectory;
        this.currentUser = currentUser;
        this.calendar = calendar;
    }

    /**
     * Rebuilds the boards of the current week and month (Vietnam dates): one per game and one for all games together.
     * Each period is deleted and written again in this transaction, so readers see the old board or the new one.
     */
    public void refresh() {
        LocalDate today = calendar.today();
        for (LeaderboardPeriod period : LeaderboardPeriod.values()) {
            LocalDate start = period.startOf(today);
            List<ScoreTotal> totals = sessionRepository.totalsBetween(
                    calendar.startOf(start), calendar.startOf(period.nextStart(start)));

            List<LeaderboardEntry> rows = new ArrayList<>();
            totals.stream()
                    .collect(Collectors.groupingBy(ScoreTotal::gameId))
                    .forEach((gameId, perGame) -> rows.addAll(rank(gameId, period, start, perGame)));
            rows.addAll(rank(null, period, start, allGames(totals)));

            entryRepository.deletePeriod(period, start);
            entryRepository.saveAll(rows);
        }
        refreshedAt = calendar.now();
    }

    /** The top of one board and the current player's place; {@code gameId} null is the board of all games. */
    @Transactional(readOnly = true)
    public LeaderboardResponse board(LeaderboardPeriod period, Long gameId) {
        if (gameId != null && !gameRepository.existsById(gameId)) {
            throw new GameNotFoundException(gameId);
        }
        LocalDate start = period.startOf(calendar.today());
        List<LeaderboardEntry> top = entryRepository.findBoard(gameId, period, start, PageRequest.of(0, TOP));
        Map<Long, String> names = userDirectory.displayNames(top.stream().map(LeaderboardEntry::getUserId).toList());
        LeaderboardResponse.Me me = entryRepository.findEntry(gameId, period, start, currentUser.id())
                .map(entry -> new LeaderboardResponse.Me(entry.getRank(), entry.getTotalScore()))
                .orElse(null);
        return new LeaderboardResponse(
                period,
                start,
                refreshedAt,
                top.stream()
                        .map(entry -> new LeaderboardResponse.Entry(
                                entry.getRank(),
                                entry.getUserId(),
                                names.getOrDefault(entry.getUserId(), ""),
                                entry.getTotalScore()))
                        .toList(),
                me);
    }

    /**
     * Ranks players by total score, highest first. Ranks are never shared (the frontend draws one podium place per
     * rank, as the mock API does): on equal totals, whoever reached the total first ranks higher, then the lower
     * user id. Players without points are left out.
     */
    public static List<LeaderboardEntry> rank(
            Long gameId, LeaderboardPeriod period, LocalDate start, List<ScoreTotal> totals) {
        List<ScoreTotal> ordered = totals.stream()
                .filter(total -> total.total() > 0)
                .sorted(Comparator.comparing(ScoreTotal::total, Comparator.reverseOrder())
                        .thenComparing(ScoreTotal::reachedAt)
                        .thenComparing(ScoreTotal::userId))
                .toList();
        List<LeaderboardEntry> rows = new ArrayList<>();
        for (int index = 0; index < ordered.size(); index++) {
            ScoreTotal player = ordered.get(index);
            rows.add(new LeaderboardEntry(
                    gameId, period, start, player.userId(), Math.toIntExact(player.total()), index + 1));
        }
        return rows;
    }

    /** Every player's total over all games, reached with their last round in any game. */
    private static List<ScoreTotal> allGames(List<ScoreTotal> totals) {
        return totals.stream()
                .collect(Collectors.groupingBy(ScoreTotal::userId))
                .entrySet().stream()
                .map(player -> new ScoreTotal(
                        null,
                        player.getKey(),
                        player.getValue().stream().mapToLong(ScoreTotal::total).sum(),
                        player.getValue().stream().map(ScoreTotal::reachedAt).max(Comparator.naturalOrder()).orElseThrow()))
                .toList();
    }
}
