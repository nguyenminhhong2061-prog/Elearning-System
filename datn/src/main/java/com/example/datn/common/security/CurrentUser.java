package com.example.datn.common.security;

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
}
