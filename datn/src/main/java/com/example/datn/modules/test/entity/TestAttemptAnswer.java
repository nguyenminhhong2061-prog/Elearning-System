package com.example.datn.modules.test.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;

/** The learner's answer to one question of an attempt (test_attempt_answers). */
@Entity
@Table(name = "test_attempt_answers")
public class TestAttemptAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "attempt_id", nullable = false)
    private Long attemptId;

    @Column(name = "question_id", nullable = false)
    private Long questionId;

    @Column(name = "answer_content", columnDefinition = "TEXT")
    private String answerContent;

    @Column(name = "selected_option_id")
    private Long selectedOptionId;

    @Column(name = "is_correct")
    private Boolean correct;

    @Column(name = "score_earned", nullable = false)
    private BigDecimal scoreEarned;

    protected TestAttemptAnswer() {
    }

    public TestAttemptAnswer(Long attemptId, Long questionId) {
        this.attemptId = attemptId;
        this.questionId = questionId;
        this.scoreEarned = BigDecimal.ZERO;
    }

    public Long getId() {
        return id;
    }

    public Long getAttemptId() {
        return attemptId;
    }

    public Long getQuestionId() {
        return questionId;
    }

    public String getAnswerContent() {
        return answerContent;
    }

    public Long getSelectedOptionId() {
        return selectedOptionId;
    }

    public Boolean getCorrect() {
        return correct;
    }

    public BigDecimal getScoreEarned() {
        return scoreEarned;
    }

    public void setOption(Long selectedOptionId) {
        this.selectedOptionId = selectedOptionId;
        this.answerContent = null;
    }

    public void setText(String answerContent) {
        this.answerContent = answerContent;
        this.selectedOptionId = null;
    }

    public void grade(Boolean correct, BigDecimal scoreEarned) {
        this.correct = correct;
        this.scoreEarned = scoreEarned;
    }
}
