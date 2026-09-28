package com.example.datn.modules.exercise.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "pronunciation_items")
public class PronunciationItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private Long lessonId;
    @Column(nullable = false)
    private int sortOrder;
    @Column(nullable = false, length = 500)
    private String referenceText;
    @Column(length = 500)
    private String ipa;
    @Column(length = 500)
    private String referenceAudioUri;
    @Column(columnDefinition = "TEXT")
    private String notes;

    protected PronunciationItem() {}
    public Long getId() { return id; }
    public Long getLessonId() { return lessonId; }
    public int getSortOrder() { return sortOrder; }
    public String getReferenceText() { return referenceText; }
    public String getIpa() { return ipa; }
    public String getReferenceAudioUri() { return referenceAudioUri; }
    public String getNotes() { return notes; }
}
