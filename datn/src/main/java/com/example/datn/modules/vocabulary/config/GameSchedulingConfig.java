package com.example.datn.modules.vocabulary.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Turns on {@code @Scheduled} for the leaderboard refresh (LeaderboardScheduler). It is application-wide: other
 * modules' {@code @Scheduled} methods run too, without declaring it again.
 */
@Configuration
@EnableScheduling
public class GameSchedulingConfig {
}
