package com.example.datn.modules.test.repository;

import com.example.datn.modules.test.entity.TestPassage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TestPassageRepository extends JpaRepository<TestPassage, Long> {

    List<TestPassage> findByTestIdOrderByIdAsc(Long testId);
}
