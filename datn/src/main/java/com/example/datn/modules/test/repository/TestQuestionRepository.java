package com.example.datn.modules.test.repository;

import com.example.datn.modules.test.entity.TestQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface TestQuestionRepository extends JpaRepository<TestQuestion, Long> {

    /** The questions of a test in the order the admin gave them; tests nobody ordered go by id. */
    List<TestQuestion> findByTestIdOrderBySortOrderAscIdAsc(Long testId);

    List<TestQuestion> findByTestIdIn(Collection<Long> testIds);

    /** The questions made from the given words of the vocabulary bank. */
    List<TestQuestion> findByVocabularyIdIn(Collection<Long> vocabularyIds);
}
