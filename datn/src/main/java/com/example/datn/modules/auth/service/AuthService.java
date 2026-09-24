package com.example.datn.modules.auth.service;

import com.example.datn.modules.auth.dto.request.ChangePasswordRequest;
import com.example.datn.modules.auth.dto.request.LoginRequest;
import com.example.datn.modules.auth.dto.request.RegisterRequest;
import com.example.datn.modules.auth.dto.response.AuthTokenResponse;
import com.example.datn.modules.auth.exception.AccountLockedException;
import com.example.datn.modules.auth.exception.EmailAlreadyExistsException;
import com.example.datn.modules.auth.exception.InvalidCredentialsException;
import com.example.datn.modules.auth.exception.InvalidPasswordChangeException;
import com.example.datn.modules.user.dto.response.UserResponse;
import com.example.datn.modules.user.enums.UserRole;
import com.example.datn.modules.user.enums.UserStatus;
import com.example.datn.modules.user.service.UserCredentials;
import com.example.datn.modules.user.service.UserService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthService {

    private static final String TOKEN_TYPE = "Bearer";

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    // Compared against when the email is unknown, so a missing account costs as much time as a wrong password.
    private final String timingDummyHash;

    public AuthService(UserService userService, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.timingDummyHash = passwordEncoder.encode("timing-dummy-password");
    }

    public UserResponse register(RegisterRequest request) {
        if (userService.emailExists(request.email())) {
            throw new EmailAlreadyExistsException(request.email());
        }
        try {
            return userService.createUser(
                    request.fullName(),
                    request.email(),
                    passwordEncoder.encode(request.password()),
                    UserRole.LEARNER);
        } catch (DataIntegrityViolationException e) {
            // Two registrations with the same email raced past the check above; the unique constraint caught it.
            throw new EmailAlreadyExistsException(request.email());
        }
    }

    public AuthTokenResponse login(LoginRequest request) {
        UserCredentials credentials = userService.findCredentialsByEmail(request.email()).orElse(null);
        if (credentials == null) {
            passwordEncoder.matches(request.password(), timingDummyHash);
            throw new InvalidCredentialsException();
        }
        if (!passwordEncoder.matches(request.password(), credentials.passwordHash())) {
            throw new InvalidCredentialsException();
        }
        // Checked only after the password is right, so a locked status is not revealed to someone guessing.
        if (credentials.status() == UserStatus.LOCKED) {
            throw new AccountLockedException();
        }

        JwtService.IssuedToken token = jwtService.issue(credentials.id(), credentials.role());
        return new AuthTokenResponse(
                token.value(),
                TOKEN_TYPE,
                token.expiresInSeconds(),
                userService.getProfile(credentials.id()));
    }

    public void changePassword(Long userId, ChangePasswordRequest request) {
        UserCredentials credentials = userService.findCredentialsById(userId)
                .orElseThrow(() -> new InvalidCredentialsException("Account no longer exists"));

        if (!passwordEncoder.matches(request.currentPassword(), credentials.passwordHash())) {
            throw new InvalidPasswordChangeException("Current password is incorrect");
        }
        if (request.currentPassword().equals(request.newPassword())) {
            throw new InvalidPasswordChangeException("New password must be different from the current password");
        }
        userService.updatePasswordHash(userId, passwordEncoder.encode(request.newPassword()));
    }
}
