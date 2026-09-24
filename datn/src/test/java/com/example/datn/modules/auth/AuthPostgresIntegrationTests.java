package com.example.datn.modules.auth;

import com.example.datn.support.AbstractPostgresIntegrationTest;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Runs the auth flow against a real PostgreSQL. The H2 tests cannot prove that the role and status values written by
 * the enum converters satisfy the CHECK constraints of the real schema ('learner'/'admin', 'active'/'locked').
 */
class AuthPostgresIntegrationTests extends AbstractPostgresIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void registerLoginAndChangePasswordWorkAgainstTheRealSchema() throws Exception {
        String email = "learner-" + UUID.randomUUID() + "@example.com";

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Nguyen Van A\",\"email\":\"" + email + "\",\"password\":\"password123\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("LEARNER"));

        // The database stores the lower-case values required by the CHECK constraints.
        Map<String, Object> row = jdbcTemplate.queryForMap(
                "select role, status, current_level, created_at from users where email = ?", email);
        assertThat(row.get("role")).isEqualTo("learner");
        assertThat(row.get("status")).isEqualTo("active");
        assertThat(row.get("current_level")).isNull();
        assertThat(row.get("created_at")).isNotNull();

        String body = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"password123\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String token = JsonPath.read(body, "$.accessToken");

        mockMvc.perform(get("/api/users/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email));

        mockMvc.perform(post("/api/auth/change-password")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"password123\",\"newPassword\":\"new-password-1\"}"))
                .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"new-password-1\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void duplicateEmailIsRejectedByTheUniqueConstraint() throws Exception {
        String email = "dup-" + UUID.randomUUID() + "@example.com";
        String body = "{\"fullName\":\"A\",\"email\":\"" + email + "\",\"password\":\"password123\"}";

        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict());
    }
}
