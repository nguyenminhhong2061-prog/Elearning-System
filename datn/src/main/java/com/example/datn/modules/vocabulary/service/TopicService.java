package com.example.datn.modules.vocabulary.service;

import com.example.datn.common.security.CurrentUser;
import com.example.datn.modules.vocabulary.dto.request.CreateTopicRequest;
import com.example.datn.modules.vocabulary.dto.request.UpdateTopicRequest;
import com.example.datn.modules.vocabulary.dto.response.TopicResponse;
import com.example.datn.modules.vocabulary.entity.Topic;
import com.example.datn.modules.vocabulary.enums.LearningStatus;
import com.example.datn.modules.vocabulary.exception.DuplicateTopicNameException;
import com.example.datn.modules.vocabulary.exception.TopicHasWordsException;
import com.example.datn.modules.vocabulary.exception.TopicNotFoundException;
import com.example.datn.modules.vocabulary.mapper.TopicMapper;
import com.example.datn.modules.vocabulary.repository.TopicRepository;
import com.example.datn.modules.vocabulary.repository.TopicWordCounts;
import com.example.datn.modules.vocabulary.repository.VocabularyRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional
public class TopicService {

    private final TopicRepository repository;
    private final VocabularyRepository vocabularyRepository;
    private final TopicMapper mapper;
    private final CurrentUser currentUser;
    private final StudyCalendar calendar;

    public TopicService(
            TopicRepository repository,
            VocabularyRepository vocabularyRepository,
            TopicMapper mapper,
            CurrentUser currentUser,
            StudyCalendar calendar) {
        this.repository = repository;
        this.vocabularyRepository = vocabularyRepository;
        this.mapper = mapper;
        this.currentUser = currentUser;
        this.calendar = calendar;
    }

    public TopicResponse create(CreateTopicRequest request) {
        String name = request.name().strip();
        requireNewName(name, -1L);
        Topic topic = saveAndCheck(new Topic(name, blankToNull(request.description()), blankToNull(request.imageUrl()), calendar.now()));
        return mapper.toResponse(topic, TopicWordCounts.empty(topic.getId()));
    }

    @Transactional(readOnly = true)
    public List<TopicResponse> findAll() {
        List<Topic> topics = repository.findAll(Sort.by("id"));
        Map<Long, TopicWordCounts> counts = countsOf(topics.stream().map(Topic::getId).toList());
        return topics.stream().map(topic -> toResponse(topic, counts)).toList();
    }

    @Transactional(readOnly = true)
    public TopicResponse findById(Long id) {
        return toResponse(findEntity(id));
    }

    public TopicResponse update(Long id, UpdateTopicRequest request) {
        Topic topic = findEntity(id);
        String name = request.name().strip();
        requireNewName(name, id);
        topic.update(name, blankToNull(request.description()), blankToNull(request.imageUrl()), calendar.now());
        return toResponse(saveAndCheck(topic));
    }

    /**
     * Scenario 22, branch 2b: a topic that still has words, hidden ones included, is not deleted; the admin moves or
     * deletes them first, so no word silently loses its topic.
     */
    public void delete(Long id) {
        Topic topic = findEntity(id);
        long words = vocabularyRepository.countByTopicId(id);
        if (words > 0) {
            throw new TopicHasWordsException(words);
        }
        repository.delete(topic);
    }

    /** Scenario 22, branch 6a: no two topics with the same name, ignoring case. */
    private void requireNewName(String name, Long excludedId) {
        if (repository.existsByNameIgnoreCaseAndIdNot(name, excludedId)) {
            throw new DuplicateTopicNameException(name);
        }
    }

    /** Flushes now, so that two admins saving the same name at once meet the unique index here: 409, not 500. */
    private Topic saveAndCheck(Topic topic) {
        try {
            return repository.saveAndFlush(topic);
        } catch (DataIntegrityViolationException exception) {
            throw new DuplicateTopicNameException(topic.getName());
        }
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }

    private Topic findEntity(Long id) {
        return repository.findById(id).orElseThrow(() -> new TopicNotFoundException(id));
    }

    private TopicResponse toResponse(Topic topic) {
        return toResponse(topic, countsOf(List.of(topic.getId())));
    }

    private TopicResponse toResponse(Topic topic, Map<Long, TopicWordCounts> counts) {
        TopicWordCounts topicCounts = counts.getOrDefault(topic.getId(), TopicWordCounts.empty(topic.getId()));
        return mapper.toResponse(topic, topicCounts);
    }

    /** Counts of the current user, keyed by topic id; topics without words are missing (all their counts are 0). */
    private Map<Long, TopicWordCounts> countsOf(Collection<Long> topicIds) {
        if (topicIds.isEmpty()) {
            return Map.of();
        }
        return vocabularyRepository
                .countByTopic(topicIds, currentUser.id(), LearningStatus.LEARNED, calendar.today())
                .stream()
                .collect(Collectors.toMap(TopicWordCounts::topicId, Function.identity()));
    }
}
