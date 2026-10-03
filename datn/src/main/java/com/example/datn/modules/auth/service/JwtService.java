package com.example.datn.modules.auth.service;

import com.example.datn.modules.auth.config.JwtProperties;
import com.example.datn.modules.user.enums.UserRole;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;

/**
 * Issues the access tokens. A token lives {@link JwtProperties#idleTimeout()} and carries the time its session
 * started (the {@value #AUTH_TIME_CLAIM} claim, epoch seconds), so refreshing it can keep an active user signed in
 * without ever passing {@link JwtProperties#expiration()} after the login.
 */
@Service
public class JwtService {

    /** Claim carrying the user's role (LEARNER or ADMIN). The user id is the standard "sub" claim. */
    public static final String ROLE_CLAIM = "role";

    /** When the user logged in (the OpenID Connect claim of the same name). */
    public static final String AUTH_TIME_CLAIM = "auth_time";

    private final JwtEncoder encoder;
    private final JwtProperties properties;

    public JwtService(JwtEncoder encoder, JwtProperties properties) {
        this.encoder = encoder;
        this.properties = properties;
    }

    /** The first token of a new session. */
    public IssuedToken issue(Long userId, UserRole role) {
        Instant now = Instant.now();
        return issue(userId, role, now, now);
    }

    /**
     * A new token for a session started at {@code authTime}, or empty when that session has reached its maximum
     * length.
     */
    public Optional<IssuedToken> renew(Long userId, UserRole role, Instant authTime) {
        Instant now = Instant.now();
        if (!now.isBefore(sessionEnd(authTime))) {
            return Optional.empty();
        }
        return Optional.of(issue(userId, role, authTime, now));
    }

    /** When the session of this token started; tokens issued before the claim existed use their issue time. */
    public static Instant authTimeOf(Jwt jwt) {
        Instant authTime = jwt.getClaimAsInstant(AUTH_TIME_CLAIM);
        return authTime != null ? authTime : jwt.getIssuedAt();
    }

    private IssuedToken issue(Long userId, UserRole role, Instant authTime, Instant now) {
        Instant idleEnd = now.plus(properties.idleTimeout());
        Instant sessionEnd = sessionEnd(authTime);
        Instant expiresAt = idleEnd.isBefore(sessionEnd) ? idleEnd : sessionEnd;
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject(String.valueOf(userId))
                .claim(ROLE_CLAIM, role.name())
                // Epoch seconds, as in OpenID Connect; an Instant would not serialize to a JSON number.
                .claim(AUTH_TIME_CLAIM, authTime.getEpochSecond())
                .issuedAt(now)
                .expiresAt(expiresAt)
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        return new IssuedToken(token, expiresAt.getEpochSecond() - now.getEpochSecond());
    }

    private Instant sessionEnd(Instant authTime) {
        return authTime.plus(properties.expiration());
    }

    public record IssuedToken(String value, long expiresInSeconds) {
    }
}
