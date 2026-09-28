package com.example.datn.modules.exercise.repository;

import com.example.datn.modules.exercise.entity.ExerciseQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExerciseQuestionRepository extends JpaRepository<ExerciseQuestion, Long> {
    List<ExerciseQuestion> findAllByLessonIdOrderBySortOrderAscIdAsc(Long lessonId);
    long countByLessonId(Long lessonId);
}
