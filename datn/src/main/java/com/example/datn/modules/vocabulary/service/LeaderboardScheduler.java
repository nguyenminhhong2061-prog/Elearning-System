package com.example.datn.modules.vocabulary.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

/**
 * Rebuilds the leaderboard cache every 5 minutes and once at startup, so the boards are never empty after a restart.
 * Separate from LeaderboardService so that the calls go through its transactional proxy.
 */
@Component
public class LeaderboardScheduler {

    private static final Logger log = LoggerFactory.getLogger(LeaderboardScheduler.class);

    private final LeaderboardService leaderboardService;

    public LeaderboardScheduler(LeaderboardService leaderboardService) {
        this.leaderboardService = leaderboardService;
    }

    @Scheduled(initialDelay = 5, fixedDelay = 5, timeUnit = TimeUnit.MINUTES)
    public void refreshPeriodically() {
        refresh();
    }

    @EventListener(ApplicationReadyEvent.class)
    public void refreshAtStartup() {
        refresh();
    }

    // A failed refresh keeps the previous boards; it must not stop the application or the schedule.
    private void refresh() {
        try {
            leaderboardService.refresh();
        } catch (RuntimeException exception) {
            log.error("Leaderboard refresh failed; the previous boards stay in place", exception);
        }
    }
}
