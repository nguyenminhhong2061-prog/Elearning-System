package com.example.datn.modules.vocabulary.repository;

import com.example.datn.modules.vocabulary.entity.CustomVocabularyList;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CustomVocabularyListRepository extends JpaRepository<CustomVocabularyList, Long> {

    /** Newest first; lists created in the same instant keep the order they were created in. */
    List<CustomVocabularyList> findAllByUserIdOrderByCreatedAtDescIdDesc(Long userId);

    /** Whether the user has a list with this name, ignoring case; {@code excludedId} skips the list being renamed. */
    boolean existsByUserIdAndNameIgnoreCaseAndIdNot(Long userId, String name, Long excludedId);

    /** The list, only if it belongs to the user: someone else's list is "not found" too. */
    Optional<CustomVocabularyList> findByIdAndUserId(Long id, Long userId);
}
