package com.example.datn.modules.test.dto.request;

import java.time.LocalDate;

/** The name and the dates of the copy of a test (docs/api/admin.md, POST /api/admin/tests/{id}/duplicate). */
public record DuplicateTestRequest(String title, LocalDate startDate, LocalDate endDate) {
}
