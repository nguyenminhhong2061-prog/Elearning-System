package com.example.datn;

import com.example.datn.support.AbstractPostgresIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Runs every Flyway migration against a real (throwaway) PostgreSQL and starts the application with
 * {@code ddl-auto=validate}. The context only starts if every JPA entity matches the tables and columns created
 * by the migrations, so this catches schema/entity drift that the H2-based tests cannot see (column types,
 * missing tables).
 */
class DatabaseMigrationTests extends AbstractPostgresIntegrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void migrationsCreateSchemaAndEntitiesMatchIt() {
        Integer tables = jdbcTemplate.queryForObject("""
                select count(*) from information_schema.tables
                where table_schema = 'public'
                  and table_type = 'BASE TABLE'
                  and table_name <> 'flyway_schema_history'
                """, Integer.class);

        // V1 defines the 38 tables of the agreed schema; later migrations may add more.
        assertThat(tables).isGreaterThanOrEqualTo(38);
    }
}
