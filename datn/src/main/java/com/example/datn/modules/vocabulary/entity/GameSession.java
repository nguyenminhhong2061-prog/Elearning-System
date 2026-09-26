package com.example.datn.modules.vocabulary.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/** A finished round, saved only when the player hands it in (a round left midway is not saved). */
@Entity
@Table(name = "game_sessions")
public class GameSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long gameId;

    // Plain id: users belong to another module.
    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private int score;

    @Column(nullable = false)
    private Instant playedAt;

    protected GameSession() {
    }

    public GameSession(Long gameId, Long userId, int score, Instant playedAt) {
        this.gameId = gameId;
        this.userId = userId;
        this.score = score;
        this.playedAt = playedAt;
    }

    public Long getId() {
        return id;
    }

    public Long getGameId() {
        return gameId;
    }

    public Long getUserId() {
        return userId;
    }

    public int getScore() {
        return score;
    }

    public Instant getPlayedAt() {
        return playedAt;
    }
}
