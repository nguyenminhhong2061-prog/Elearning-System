package com.example.datn.modules.vocabulary.controller;

import com.example.datn.common.dto.PageResponse;
import com.example.datn.modules.vocabulary.dto.request.AddListWordRequest;
import com.example.datn.modules.vocabulary.dto.request.CreateCustomListRequest;
import com.example.datn.modules.vocabulary.dto.request.NewWordRequest;
import com.example.datn.modules.vocabulary.dto.request.RenameCustomListRequest;
import com.example.datn.modules.vocabulary.dto.response.CustomListResponse;
import com.example.datn.modules.vocabulary.dto.response.VocabularyResponse;
import com.example.datn.modules.vocabulary.service.CustomListService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
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

import java.util.List;

/** The signed-in learner's own word lists (docs/api/custom-lists.md). Someone else's list answers 404. */
@RestController
@RequestMapping("/api/custom-lists")
public class CustomListController {

    private final CustomListService service;

    public CustomListController(CustomListService service) {
        this.service = service;
    }

    @GetMapping
    public List<CustomListResponse> findAll() {
        return service.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CustomListResponse create(@Valid @RequestBody CreateCustomListRequest request) {
        return service.create(request);
    }

    @GetMapping("/{id}")
    public CustomListResponse findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PutMapping("/{id}")
    public CustomListResponse rename(@PathVariable Long id, @Valid @RequestBody RenameCustomListRequest request) {
        return service.rename(id, request.name());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    @GetMapping("/{id}/words")
    public PageResponse<VocabularyResponse> words(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "page must not be negative") int page,
            @RequestParam(defaultValue = "20")
            @Min(value = 1, message = "size must be between 1 and " + VocabularyController.MAX_PAGE_SIZE)
            @Max(value = VocabularyController.MAX_PAGE_SIZE,
                    message = "size must be between 1 and " + VocabularyController.MAX_PAGE_SIZE) int size) {
        return service.words(id, page, size);
    }

    @PostMapping("/{id}/words")
    @ResponseStatus(HttpStatus.CREATED)
    public VocabularyResponse addWord(@PathVariable Long id, @Valid @RequestBody AddListWordRequest request) {
        return service.addWord(id, request.vocabularyId());
    }

    @PostMapping("/{id}/words/new")
    @ResponseStatus(HttpStatus.CREATED)
    public VocabularyResponse addNewWord(@PathVariable Long id, @Valid @RequestBody NewWordRequest request) {
        return service.addNewWord(id, request);
    }

    @DeleteMapping("/{id}/words/{vocabularyId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeWord(@PathVariable Long id, @PathVariable Long vocabularyId) {
        service.removeWord(id, vocabularyId);
    }
}
