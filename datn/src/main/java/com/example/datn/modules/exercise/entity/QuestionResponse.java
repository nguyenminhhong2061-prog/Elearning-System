package com.example.datn.modules.exercise.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import tools.jackson.databind.JsonNode;

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
    @Column(columnDefinition = "TEXT")
    private String enteredAnswer;
    @Column(columnDefinition = "TEXT")
    private String normalizedAnswer;
    @Column(name = "is_correct")
    private Boolean correct;
    @Column(nullable = false)
    private boolean graded = true;
    @Column(precision = 6, scale = 2)
    private BigDecimal awardedPoints;
    @Column(columnDefinition = "TEXT")
    private String feedback;
    @Column(name = "ai_explanation", columnDefinition = "TEXT")
    private String aiExplanation;
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "sample_answers", columnDefinition = "jsonb")
    private JsonNode sampleAnswers;
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "ai_assessment", columnDefinition = "jsonb")
    private JsonNode aiAssessment;
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
    public boolean isCorrect() { return Boolean.TRUE.equals(correct); }
    public Boolean getCorrect() { return correct; }
    public boolean isGraded() { return graded; }
    public BigDecimal getAwardedPoints() { return awardedPoints; }
    public String getFeedback() { return feedback; }
    public String getAiExplanation() { return aiExplanation; }
    public JsonNode getSampleAnswers() { return sampleAnswers; }
    public JsonNode getAiAssessment() { return aiAssessment; }
    public Instant getAnsweredAt() { return answeredAt; }

    public void applyAiGrade(BigDecimal awardedPoints, String feedback, String explanation,
                             JsonNode sampleAnswers, JsonNode assessment) {
        this.awardedPoints = awardedPoints;
        this.feedback = feedback;
        this.aiExplanation = explanation;
        this.sampleAnswers = sampleAnswers;
        this.aiAssessment = assessment;
        this.graded = true;
        this.correct = null;
    }

    public void markUngraded() {
        this.awardedPoints = null;
        this.feedback = null;
        this.aiExplanation = null;
        this.sampleAnswers = null;
        this.aiAssessment = null;
        this.graded = false;
        this.correct = null;
    }

    public QuestionResponse(Long attemptId, Long lessonId, Long questionId, String enteredAnswer, Instant answeredAt) {
        this.attemptId = attemptId;
        this.lessonId = lessonId;
        this.questionId = questionId;
        this.enteredAnswer = enteredAnswer;
        this.answeredAt = answeredAt;
        markUngraded();
    }
}
