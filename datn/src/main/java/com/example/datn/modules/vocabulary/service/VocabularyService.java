package com.example.datn.modules.vocabulary.service;

import com.example.datn.common.dto.PageResponse;
import com.example.datn.common.enums.CefrLevel;
import com.example.datn.common.security.CurrentUser;
import com.example.datn.modules.vocabulary.dto.request.CreateVocabularyRequest;
import com.example.datn.modules.vocabulary.dto.request.UpdateVocabularyRequest;
import com.example.datn.modules.vocabulary.dto.response.VocabularyResponse;
import com.example.datn.modules.vocabulary.entity.UserVocabulary;
import com.example.datn.modules.vocabulary.entity.Vocabulary;
import com.example.datn.modules.vocabulary.enums.LearningStatus;
import com.example.datn.modules.vocabulary.exception.TopicNotFoundException;
import com.example.datn.modules.vocabulary.exception.VocabularyNotFoundException;
import com.example.datn.modules.vocabulary.mapper.VocabularyMapper;
import com.example.datn.modules.vocabulary.repository.TopicRepository;
import com.example.datn.modules.vocabulary.repository.UserVocabularyRepository;
import com.example.datn.modules.vocabulary.repository.VocabularyRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class VocabularyService {

    private final VocabularyRepository repository;
    private final TopicRepository topicRepository;
    private final UserVocabularyRepository userVocabularyRepository;
    private final VocabularyMapper mapper;
    private final CurrentUser currentUser;

    public VocabularyService(
            VocabularyRepository repository,
            TopicRepository topicRepository,
            UserVocabularyRepository userVocabularyRepository,
            VocabularyMapper mapper,
            CurrentUser currentUser) {
        this.repository = repository;
        this.topicRepository = topicRepository;
        this.userVocabularyRepository = userVocabularyRepository;
        this.mapper = mapper;
        this.currentUser = currentUser;
    }

    public VocabularyResponse create(CreateVocabularyRequest request) {
        requireTopicIfPresent(request.topicId());
        // System words keep created_by NULL, whichever admin adds them. A non-null created_by marks a learner's own
        // word, visible only to that learner (Phase 4), so visibility never depends on the creator's current role.
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
        return mapper.toResponse(repository.save(vocabulary), LearningStatus.NEW);
    }

    /** One page of words matching the optional filters, easiest first (see VocabularyRepository#search). */
    @Transactional(readOnly = true)
    public PageResponse<VocabularyResponse> search(Long topicId, String q, CefrLevel level, int page, int size) {
        Page<Vocabulary> words = repository.search(topicId, level, toLikePattern(q), PageRequest.of(page, size));
        Map<Long, LearningStatus> statuses = statusesOf(words.getContent().stream().map(Vocabulary::getId).toList());
        return PageResponse.from(words, word -> toResponse(word, statuses));
    }

    @Transactional(readOnly = true)
    public VocabularyResponse findById(Long id) {
        return toResponse(findEntity(id));
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
        return toResponse(vocabulary);
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

    private VocabularyResponse toResponse(Vocabulary vocabulary) {
        return toResponse(vocabulary, statusesOf(List.of(vocabulary.getId())));
    }

    private VocabularyResponse toResponse(Vocabulary vocabulary, Map<Long, LearningStatus> statuses) {
        return mapper.toResponse(vocabulary, statuses.getOrDefault(vocabulary.getId(), LearningStatus.NEW));
    }

    /** The current user's status of each given word, in one query; words never studied are missing (NEW). */
    private Map<Long, LearningStatus> statusesOf(Collection<Long> vocabularyIds) {
        if (vocabularyIds.isEmpty()) {
            return Map.of();
        }
        return userVocabularyRepository.findAllByUserIdAndVocabularyIdIn(currentUser.id(), vocabularyIds).stream()
                .collect(Collectors.toMap(UserVocabulary::getVocabularyId, UserVocabulary::getStatus));
    }

    /**
     * "Contains q, ignoring case" as a LIKE pattern, or null when q is blank. '%' and '_' typed by the user are
     * escaped (with '!', see the query) so that they match themselves instead of acting as wildcards.
     */
    static String toLikePattern(String q) {
        if (q == null || q.isBlank()) {
            return null;
        }
        String escaped = q.strip().toLowerCase(Locale.ROOT)
                .replace("!", "!!")
                .replace("%", "!%")
                .replace("_", "!_");
        return "%" + escaped + "%";
    }
}
