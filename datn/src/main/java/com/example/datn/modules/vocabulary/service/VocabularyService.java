package com.example.datn.modules.vocabulary.service;

import com.example.datn.common.dto.PageResponse;
import com.example.datn.common.enums.CefrLevel;
import com.example.datn.common.security.CurrentUser;
import com.example.datn.modules.vocabulary.dto.request.CreateVocabularyRequest;
import com.example.datn.modules.vocabulary.dto.request.UpdateVocabularyRequest;
import com.example.datn.modules.vocabulary.dto.response.DeleteResultResponse;
import com.example.datn.modules.vocabulary.dto.response.VocabularyResponse;
import com.example.datn.modules.vocabulary.entity.UserVocabulary;
import com.example.datn.modules.vocabulary.entity.Vocabulary;
import com.example.datn.modules.vocabulary.enums.DeleteResult;
import com.example.datn.modules.vocabulary.enums.LearningStatus;
import com.example.datn.modules.vocabulary.exception.DuplicateWordException;
import com.example.datn.modules.vocabulary.exception.TopicNotFoundException;
import com.example.datn.modules.vocabulary.exception.VocabularyNotFoundException;
import com.example.datn.modules.vocabulary.mapper.VocabularyMapper;
import com.example.datn.modules.vocabulary.repository.TopicRepository;
import com.example.datn.modules.vocabulary.repository.UserVocabularyRepository;
import com.example.datn.modules.vocabulary.repository.VocabularyRepository;
import org.springframework.dao.DataIntegrityViolationException;
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
    private final WordUsageService usageService;
    private final StudyCalendar calendar;

    public VocabularyService(
            VocabularyRepository repository,
            TopicRepository topicRepository,
            UserVocabularyRepository userVocabularyRepository,
            VocabularyMapper mapper,
            CurrentUser currentUser,
            WordUsageService usageService,
            StudyCalendar calendar) {
        this.repository = repository;
        this.topicRepository = topicRepository;
        this.userVocabularyRepository = userVocabularyRepository;
        this.mapper = mapper;
        this.currentUser = currentUser;
        this.usageService = usageService;
        this.calendar = calendar;
    }

    public VocabularyResponse create(CreateVocabularyRequest request) {
        String word = request.word().strip();
        requireTopicIfPresent(request.topicId());
        requireNewWordInTopic(request.topicId(), word, -1L);
        // System words keep created_by NULL, whichever admin adds them. A non-null created_by marks a learner's own
        // word, visible only to that learner (Phase 4), so visibility never depends on the creator's current role.
        Vocabulary vocabulary = new Vocabulary(
                request.topicId(),
                null,
                word,
                request.meaning().strip(),
                blankToNull(request.exampleSentence()),
                blankToNull(request.phonetic()),
                blankToNull(request.audioUrl()),
                blankToNull(request.imageUrl()),
                request.difficultyLevel());
        vocabulary.touch(calendar.now());
        return mapper.toResponse(saveAndCheck(vocabulary, word), LearningStatus.NEW);
    }

    /**
     * One page of the words the current user can see (system words and their own) matching the optional filters,
     * easiest first (see VocabularyRepository#search).
     */
    @Transactional(readOnly = true)
    public PageResponse<VocabularyResponse> search(Long topicId, String q, CefrLevel level, int page, int size) {
        Page<Vocabulary> words = repository.search(
                currentUser.id(), topicId, level, toLikePattern(q), PageRequest.of(page, size));
        return toPage(words);
    }

    /** A word another learner typed in is "not found" for everyone else, like a missing word. */
    @Transactional(readOnly = true)
    public VocabularyResponse findById(Long id) {
        Vocabulary vocabulary = findEntity(id);
        if (!vocabulary.isVisibleTo(currentUser.id())) {
            throw new VocabularyNotFoundException(id);
        }
        return toResponse(vocabulary);
    }

    /** VocabularyItem responses of a page of words, with the current user's statuses read in one query. */
    public PageResponse<VocabularyResponse> toPage(Page<Vocabulary> words) {
        Map<Long, LearningStatus> statuses = statusesOf(words.getContent().stream().map(Vocabulary::getId).toList());
        return PageResponse.from(words, word -> toResponse(word, statuses));
    }

    /** The VocabularyItem response of one word, with the current user's status. */
    public VocabularyResponse toResponse(Vocabulary vocabulary) {
        return toResponse(vocabulary, statusesOf(List.of(vocabulary.getId())));
    }

    public VocabularyResponse update(Long id, UpdateVocabularyRequest request) {
        Vocabulary vocabulary = findShownEntity(id);
        String word = request.word().strip();
        requireTopicIfPresent(request.topicId());
        requireNewWordInTopic(request.topicId(), word, id);
        vocabulary.update(
                request.topicId(),
                word,
                request.meaning().strip(),
                blankToNull(request.exampleSentence()),
                blankToNull(request.phonetic()),
                blankToNull(request.audioUrl()),
                blankToNull(request.imageUrl()),
                request.difficultyLevel());
        vocabulary.touch(calendar.now());
        return toResponse(saveAndCheck(vocabulary, word));
    }

    /**
     * Scenario 21: a word that learners study, keep in a list or that a test question uses is hidden, so their
     * progress and the question stay; a word nothing uses is deleted for good.
     */
    public DeleteResultResponse delete(Long id) {
        Vocabulary vocabulary = findShownEntity(id);
        if (usageService.usageOf(id).inUse()) {
            vocabulary.hide(calendar.now());
            return new DeleteResultResponse(DeleteResult.HIDDEN);
        }
        repository.delete(vocabulary);
        return new DeleteResultResponse(DeleteResult.DELETED);
    }

    private Vocabulary findEntity(Long id) {
        return repository.findById(id).orElseThrow(() -> new VocabularyNotFoundException(id));
    }

    /** A word an admin may still edit or delete: a hidden word is gone from the admin area too. */
    private Vocabulary findShownEntity(Long id) {
        return repository.findById(id)
                .filter(word -> !word.isHidden())
                .orElseThrow(() -> new VocabularyNotFoundException(id));
    }

    /** Scenarios 19 (branch 12b) and 20 (branch 4b): one visible system word per text and topic, ignoring case. */
    private void requireNewWordInTopic(Long topicId, String word, Long excludedId) {
        if (topicId != null && repository.existsSystemWordInTopic(topicId, word, excludedId)) {
            throw new DuplicateWordException(word);
        }
    }

    /** Flushes now, so that two admins saving the same word at once meet the unique index here: 409, not 500. */
    private Vocabulary saveAndCheck(Vocabulary vocabulary, String word) {
        try {
            return repository.saveAndFlush(vocabulary);
        } catch (DataIntegrityViolationException exception) {
            throw new DuplicateWordException(word);
        }
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }

    private void requireTopicIfPresent(Long topicId) {
        if (topicId != null && !topicRepository.existsById(topicId)) {
            throw new TopicNotFoundException(topicId);
        }
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
