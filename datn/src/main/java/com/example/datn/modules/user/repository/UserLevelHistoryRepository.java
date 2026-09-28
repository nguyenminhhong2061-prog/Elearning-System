package com.example.datn.modules.user.repository;

import com.example.datn.modules.user.entity.UserLevelHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserLevelHistoryRepository extends JpaRepository<UserLevelHistory, Long> {
}
