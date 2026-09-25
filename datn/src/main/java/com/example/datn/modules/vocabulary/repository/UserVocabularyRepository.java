package com.example.datn.modules.vocabulary.repository;

import com.example.datn.modules.vocabulary.entity.UserVocabulary;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface UserVocabularyRepository extends JpaRepository<UserVocabulary, Long> {

    List<UserVocabulary> findAllByUserIdAndVocabularyIdIn(Long userId, Collection<Long> vocabularyIds);
}
