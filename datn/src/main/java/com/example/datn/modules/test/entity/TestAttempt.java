package com.example.datn.modules.test.entity;

import com.example.datn.common.enums.CefrLevel;
import com.example.datn.modules.test.enums.TestAttemptStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

/** One learner's attempt at a test (test_attempts). */
@Entity
@Table(name = "test_attempts")
public class TestAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "test_id", nullable = false)
    private Long testId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @CreationTimestamp
    @Column(name = "start_time", nullable = false, updatable = false)
    private Instant startTime;

    @Column(name = "total_score", nullable = false)
    private BigDecimal totalScore;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TestAttemptStatus status;

    // Skill scores keyed by the Vietnamese key of TestSkill ({"nghe":..,"noi":..,"doc":..,"viet":..}).
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "skill_scores")
    private Map<String, Integer> skillScores;

    // Skill levels under the same keys as skillScores ({"nghe":"B1",..}); null on attempts graded before the column.
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "skill_levels")
    private Map<String, CefrLevel> skillLevels;

    @Enumerated(EnumType.STRING)
    @Column(name = "suggested_level", length = 2)
    private CefrLevel suggestedLevel;

    @Column(name = "suggested_roadmap", columnDefinition = "TEXT")
    private String suggestedRoadmap;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    protected TestAttempt() {
    }

    public TestAttempt(Long testId, Long userId) {
        this.testId = testId;
        this.userId = userId;
        this.totalScore = BigDecimal.ZERO;
        this.status = TestAttemptStatus.IN_PROGRESS;
    }

    public Long getId() {
        return id;
    }

    public Long getTestId() {
        return testId;
    }

    public Long getUserId() {
        return userId;
    }

    public Instant getStartTime() {
        return startTime;
    }

    public BigDecimal getTotalScore() {
        return totalScore;
    }

    public TestAttemptStatus getStatus() {
        return status;
    }

    public Map<String, Integer> getSkillScores() {
        return skillScores;
    }

    public Map<String, CefrLevel> getSkillLevels() {
        return skillLevels;
    }

    public CefrLevel getSuggestedLevel() {
        return suggestedLevel;
    }

    public String getSuggestedRoadmap() {
        return suggestedRoadmap;
    }

    public Instant getSubmittedAt() {
        return submittedAt;
    }

    /** Marks the attempt submitted/graded and records the grading outcome. */
    public void grade(
            BigDecimal totalScore,
            TestAttemptStatus status,
            Map<String, Integer> skillScores,
            Map<String, CefrLevel> skillLevels,
            CefrLevel suggestedLevel,
            String suggestedRoadmap,
            Instant submittedAt) {
        this.totalScore = totalScore;
        this.status = status;
        this.skillScores = skillScores;
        this.skillLevels = skillLevels;
        this.suggestedLevel = suggestedLevel;
        this.suggestedRoadmap = suggestedRoadmap;
        this.submittedAt = submittedAt;
    }
}
