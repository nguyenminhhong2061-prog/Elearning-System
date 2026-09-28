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
@Table(name = "pronunciation_attempts")
public class PronunciationAttempt {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private Long attemptId;
    @Column(nullable = false)
    private Long lessonId;
    @Column(nullable = false)
    private Long pronunciationItemId;
    @Column(nullable = false)
    private int tryNumber;
    @Column(length = 100)
    private String provider;
    @Column(length = 255)
    private String providerRequestId;
    @Column(length = 500)
    private String recordingUri;
    @Column(columnDefinition = "TEXT")
    private String recognizedText;
    @Column(precision = 5, scale = 2)
    private BigDecimal accuracyScore;
    @Column(precision = 5, scale = 2)
    private BigDecimal fluencyScore;
    @Column(precision = 5, scale = 2)
    private BigDecimal completenessScore;
    @Column(precision = 5, scale = 2)
    private BigDecimal overallScore;
    @Column(columnDefinition = "jsonb")
    private String assessmentDetails;
    private Instant assessedAt;

    protected PronunciationAttempt() {}
    public Long getId() { return id; }
    public Long getAttemptId() { return attemptId; }
    public Long getLessonId() { return lessonId; }
    public Long getPronunciationItemId() { return pronunciationItemId; }
    public int getTryNumber() { return tryNumber; }
    public BigDecimal getOverallScore() { return overallScore; }
    public Instant getAssessedAt() { return assessedAt; }
}
