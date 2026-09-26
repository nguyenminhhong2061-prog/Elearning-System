package com.example.datn.modules.vocabulary.enums;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;

/** A leaderboard period (leaderboard.period_type, stored lower-case), in Vietnam dates. */
public enum LeaderboardPeriod {
    /** Monday to Sunday. */
    WEEK {
        @Override
        public LocalDate startOf(LocalDate day) {
            return day.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        }

        @Override
        public LocalDate nextStart(LocalDate start) {
            return start.plusWeeks(1);
        }
    },
    MONTH {
        @Override
        public LocalDate startOf(LocalDate day) {
            return day.withDayOfMonth(1);
        }

        @Override
        public LocalDate nextStart(LocalDate start) {
            return start.plusMonths(1);
        }
    };

    /** The first day of the period containing {@code day}. */
    public abstract LocalDate startOf(LocalDate day);

    /** The first day of the period after the one starting on {@code start}. */
    public abstract LocalDate nextStart(LocalDate start);
}
