package com.example.datn.modules.exercise.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "knowledge_chunks")
public class KnowledgeChunk {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 191)
    private String sourceKey;
    private String sourceTitle;
    private Long lessonId;
    private Long questionId;
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    protected KnowledgeChunk() {}
    public Long getId() { return id; }
    public String getSourceKey() { return sourceKey; }
    public String getSourceTitle() { return sourceTitle; }
    public Long getLessonId() { return lessonId; }
    public Long getQuestionId() { return questionId; }
    public String getContent() { return content; }
}
