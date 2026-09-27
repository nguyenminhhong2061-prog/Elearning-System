package com.example.datn.modules.test.repository;

import com.example.datn.modules.test.entity.TestQuestionAcceptedAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface TestQuestionAcceptedAnswerRepository extends JpaRepository<TestQuestionAcceptedAnswer, Long> {

    List<TestQuestionAcceptedAnswer> findByQuestionIdIn(Collection<Long> questionIds);
}
