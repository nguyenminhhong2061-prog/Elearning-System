package com.example.datn.modules.user.service;

import com.example.datn.common.user.UserDirectory;
import com.example.datn.modules.user.entity.User;
import com.example.datn.modules.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.Map;
import java.util.stream.Collectors;

/** {@link UserDirectory} over the users table: only given names leave this module. */
@Service
@Transactional(readOnly = true)
public class UserDisplayNames implements UserDirectory {

    private final UserRepository repository;

    public UserDisplayNames(UserRepository repository) {
        this.repository = repository;
    }

    @Override
    public Map<Long, String> displayNames(Collection<Long> userIds) {
        if (userIds.isEmpty()) {
            return Map.of();
        }
        return repository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, user -> givenName(user.getFullName()), (first, second) -> first));
    }

    /** "Nguyễn Minh Hồng" gives "Hồng". */
    static String givenName(String fullName) {
        String[] words = fullName.strip().split("\\s+");
        return words[words.length - 1];
    }
}
