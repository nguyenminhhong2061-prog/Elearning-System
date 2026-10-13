package com.example.datn.modules.test.service;

import com.example.datn.modules.test.entity.TestPassage;
import com.example.datn.modules.test.entity.TestQuestion;
import com.example.datn.modules.test.entity.TestQuestionAcceptedAnswer;
import com.example.datn.modules.test.entity.TestQuestionOption;

import java.util.List;
import java.util.Map;

/**
 * Everything a test is made of, as stored: its passages, its questions in their order, and the answers of each
 * question by question id.
 */
record TestContent(
        List<TestPassage> passages,
        List<TestQuestion> questions,
        Map<Long, List<TestQuestionOption>> options,
        Map<Long, List<TestQuestionAcceptedAnswer>> acceptedAnswers) {

    /** The content of a test that has just been created. */
    static final TestContent EMPTY = new TestContent(List.of(), List.of(), Map.of(), Map.of());

    List<TestQuestionOption> optionsOf(Long questionId) {
        return options.getOrDefault(questionId, List.of());
    }

    List<TestQuestionAcceptedAnswer> acceptedAnswersOf(Long questionId) {
        return acceptedAnswers.getOrDefault(questionId, List.of());
    }
}
