package com.example.datn.modules.sample.service;

import com.example.datn.modules.sample.dto.request.CreateSampleItemRequest;
import com.example.datn.modules.sample.dto.request.UpdateSampleItemRequest;
import com.example.datn.modules.sample.dto.response.SampleItemResponse;
import com.example.datn.modules.sample.entity.SampleItem;
import com.example.datn.modules.sample.exception.SampleItemNotFoundException;
import com.example.datn.modules.sample.mapper.SampleItemMapper;
import com.example.datn.modules.sample.repository.SampleItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

@Service
@Transactional
public class SampleItemService {

    private final SampleItemRepository repository;
    private final SampleItemMapper mapper;
    private final Clock clock;

    public SampleItemService(SampleItemRepository repository, SampleItemMapper mapper, Clock clock) {
        this.repository = repository;
        this.mapper = mapper;
        this.clock = clock;
    }

    public SampleItemResponse create(CreateSampleItemRequest request) {
        SampleItem item = new SampleItem(request.name(), request.description(), Instant.now(clock));
        return mapper.toResponse(repository.save(item));
    }

    @Transactional(readOnly = true)
    public List<SampleItemResponse> findAll() {
        return repository.findAll().stream().map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public SampleItemResponse findById(Long id) {
        return mapper.toResponse(findEntity(id));
    }

    public SampleItemResponse update(Long id, UpdateSampleItemRequest request) {
        SampleItem item = findEntity(id);
        item.update(request.name(), request.description(), request.status());
        return mapper.toResponse(item);
    }

    public void delete(Long id) {
        repository.delete(findEntity(id));
    }

    private SampleItem findEntity(Long id) {
        return repository.findById(id).orElseThrow(() -> new SampleItemNotFoundException(id));
    }
}
