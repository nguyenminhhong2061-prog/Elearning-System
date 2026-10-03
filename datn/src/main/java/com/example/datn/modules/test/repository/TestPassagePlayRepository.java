package com.example.datn.modules.test.repository;

import com.example.datn.modules.test.entity.TestPassagePlay;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TestPassagePlayRepository extends JpaRepository<TestPassagePlay, Long> {

    List<TestPassagePlay> findByAttemptId(Long attemptId);

    Optional<TestPassagePlay> findByAttemptIdAndPassageId(Long attemptId, Long passageId);
}
