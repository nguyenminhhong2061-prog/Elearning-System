package com.example.datn.modules.exercise.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "chat_sessions")
public class ChatSession {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private Long userId;
    private Long lessonId;
    private Long questionId;
    private String title;
    @Column(nullable = false)
    private Instant createdAt;
    @Column(nullable = false)
    private Instant updatedAt;

    protected ChatSession() {}

    public ChatSession(Long userId, Long lessonId, Long questionId, String title, Instant now) {
        this.userId = userId;
        this.lessonId = lessonId;
        this.questionId = questionId;
        this.title = title;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public void touch(Instant now) { this.updatedAt = now; }
    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public Long getLessonId() { return lessonId; }
    public Long getQuestionId() { return questionId; }
    public String getTitle() { return title; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
