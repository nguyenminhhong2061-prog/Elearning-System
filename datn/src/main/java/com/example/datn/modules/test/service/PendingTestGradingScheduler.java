package com.example.datn.modules.test.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

/**
 * Comes back to the attempts the AI examiner could not grade when they were submitted ("kết quả sẽ có sau", exception
 * of C2). Scheduling is switched on for the whole application by the vocabulary module (GameSchedulingConfig).
 */
@Component
public class PendingTestGradingScheduler {

    private static final Logger log = LoggerFactory.getLogger(PendingTestGradingScheduler.class);

    private final TestGradingService gradingService;

    public PendingTestGradingScheduler(TestGradingService gradingService) {
        this.gradingService = gradingService;
    }

    @Scheduled(initialDelay = 1, fixedDelay = 2, timeUnit = TimeUnit.MINUTES)
    public void gradePendingAttempts() {
        for (Long attemptId : gradingService.pendingAttemptIds()) {
            try {
                gradingService.gradePending(attemptId);
            } catch (RuntimeException exception) {
                // One attempt that cannot be graded must not stop the others.
                log.warn("Grading attempt {} again failed: {}", attemptId, exception.getMessage());
            }
        }
    }
}
