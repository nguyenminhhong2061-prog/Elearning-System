package com.example.datn.modules.test.repository;

import com.example.datn.modules.test.entity.TestAttempt;
import com.example.datn.modules.test.enums.TestAttemptStatus;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    Optional<TestAttempt> findFirstByTestIdAndUserIdAndStatusInOrderByIdDesc(
            Long testId, Long userId, Collection<TestAttemptStatus> statuses);

    boolean existsByTestIdAndUserIdAndStatusIn(Long testId, Long userId, Collection<TestAttemptStatus> statuses);

    Optional<TestAttempt> findByIdAndUserId(Long id, Long userId);

    List<TestAttempt> findByStatusOrderBySubmittedAtDesc(TestAttemptStatus status, Limit limit);

    /** Whether any learner has an attempt at the test in one of the statuses. */
    boolean existsByTestIdAndStatusIn(Long testId, Collection<TestAttemptStatus> statuses);

    /** Per test and status: how many attempts of every learner there are and the sum of their scores. */
    @Query("""
            select new com.example.datn.modules.test.repository.AttemptTally(
                a.testId, a.status, count(a), sum(a.totalScore))
            from TestAttempt a
            where a.testId in :testIds and a.status in :statuses
            group by a.testId, a.status
            """)
    List<AttemptTally> tally(
            @Param("testIds") Collection<Long> testIds, @Param("statuses") Collection<TestAttemptStatus> statuses);
}
