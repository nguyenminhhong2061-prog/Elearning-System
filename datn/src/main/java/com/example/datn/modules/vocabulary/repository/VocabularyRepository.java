package com.example.datn.modules.vocabulary.repository;

import com.example.datn.modules.vocabulary.entity.Vocabulary;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VocabularyRepository extends JpaRepository<Vocabulary, Long> {

    List<Vocabulary> findAllByTopicId(Long topicId);
}
