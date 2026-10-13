package com.example.datn.modules.test.entity;

import com.example.datn.common.enums.CefrLevel;
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

    /** The longest recording of a read-aloud answer the screen makes. */
    public static final int MAX_RECORDING_SECONDS = 15;

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

    // The CEFR level the question tests; null for a question that has not been given one.
    @Enumerated(EnumType.STRING)
    @Column(length = 2)
    private CefrLevel level;

    // The passage (recording or text) the question is asked about; null for a question that stands alone.
    @Column(name = "passage_id")
    private Long passageId;

    // The sentence a read-aloud speaking question asks the learner to read; null for every other question.
    @Column(name = "reference_text", columnDefinition = "TEXT")
    private String referenceText;

    // The place of the question in its test as the admin ordered it; questions with the same place go by id.
    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

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

    public TestQuestion(Long testId, TestQuestionType questionType, TestSkill skill, String content, int points,
            String audioUrl, CefrLevel level) {
        this(testId, questionType, skill, content, points, audioUrl);
        this.level = level;
    }

    public TestQuestion(Long testId, TestQuestionType questionType, TestSkill skill, String content, int points,
            String audioUrl, CefrLevel level, Long passageId) {
        this(testId, questionType, skill, content, points, audioUrl, level);
        this.passageId = passageId;
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

    public CefrLevel getLevel() {
        return level;
    }

    public Long getPassageId() {
        return passageId;
    }

    public String getReferenceText() {
        return referenceText;
    }

    /** A speaking question answered by recording its reference sentence and scored on pronunciation. */
    public boolean isReadAloud() {
        return referenceText != null;
    }

    /** Makes this a read-aloud question of the given sentence. */
    public TestQuestion asReadAloud(String referenceText) {
        this.referenceText = referenceText;
        return this;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    /** Rewrites the question as the admin editor saved it; its test never changes. */
    public void edit(TestQuestionType questionType, TestSkill skill, String content, int points, String audioUrl,
            CefrLevel level, Long passageId, String referenceText, Long vocabularyId, int sortOrder) {
        this.questionType = questionType;
        this.skill = skill;
        this.content = content;
        this.points = points;
        this.audioUrl = audioUrl;
        this.level = level;
        this.passageId = passageId;
        this.referenceText = referenceText;
        this.vocabularyId = vocabularyId;
        this.sortOrder = sortOrder;
    }
}
