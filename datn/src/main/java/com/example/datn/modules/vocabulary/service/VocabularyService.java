package com.example.datn.modules.vocabulary.service;

import com.example.datn.modules.vocabulary.dto.request.CreateVocabularyRequest;
import com.example.datn.modules.vocabulary.dto.request.UpdateVocabularyRequest;
import com.example.datn.modules.vocabulary.dto.response.VocabularyResponse;
import com.example.datn.modules.vocabulary.entity.Vocabulary;
import com.example.datn.modules.vocabulary.exception.TopicNotFoundException;
import com.example.datn.modules.vocabulary.exception.VocabularyNotFoundException;
import com.example.datn.modules.vocabulary.mapper.VocabularyMapper;
import com.example.datn.modules.vocabulary.repository.TopicRepository;
import com.example.datn.modules.vocabulary.repository.VocabularyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class VocabularyService {

    private final VocabularyRepository repository;
    private final TopicRepository topicRepository;
    private final VocabularyMapper mapper;

    public VocabularyService(
            VocabularyRepository repository,
            TopicRepository topicRepository,
            VocabularyMapper mapper) {
        this.repository = repository;
        this.topicRepository = topicRepository;
        this.mapper = mapper;
    }

    public VocabularyResponse create(CreateVocabularyRequest request) {
        requireTopicIfPresent(request.topicId());
        // createdBy stays null until authentication exists to tell us who the caller is.
        Vocabulary vocabulary = new Vocabulary(
                request.topicId(),
                null,
                request.word(),
                request.meaning(),
                request.exampleSentence(),
                request.phonetic(),
                request.audioUrl(),
                request.imageUrl(),
                request.difficultyLevel());
        return mapper.toResponse(repository.save(vocabulary));
    }

    @Transactional(readOnly = true)
    public List<VocabularyResponse> findAll(Long topicId) {
        List<Vocabulary> result = topicId == null ? repository.findAll() : repository.findAllByTopicId(topicId);
        return result.stream().map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public VocabularyResponse findById(Long id) {
        return mapper.toResponse(findEntity(id));
    }

    public VocabularyResponse update(Long id, UpdateVocabularyRequest request) {
        Vocabulary vocabulary = findEntity(id);
        requireTopicIfPresent(request.topicId());
        vocabulary.update(
                request.topicId(),
                request.word(),
                request.meaning(),
                request.exampleSentence(),
                request.phonetic(),
                request.audioUrl(),
                request.imageUrl(),
                request.difficultyLevel());
        return mapper.toResponse(vocabulary);
    }

    public void delete(Long id) {
        repository.delete(findEntity(id));
    }

    private Vocabulary findEntity(Long id) {
        return repository.findById(id).orElseThrow(() -> new VocabularyNotFoundException(id));
    }

    private void requireTopicIfPresent(Long topicId) {
        if (topicId != null && !topicRepository.existsById(topicId)) {
            throw new TopicNotFoundException(topicId);
        }
    }
}
