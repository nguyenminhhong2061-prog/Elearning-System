package com.example.datn.modules.vocabulary.entity;

import com.example.datn.common.enums.CefrLevel;
import com.example.datn.modules.vocabulary.enums.VocabularyStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;

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

    @Convert(converter = VocabularyStatusConverter.class)
    @ColumnDefault("'visible'")
    @Column(nullable = false, length = 20)
    private VocabularyStatus status = VocabularyStatus.VISIBLE;

    // When an admin last added or changed the word; null for the seeded words never edited since.
    private Instant updatedAt;

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

    public VocabularyStatus getStatus() {
        return status;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public boolean isHidden() {
        return status == VocabularyStatus.HIDDEN;
    }

    /**
     * System words (created_by NULL) are visible to everyone; a word a learner typed in is visible only to that
     * learner (docs/api/custom-lists.md). A word an admin hid is visible to nobody (scenario 21).
     */
    public boolean isVisibleTo(Long userId) {
        return !isHidden() && (createdBy == null || createdBy.equals(userId));
    }

    /** Scenario 21, step 8: learners stop meeting the word; their progress on it stays. */
    public void hide(Instant now) {
        this.status = VocabularyStatus.HIDDEN;
        this.updatedAt = now;
    }

    public void touch(Instant now) {
        this.updatedAt = now;
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
