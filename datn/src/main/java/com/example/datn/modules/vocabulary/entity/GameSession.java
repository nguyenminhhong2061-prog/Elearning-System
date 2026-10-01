package com.example.datn.modules.vocabulary.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * A finished round ("Lượt chơi trò chơi" of the Business model), saved only when the player hands it in (a round left
 * midway is not saved): the game, the topic or personal list its words came from, the right answers out of the
 * questions, the score and the time played.
 */
@Entity
@Table(name = "game_sessions")
public class GameSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long gameId;

    // Plain ids: users belong to another module; topics and lists are only referenced.
    @Column(nullable = false)
    private Long userId;

    private Long topicId;

    private Long customListId;

    @Column(nullable = false)
    private int correctCount;

    @Column(nullable = false)
    private int questionCount;

    @Column(nullable = false)
    private int score;

    // Null only for the rounds played before it was recorded (V202610021010).
    private Integer durationSeconds;

    @Column(nullable = false)
    private Instant playedAt;

    protected GameSession() {
    }

    public GameSession(
            Long gameId,
            Long userId,
            Long topicId,
            Long customListId,
            int correctCount,
            int questionCount,
            int score,
            int durationSeconds,
            Instant playedAt) {
        this.gameId = gameId;
        this.userId = userId;
        this.topicId = topicId;
        this.customListId = customListId;
        this.correctCount = correctCount;
        this.questionCount = questionCount;
        this.score = score;
        this.durationSeconds = durationSeconds;
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

    public Long getTopicId() {
        return topicId;
    }

    public Long getCustomListId() {
        return customListId;
    }

    public int getCorrectCount() {
        return correctCount;
    }

    public int getQuestionCount() {
        return questionCount;
    }

    public int getScore() {
        return score;
    }

    public Integer getDurationSeconds() {
        return durationSeconds;
    }

    public Instant getPlayedAt() {
        return playedAt;
    }
}
