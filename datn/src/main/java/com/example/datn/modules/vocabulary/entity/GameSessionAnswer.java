package com.example.datn.modules.vocabulary.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** The answer given to one question of a saved round, as graded by the server. */
@Entity
@Table(name = "game_session_answers")
public class GameSessionAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long sessionId;

    @Column(nullable = false)
    private Long gameQuestionId;

    // Null: the question was not answered.
    private Long selectedOptionId;

    @Column(name = "is_correct", nullable = false)
    private boolean correct;

    private Integer responseTimeMs;

    protected GameSessionAnswer() {
    }

    public GameSessionAnswer(
            Long sessionId,
            Long gameQuestionId,
            Long selectedOptionId,
            boolean correct,
            Integer responseTimeMs) {
        this.sessionId = sessionId;
        this.gameQuestionId = gameQuestionId;
        this.selectedOptionId = selectedOptionId;
        this.correct = correct;
        this.responseTimeMs = responseTimeMs;
    }

    public Long getId() {
        return id;
    }

    public Long getSessionId() {
        return sessionId;
    }

    public Long getGameQuestionId() {
        return gameQuestionId;
    }

    public Long getSelectedOptionId() {
        return selectedOptionId;
    }

    public boolean isCorrect() {
        return correct;
    }

    public Integer getResponseTimeMs() {
        return responseTimeMs;
    }
}
