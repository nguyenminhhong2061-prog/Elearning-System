package com.example.datn.modules.exercise.entity;

import com.example.datn.modules.exercise.enums.QuestionType;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "exercise_questions")
public class ExerciseQuestion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private Long lessonId;
    @Column(nullable = false, length = 100)
    private String code;
    @Convert(converter = QuestionTypeConverter.class)
    @Column(nullable = false, length = 20)
    private QuestionType questionType;
    @Column(nullable = false, columnDefinition = "TEXT")
    private String prompt;
    @Column(columnDefinition = "TEXT")
    private String hintText;
    @Column(columnDefinition = "TEXT")
    private String explanation;
    @Column(nullable = false, precision = 6, scale = 2)
    private BigDecimal points;
    @Column(nullable = false)
    private int sortOrder;
    @Column(nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    protected ExerciseQuestion() {}

    public Long getId() { return id; }
    public Long getLessonId() { return lessonId; }
    public String getCode() { return code; }
    public QuestionType getQuestionType() { return questionType; }
    public String getPrompt() { return prompt; }
    public String getHintText() { return hintText; }
    public String getExplanation() { return explanation; }
    public BigDecimal getPoints() { return points; }
    public int getSortOrder() { return sortOrder; }
    public Instant getCreatedAt() { return createdAt; }
}
