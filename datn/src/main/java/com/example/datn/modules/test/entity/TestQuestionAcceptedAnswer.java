package com.example.datn.modules.test.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** One accepted answer of a fill-blank / short-writing question (test_question_accepted_answers). */
@Entity
@Table(name = "test_question_accepted_answers")
public class TestQuestionAcceptedAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "question_id", nullable = false)
    private Long questionId;

    @Column(name = "answer_text", nullable = false, length = 255)
    private String answerText;

    @Column(name = "normalized_answer", nullable = false, length = 255)
    private String normalizedAnswer;

    @Column(name = "is_primary", nullable = false)
    private boolean primary;

    protected TestQuestionAcceptedAnswer() {
    }

    public TestQuestionAcceptedAnswer(Long questionId, String answerText, String normalizedAnswer, boolean primary) {
        this.questionId = questionId;
        this.answerText = answerText;
        this.normalizedAnswer = normalizedAnswer;
        this.primary = primary;
    }

    public Long getId() {
        return id;
    }

    public Long getQuestionId() {
        return questionId;
    }

    public String getAnswerText() {
        return answerText;
    }

    public String getNormalizedAnswer() {
        return normalizedAnswer;
    }

    public boolean isPrimary() {
        return primary;
    }
}
