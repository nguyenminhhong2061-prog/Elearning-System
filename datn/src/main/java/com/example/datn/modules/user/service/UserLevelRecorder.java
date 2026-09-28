package com.example.datn.modules.user.service;

import com.example.datn.common.enums.CefrLevel;
import com.example.datn.common.user.LevelRecorder;
import com.example.datn.modules.user.entity.User;
import com.example.datn.modules.user.entity.UserLevelHistory;
import com.example.datn.modules.user.exception.UserNotFoundException;
import com.example.datn.modules.user.repository.UserLevelHistoryRepository;
import com.example.datn.modules.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** {@link LevelRecorder} over the users table: updates the level and appends a history row. */
@Service
@Transactional
public class UserLevelRecorder implements LevelRecorder {

    private final UserRepository userRepository;
    private final UserLevelHistoryRepository historyRepository;

    public UserLevelRecorder(UserRepository userRepository, UserLevelHistoryRepository historyRepository) {
        this.userRepository = userRepository;
        this.historyRepository = historyRepository;
    }

    @Override
    public void recordLevelChange(Long userId, CefrLevel level, Long testAttemptId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException(userId));
        user.changeCurrentLevel(level);
        historyRepository.save(new UserLevelHistory(userId, level, testAttemptId));
    }
}
