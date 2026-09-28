package com.example.datn.modules.exercise.entity;

import com.example.datn.common.enums.CefrLevel;
import com.example.datn.modules.exercise.enums.ExerciseDifficulty;
import com.example.datn.modules.exercise.enums.ExerciseSkill;
import com.example.datn.modules.exercise.enums.PublicationStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "exercise_lessons")
public class ExerciseLesson {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 191)
    private String slug;
    @Convert(converter = ExerciseSkillConverter.class)
    @Column(nullable = false, length = 20)
    private ExerciseSkill skill;
    @Column(nullable = false)
    private String title;
    @Column(columnDefinition = "TEXT")
    private String description;
    @Column(length = 150)
    private String topic;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 2)
    private CefrLevel cefrLevel;
    @Convert(converter = ExerciseDifficultyConverter.class)
    @Column(nullable = false, length = 10)
    private ExerciseDifficulty difficulty;
    private Integer estimatedMinutes;
    @Convert(converter = PublicationStatusConverter.class)
    @Column(nullable = false, length = 20)
    private PublicationStatus publicationStatus;
    @Column(nullable = false)
    private int sortOrder;
    @Column(nullable = false, insertable = false, updatable = false)
    private Instant createdAt;
    @Column(nullable = false, insertable = false, updatable = false)
    private Instant updatedAt;

    protected ExerciseLesson() {}

    public Long getId() { return id; }
    public String getSlug() { return slug; }
    public ExerciseSkill getSkill() { return skill; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getTopic() { return topic; }
    public CefrLevel getCefrLevel() { return cefrLevel; }
    public ExerciseDifficulty getDifficulty() { return difficulty; }
    public Integer getEstimatedMinutes() { return estimatedMinutes; }
    public PublicationStatus getPublicationStatus() { return publicationStatus; }
    public int getSortOrder() { return sortOrder; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
