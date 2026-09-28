package com.example.datn.modules.exercise.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "listening_segments")
public class ListeningSegment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private Long passageId;
    @Column(name = "segment_order", nullable = false)
    private int order;
    @Column(nullable = false)
    private int startMs;
    @Column(nullable = false)
    private int endMs;
    @Column(length = 100)
    private String speakerLabel;
    @Column(columnDefinition = "TEXT")
    private String transcriptEn;
    @Column(columnDefinition = "TEXT")
    private String translationVi;

    protected ListeningSegment() {}
    public Long getId() { return id; }
    public Long getPassageId() { return passageId; }
    public int getOrder() { return order; }
    public int getStartMs() { return startMs; }
    public int getEndMs() { return endMs; }
    public String getSpeakerLabel() { return speakerLabel; }
    public String getTranscriptEn() { return transcriptEn; }
    public String getTranslationVi() { return translationVi; }
}
