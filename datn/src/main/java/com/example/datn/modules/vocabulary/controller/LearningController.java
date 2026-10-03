package com.example.datn.modules.vocabulary.controller;

import com.example.datn.common.dto.PageResponse;
import com.example.datn.modules.vocabulary.dto.request.ReviewRequest;
import com.example.datn.modules.vocabulary.dto.response.LearningCardResponse;
import com.example.datn.modules.vocabulary.dto.response.LearningSummaryResponse;
import com.example.datn.modules.vocabulary.dto.response.ReviewResponse;
import com.example.datn.modules.vocabulary.dto.response.SessionSummaryResponse;
import com.example.datn.modules.vocabulary.dto.response.StudySessionResponse;
import com.example.datn.modules.vocabulary.enums.LearningStatus;
import com.example.datn.modules.vocabulary.service.LearningService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

/** Flashcard sessions, reviews and review statistics of the signed-in user (docs/api/learning.md). */
@RestController
@RequestMapping("/api/learning")
public class LearningController {

    /** Largest {@code size} a session may ask for; without it, a session has every card it should. */
    static final int MAX_SESSION_SIZE = 500;

    private final LearningService service;

    public LearningController(LearningService service) {
        this.service = service;
    }

    @GetMapping("/session")
    public StudySessionResponse session(
            @RequestParam(required = false) Long topicId,
            @RequestParam(required = false) Long listId,
            @RequestParam(required = false)
            @Min(value = 1, message = "size must be between 1 and " + MAX_SESSION_SIZE)
            @Max(value = MAX_SESSION_SIZE, message = "size must be between 1 and " + MAX_SESSION_SIZE) Integer size) {
        return service.session(topicId, listId, size);
    }

    /** The summary card of a session: {@code since} is the session's {@code startedAt}. */
    @GetMapping("/session-summary")
    public SessionSummaryResponse sessionSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant since) {
        return service.sessionSummary(since);
    }

    @PostMapping("/reviews")
    public ReviewResponse review(@Valid @RequestBody ReviewRequest request) {
        return service.review(request);
    }

    @GetMapping("/summary")
    public LearningSummaryResponse summary() {
        return service.summary();
    }

    // status and reviewedToday are checked as text: NEW is not a history filter, and Spring would otherwise also
    // accept "yes", "on" or "1" as true.
    @GetMapping("/history")
    public PageResponse<LearningCardResponse> history(
            @RequestParam(required = false)
            @Pattern(regexp = "LEARNING|MASTERED", message = "status must be LEARNING or MASTERED") String status,
            @RequestParam(required = false)
            @Pattern(regexp = "true|false", message = "reviewedToday must be true or false") String reviewedToday,
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "page must not be negative") int page,
            @RequestParam(defaultValue = "20")
            @Min(value = 1, message = "size must be between 1 and " + VocabularyController.MAX_PAGE_SIZE)
            @Max(value = VocabularyController.MAX_PAGE_SIZE,
                    message = "size must be between 1 and " + VocabularyController.MAX_PAGE_SIZE) int size) {
        LearningStatus statusFilter = status == null ? null : LearningStatus.valueOf(status);
        return service.history(statusFilter, Boolean.parseBoolean(reviewedToday), page, size);
    }
}
