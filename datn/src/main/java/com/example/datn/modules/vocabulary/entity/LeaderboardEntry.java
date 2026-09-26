package com.example.datn.modules.vocabulary.entity;

import com.example.datn.modules.vocabulary.enums.LeaderboardPeriod;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;

/**
 * One row of the leaderboard cache: a player's total score and rank in one period, for one game or (game id null)
 * for all games together. Rebuilt by LeaderboardService.refresh, never computed on read (decision of 23/09/2026).
 */
@Entity
@Table(name = "leaderboard")
public class LeaderboardEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Null: all games together.
    private Long gameId;

    @Convert(converter = LeaderboardPeriodConverter.class)
    @Column(nullable = false, length = 10)
    private LeaderboardPeriod periodType;

    @Column(nullable = false)
    private LocalDate periodStart;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private int totalScore;

    // "rank" is quoted in the schema (a function name in SQL), so it is quoted here too.
    @Column(name = "\"rank\"", nullable = false)
    private int rank;

    protected LeaderboardEntry() {
    }

    public LeaderboardEntry(
            Long gameId,
            LeaderboardPeriod periodType,
            LocalDate periodStart,
            Long userId,
            int totalScore,
            int rank) {
        this.gameId = gameId;
        this.periodType = periodType;
        this.periodStart = periodStart;
        this.userId = userId;
        this.totalScore = totalScore;
        this.rank = rank;
    }

    public Long getId() {
        return id;
    }

    public Long getGameId() {
        return gameId;
    }

    public LeaderboardPeriod getPeriodType() {
        return periodType;
    }

    public LocalDate getPeriodStart() {
        return periodStart;
    }

    public Long getUserId() {
        return userId;
    }

    public int getTotalScore() {
        return totalScore;
    }

    public int getRank() {
        return rank;
    }
}
