package com.example.datn.modules.exercise.repository;

import com.example.datn.modules.exercise.entity.ChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findAllBySessionIdOrderByCreatedAtDescIdDesc(Long sessionId, Pageable pageable);
}
