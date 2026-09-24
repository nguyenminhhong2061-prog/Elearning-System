package com.example.datn.modules.sample.entity;

import com.example.datn.modules.sample.enums.SampleItemStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "sample_items")
public class SampleItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SampleItemStatus status;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected SampleItem() {
    }

    public SampleItem(String name, String description, Instant createdAt) {
        this.name = name;
        this.description = description;
        this.status = SampleItemStatus.ACTIVE;
        this.createdAt = createdAt;
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

    public SampleItemStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void update(String name, String description, SampleItemStatus status) {
        this.name = name;
        this.description = description;
        this.status = status;
    }
}
