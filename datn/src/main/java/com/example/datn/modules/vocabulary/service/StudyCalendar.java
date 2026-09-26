package com.example.datn.modules.vocabulary.service;

import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;

/**
 * Decides which day "today" is for reviews. user_vocabulary.next_review_at is a DATE and learners are in Vietnam,
 * so the day changes at midnight Vietnam time, not at midnight UTC where the server clock may run.
 */
@Component
public class StudyCalendar {

    public static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    // The application Clock bean (currently declared in SampleModuleConfig); do not declare a second one.
    private final Clock clock;

    public StudyCalendar(Clock clock) {
        this.clock = clock;
    }

    public LocalDate today() {
        return LocalDate.now(clock.withZone(ZONE));
    }

    /** The current instant in milliseconds, the precision a browser's Date keeps. */
    public Instant now() {
        return clock.instant().truncatedTo(ChronoUnit.MILLIS);
    }

    /** The first instant of the given Vietnamese day (00:00 in Vietnam, 17:00 UTC the day before). */
    public Instant startOf(LocalDate day) {
        return day.atStartOfDay(ZONE).toInstant();
    }
}
