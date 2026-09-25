package com.example.datn.modules.auth.security;

import com.example.datn.common.enums.CefrLevel;
import com.example.datn.common.security.CurrentUser;
import com.example.datn.modules.user.service.UserService;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Optional;

/** {@link CurrentUser} backed by the JWT of the current request: the token subject is the user id. */
@Component
public class JwtCurrentUser implements CurrentUser {

    private static final String ADMIN_AUTHORITY = "ROLE_ADMIN";

    private final UserService userService;

    public JwtCurrentUser(UserService userService) {
        this.userService = userService;
    }

    @Override
    public Long id() {
        return Long.valueOf(jwtAuthentication().getToken().getSubject());
    }

    @Override
    public boolean isAdmin() {
        return jwtAuthentication().getAuthorities().stream()
                .anyMatch(authority -> ADMIN_AUTHORITY.equals(authority.getAuthority()));
    }

    /** Not in the token: the level changes after placement tests, while a token lives for hours. */
    @Override
    public Optional<CefrLevel> currentLevel() {
        return userService.findCurrentLevel(id());
    }

    private JwtAuthenticationToken jwtAuthentication() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof JwtAuthenticationToken token) {
            return token;
        }
        throw new AuthenticationCredentialsNotFoundException("No authenticated user in the current request");
    }
}
