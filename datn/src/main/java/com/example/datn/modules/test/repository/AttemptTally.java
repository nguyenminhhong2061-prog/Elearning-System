package com.example.datn.modules.test.repository;

import com.example.datn.modules.test.enums.TestAttemptStatus;

import java.math.BigDecimal;

/** The attempts of one test in one status: how many there are and the sum of their scores (0-100 each). */
public record AttemptTally(Long testId, TestAttemptStatus status, Long count, BigDecimal scoreSum) {
}
