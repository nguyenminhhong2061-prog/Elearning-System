package com.example.datn.modules.exercise.repository;

import com.example.datn.modules.exercise.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {
    Optional<ChatSession> findByIdAndUserId(Long id, Long userId);
    Page<ChatSession> findAllByUserIdOrderByUpdatedAtDescIdDesc(Long userId, Pageable pageable);
}
