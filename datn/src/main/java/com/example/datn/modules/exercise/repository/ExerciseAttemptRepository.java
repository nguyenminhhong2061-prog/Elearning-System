package com.example.datn.modules.exercise.repository;

import com.example.datn.modules.exercise.entity.ExerciseAttempt;
import com.example.datn.modules.exercise.enums.AttemptStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExerciseAttemptRepository extends JpaRepository<ExerciseAttempt, Long> {
    List<ExerciseAttempt> findAllByUserIdAndLessonIdAndStatusOrderByStartedAtDesc(
            Long userId, Long lessonId, AttemptStatus status);
    List<ExerciseAttempt> findAllByUserIdAndStatus(Long userId, AttemptStatus status);
    List<ExerciseAttempt> findAllByUserIdAndLessonIdAndStatus(Long userId, Long lessonId, AttemptStatus status);
    long countByUserIdAndLessonIdAndStatus(Long userId, Long lessonId, AttemptStatus status);
}
