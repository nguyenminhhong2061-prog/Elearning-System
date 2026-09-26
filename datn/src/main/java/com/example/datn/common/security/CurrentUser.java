package com.example.datn.common.security;

import com.example.datn.common.enums.CefrLevel;

import java.util.Optional;

/**
 * The authenticated user of the current request. Inject this into controllers or services of any module
 * instead of reading the security context directly, so modules only depend on this small contract.
 *
 * Only meaningful on endpoints that require authentication (everything except register/login).
 */
public interface CurrentUser {

    /** Id of the authenticated user (users.id). */
    Long id();

    boolean isAdmin();

    /**
     * The user's current CEFR level (users.current_level), empty until a placement test has set it. Read from the
     * database on each call, so it reflects a level changed after the token was issued.
     *
     * A default method so that test doubles written before it existed keep compiling.
     */
    default Optional<CefrLevel> currentLevel() {
        return Optional.empty();
    }
}
