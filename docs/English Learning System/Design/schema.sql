-- ============================================================================
-- CSDL hệ thống học tiếng Anh (PostgreSQL)
-- Sinh từ Design/EntityClasses.md theo 5 bước trong Design/Database.md.
-- Quy ước:
--   * Tên bảng: tbl_ + tên lớp thực thể dạng snake_case; tên cột dạng snake_case.
--   * Khóa chính: id BIGINT tự tăng. Khóa ngoại: <tên thuộc tính đối tượng>_id.
--   * Enum Java lưu dạng VARCHAR kèm CHECK liệt kê giá trị hợp lệ.
--   * Thuộc tính dẫn xuất (xem Database.md, bước 5) không có cột.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tài khoản
-- ---------------------------------------------------------------------------

-- User, Learner, Admin lưu chung một bảng; cột role phân biệt lớp con.
CREATE TABLE tbl_user (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    role          VARCHAR(20)  NOT NULL CHECK (role IN ('LEARNER', 'ADMIN')),
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password      VARCHAR(255) NOT NULL,
    status        VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'LOCKED')),
    created_date  DATE         NOT NULL DEFAULT CURRENT_DATE,
    last_active_time  TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- Học từ vựng
-- ---------------------------------------------------------------------------

CREATE TABLE tbl_topic (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name          VARCHAR(150) NOT NULL UNIQUE,
    description   TEXT,
    image         VARCHAR(255),
    updated_date  DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE tbl_vocabulary (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    word        VARCHAR(150) NOT NULL,
    phonetic    VARCHAR(150),
    meaning     TEXT         NOT NULL,
    example     TEXT,
    audio       VARCHAR(255),
    image       VARCHAR(255),
    level       VARCHAR(2)   CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    status      VARCHAR(20)  NOT NULL DEFAULT 'VISIBLE' CHECK (status IN ('VISIBLE', 'HIDDEN')),
    updated_date DATE        NOT NULL DEFAULT CURRENT_DATE,
    topic_id    BIGINT REFERENCES tbl_topic (id),
    creator_id  BIGINT NOT NULL REFERENCES tbl_user (id),
    UNIQUE (topic_id, word)
);

CREATE TABLE tbl_learner_vocabulary (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    status            VARCHAR(20) NOT NULL CHECK (status IN ('NEW', 'LEARNING', 'MASTERED')),
    next_review_date  DATE        NOT NULL,
    learner_id        BIGINT NOT NULL REFERENCES tbl_user (id),
    vocabulary_id     BIGINT NOT NULL REFERENCES tbl_vocabulary (id),
    UNIQUE (learner_id, vocabulary_id)
);

CREATE TABLE tbl_vocabulary_review (
    id                     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    rating                 VARCHAR(20) NOT NULL CHECK (rating IN ('FORGOT', 'VAGUE', 'REMEMBERED')),
    reviewed_time          TIMESTAMP   NOT NULL,
    learner_vocabulary_id  BIGINT NOT NULL REFERENCES tbl_learner_vocabulary (id) ON DELETE CASCADE
);

CREATE TABLE tbl_custom_list (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    created_date  DATE         NOT NULL DEFAULT CURRENT_DATE,
    learner_id    BIGINT NOT NULL REFERENCES tbl_user (id),
    UNIQUE (learner_id, name)
);

CREATE TABLE tbl_custom_list_item (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    custom_list_id  BIGINT NOT NULL REFERENCES tbl_custom_list (id) ON DELETE CASCADE,
    vocabulary_id   BIGINT NOT NULL REFERENCES tbl_vocabulary (id),
    UNIQUE (custom_list_id, vocabulary_id)
);

-- Mỗi lượt chơi gắn với tối đa một trong hai: chủ đề hoặc danh sách từ riêng.
-- Khi danh sách từ riêng bị xóa, lượt chơi vẫn được giữ nhưng mất liên kết.
CREATE TABLE tbl_game_play (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    game_type       VARCHAR(20) NOT NULL CHECK (game_type IN ('MATCHING', 'QUICK_QUIZ', 'GUESS_MEANING')),
    correct_count   INTEGER NOT NULL CHECK (correct_count >= 0),
    question_count  INTEGER NOT NULL CHECK (question_count > 0),
    score           INTEGER NOT NULL CHECK (score >= 0),
    duration        INTEGER NOT NULL CHECK (duration >= 0),
    played_date     DATE    NOT NULL,
    learner_id      BIGINT NOT NULL REFERENCES tbl_user (id),
    topic_id        BIGINT REFERENCES tbl_topic (id),
    custom_list_id  BIGINT REFERENCES tbl_custom_list (id) ON DELETE SET NULL,
    CHECK (correct_count <= question_count),
    CHECK (topic_id IS NULL OR custom_list_id IS NULL)
);

-- ---------------------------------------------------------------------------
-- Bài tập
-- ---------------------------------------------------------------------------

CREATE TABLE tbl_exercise_lesson (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    skill               VARCHAR(20)  NOT NULL CHECK (skill IN ('READING', 'WRITING', 'LISTENING', 'PRONUNCIATION')),
    title               VARCHAR(200) NOT NULL,
    description         TEXT,
    topic               VARCHAR(100),
    level               VARCHAR(2)   NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    difficulty          VARCHAR(10)  NOT NULL DEFAULT 'MEDIUM' CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
    estimated_duration  INTEGER CHECK (estimated_duration > 0),
    status              VARCHAR(20)  NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'HIDDEN'))
);

CREATE TABLE tbl_reading_passage (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title      VARCHAR(200) NOT NULL,
    content    TEXT         NOT NULL,
    lesson_id  BIGINT NOT NULL REFERENCES tbl_exercise_lesson (id) ON DELETE CASCADE
);

CREATE TABLE tbl_listening_passage (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title        VARCHAR(200) NOT NULL,
    audio        VARCHAR(255) NOT NULL,
    duration     INTEGER CHECK (duration > 0),
    transcript   TEXT NOT NULL,
    translation  TEXT,
    lesson_id    BIGINT NOT NULL UNIQUE REFERENCES tbl_exercise_lesson (id) ON DELETE CASCADE
);

CREATE TABLE tbl_listening_segment (
    id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_no              INTEGER NOT NULL CHECK (order_no > 0),
    start_time            INTEGER NOT NULL CHECK (start_time >= 0),
    end_time              INTEGER NOT NULL,
    speaker               VARCHAR(100),
    transcript            TEXT    NOT NULL,
    translation           TEXT,
    listening_passage_id  BIGINT NOT NULL REFERENCES tbl_listening_passage (id) ON DELETE CASCADE,
    CHECK (end_time > start_time),
    UNIQUE (listening_passage_id, order_no)
);

CREATE TABLE tbl_pronunciation_item (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sample_text   VARCHAR(500) NOT NULL,
    ipa           VARCHAR(500) NOT NULL,
    sample_audio  VARCHAR(255) NOT NULL,
    notes         VARCHAR(500),
    lesson_id     BIGINT NOT NULL REFERENCES tbl_exercise_lesson (id) ON DELETE CASCADE
);

-- ai_feedback lưu nhận xét của AI theo từng từ ở dạng chuỗi JSON.
CREATE TABLE tbl_pronunciation_attempt (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    recording       VARCHAR(255) NOT NULL,
    accuracy_score  REAL NOT NULL CHECK (accuracy_score BETWEEN 0 AND 100),
    fluency_score   REAL NOT NULL CHECK (fluency_score BETWEEN 0 AND 100),
    overall_score   REAL NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
    ai_feedback     TEXT,
    practiced_time  TIMESTAMP NOT NULL,
    learner_id      BIGINT NOT NULL REFERENCES tbl_user (id),
    item_id         BIGINT NOT NULL REFERENCES tbl_pronunciation_item (id)
);

-- ---------------------------------------------------------------------------
-- Kiểm tra (tạo trước tbl_question vì câu hỏi kiểm tra tham chiếu đề và tài liệu)
-- ---------------------------------------------------------------------------

CREATE TABLE tbl_test (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title        VARCHAR(200) NOT NULL,
    type         VARCHAR(20)  NOT NULL CHECK (type IN ('PERIODIC', 'COMPREHENSIVE')),
    skill        VARCHAR(200),
    instruction  TEXT,
    open_date    DATE NOT NULL,
    close_date   DATE NOT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'VISIBLE', 'HIDDEN')),
    -- đề gốc khi đề được tạo bằng "Nhân bản" (kịch bản 24, nhánh 2c)
    duplicated_from_id  BIGINT REFERENCES tbl_test (id) ON DELETE SET NULL,
    CHECK (close_date > open_date)
);

CREATE TABLE tbl_test_material (
    id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    type     VARCHAR(20) NOT NULL CHECK (type IN ('LISTENING', 'READING')),
    title    VARCHAR(200),
    audio    VARCHAR(255),
    text     TEXT,
    -- lời thoại của bài nghe, chỉ hiện cho người học sau khi nộp bài
    transcript  TEXT,
    test_id  BIGINT NOT NULL REFERENCES tbl_test (id) ON DELETE CASCADE,
    CHECK ((type = 'LISTENING' AND audio IS NOT NULL) OR (type = 'READING' AND text IS NOT NULL)),
    CHECK (transcript IS NULL OR type = 'LISTENING')
);

-- ---------------------------------------------------------------------------
-- Câu hỏi: ExerciseQuestion và TestQuestion lưu chung một bảng; cột kind
-- phân biệt lớp con. Các cột riêng của lớp con này phải rỗng ở lớp con kia.
-- ---------------------------------------------------------------------------

CREATE TABLE tbl_question (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    kind                VARCHAR(20) NOT NULL CHECK (kind IN ('EXERCISE', 'TEST')),
    type                VARCHAR(20) NOT NULL CHECK (type IN ('MULTIPLE_CHOICE', 'FILL_IN', 'TRANSLATION',
                                                             'REWRITE', 'KEYWORD_SENTENCE', 'SPEAKING', 'ESSAY')),
    content             TEXT NOT NULL,
    score               REAL NOT NULL CHECK (score > 0),
    -- cột riêng của ExerciseQuestion
    hint                TEXT,
    explanation         TEXT,
    lesson_id           BIGINT REFERENCES tbl_exercise_lesson (id) ON DELETE CASCADE,
    reading_passage_id  BIGINT REFERENCES tbl_reading_passage (id),
    -- cột riêng của TestQuestion
    skill               VARCHAR(20) CHECK (skill IN ('LISTENING', 'SPEAKING', 'READING', 'WRITING')),
    test_id             BIGINT REFERENCES tbl_test (id) ON DELETE CASCADE,
    material_id         BIGINT REFERENCES tbl_test_material (id),
    vocabulary_id       BIGINT REFERENCES tbl_vocabulary (id),
    -- bậc CEFR mà câu hỏi kiểm tra; trình độ người học tính theo bậc của các câu làm được (kịch bản 15, bước 15)
    level               VARCHAR(2) CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    -- câu mẫu của câu nói "đọc theo câu mẫu": trả lời bằng ghi âm, chấm phát âm; rỗng với mọi câu khác
    reference_text      TEXT,
    -- thứ tự của câu trong đề do admin sắp
    sort_order          INT NOT NULL DEFAULT 0,
    CHECK (reference_text IS NULL OR (kind = 'TEST' AND type = 'SPEAKING')),
    CHECK (level IS NULL OR kind = 'TEST'),
    CHECK (
        (kind = 'EXERCISE'
            AND lesson_id IS NOT NULL
            AND type IN ('MULTIPLE_CHOICE', 'FILL_IN', 'TRANSLATION', 'REWRITE', 'KEYWORD_SENTENCE')
            AND test_id IS NULL AND skill IS NULL AND material_id IS NULL AND vocabulary_id IS NULL)
        OR
        (kind = 'TEST'
            AND test_id IS NOT NULL AND skill IS NOT NULL
            AND type IN ('MULTIPLE_CHOICE', 'FILL_IN', 'SPEAKING', 'ESSAY')
            AND lesson_id IS NULL AND reading_passage_id IS NULL AND hint IS NULL AND explanation IS NULL)
    )
);

CREATE TABLE tbl_answer_option (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    content      VARCHAR(500) NOT NULL,
    is_correct   BOOLEAN      NOT NULL,
    question_id  BIGINT NOT NULL REFERENCES tbl_question (id) ON DELETE CASCADE
);

CREATE TABLE tbl_accepted_answer (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    content      VARCHAR(255) NOT NULL,
    question_id  BIGINT NOT NULL REFERENCES tbl_question (id) ON DELETE CASCADE,
    UNIQUE (question_id, content)
);

CREATE TABLE tbl_sample_answer (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    content      TEXT NOT NULL,
    question_id  BIGINT NOT NULL REFERENCES tbl_question (id) ON DELETE CASCADE
);

CREATE TABLE tbl_exercise_attempt (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    status      VARCHAR(20) NOT NULL CHECK (status IN ('IN_PROGRESS', 'SUBMITTED')),
    max_score   REAL        NOT NULL CHECK (max_score > 0),
    start_time  TIMESTAMP   NOT NULL,
    end_time    TIMESTAMP,
    learner_id  BIGINT NOT NULL REFERENCES tbl_user (id),
    lesson_id   BIGINT NOT NULL REFERENCES tbl_exercise_lesson (id),
    CHECK (end_time IS NULL OR end_time >= start_time)
);

-- score rỗng nghĩa là câu viết chưa được Dịch vụ AI chấm.
CREATE TABLE tbl_exercise_answer (
    id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    answer_text          TEXT,
    is_correct           BOOLEAN,
    score                REAL CHECK (score >= 0),
    ai_feedback          TEXT,
    exercise_attempt_id  BIGINT NOT NULL REFERENCES tbl_exercise_attempt (id) ON DELETE CASCADE,
    question_id          BIGINT NOT NULL REFERENCES tbl_question (id),
    selected_option_id   BIGINT REFERENCES tbl_answer_option (id),
    UNIQUE (exercise_attempt_id, question_id)
);

-- ---------------------------------------------------------------------------
-- Chatbot
-- ---------------------------------------------------------------------------

CREATE TABLE tbl_knowledge_chunk (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    source       VARCHAR(255),
    title        VARCHAR(200) NOT NULL,
    content      TEXT NOT NULL,
    lesson_id    BIGINT REFERENCES tbl_exercise_lesson (id),
    question_id  BIGINT REFERENCES tbl_question (id)
);

CREATE TABLE tbl_chat_session (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title        VARCHAR(200),
    learner_id   BIGINT NOT NULL REFERENCES tbl_user (id),
    lesson_id    BIGINT REFERENCES tbl_exercise_lesson (id),
    question_id  BIGINT REFERENCES tbl_question (id)
);

CREATE TABLE tbl_chat_message (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    role             VARCHAR(20) NOT NULL CHECK (role IN ('LEARNER', 'AI')),
    content          TEXT      NOT NULL,
    sent_time        TIMESTAMP NOT NULL,
    chat_session_id  BIGINT NOT NULL REFERENCES tbl_chat_session (id) ON DELETE CASCADE
);

CREATE TABLE tbl_message_source (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    chat_message_id  BIGINT NOT NULL REFERENCES tbl_chat_message (id) ON DELETE CASCADE,
    chunk_id         BIGINT NOT NULL REFERENCES tbl_knowledge_chunk (id),
    UNIQUE (chat_message_id, chunk_id)
);

-- ---------------------------------------------------------------------------
-- Lượt làm bài kiểm tra
-- ---------------------------------------------------------------------------

CREATE TABLE tbl_test_attempt (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    start_time         TIMESTAMP   NOT NULL,
    submit_time        TIMESTAMP,
    status             VARCHAR(20) NOT NULL CHECK (status IN ('IN_PROGRESS', 'SUBMITTED', 'GRADED')),
    suggested_level    VARCHAR(2)  CHECK (suggested_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    suggested_roadmap  TEXT,
    learner_id         BIGINT NOT NULL REFERENCES tbl_user (id),
    test_id            BIGINT NOT NULL REFERENCES tbl_test (id),
    CHECK (submit_time IS NULL OR submit_time >= start_time)
);

-- score rỗng nghĩa là câu nói/câu viết chưa được Dịch vụ AI chấm.
-- Không lưu file ghi âm: bản ghi của câu đọc theo câu mẫu được chấm phát âm ngay khi gửi lên, chỉ kết quả chấm được
-- lưu (answer_text giữ văn bản dịch vụ nghe được).
CREATE TABLE tbl_test_answer (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    answer_text         TEXT,
    is_correct          BOOLEAN,
    score               REAL CHECK (score >= 0),
    ai_feedback         TEXT,
    -- mức 0–6 Dịch vụ AI cho từng tiêu chí: {"task":3,"coherence":3,"vocabulary":2,"grammar":3}
    ai_criteria         JSONB,
    -- điểm phát âm 0–100 của câu đọc theo câu mẫu và chi tiết (độ chính xác âm vị, từ; các từ đọc sai)
    pronunciation_score    REAL CHECK (pronunciation_score BETWEEN 0 AND 100),
    pronunciation_details  JSONB,
    test_attempt_id     BIGINT NOT NULL REFERENCES tbl_test_attempt (id) ON DELETE CASCADE,
    question_id         BIGINT NOT NULL REFERENCES tbl_question (id),
    selected_option_id  BIGINT REFERENCES tbl_answer_option (id),
    UNIQUE (test_attempt_id, question_id)
);

-- Số lần người học đã nghe một bài nghe trong một lượt làm bài (tối đa 2 lần mỗi bài, mỗi lượt).
CREATE TABLE tbl_test_material_play (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    play_count       INT NOT NULL DEFAULT 0 CHECK (play_count BETWEEN 0 AND 2),
    test_attempt_id  BIGINT NOT NULL REFERENCES tbl_test_attempt (id) ON DELETE CASCADE,
    material_id      BIGINT NOT NULL REFERENCES tbl_test_material (id) ON DELETE CASCADE,
    UNIQUE (test_attempt_id, material_id)
);

-- Mỗi lượt kiểm tra sinh ra tối đa một bản ghi lịch sử trình độ.
CREATE TABLE tbl_level_history (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    level            VARCHAR(2) NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    changed_date     DATE       NOT NULL,
    learner_id       BIGINT NOT NULL REFERENCES tbl_user (id),
    test_attempt_id  BIGINT UNIQUE REFERENCES tbl_test_attempt (id)
);

-- ---------------------------------------------------------------------------
-- Tiến độ và kế hoạch
-- ---------------------------------------------------------------------------

CREATE TABLE tbl_daily_progress (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    date           DATE    NOT NULL,
    study_minutes  INTEGER NOT NULL DEFAULT 0 CHECK (study_minutes >= 0),
    learner_id     BIGINT NOT NULL REFERENCES tbl_user (id),
    UNIQUE (learner_id, date)
);

CREATE TABLE tbl_badge (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,
    description     VARCHAR(255),
    icon            VARCHAR(255),
    condition_type  VARCHAR(20) NOT NULL CHECK (condition_type IN ('STREAK_DAYS', 'WORDS_LEARNED', 'PERFECT_SCORE')),
    threshold       INTEGER     NOT NULL CHECK (threshold > 0)
);

CREATE TABLE tbl_learner_badge (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    achieved_date  DATE NOT NULL,
    learner_id     BIGINT NOT NULL REFERENCES tbl_user (id),
    badge_id       BIGINT NOT NULL REFERENCES tbl_badge (id),
    UNIQUE (learner_id, badge_id)
);

CREATE TABLE tbl_study_plan (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    goal               TEXT        NOT NULL,
    target_level       VARCHAR(2)  NOT NULL CHECK (target_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    start_date         DATE        NOT NULL,
    end_date           DATE        NOT NULL,
    status             VARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE', 'COMPLETED', 'PAUSED')),
    learner_id         BIGINT NOT NULL REFERENCES tbl_user (id),
    source_attempt_id  BIGINT REFERENCES tbl_test_attempt (id),
    CHECK (end_date > start_date)
);

-- Mỗi người học có tối đa một kế hoạch đang thực hiện.
CREATE UNIQUE INDEX ux_study_plan_one_active ON tbl_study_plan (learner_id) WHERE status = 'ACTIVE';

CREATE TABLE tbl_study_week (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    week_no           INTEGER NOT NULL CHECK (week_no > 0),
    description       TEXT,
    target_words      INTEGER NOT NULL CHECK (target_words >= 0),
    target_exercises  INTEGER NOT NULL CHECK (target_exercises >= 0),
    study_plan_id     BIGINT NOT NULL REFERENCES tbl_study_plan (id) ON DELETE CASCADE,
    UNIQUE (study_plan_id, week_no)
);

-- Nhắc nhở loại kế hoạch gắn với một tuần; tuần bị xóa (rút ngắn kế hoạch) thì nhắc nhở bị xóa theo.
CREATE TABLE tbl_reminder (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    type           VARCHAR(20)  NOT NULL CHECK (type IN ('REVIEW', 'TEST', 'PLAN')),
    remind_time    TIMESTAMP    NOT NULL,
    content        VARCHAR(500) NOT NULL,
    is_sent        BOOLEAN      NOT NULL DEFAULT FALSE,
    learner_id     BIGINT NOT NULL REFERENCES tbl_user (id),
    test_id        BIGINT REFERENCES tbl_test (id),
    study_week_id  BIGINT UNIQUE REFERENCES tbl_study_week (id) ON DELETE CASCADE,
    CHECK (type <> 'PLAN' OR study_week_id IS NOT NULL),
    CHECK (type <> 'TEST' OR test_id IS NOT NULL)
);
