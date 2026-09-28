package com.example.datn.modules.exercise.repository;

import com.example.datn.modules.exercise.entity.QuestionResponse;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface QuestionResponseRepository extends JpaRepository<QuestionResponse, Long> {
    List<QuestionResponse> findAllByAttemptIdOrderByAnsweredAtAscIdAsc(Long attemptId);
    Optional<QuestionResponse> findByAttemptIdAndQuestionId(Long attemptId, Long questionId);
    long countByAttemptId(Long attemptId);
    Optional<QuestionResponse> findFirstByAttemptIdOrderByAnsweredAtDescIdDesc(Long attemptId);
}
