package com.example.datn.modules.exercise.repository;

import com.example.datn.modules.exercise.entity.PronunciationAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PronunciationAttemptRepository extends JpaRepository<PronunciationAttempt, Long> {
    List<PronunciationAttempt> findAllByAttemptId(Long attemptId);
    long countByAttemptId(Long attemptId);
    long countByAttemptIdAndPronunciationItemId(Long attemptId, Long pronunciationItemId);
    Optional<PronunciationAttempt> findFirstByAttemptIdOrderByAssessedAtDescIdDesc(Long attemptId);
    Optional<PronunciationAttempt> findFirstByAttemptIdAndPronunciationItemIdOrderByAssessedAtDescIdDesc(
            Long attemptId, Long pronunciationItemId);
}
