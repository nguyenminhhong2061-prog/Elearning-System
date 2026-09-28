package com.example.datn.modules.exercise.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "question_responses")
public class QuestionResponse {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private Long attemptId;
    @Column(nullable = false)
    private Long lessonId;
    @Column(nullable = false)
    private Long questionId;
    private Long selectedOptionId;
    @Column(length = 500)
    private String enteredAnswer;
    @Column(length = 500)
    private String normalizedAnswer;
    @Column(name = "is_correct", nullable = false)
    private boolean correct;
    @Column(nullable = false, precision = 6, scale = 2)
    private BigDecimal awardedPoints;
    @Column(nullable = false)
    private Instant answeredAt;

    protected QuestionResponse() {}

    public QuestionResponse(Long attemptId, Long lessonId, Long questionId, Long selectedOptionId,
                            String enteredAnswer, String normalizedAnswer, boolean correct,
                            BigDecimal awardedPoints, Instant answeredAt) {
        this.attemptId = attemptId;
        this.lessonId = lessonId;
        this.questionId = questionId;
        this.selectedOptionId = selectedOptionId;
        this.enteredAnswer = enteredAnswer;
        this.normalizedAnswer = normalizedAnswer;
        this.correct = correct;
        this.awardedPoints = awardedPoints;
        this.answeredAt = answeredAt;
    }

    public Long getId() { return id; }
    public Long getAttemptId() { return attemptId; }
    public Long getLessonId() { return lessonId; }
    public Long getQuestionId() { return questionId; }
    public Long getSelectedOptionId() { return selectedOptionId; }
    public String getEnteredAnswer() { return enteredAnswer; }
    public String getNormalizedAnswer() { return normalizedAnswer; }
    public boolean isCorrect() { return correct; }
    public BigDecimal getAwardedPoints() { return awardedPoints; }
    public Instant getAnsweredAt() { return answeredAt; }
}
