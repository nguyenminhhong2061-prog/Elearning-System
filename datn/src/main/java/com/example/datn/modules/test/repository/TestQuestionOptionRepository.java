package com.example.datn.modules.test.repository;

import com.example.datn.modules.test.entity.TestQuestionOption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface TestQuestionOptionRepository extends JpaRepository<TestQuestionOption, Long> {

    List<TestQuestionOption> findByQuestionIdInOrderByIdAsc(Collection<Long> questionIds);
}
