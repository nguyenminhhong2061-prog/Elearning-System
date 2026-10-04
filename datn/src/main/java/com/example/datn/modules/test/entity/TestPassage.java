package com.example.datn.modules.test.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * What several questions of a test are asked about (test_passages): a recording to listen to, or a text to read.
 * Questions point to it by passage_id.
 */
@Entity
@Table(name = "test_passages")
public class TestPassage {

    /** How many times a learner may play the recording of a passage in one attempt. */
    public static final int MAX_PLAYS = 2;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "test_id", nullable = false)
    private Long testId;

    @Column(length = 255)
    private String title;

    // The text the learner reads; null for a listening passage.
    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "audio_url", length = 500)
    private String audioUrl;

    // What is said in the recording. Only shown once the attempt is submitted.
    @Column(columnDefinition = "TEXT")
    private String transcript;

    protected TestPassage() {
    }

    public TestPassage(Long testId, String title, String content, String audioUrl, String transcript) {
        this.testId = testId;
        this.title = title;
        this.content = content;
        this.audioUrl = audioUrl;
        this.transcript = transcript;
    }

    public Long getId() {
        return id;
    }

    public Long getTestId() {
        return testId;
    }

    public String getTitle() {
        return title;
    }

    public String getContent() {
        return content;
    }

    public String getAudioUrl() {
        return audioUrl;
    }

    public String getTranscript() {
        return transcript;
    }

    public boolean hasAudio() {
        return audioUrl != null;
    }
}
