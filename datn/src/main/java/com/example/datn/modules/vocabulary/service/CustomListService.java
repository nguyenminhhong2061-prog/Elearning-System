package com.example.datn.modules.vocabulary.service;

import com.example.datn.common.dto.PageResponse;
import com.example.datn.common.enums.CefrLevel;
import com.example.datn.common.security.CurrentUser;
import com.example.datn.modules.vocabulary.dto.request.CreateCustomListRequest;
import com.example.datn.modules.vocabulary.dto.request.NewWordRequest;
import com.example.datn.modules.vocabulary.dto.response.CustomListResponse;
import com.example.datn.modules.vocabulary.dto.response.VocabularyResponse;
import com.example.datn.modules.vocabulary.entity.CustomVocabularyList;
import com.example.datn.modules.vocabulary.entity.CustomVocabularyListItem;
import com.example.datn.modules.vocabulary.entity.CustomVocabularyListItemId;
import com.example.datn.modules.vocabulary.entity.Vocabulary;
import com.example.datn.modules.vocabulary.enums.LearningStatus;
import com.example.datn.modules.vocabulary.exception.DuplicateListNameException;
import com.example.datn.modules.vocabulary.exception.InvalidListWordsException;
import com.example.datn.modules.vocabulary.exception.ListNotFoundException;
import com.example.datn.modules.vocabulary.exception.VocabularyNotFoundException;
import com.example.datn.modules.vocabulary.exception.WordAlreadyInListException;
import com.example.datn.modules.vocabulary.repository.CustomVocabularyListItemRepository;
import com.example.datn.modules.vocabulary.repository.CustomVocabularyListRepository;
import com.example.datn.modules.vocabulary.repository.ListWordCounts;
import com.example.datn.modules.vocabulary.repository.VocabularyRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * A learner's own word lists (A3, docs/api/custom-lists.md). Every operation goes through {@link #requireOwnList}:
 * another learner's list answers 404, exactly like a list that does not exist.
 */
@Service
@Transactional
public class CustomListService {

    private final CustomVocabularyListRepository listRepository;
    private final CustomVocabularyListItemRepository itemRepository;
    private final VocabularyRepository vocabularyRepository;
    private final VocabularyService vocabularyService;
    private final CurrentUser currentUser;
    private final StudyCalendar calendar;

    public CustomListService(
            CustomVocabularyListRepository listRepository,
            CustomVocabularyListItemRepository itemRepository,
            VocabularyRepository vocabularyRepository,
            VocabularyService vocabularyService,
            CurrentUser currentUser,
            StudyCalendar calendar) {
        this.listRepository = listRepository;
        this.itemRepository = itemRepository;
        this.vocabularyRepository = vocabularyRepository;
        this.vocabularyService = vocabularyService;
        this.currentUser = currentUser;
        this.calendar = calendar;
    }

    /** The current user's lists, newest first, with their counts computed in one query. */
    @Transactional(readOnly = true)
    public List<CustomListResponse> findAll() {
        List<CustomVocabularyList> lists = listRepository.findAllByUserIdOrderByCreatedAtDescIdDesc(currentUser.id());
        Map<Long, ListWordCounts> counts = countsOf(lists.stream().map(CustomVocabularyList::getId).toList());
        return lists.stream().map(list -> toResponse(list, counts)).toList();
    }

    /**
     * Creates a list with its first words in one transaction: the existing words (duplicates ignored) and the words
     * typed in are all saved, or nothing is. Everything is checked before the first row is written.
     */
    public CustomListResponse create(CreateCustomListRequest request) {
        Long userId = currentUser.id();
        requireUniqueName(userId, request.name(), null);
        Set<Long> existingIds = new LinkedHashSet<>(request.vocabularyIds());
        requireVisibleWords(existingIds, userId);

        CustomVocabularyList list = saveUniquelyNamed(new CustomVocabularyList(userId, request.name(), calendar.now()));
        List<Long> wordIds = new ArrayList<>(existingIds);
        CefrLevel defaultLevel = request.newWords().stream().anyMatch(input -> input.difficultyLevel() == null)
                ? defaultLevel()
                : null;
        request.newWords().forEach(input -> wordIds.add(saveOwnWord(input, userId, defaultLevel).getId()));
        itemRepository.saveAll(wordIds.stream().map(id -> new CustomVocabularyListItem(list.getId(), id)).toList());
        return toResponse(list);
    }

    @Transactional(readOnly = true)
    public CustomListResponse findById(Long id) {
        return toResponse(requireOwnList(id));
    }

    public CustomListResponse rename(Long id, String name) {
        CustomVocabularyList list = requireOwnList(id);
        requireUniqueName(list.getUserId(), name, list.getId());
        list.rename(name);
        saveUniquelyNamed(list);
        return toResponse(list);
    }

    /** Two lists of one learner cannot share a name, ignoring case (scenario 7, branch 11a): 409 otherwise. */
    private void requireUniqueName(Long userId, String name, Long excludedId) {
        // -1 matches no list: a new list has nothing to exclude.
        if (listRepository.existsByUserIdAndNameIgnoreCaseAndIdNot(userId, name, excludedId == null ? -1L : excludedId)) {
            throw new DuplicateListNameException(name);
        }
    }

    /**
     * Writes the list at once, so that a name taken by another request between {@link #requireUniqueName} and now (two
     * tabs) is refused by the database's unique index here, with the same 409, instead of failing at commit.
     */
    private CustomVocabularyList saveUniquelyNamed(CustomVocabularyList list) {
        try {
            return listRepository.saveAndFlush(list);
        } catch (DataIntegrityViolationException e) {
            throw new DuplicateListNameException(list.getName());
        }
    }

    /** Deletes the list and its items; the learner's own words stay, since their learning history still needs them. */
    public void delete(Long id) {
        CustomVocabularyList list = requireOwnList(id);
        itemRepository.deleteAllInList(list.getId());
        listRepository.delete(list);
    }

    /** The list's words the learner can see, easiest first like GET /api/vocabulary. */
    @Transactional(readOnly = true)
    public PageResponse<VocabularyResponse> words(Long id, int page, int size) {
        CustomVocabularyList list = requireOwnList(id);
        return vocabularyService.toPage(
                vocabularyRepository.findInList(list.getId(), currentUser.id(), PageRequest.of(page, size)));
    }

    /** Adds an existing word; 404 when it does not exist or the learner cannot see it, 409 when already there. */
    public VocabularyResponse addWord(Long id, Long vocabularyId) {
        CustomVocabularyList list = requireOwnList(id);
        Vocabulary word = vocabularyRepository.findById(vocabularyId)
                .filter(candidate -> candidate.isVisibleTo(currentUser.id()))
                .orElseThrow(() -> new VocabularyNotFoundException(vocabularyId));
        if (itemRepository.existsById(new CustomVocabularyListItemId(list.getId(), word.getId()))) {
            throw new WordAlreadyInListException(list.getId(), word.getId());
        }
        itemRepository.save(new CustomVocabularyListItem(list.getId(), word.getId()));
        return vocabularyService.toResponse(word);
    }

    /** Creates a word owned by the learner and adds it to the list. */
    public VocabularyResponse addNewWord(Long id, NewWordRequest request) {
        CustomVocabularyList list = requireOwnList(id);
        CefrLevel defaultLevel = request.difficultyLevel() == null ? defaultLevel() : null;
        Vocabulary word = saveOwnWord(request, currentUser.id(), defaultLevel);
        itemRepository.save(new CustomVocabularyListItem(list.getId(), word.getId()));
        return vocabularyService.toResponse(word);
    }

    /** Removes a word from the list (nothing to do if it is not there); the learner's progress on it is kept. */
    public void removeWord(Long id, Long vocabularyId) {
        CustomVocabularyList list = requireOwnList(id);
        itemRepository.deleteById(new CustomVocabularyListItemId(list.getId(), vocabularyId));
    }

    /** The list if it belongs to the current user; otherwise 404, so the API never reveals that it exists. */
    public CustomVocabularyList requireOwnList(Long id) {
        return listRepository.findByIdAndUserId(id, currentUser.id()).orElseThrow(() -> new ListNotFoundException(id));
    }

    private void requireVisibleWords(Set<Long> vocabularyIds, Long userId) {
        if (vocabularyIds.isEmpty()) {
            return;
        }
        Set<Long> visible = vocabularyRepository.findAllById(vocabularyIds).stream()
                .filter(word -> word.isVisibleTo(userId))
                .map(Vocabulary::getId)
                .collect(Collectors.toSet());
        List<Long> invalid = vocabularyIds.stream().filter(id -> !visible.contains(id)).toList();
        if (!invalid.isEmpty()) {
            throw new InvalidListWordsException(invalid);
        }
    }

    /**
     * A word typed in by the learner: no topic, and created_by set to them, which makes it visible to them only.
     *
     * @param defaultLevel used when the word has no level of its own (null when every word has one)
     */
    private Vocabulary saveOwnWord(NewWordRequest input, Long userId, CefrLevel defaultLevel) {
        CefrLevel level = input.difficultyLevel() != null ? input.difficultyLevel() : defaultLevel;
        return vocabularyRepository.save(new Vocabulary(
                null, userId, input.word(), input.meaning(), input.exampleSentence(), input.phonetic(), null, null, level));
    }

    /** The level of a typed-in word without one: the learner's current level, or A1 before any placement test. */
    private CefrLevel defaultLevel() {
        return currentUser.currentLevel().orElse(CefrLevel.A1);
    }

    private CustomListResponse toResponse(CustomVocabularyList list) {
        return toResponse(list, countsOf(List.of(list.getId())));
    }

    private CustomListResponse toResponse(CustomVocabularyList list, Map<Long, ListWordCounts> counts) {
        ListWordCounts listCounts = counts.getOrDefault(list.getId(), ListWordCounts.empty(list.getId()));
        return new CustomListResponse(
                list.getId(),
                list.getName(),
                list.getCreatedAt(),
                listCounts.wordCount(),
                listCounts.learnedCount(),
                listCounts.dueCount());
    }

    private Map<Long, ListWordCounts> countsOf(Collection<Long> listIds) {
        if (listIds.isEmpty()) {
            return Map.of();
        }
        return itemRepository.countByList(listIds, currentUser.id(), LearningStatus.LEARNED, calendar.today()).stream()
                .collect(Collectors.toMap(ListWordCounts::listId, Function.identity()));
    }
}
