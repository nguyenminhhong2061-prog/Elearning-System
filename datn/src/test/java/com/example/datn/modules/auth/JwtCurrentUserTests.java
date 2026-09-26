package com.example.datn.modules.auth;

import com.example.datn.common.enums.CefrLevel;
import com.example.datn.modules.auth.security.JwtCurrentUser;
import com.example.datn.modules.user.service.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class JwtCurrentUserTests {

    private final UserService userService = mock(UserService.class);

    private final JwtCurrentUser currentUser = new JwtCurrentUser(userService);

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void idComesFromTheTokenSubject() {
        authenticateAs("42", "ROLE_LEARNER");

        assertThat(currentUser.id()).isEqualTo(42L);
        assertThat(currentUser.isAdmin()).isFalse();
    }

    @Test
    void adminRoleIsRecognised() {
        authenticateAs("7", "ROLE_ADMIN");

        assertThat(currentUser.isAdmin()).isTrue();
    }

    @Test
    void currentLevelIsReadFromTheUserRecordOfTheTokenSubject() {
        authenticateAs("42", "ROLE_LEARNER");
        when(userService.findCurrentLevel(42L)).thenReturn(Optional.of(CefrLevel.B1));

        assertThat(currentUser.currentLevel()).contains(CefrLevel.B1);
    }

    @Test
    void failsWhenNobodyIsAuthenticated() {
        assertThatThrownBy(currentUser::id).isInstanceOf(AuthenticationCredentialsNotFoundException.class);
    }

    private static void authenticateAs(String subject, String authority) {
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "HS256")
                .subject(subject)
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(60))
                .build();
        SecurityContextHolder.getContext().setAuthentication(
                new JwtAuthenticationToken(jwt, List.of(new SimpleGrantedAuthority(authority))));
    }
}
