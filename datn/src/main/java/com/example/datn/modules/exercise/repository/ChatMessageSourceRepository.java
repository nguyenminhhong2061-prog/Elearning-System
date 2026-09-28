package com.example.datn.modules.exercise.repository;

import com.example.datn.modules.exercise.entity.ChatMessageSource;
import com.example.datn.modules.exercise.entity.ChatMessageSourceId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ChatMessageSourceRepository extends JpaRepository<ChatMessageSource, ChatMessageSourceId> {
    @Query("select source from ChatMessageSource source where source.id.messageId in :messageIds")
    List<ChatMessageSource> findAllByMessageIds(List<Long> messageIds);
}
