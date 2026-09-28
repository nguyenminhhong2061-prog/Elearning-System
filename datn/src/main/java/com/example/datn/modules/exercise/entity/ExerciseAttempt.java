package com.example.datn.modules.exercise.entity;

import com.example.datn.modules.exercise.enums.AttemptStatus;
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
@Table(name = "exercise_attempts")
public class ExerciseAttempt {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private Long userId;
    @Column(nullable = false)
    private Long lessonId;
    @Convert(converter = AttemptStatusConverter.class)
    @Column(nullable = false, length = 20)
    private AttemptStatus status;
    @Column(nullable = false, precision = 3, scale = 2)
    private BigDecimal playbackRate;
    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal totalPoints;
    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal earnedPoints;
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal scorePercent;
    @Column(nullable = false)
    private Instant startedAt;
    private Instant finishedAt;

    protected ExerciseAttempt() {}

    public ExerciseAttempt(Long userId, Long lessonId, Instant startedAt) {
        this.userId = userId;
        this.lessonId = lessonId;
        this.status = AttemptStatus.IN_PROGRESS;
        this.playbackRate = BigDecimal.ONE;
        this.totalPoints = BigDecimal.ZERO;
        this.earnedPoints = BigDecimal.ZERO;
        this.scorePercent = BigDecimal.ZERO;
        this.startedAt = startedAt;
    }

    public void abandon() { this.status = AttemptStatus.ABANDONED; }
    public void complete(BigDecimal playbackRate, BigDecimal total, BigDecimal earned, BigDecimal percent, Instant now) {
        this.playbackRate = playbackRate == null ? BigDecimal.ONE : playbackRate;
        this.totalPoints = total;
        this.earnedPoints = earned;
        this.scorePercent = percent;
        this.status = AttemptStatus.COMPLETED;
        this.finishedAt = now;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public Long getLessonId() { return lessonId; }
    public AttemptStatus getStatus() { return status; }
    public BigDecimal getPlaybackRate() { return playbackRate; }
    public BigDecimal getTotalPoints() { return totalPoints; }
    public BigDecimal getEarnedPoints() { return earnedPoints; }
    public BigDecimal getScorePercent() { return scorePercent; }
    public Instant getStartedAt() { return startedAt; }
    public Instant getFinishedAt() { return finishedAt; }
}
