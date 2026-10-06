package com.example.datn.common.test;

import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * Test questions made from words of the vocabulary bank (test_questions.vocabulary_id), for the admin word table and
 * the word delete dialog (docs/api/admin.md, scenario 21). The test module implements it; the vocabulary module only
 * depends on this contract and never reads the test tables. Until an implementation exists, the vocabulary module
 * treats every word as used by no question.
 */
public interface WordQuestionLookup {

    /** How many test questions were made from each word; words without any are absent from the map. */
    Map<Long, Long> countQuestionsByWord(Collection<Long> vocabularyIds);

    /**
     * The tests open to learners today (shown, within their dates) that have questions made from each word; words
     * without any are absent from the map.
     */
    Map<Long, List<TestRef>> openTestsByWord(Collection<Long> vocabularyIds);

    /** A test as the word delete dialog names it. */
    record TestRef(Long id, String title) {
    }
}
