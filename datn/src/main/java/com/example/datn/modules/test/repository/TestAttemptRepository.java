package com.example.datn.modules.test.repository;

import com.example.datn.modules.test.entity.TestAttempt;
import com.example.datn.modules.test.enums.TestAttemptStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TestAttemptRepository extends JpaRepository<TestAttempt, Long> {

    Optional<TestAttempt> findFirstByTestIdAndUserIdAndStatusOrderByIdDesc(
            Long testId, Long userId, TestAttemptStatus status);

    List<TestAttempt> findByTestIdAndUserIdAndStatusIn(
            Long testId, Long userId, Collection<TestAttemptStatus> statuses);

    List<TestAttempt> findByUserIdAndStatusAndTestIdIn(
            Long userId, TestAttemptStatus status, Collection<Long> testIds);

    List<TestAttempt> findByUserIdAndStatusInAndTestIdIn(
            Long userId, Collection<TestAttemptStatus> statuses, Collection<Long> testIds);

    Optional<TestAttempt> findByIdAndUserId(Long id, Long userId);
}
