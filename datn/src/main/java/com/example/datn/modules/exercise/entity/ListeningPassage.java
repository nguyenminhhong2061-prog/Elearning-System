package com.example.datn.modules.exercise.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "listening_passages")
public class ListeningPassage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private Long lessonId;
    @Column(nullable = false)
    private String title;
    @Column(nullable = false, length = 500)
    private String audioUri;
    @Column(nullable = false)
    private int durationMs;
    @Column(columnDefinition = "TEXT")
    private String fullTranscriptEn;
    @Column(columnDefinition = "TEXT")
    private String fullTranslationVi;

    protected ListeningPassage() {}
    public Long getId() { return id; }
    public Long getLessonId() { return lessonId; }
    public String getTitle() { return title; }
    public String getAudioUri() { return audioUri; }
    public int getDurationMs() { return durationMs; }
    public String getFullTranscriptEn() { return fullTranscriptEn; }
    public String getFullTranslationVi() { return fullTranslationVi; }
}
