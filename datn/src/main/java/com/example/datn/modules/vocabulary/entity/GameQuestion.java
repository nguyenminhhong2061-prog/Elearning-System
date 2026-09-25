package com.example.datn.modules.vocabulary.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** A question of a game's bank, about one word. A round draws some of them at random. */
@Entity
@Table(name = "game_questions")
public class GameQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long gameId;

    @Column(nullable = false)
    private Long vocabularyId;

    // Part of the agreed schema but unused: rounds are drawn at random rather than fixed.
    private Integer roundNumber;

    @Column(nullable = false)
    private int points;

    protected GameQuestion() {
    }

    public GameQuestion(Long gameId, Long vocabularyId, int points) {
        this.gameId = gameId;
        this.vocabularyId = vocabularyId;
        this.points = points;
    }

    public Long getId() {
        return id;
    }

    public Long getGameId() {
        return gameId;
    }

    public Long getVocabularyId() {
        return vocabularyId;
    }

    public Integer getRoundNumber() {
        return roundNumber;
    }

    public int getPoints() {
        return points;
    }
}
