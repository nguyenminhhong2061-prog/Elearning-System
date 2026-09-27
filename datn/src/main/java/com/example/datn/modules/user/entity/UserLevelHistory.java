package com.example.datn.modules.user.entity;

import com.example.datn.common.enums.CefrLevel;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/** One row of the user's CEFR level history (user_level_history), appended whenever a placement changes the level. */
@Entity
@Table(name = "user_level_history")
public class UserLevelHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    // 'level' has no CHECK problem with @Enumerated(STRING): the constants A1..C2 match the CHECK values exactly.
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 2)
    private CefrLevel level;

    @Column(name = "test_attempt_id")
    private Long testAttemptId;

    @CreationTimestamp
    @Column(name = "changed_at", nullable = false, updatable = false)
    private Instant changedAt;

    protected UserLevelHistory() {
    }

    public UserLevelHistory(Long userId, CefrLevel level, Long testAttemptId) {
        this.userId = userId;
        this.level = level;
        this.testAttemptId = testAttemptId;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public CefrLevel getLevel() {
        return level;
    }

    public Long getTestAttemptId() {
        return testAttemptId;
    }

    public Instant getChangedAt() {
        return changedAt;
    }
}
