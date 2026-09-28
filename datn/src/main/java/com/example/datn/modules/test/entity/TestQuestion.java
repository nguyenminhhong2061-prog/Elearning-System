package com.example.datn.modules.test.entity;

import com.example.datn.modules.test.enums.TestQuestionType;
import com.example.datn.modules.test.enums.TestSkill;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** One question of a test (test_questions). Linked to its test by id, not by a JPA relation. */
@Entity
@Table(name = "test_questions")
public class TestQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "test_id", nullable = false)
    private Long testId;

    @Column(name = "vocabulary_id")
    private Long vocabularyId;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", nullable = false, length = 20)
    private TestQuestionType questionType;

    @Convert(converter = TestSkillConverter.class)
    @Column(length = 100)
    private TestSkill skill;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private int points;

    @Column(name = "audio_url", length = 500)
    private String audioUrl;

    protected TestQuestion() {
    }

    public TestQuestion(Long testId, TestQuestionType questionType, TestSkill skill, String content, int points,
            String audioUrl) {
        this.testId = testId;
        this.questionType = questionType;
        this.skill = skill;
        this.content = content;
        this.points = points;
        this.audioUrl = audioUrl;
    }

    public Long getId() {
        return id;
    }

    public Long getTestId() {
        return testId;
    }

    public Long getVocabularyId() {
        return vocabularyId;
    }

    public TestQuestionType getQuestionType() {
        return questionType;
    }

    public TestSkill getSkill() {
        return skill;
    }

    public String getContent() {
        return content;
    }

    public int getPoints() {
        return points;
    }

    public String getAudioUrl() {
        return audioUrl;
    }
}
