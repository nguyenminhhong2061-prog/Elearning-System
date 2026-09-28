package com.example.datn.modules.exercise.repository;

import com.example.datn.modules.exercise.entity.QuestionOption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface QuestionOptionRepository extends JpaRepository<QuestionOption, Long> {
    List<QuestionOption> findAllByQuestionIdInOrderBySortOrderAscIdAsc(Collection<Long> questionIds);
    Optional<QuestionOption> findByIdAndQuestionId(Long id, Long questionId);
    Optional<QuestionOption> findFirstByQuestionIdAndCorrectTrueOrderBySortOrderAscIdAsc(Long questionId);
}
