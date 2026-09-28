package com.example.datn.modules.exercise.entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "chat_message_sources")
public class ChatMessageSource {
    @EmbeddedId
    private ChatMessageSourceId id;

    protected ChatMessageSource() {}
    public ChatMessageSource(Long messageId, Long knowledgeChunkId) {
        this.id = new ChatMessageSourceId(messageId, knowledgeChunkId);
    }
    public ChatMessageSourceId getId() { return id; }
}
