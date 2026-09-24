package com.example.datn.modules.vocabulary.service;

import com.example.datn.modules.vocabulary.dto.request.CreateTopicRequest;
import com.example.datn.modules.vocabulary.dto.request.UpdateTopicRequest;
import com.example.datn.modules.vocabulary.dto.response.TopicResponse;
import com.example.datn.modules.vocabulary.entity.Topic;
import com.example.datn.modules.vocabulary.exception.TopicNotFoundException;
import com.example.datn.modules.vocabulary.mapper.TopicMapper;
import com.example.datn.modules.vocabulary.repository.TopicRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class TopicService {

    private final TopicRepository repository;
    private final TopicMapper mapper;

    public TopicService(TopicRepository repository, TopicMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public TopicResponse create(CreateTopicRequest request) {
        Topic topic = new Topic(request.name(), request.description(), request.imageUrl());
        return mapper.toResponse(repository.save(topic));
    }

    @Transactional(readOnly = true)
    public List<TopicResponse> findAll() {
        return repository.findAll().stream().map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public TopicResponse findById(Long id) {
        return mapper.toResponse(findEntity(id));
    }

    public TopicResponse update(Long id, UpdateTopicRequest request) {
        Topic topic = findEntity(id);
        topic.update(request.name(), request.description(), request.imageUrl());
        return mapper.toResponse(topic);
    }

    public void delete(Long id) {
        repository.delete(findEntity(id));
    }

    private Topic findEntity(Long id) {
        return repository.findById(id).orElseThrow(() -> new TopicNotFoundException(id));
    }
}
