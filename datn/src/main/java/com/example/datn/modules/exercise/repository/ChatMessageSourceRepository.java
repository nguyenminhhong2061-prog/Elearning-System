package com.example.datn.modules.exercise.repository;

import com.example.datn.modules.exercise.entity.ChatMessageSource;
import com.example.datn.modules.exercise.entity.ChatMessageSourceId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatMessageSourceRepository extends JpaRepository<ChatMessageSource, ChatMessageSourceId> {
}
