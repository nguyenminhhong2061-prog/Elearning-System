package com.example.datn.modules.test.repository;

import com.example.datn.modules.test.entity.TestAttemptAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TestAttemptAnswerRepository extends JpaRepository<TestAttemptAnswer, Long> {

    List<TestAttemptAnswer> findByAttemptId(Long attemptId);

    Optional<TestAttemptAnswer> findByAttemptIdAndQuestionId(Long attemptId, Long questionId);
}
