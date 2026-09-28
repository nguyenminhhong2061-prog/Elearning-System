package com.example.datn.modules.exercise.repository;

import com.example.datn.modules.exercise.entity.QuestionAcceptedAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface QuestionAcceptedAnswerRepository extends JpaRepository<QuestionAcceptedAnswer, Long> {
    List<QuestionAcceptedAnswer> findAllByQuestionId(Long questionId);
    Optional<QuestionAcceptedAnswer> findFirstByQuestionIdAndPrimaryTrueOrderByIdAsc(Long questionId);
}
