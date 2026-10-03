package com.example.datn.modules.auth;

import com.jayway.jsonpath.JsonPath;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;
import com.nimbusds.jose.jwk.source.ImmutableSecret;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.allOf;
import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.hasKey;
import static org.hamcrest.Matchers.lessThanOrEqualTo;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthApiTests {

    private static final String PASSWORD = "password123";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtEncoder jwtEncoder;

    @Autowired
    private JwtDecoder jwtDecoder;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private EntityManager entityManager;

    @Test
    void registerCreatesLearnerWithNormalizedEmailAndNoPasswordInResponse() throws Exception {
        register("  Nguyen Van A ", "  Learner@Example.COM ", PASSWORD)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.fullName").value("Nguyen Van A"))
                .andExpect(jsonPath("$.email").value("learner@example.com"))
                .andExpect(jsonPath("$.role").value("LEARNER"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$", not(hasKey("password"))))
                .andExpect(jsonPath("$", not(hasKey("passwordHash"))));
    }

    @Test
    void registerRejectsDuplicateEmailIgnoringCase() throws Exception {
        register("A", "dup@example.com", PASSWORD).andExpect(status().isCreated());

        register("B", "DUP@example.com", PASSWORD).andExpect(status().isConflict());
    }

    @Test
    void registerRejectsInvalidInput() throws Exception {
        register(" ", "ok@example.com", PASSWORD).andExpect(status().isBadRequest());
        register("A", "not-an-email", PASSWORD).andExpect(status().isBadRequest());
        register("A", "ok@example.com", "1234567").andExpect(status().isBadRequest());
        // BCrypt ignores everything after 72 bytes, so longer passwords must be refused, not silently truncated.
        register("A", "ok@example.com", "x".repeat(73)).andExpect(status().isBadRequest());
        // The limit is in bytes: "ệ" is 3 bytes in UTF-8, so 30 of them (90 bytes) are too long despite being 30 characters.
        register("A", "ok@example.com", "ệ".repeat(30)).andExpect(status().isBadRequest());
    }

    @Test
    void registerAcceptsMultiBytePasswordUpTo72Bytes() throws Exception {
        String password = "ệ".repeat(24);

        register("A", "vn@example.com", password).andExpect(status().isCreated());
        login("vn@example.com", password).andExpect(status().isOk());
    }

    @Test
    void loginReturnsTokenThatOpensProtectedEndpoints() throws Exception {
        register("A", "user@example.com", PASSWORD).andExpect(status().isCreated());

        String body = login("user@example.com", PASSWORD)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                // A token lives for the idle timeout; the client refreshes it while the user is active.
                .andExpect(jsonPath("$.expiresIn").value(Duration.ofMinutes(30).toSeconds()))
                .andExpect(jsonPath("$.user.email").value("user@example.com"))
                .andReturn().getResponse().getContentAsString();
        String token = JsonPath.read(body, "$.accessToken");

        mockMvc.perform(get("/api/users/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("user@example.com"));
        mockMvc.perform(get("/api/topics").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void loginFailsWithTheSameResponseForWrongPasswordAndUnknownEmail() throws Exception {
        register("A", "user@example.com", PASSWORD).andExpect(status().isCreated());

        String wrongPassword = login("user@example.com", "wrong-password")
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();
        String unknownEmail = login("nobody@example.com", PASSWORD)
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();

        // Same message, so the API does not reveal which emails are registered.
        org.assertj.core.api.Assertions.assertThat((String) JsonPath.read(wrongPassword, "$.message"))
                .isEqualTo(JsonPath.read(unknownEmail, "$.message"));
    }

    @Test
    void lockedAccountCannotLogInButOnlyWithTheRightPassword() throws Exception {
        register("A", "locked@example.com", PASSWORD).andExpect(status().isCreated());
        jdbcTemplate.update("update users set status = 'locked' where email = ?", "locked@example.com");
        entityManager.clear();

        login("locked@example.com", PASSWORD).andExpect(status().isForbidden());
        // A wrong password must not reveal that the account is locked.
        login("locked@example.com", "wrong-password").andExpect(status().isUnauthorized());
    }

    @Test
    void lockingAnAccountSignsItOutAtItsNextRequest() throws Exception {
        register("A", "user@example.com", PASSWORD).andExpect(status().isCreated());
        String token = tokenFor("user@example.com", PASSWORD);
        mockMvc.perform(get("/api/users/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk());

        // Scenario 25, step 9: the still-valid token stops working at once, with a code the client can explain.
        jdbcTemplate.update("update users set status = 'locked' where email = ?", "user@example.com");
        entityManager.clear();
        mockMvc.perform(get("/api/users/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("ACCOUNT_LOCKED"));
        mockMvc.perform(post("/api/auth/refresh").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isUnauthorized());

        jdbcTemplate.update("update users set status = 'active' where email = ?", "user@example.com");
        entityManager.clear();
        mockMvc.perform(get("/api/users/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void aTokenOfADeletedAccountIsRejected() throws Exception {
        Instant now = Instant.now();
        String orphan = tokenWith(jwtEncoder, "987654321", now, now.plus(Duration.ofMinutes(10)));

        mockMvc.perform(get("/api/users/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + orphan))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$", not(hasKey("code"))));
    }

    @Test
    void refreshIssuesAFreshTokenForTheSameSession() throws Exception {
        register("A", "user@example.com", PASSWORD).andExpect(status().isCreated());
        String token = tokenFor("user@example.com", PASSWORD);

        String body = mockMvc.perform(post("/api/auth/refresh").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.expiresIn").value(Duration.ofMinutes(30).toSeconds()))
                .andExpect(jsonPath("$.user.email").value("user@example.com"))
                .andReturn().getResponse().getContentAsString();
        String refreshed = JsonPath.read(body, "$.accessToken");

        mockMvc.perform(get("/api/users/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + refreshed))
                .andExpect(status().isOk());
        // The session keeps its start, so refreshing cannot push it past its maximum length.
        assertThat(jwtDecoder.decode(refreshed).getClaimAsInstant("auth_time"))
                .isEqualTo(jwtDecoder.decode(token).getClaimAsInstant("auth_time"));
        mockMvc.perform(post("/api/auth/refresh")).andExpect(status().isUnauthorized());
    }

    @Test
    void refreshStopsAtTheMaximumSessionLength() throws Exception {
        String body = register("A", "user@example.com", PASSWORD).andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String userId = String.valueOf(((Number) JsonPath.read(body, "$.id")).longValue());
        Instant now = Instant.now();

        // Logged in 7 h 50 min ago: the new token ends with the 8-hour session, not 30 minutes later.
        String nearTheEnd = sessionToken(userId, now.minus(Duration.ofHours(8)).plus(Duration.ofMinutes(10)));
        mockMvc.perform(post("/api/auth/refresh").header(HttpHeaders.AUTHORIZATION, "Bearer " + nearTheEnd))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.expiresIn", allOf(greaterThan(500), lessThanOrEqualTo(600))));

        String overTheEnd = sessionToken(userId, now.minus(Duration.ofHours(8)).minus(Duration.ofMinutes(1)));
        mockMvc.perform(post("/api/auth/refresh").header(HttpHeaders.AUTHORIZATION, "Bearer " + overTheEnd))
                .andExpect(status().isUnauthorized());

        // Tokens issued before auth_time existed count their session from their issue time.
        String legacy = tokenWith(jwtEncoder, userId, now, now.plus(Duration.ofHours(8)));
        mockMvc.perform(post("/api/auth/refresh").header(HttpHeaders.AUTHORIZATION, "Bearer " + legacy))
                .andExpect(status().isOk());
    }

    @Test
    void protectedEndpointsRejectMissingOrInvalidTokens() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string(HttpHeaders.WWW_AUTHENTICATE, "Bearer"))
                .andExpect(jsonPath("$.status").value(401));
        mockMvc.perform(get("/api/topics")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/users/me").header(HttpHeaders.AUTHORIZATION, "Bearer not-a-token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void expiredTokenIsRejected() throws Exception {
        Instant now = Instant.now();
        String expired = tokenWith(jwtEncoder, "1", now.minus(Duration.ofHours(2)), now.minus(Duration.ofHours(1)));

        mockMvc.perform(get("/api/users/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + expired))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void tokenSignedWithAnotherKeyIsRejected() throws Exception {
        JwtEncoder attacker = new NimbusJwtEncoder(new ImmutableSecret<>(new SecretKeySpec(
                "another-secret-key-of-32-bytes!!!".getBytes(StandardCharsets.UTF_8), "HmacSHA256")));
        Instant now = Instant.now();
        String forged = tokenWith(attacker, "1", now, now.plus(Duration.ofHours(1)));

        mockMvc.perform(get("/api/users/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + forged))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void changePasswordRequiresTheCurrentPasswordAndReplacesIt() throws Exception {
        register("A", "user@example.com", PASSWORD).andExpect(status().isCreated());
        String token = tokenFor("user@example.com", PASSWORD);

        changePassword(token, "wrong-current", "new-password-1").andExpect(status().isBadRequest());
        changePassword(token, PASSWORD, PASSWORD).andExpect(status().isBadRequest());
        changePassword(token, PASSWORD, "short").andExpect(status().isBadRequest());
        changePassword(token, PASSWORD, "ệ".repeat(30)).andExpect(status().isBadRequest());
        changePassword(token, PASSWORD, "new-password-1").andExpect(status().isNoContent());

        login("user@example.com", PASSWORD).andExpect(status().isUnauthorized());
        login("user@example.com", "new-password-1").andExpect(status().isOk());
    }

    @Test
    void changePasswordRequiresAuthentication() throws Exception {
        mockMvc.perform(post("/api/auth/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"a\",\"newPassword\":\"new-password-1\"}"))
                .andExpect(status().isUnauthorized());
    }

    private ResultActions register(String fullName, String email, String password) throws Exception {
        return mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json("fullName", fullName, "email", email, "password", password)));
    }

    private ResultActions login(String email, String password) throws Exception {
        return mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json("email", email, "password", password)));
    }

    private String tokenFor(String email, String password) throws Exception {
        String body = login(email, password).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.accessToken");
    }

    private ResultActions changePassword(String token, String current, String next) throws Exception {
        return mockMvc.perform(post("/api/auth/change-password")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json("currentPassword", current, "newPassword", next)));
    }

    private static String tokenWith(JwtEncoder encoder, String subject, Instant issuedAt, Instant expiresAt) {
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject(subject)
                .claim("role", "LEARNER")
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .build();
        return encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims))
                .getTokenValue();
    }

    /** A still-valid token of a session that started at {@code authTime}. */
    private String sessionToken(String subject, Instant authTime) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject(subject)
                .claim("role", "LEARNER")
                .claim("auth_time", authTime.getEpochSecond())
                .issuedAt(now)
                .expiresAt(now.plus(Duration.ofMinutes(10)))
                .build();
        return jwtEncoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims))
                .getTokenValue();
    }

    private static String json(String... keyValues) {
        StringBuilder builder = new StringBuilder("{");
        for (int i = 0; i < keyValues.length; i += 2) {
            if (i > 0) {
                builder.append(',');
            }
            builder.append('"').append(keyValues[i]).append("\":\"").append(keyValues[i + 1]).append('"');
        }
        return builder.append('}').toString();
    }
}
