package com.example.datn.modules.vocabulary.controller;

import com.example.datn.modules.vocabulary.dto.request.CreateTopicRequest;
import com.example.datn.modules.vocabulary.dto.request.UpdateTopicRequest;
import com.example.datn.modules.vocabulary.dto.response.TopicResponse;
import com.example.datn.modules.vocabulary.service.TopicService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/topics")
public class TopicController {

    private final TopicService service;

    public TopicController(TopicService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TopicResponse create(@Valid @RequestBody CreateTopicRequest request) {
        return service.create(request);
    }

    @GetMapping
    public List<TopicResponse> findAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public TopicResponse findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PutMapping("/{id}")
    public TopicResponse update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTopicRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
