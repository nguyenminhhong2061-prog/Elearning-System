package com.example.datn.modules.auth.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;

/**
 * Writes the standard JSON error body for authentication (401) and authorization (403) failures raised by
 * the security filters, which run before controllers and so never reach the {@code @RestControllerAdvice} classes.
 *
 * <p>A token of an account locked by an admin is refused with 401 like an ended session, plus
 * {@code "code": "ACCOUNT_LOCKED"}, so the client can say why it was signed out (scenario 25).
 */
@Component
public class JsonSecurityErrorHandler implements AuthenticationEntryPoint, AccessDeniedHandler {

    /** Value of the {@code code} field for a token whose account has been locked. */
    public static final String ACCOUNT_LOCKED = "ACCOUNT_LOCKED";

    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException) throws IOException {
        response.setHeader("WWW-Authenticate", "Bearer");
        if (authException instanceof LockedException) {
            write(response, HttpServletResponse.SC_UNAUTHORIZED, "Account is locked", ACCOUNT_LOCKED);
        } else {
            write(response, HttpServletResponse.SC_UNAUTHORIZED, "Authentication required", null);
        }
    }

    @Override
    public void handle(
            HttpServletRequest request,
            HttpServletResponse response,
            AccessDeniedException accessDeniedException) throws IOException {
        write(response, HttpServletResponse.SC_FORBIDDEN, "Access denied", null);
    }

    // The messages and codes are fixed constants, so building the JSON by hand is safe (nothing needs escaping).
    private void write(HttpServletResponse response, int status, String message, String code) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        String codeField = code == null ? "" : ",\"code\":\"" + code + "\"";
        response.getWriter().write("{\"timestamp\":\"" + Instant.now() + "\",\"status\":" + status
                + ",\"message\":\"" + message + "\"" + codeField + "}");
    }
}
