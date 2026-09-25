package com.example.datn.modules.user.service;

import com.example.datn.modules.user.dto.response.UserResponse;
import com.example.datn.modules.user.entity.User;
import com.example.datn.modules.user.enums.UserRole;
import com.example.datn.modules.user.exception.UserNotFoundException;
import com.example.datn.modules.user.mapper.UserMapper;
import com.example.datn.modules.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Optional;

@Service
@Transactional
public class UserService {

    private final UserRepository repository;
    private final UserMapper mapper;

    public UserService(UserRepository repository, UserMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public boolean emailExists(String email) {
        return repository.existsByEmail(normalizeEmail(email));
    }

    /** Emails are stored trimmed and lower-case so that lookups are case-insensitive. */
    public UserResponse createUser(String fullName, String email, String passwordHash, UserRole role) {
        User user = new User(fullName.trim(), normalizeEmail(email), passwordHash, role);
        // Flush now so a duplicate email surfaces here instead of at commit time.
        return mapper.toResponse(repository.saveAndFlush(user));
    }

    @Transactional(readOnly = true)
    public Optional<UserCredentials> findCredentialsByEmail(String email) {
        return repository.findByEmail(normalizeEmail(email)).map(this::toCredentials);
    }

    @Transactional(readOnly = true)
    public Optional<UserCredentials> findCredentialsById(Long id) {
        return repository.findById(id).map(this::toCredentials);
    }

    public void updatePasswordHash(Long id, String passwordHash) {
        findEntity(id).changePasswordHash(passwordHash);
    }

    @Transactional(readOnly = true)
    public UserResponse getProfile(Long id) {
        return mapper.toResponse(findEntity(id));
    }

    private User findEntity(Long id) {
        return repository.findById(id).orElseThrow(() -> new UserNotFoundException(id));
    }

    private UserCredentials toCredentials(User user) {
        return new UserCredentials(
                user.getId(),
                user.getEmail(),
                user.getPasswordHash(),
                user.getRole(),
                user.getStatus());
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
