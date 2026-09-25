package com.example.datn.modules.auth.security;

import com.example.datn.common.security.CurrentUser;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

/** {@link CurrentUser} backed by the JWT of the current request: the token subject is the user id. */
@Component
public class JwtCurrentUser implements CurrentUser {

    private static final String ADMIN_AUTHORITY = "ROLE_ADMIN";

    @Override
    public Long id() {
        return Long.valueOf(jwtAuthentication().getToken().getSubject());
    }

    @Override
    public boolean isAdmin() {
        return jwtAuthentication().getAuthorities().stream()
                .anyMatch(authority -> ADMIN_AUTHORITY.equals(authority.getAuthority()));
    }

    private JwtAuthenticationToken jwtAuthentication() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof JwtAuthenticationToken token) {
            return token;
        }
        throw new AuthenticationCredentialsNotFoundException("No authenticated user in the current request");
    }
}
