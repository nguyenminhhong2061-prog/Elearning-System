package com.example.datn.modules.test.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** How many times the recording of a passage has been played in one attempt (test_passage_plays). */
@Entity
@Table(name = "test_passage_plays")
public class TestPassagePlay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "attempt_id", nullable = false)
    private Long attemptId;

    @Column(name = "passage_id", nullable = false)
    private Long passageId;

    @Column(name = "play_count", nullable = false)
    private int playCount;

    protected TestPassagePlay() {
    }

    public TestPassagePlay(Long attemptId, Long passageId) {
        this.attemptId = attemptId;
        this.passageId = passageId;
    }

    public Long getId() {
        return id;
    }

    public Long getAttemptId() {
        return attemptId;
    }

    public Long getPassageId() {
        return passageId;
    }

    public int getPlayCount() {
        return playCount;
    }

    public void countPlay() {
        this.playCount++;
    }
}
