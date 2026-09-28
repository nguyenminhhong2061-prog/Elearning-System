package com.example.datn.modules.exercise.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "question_accepted_answers")
public class QuestionAcceptedAnswer {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private Long questionId;
    @Column(nullable = false, length = 255)
    private String answerText;
    @Column(nullable = false, length = 255)
    private String normalizedAnswer;
    @Column(name = "is_primary", nullable = false)
    private boolean primary;

    protected QuestionAcceptedAnswer() {}

    public Long getId() { return id; }
    public Long getQuestionId() { return questionId; }
    public String getAnswerText() { return answerText; }
    public String getNormalizedAnswer() { return normalizedAnswer; }
    public boolean isPrimary() { return primary; }
}
