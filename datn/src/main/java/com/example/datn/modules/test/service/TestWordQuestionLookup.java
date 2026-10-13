package com.example.datn.modules.test.service;

import com.example.datn.common.test.WordQuestionLookup;
import com.example.datn.modules.test.entity.Test;
import com.example.datn.modules.test.entity.TestQuestion;
import com.example.datn.modules.test.repository.TestQuestionRepository;
import com.example.datn.modules.test.repository.TestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Tells the vocabulary module which words test questions were made from (test_questions.vocabulary_id), for the admin
 * word table and the word delete dialog (docs/api/admin.md, scenario 21).
 */
@Service
@Transactional(readOnly = true)
public class TestWordQuestionLookup implements WordQuestionLookup {

    private final TestRepository testRepository;
    private final TestQuestionRepository questionRepository;
    private final TestCalendar calendar;

    public TestWordQuestionLookup(
            TestRepository testRepository, TestQuestionRepository questionRepository, TestCalendar calendar) {
        this.testRepository = testRepository;
        this.questionRepository = questionRepository;
        this.calendar = calendar;
    }

    /** Questions of every test count, a draft or a hidden one too: each of them still names the word. */
    @Override
    public Map<Long, Long> countQuestionsByWord(Collection<Long> vocabularyIds) {
        if (vocabularyIds.isEmpty()) {
            return Map.of();
        }
        return questionRepository.findByVocabularyIdIn(vocabularyIds).stream()
                .collect(Collectors.groupingBy(TestQuestion::getVocabularyId, Collectors.counting()));
    }

    @Override
    public Map<Long, List<TestRef>> openTestsByWord(Collection<Long> vocabularyIds) {
        if (vocabularyIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, Test> openTests = testRepository.findOpen(calendar.now()).stream()
                .collect(Collectors.toMap(Test::getId, Function.identity()));
        // Per word, each open test once and in the order of the tests' ids.
        Map<Long, Map<Long, TestRef>> byWord = new TreeMap<>();
        for (TestQuestion question : questionRepository.findByVocabularyIdIn(vocabularyIds)) {
            Test test = openTests.get(question.getTestId());
            if (test != null) {
                byWord.computeIfAbsent(question.getVocabularyId(), word -> new TreeMap<>())
                        .put(test.getId(), new TestRef(test.getId(), test.getTitle()));
            }
        }
        return byWord.entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, entry -> List.copyOf(entry.getValue().values())));
    }
}
