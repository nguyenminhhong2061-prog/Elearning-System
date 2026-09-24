package com.example.datn.support;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;

/**
 * Authenticates a MockMvc request as a given user without going through the login endpoint. Usage:
 *
 * <pre>
 * mockMvc.perform(get("/api/vocabulary").with(TestAuth.learner(42)))
 * mockMvc.perform(post("/api/topics").with(TestAuth.admin()).content(...))
 * </pre>
 *
 * The request carries a JWT whose subject is the user id, so {@code CurrentUser.id()} returns that id.
 * ({@code @WithMockUser} does not work here because the API is stateless.)
 */
public final class TestAuth {

    private TestAuth() {
    }

    public static RequestPostProcessor learner(long userId) {
        return user(userId, "ROLE_LEARNER");
    }

    public static RequestPostProcessor admin() {
        return user(1L, "ROLE_ADMIN");
    }

    private static RequestPostProcessor user(long userId, String authority) {
        return jwt()
                .jwt(token -> token.subject(String.valueOf(userId)))
                .authorities(new SimpleGrantedAuthority(authority));
    }
}
