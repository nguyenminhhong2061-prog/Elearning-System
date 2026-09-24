package com.example.datn.modules.vocabulary.repository;

import com.example.datn.modules.vocabulary.entity.Topic;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TopicRepository extends JpaRepository<Topic, Long> {
}
