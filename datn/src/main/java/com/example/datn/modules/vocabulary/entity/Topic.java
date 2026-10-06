package com.example.datn.modules.vocabulary.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "topics")
public class Topic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 500)
    private String imageUrl;

    // When an admin last added or changed the topic (column "Cập nhật"); null for the seeded topics never edited.
    private Instant updatedAt;

    protected Topic() {
    }

    public Topic(String name, String description, String imageUrl) {
        this(name, description, imageUrl, null);
    }

    public Topic(String name, String description, String imageUrl, Instant updatedAt) {
        this.name = name;
        this.description = description;
        this.imageUrl = imageUrl;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void update(String name, String description, String imageUrl, Instant updatedAt) {
        this.name = name;
        this.description = description;
        this.imageUrl = imageUrl;
        this.updatedAt = updatedAt;
    }
}
