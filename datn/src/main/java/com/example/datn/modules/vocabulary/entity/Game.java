package com.example.datn.modules.vocabulary.entity;

import com.example.datn.modules.vocabulary.enums.GameType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** One of the vocabulary games (A4). Games and their question banks are seeded by migration. */
@Entity
@Table(name = "games")
public class Game {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    // The schema's CHECK constraint uses the upper-case names, so the default EnumType.STRING mapping fits.
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private GameType gameType;

    // Null: no time limit.
    private Integer timeLimitSeconds;

    protected Game() {
    }

    public Game(String name, GameType gameType, Integer timeLimitSeconds) {
        this.name = name;
        this.gameType = gameType;
        this.timeLimitSeconds = timeLimitSeconds;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public GameType getGameType() {
        return gameType;
    }

    public Integer getTimeLimitSeconds() {
        return timeLimitSeconds;
    }
}
