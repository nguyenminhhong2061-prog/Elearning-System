package com.example.datn.modules.vocabulary.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A possible answer to a game question. Choice games have one right option and three wrong ones per question;
 * a WORD_MATCH question has only its right option (the meaning to match). Never sent to the browser with
 * {@code correct}: the server grades the answers.
 */
@Entity
@Table(name = "game_question_options")
public class GameQuestionOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long gameQuestionId;

    @Column(nullable = false, length = 500)
    private String content;

    @Column(name = "is_correct", nullable = false)
    private boolean correct;

    protected GameQuestionOption() {
    }

    public GameQuestionOption(Long gameQuestionId, String content, boolean correct) {
        this.gameQuestionId = gameQuestionId;
        this.content = content;
        this.correct = correct;
    }

    public Long getId() {
        return id;
    }

    public Long getGameQuestionId() {
        return gameQuestionId;
    }

    public String getContent() {
        return content;
    }

    public boolean isCorrect() {
        return correct;
    }
}
