package com.example.datn.modules.vocabulary.controller;

import com.example.datn.common.dto.PageResponse;
import com.example.datn.common.enums.CefrLevel;
import com.example.datn.modules.vocabulary.dto.request.CreateVocabularyRequest;
import com.example.datn.modules.vocabulary.dto.request.UpdateVocabularyRequest;
import com.example.datn.modules.vocabulary.dto.response.VocabularyResponse;
import com.example.datn.modules.vocabulary.service.VocabularyService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Words are read by every signed-in user and written only by admins (docs/api/vocabulary.md). */
@RestController
@RequestMapping("/api/vocabulary")
public class VocabularyController {

    static final int MAX_PAGE_SIZE = 100;

    private final VocabularyService service;

    public VocabularyController(VocabularyService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public VocabularyResponse create(@Valid @RequestBody CreateVocabularyRequest request) {
        return service.create(request);
    }

    @GetMapping
    public PageResponse<VocabularyResponse> search(
            @RequestParam(required = false) Long topicId,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) CefrLevel level,
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "page must not be negative") int page,
            @RequestParam(defaultValue = "20")
            @Min(value = 1, message = "size must be between 1 and " + MAX_PAGE_SIZE)
            @Max(value = MAX_PAGE_SIZE, message = "size must be between 1 and " + MAX_PAGE_SIZE) int size) {
        return service.search(topicId, q, level, page, size);
    }

    @GetMapping("/{id}")
    public VocabularyResponse findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public VocabularyResponse update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateVocabularyRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
