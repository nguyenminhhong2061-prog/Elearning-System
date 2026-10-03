package com.example.datn.modules.auth.security;

import com.example.datn.modules.user.enums.UserStatus;
import com.example.datn.modules.user.service.UserService;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;

/**
 * Turns a valid token into the authenticated user, but only while the account still exists and is active
 * ("JwtAuthFilter" of the design, scenario 25 step 9): a token is checked against the database on every request,
 * so locking an account signs it out at its next request instead of when its token expires.
 *
 * <p>Both refusals are authentication failures, so the security filter answers 401 through
 * {@link JsonSecurityErrorHandler}, which tells a locked account apart from an ended session.
 */
public class ActiveAccountJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final JwtAuthenticationConverter delegate;
    private final UserService userService;

    public ActiveAccountJwtAuthenticationConverter(JwtAuthenticationConverter delegate, UserService userService) {
        this.delegate = delegate;
        this.userService = userService;
    }

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        Long userId = userId(jwt);
        UserStatus status = userService.findStatus(userId)
                .orElseThrow(() -> new InvalidBearerTokenException("The account no longer exists"));
        if (status == UserStatus.LOCKED) {
            throw new LockedException("Account is locked");
        }
        return delegate.convert(jwt);
    }

    private static Long userId(Jwt jwt) {
        try {
            return Long.valueOf(jwt.getSubject());
        } catch (NumberFormatException e) {
            throw new InvalidBearerTokenException("The token subject is not a user id");
        }
    }
}
