package com.example.datn.modules.vocabulary.repository;

import com.example.datn.modules.vocabulary.entity.Topic;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TopicRepository extends JpaRepository<Topic, Long> {

    /**
     * Whether another topic has this name, ignoring case (scenario 22); names are stored trimmed.
     *
     * @param excludedId the topic being renamed, or -1 when adding one
     */
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long excludedId);
}
