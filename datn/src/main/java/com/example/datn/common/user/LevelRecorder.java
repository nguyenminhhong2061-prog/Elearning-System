package com.example.datn.common.user;

import com.example.datn.common.enums.CefrLevel;

/**
 * Records a learner's level change, implemented by the user module. Modules (for example the test module after grading
 * a comprehensive test) depend only on this contract and never write to the {@code users} or
 * {@code user_level_history} tables directly.
 */
public interface LevelRecorder {

    /**
     * Sets the user's current CEFR level and appends a row to the level history.
     *
     * @param userId the learner (users.id)
     * @param level the new level (A1..C2)
     * @param testAttemptId the test attempt that produced the change, or {@code null} when the change did not come from
     *                      a test
     */
    void recordLevelChange(Long userId, CefrLevel level, Long testAttemptId);
}
