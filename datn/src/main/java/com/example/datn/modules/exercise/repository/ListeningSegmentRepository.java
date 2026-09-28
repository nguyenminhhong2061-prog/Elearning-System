package com.example.datn.modules.exercise.repository;

import com.example.datn.modules.exercise.entity.ListeningSegment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ListeningSegmentRepository extends JpaRepository<ListeningSegment, Long> {
    List<ListeningSegment> findAllByPassageIdOrderByOrderAscIdAsc(Long passageId);
}
