package com.example.datn.modules.vocabulary.entity;

import com.example.datn.common.enums.CefrLevel;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "vocabulary")
public class Vocabulary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // topic_id / created_by are kept as plain ids: users belong to another module,
    // and topics are looked up through TopicRepository when needed.
    private Long topicId;

    private Long createdBy;

    @Column(nullable = false, length = 150)
    private String word;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String meaning;

    @Column(columnDefinition = "TEXT")
    private String exampleSentence;

    @Column(length = 150)
    private String phonetic;

    @Column(length = 500)
    private String audioUrl;

    @Column(length = 500)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 2)
    private CefrLevel difficultyLevel;

    protected Vocabulary() {
    }

    public Vocabulary(
            Long topicId,
            Long createdBy,
            String word,
            String meaning,
            String exampleSentence,
            String phonetic,
            String audioUrl,
            String imageUrl,
            CefrLevel difficultyLevel) {
        this.topicId = topicId;
        this.createdBy = createdBy;
        this.word = word;
        this.meaning = meaning;
        this.exampleSentence = exampleSentence;
        this.phonetic = phonetic;
        this.audioUrl = audioUrl;
        this.imageUrl = imageUrl;
        this.difficultyLevel = difficultyLevel;
    }

    public Long getId() {
        return id;
    }

    public Long getTopicId() {
        return topicId;
    }

    public Long getCreatedBy() {
        return createdBy;
    }

    public String getWord() {
        return word;
    }

    public String getMeaning() {
        return meaning;
    }

    public String getExampleSentence() {
        return exampleSentence;
    }

    public String getPhonetic() {
        return phonetic;
    }

    public String getAudioUrl() {
        return audioUrl;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public CefrLevel getDifficultyLevel() {
        return difficultyLevel;
    }

    public void update(
            Long topicId,
            String word,
            String meaning,
            String exampleSentence,
            String phonetic,
            String audioUrl,
            String imageUrl,
            CefrLevel difficultyLevel) {
        this.topicId = topicId;
        this.word = word;
        this.meaning = meaning;
        this.exampleSentence = exampleSentence;
        this.phonetic = phonetic;
        this.audioUrl = audioUrl;
        this.imageUrl = imageUrl;
        this.difficultyLevel = difficultyLevel;
    }
}
