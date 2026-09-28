package com.example.datn.modules.exercise.repository;

import com.example.datn.modules.exercise.entity.ListeningPassage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ListeningPassageRepository extends JpaRepository<ListeningPassage, Long> {
    Optional<ListeningPassage> findByLessonId(Long lessonId);
}
