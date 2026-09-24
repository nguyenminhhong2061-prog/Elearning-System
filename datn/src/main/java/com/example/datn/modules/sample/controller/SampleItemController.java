package com.example.datn.modules.sample.controller;

import com.example.datn.modules.sample.dto.request.CreateSampleItemRequest;
import com.example.datn.modules.sample.dto.request.UpdateSampleItemRequest;
import com.example.datn.modules.sample.dto.response.SampleItemResponse;
import com.example.datn.modules.sample.service.SampleItemService;
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
@RequestMapping("/api/sample-items")
public class SampleItemController {

    private final SampleItemService service;

    public SampleItemController(SampleItemService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SampleItemResponse create(@Valid @RequestBody CreateSampleItemRequest request) {
        return service.create(request);
    }

    @GetMapping
    public List<SampleItemResponse> findAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public SampleItemResponse findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PutMapping("/{id}")
    public SampleItemResponse update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSampleItemRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
