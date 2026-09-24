package com.example.datn.modules.sample.repository;

import com.example.datn.modules.sample.entity.SampleItem;
import com.example.datn.modules.sample.enums.SampleItemStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SampleItemRepository extends JpaRepository<SampleItem, Long> {

    List<SampleItem> findAllByStatusOrderByCreatedAtDesc(SampleItemStatus status);
}
