package com.example.datn.modules.test.enums;

/** The CEFR skill a question's points count toward. Stored lower-case (like the exercise module) via a converter. */
public enum TestSkill {
    LISTENING("nghe"),
    SPEAKING("noi"),
    READING("doc"),
    WRITING("viet");

    private final String dbKey;

    TestSkill(String dbKey) {
        this.dbKey = dbKey;
    }

    /**
     * The key used inside {@code test_attempts.skill_scores} (JSONB), matching the Vietnamese keys documented in
     * docs/api/progress.md ({@code nghe}, {@code noi}, {@code doc}, {@code viet}).
     */
    public String dbKey() {
        return dbKey;
    }

    /** The key used in JSON responses, the lower-case enum name ({@code listening}, {@code speaking}, ...). */
    public String apiKey() {
        return name().toLowerCase(java.util.Locale.ROOT);
    }
}
