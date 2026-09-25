package com.example.datn.modules.vocabulary.repository;

import java.time.LocalDate;

/** How many words of one user fall due on one day. */
public record DueDateCount(LocalDate date, Long count) {
}
