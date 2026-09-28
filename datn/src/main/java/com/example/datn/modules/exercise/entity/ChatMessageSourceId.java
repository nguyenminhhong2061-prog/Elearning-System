package com.example.datn.modules.exercise.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class ChatMessageSourceId implements Serializable {
    @Column(name = "message_id")
    private Long messageId;
    @Column(name = "knowledge_chunk_id")
    private Long knowledgeChunkId;

    protected ChatMessageSourceId() {}
    public ChatMessageSourceId(Long messageId, Long knowledgeChunkId) {
        this.messageId = messageId;
        this.knowledgeChunkId = knowledgeChunkId;
    }
    public Long getMessageId() { return messageId; }
    public Long getKnowledgeChunkId() { return knowledgeChunkId; }
    @Override public boolean equals(Object other) {
        return this == other || other instanceof ChatMessageSourceId id
                && Objects.equals(messageId, id.messageId) && Objects.equals(knowledgeChunkId, id.knowledgeChunkId);
    }
    @Override public int hashCode() { return Objects.hash(messageId, knowledgeChunkId); }
}
