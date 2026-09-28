package com.example.datn.modules.exercise.repository;

import com.example.datn.modules.exercise.entity.PronunciationItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PronunciationItemRepository extends JpaRepository<PronunciationItem, Long> {
    List<PronunciationItem> findAllByLessonIdOrderBySortOrderAscIdAsc(Long lessonId);
    long countByLessonId(Long lessonId);
}
