package com.example.datn.modules.exercise.mapper;

import com.example.datn.modules.exercise.dto.response.ChatMessageResponse;
import com.example.datn.modules.exercise.dto.response.ChatSessionResponse;
import com.example.datn.modules.exercise.entity.ChatMessage;
import com.example.datn.modules.exercise.entity.ChatSession;
import com.example.datn.modules.exercise.entity.KnowledgeChunk;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ChatMapper {
    public ChatSessionResponse toResponse(ChatSession session) {
        return new ChatSessionResponse(session.getId(), session.getTitle(), session.getLessonId(),
                session.getCreatedAt(), session.getUpdatedAt());
    }

    public ChatMessageResponse toResponse(ChatMessage message, List<KnowledgeChunk> sources) {
        return new ChatMessageResponse(message.getId(), message.getRole(), message.getContent(), message.getCreatedAt(),
                sources.stream().map(source -> new ChatMessageResponse.Source(
                        source.getSourceTitle() == null ? source.getSourceKey() : source.getSourceTitle())).toList());
    }
}
