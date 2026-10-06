package com.example.datn.modules.vocabulary.service;

import com.example.datn.common.test.WordQuestionLookup;
import com.example.datn.common.test.WordQuestionLookup.TestRef;
import com.example.datn.modules.vocabulary.repository.VocabularyRepository;
import com.example.datn.modules.vocabulary.repository.WordUsageCount;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * What uses each word (scenario 21): learners studying it, personal lists holding it, and test questions made from it.
 * The test questions belong to the test module, read through {@link WordQuestionLookup}; without an implementation
 * no word counts as used by a question.
 */
@Service
@Transactional(readOnly = true)
public class WordUsageService {

    private final VocabularyRepository repository;
    private final ObjectProvider<WordQuestionLookup> questionLookup;

    public WordUsageService(VocabularyRepository repository, ObjectProvider<WordQuestionLookup> questionLookup) {
        this.repository = repository;
        this.questionLookup = questionLookup;
    }

    /** The usage of each given word; every id has an entry. */
    public Map<Long, WordUsage> usageOf(Collection<Long> vocabularyIds) {
        if (vocabularyIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, Long> learners = toMap(repository.countLearners(vocabularyIds));
        Map<Long, Long> lists = toMap(repository.countLists(vocabularyIds));
        WordQuestionLookup lookup = questionLookup.getIfAvailable();
        Map<Long, Long> questions = lookup == null ? Map.of() : lookup.countQuestionsByWord(vocabularyIds);
        Map<Long, List<TestRef>> openTests = lookup == null ? Map.of() : lookup.openTestsByWord(vocabularyIds);
        return vocabularyIds.stream().distinct().collect(Collectors.toMap(Function.identity(), id -> new WordUsage(
                learners.getOrDefault(id, 0L),
                lists.getOrDefault(id, 0L),
                questions.getOrDefault(id, 0L),
                openTests.getOrDefault(id, List.of()))));
    }

    public WordUsage usageOf(Long vocabularyId) {
        return usageOf(List.of(vocabularyId)).get(vocabularyId);
    }

    private static Map<Long, Long> toMap(List<WordUsageCount> counts) {
        return counts.stream().collect(Collectors.toMap(WordUsageCount::vocabularyId, WordUsageCount::count));
    }

    /** What points at one word. */
    public record WordUsage(long learnerCount, long listCount, long questionCount, List<TestRef> openTests) {

        /** A word in use is hidden rather than deleted, so that nothing pointing at it breaks (scenario 21, 6a). */
        public boolean inUse() {
            return learnerCount > 0 || listCount > 0 || questionCount > 0;
        }
    }
}
