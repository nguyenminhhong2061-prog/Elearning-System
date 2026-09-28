package com.example.datn.modules.exercise.repository;

import com.example.datn.modules.exercise.entity.ExerciseLesson;
import com.example.datn.modules.exercise.enums.ExerciseSkill;
import com.example.datn.modules.exercise.enums.PublicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExerciseLessonRepository extends JpaRepository<ExerciseLesson, Long> {
    List<ExerciseLesson> findAllBySkillAndPublicationStatusOrderByCefrLevelAscSortOrderAscIdAsc(
            ExerciseSkill skill, PublicationStatus status);
}
