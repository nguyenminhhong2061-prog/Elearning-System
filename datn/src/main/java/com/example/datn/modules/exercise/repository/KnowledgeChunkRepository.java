package com.example.datn.modules.exercise.repository;

import com.example.datn.modules.exercise.entity.KnowledgeChunk;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface KnowledgeChunkRepository extends JpaRepository<KnowledgeChunk, Long> {
    List<KnowledgeChunk> findTop5ByQuestionIdOrderByIdAsc(Long questionId);
    List<KnowledgeChunk> findTop5ByLessonIdAndQuestionIdIsNullOrderByIdAsc(Long lessonId);
}
