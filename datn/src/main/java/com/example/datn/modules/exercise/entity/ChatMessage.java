package com.example.datn.modules.exercise.entity;

import com.example.datn.modules.exercise.enums.ChatRole;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "chat_messages")
public class ChatMessage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private Long sessionId;
    @Convert(converter = ChatRoleConverter.class)
    @Column(nullable = false, length = 20)
    private ChatRole role;
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;
    @Column(length = 100)
    private String provider;
    @Column(length = 100)
    private String modelName;
    private Integer promptTokens;
    private Integer completionTokens;
    @Column(nullable = false)
    private Instant createdAt;

    protected ChatMessage() {}

    public ChatMessage(Long sessionId, ChatRole role, String content, String provider, String modelName,
                       Integer promptTokens, Integer completionTokens, Instant createdAt) {
        this.sessionId = sessionId;
        this.role = role;
        this.content = content;
        this.provider = provider;
        this.modelName = modelName;
        this.promptTokens = promptTokens;
        this.completionTokens = completionTokens;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public Long getSessionId() { return sessionId; }
    public ChatRole getRole() { return role; }
    public String getContent() { return content; }
    public String getProvider() { return provider; }
    public String getModelName() { return modelName; }
    public Integer getPromptTokens() { return promptTokens; }
    public Integer getCompletionTokens() { return completionTokens; }
    public Instant getCreatedAt() { return createdAt; }
}
