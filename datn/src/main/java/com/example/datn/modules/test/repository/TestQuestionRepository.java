package com.example.datn.modules.test.repository;

import com.example.datn.modules.test.entity.TestQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface TestQuestionRepository extends JpaRepository<TestQuestion, Long> {

    List<TestQuestion> findByTestIdOrderByIdAsc(Long testId);

    List<TestQuestion> findByTestIdIn(Collection<Long> testIds);
}
