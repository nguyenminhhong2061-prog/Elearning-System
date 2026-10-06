package com.example.datn.modules.vocabulary.controller;

import com.example.datn.common.dto.PageResponse;
import com.example.datn.common.enums.CefrLevel;
import com.example.datn.modules.vocabulary.dto.response.AdminTopicResponse;
import com.example.datn.modules.vocabulary.dto.response.AdminWordResponse;
import com.example.datn.modules.vocabulary.dto.response.WordQuestionResponse;
import com.example.datn.modules.vocabulary.service.AdminVocabularyService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Reads of the admin vocabulary pages (docs/api/admin.md, "Chủ đề và từ vựng"). Writes go through the existing
 * /api/topics and /api/vocabulary endpoints, which are admin-only too.
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminVocabularyController {

    static final int MAX_PAGE_SIZE = 50;

    private final AdminVocabularyService service;

    public AdminVocabularyController(AdminVocabularyService service) {
        this.service = service;
    }

    @GetMapping("/topics")
    public List<AdminTopicResponse> topics() {
        return service.topics();
    }

    @GetMapping("/vocabulary")
    public PageResponse<AdminWordResponse> words(
            @RequestParam(required = false) Long topicId,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) CefrLevel level,
            @RequestParam(required = false)
            @Pattern(regexp = "AUDIO|EXAMPLE|IMAGE", message = "missing must be AUDIO, EXAMPLE or IMAGE") String missing,
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "page must not be negative") int page,
            @RequestParam(defaultValue = "10")
            @Min(value = 1, message = "size must be between 1 and " + MAX_PAGE_SIZE)
            @Max(value = MAX_PAGE_SIZE, message = "size must be between 1 and " + MAX_PAGE_SIZE) int size) {
        return service.words(topicId, q, level, missing, page, size);
    }

    /** Scenario 24, step 6: "Thêm câu hỏi từ kho từ vựng". */
    @GetMapping("/vocabulary/{id}/test-question")
    public WordQuestionResponse testQuestion(@PathVariable Long id) {
        return service.questionFrom(id);
    }
}
