package com.example.datn.modules.test.service;

import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

/** The module's view of time: "now" and the Vietnamese day a submission is recorded on. */
@Component
public class TestCalendar {

    public static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final Clock clock;

    public TestCalendar(Clock clock) {
        this.clock = clock;
    }

    public Instant now() {
        return clock.instant();
    }

    public LocalDate today() {
        return LocalDate.now(clock.withZone(ZONE));
    }

    /** The Vietnamese day a moment falls on; null for no moment. */
    public static LocalDate dayOf(Instant moment) {
        return moment == null ? null : LocalDate.ofInstant(moment, ZONE);
    }

    /** The first moment of a Vietnamese day: when a test that opens on that day opens. */
    public static Instant startOf(LocalDate day) {
        return day.atStartOfDay(ZONE).toInstant();
    }

    /** The last second of a Vietnamese day: when a test that closes on that day closes. */
    public static Instant endOf(LocalDate day) {
        return startOf(day.plusDays(1)).minusSeconds(1);
    }
}
