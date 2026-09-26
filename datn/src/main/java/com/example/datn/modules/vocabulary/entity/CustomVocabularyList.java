package com.example.datn.modules.vocabulary.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/** A learner's own word list (A3). Its words are {@link CustomVocabularyListItem} rows. */
@Entity
@Table(name = "custom_vocabulary_lists")
public class CustomVocabularyList {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The owner, as a plain id: users belong to another module.
    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected CustomVocabularyList() {
    }

    public CustomVocabularyList(Long userId, String name, Instant createdAt) {
        this.userId = userId;
        this.name = name;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public String getName() {
        return name;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void rename(String name) {
        this.name = name;
    }
}
