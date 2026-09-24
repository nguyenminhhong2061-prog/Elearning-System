package com.example.datn.modules.vocabulary.controller;

import com.example.datn.modules.vocabulary.dto.request.CreateVocabularyRequest;
import com.example.datn.modules.vocabulary.dto.request.UpdateVocabularyRequest;
import com.example.datn.modules.vocabulary.dto.response.VocabularyResponse;
import com.example.datn.modules.vocabulary.service.VocabularyService;
import jakarta.validation.Valid;
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

@RestController
@RequestMapping("/api/vocabulary")
public class VocabularyController {

    private final VocabularyService service;

    public VocabularyController(VocabularyService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public VocabularyResponse create(@Valid @RequestBody CreateVocabularyRequest request) {
        return service.create(request);
    }

    @GetMapping
    public List<VocabularyResponse> findAll(@RequestParam(required = false) Long topicId) {
        return service.findAll(topicId);
    }

    @GetMapping("/{id}")
    public VocabularyResponse findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PutMapping("/{id}")
    public VocabularyResponse update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateVocabularyRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
