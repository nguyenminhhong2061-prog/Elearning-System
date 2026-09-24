-- =====================================================================
-- DATN — Nền tảng học tiếng Anh cá nhân hóa theo AI
-- Migration tạo cơ sở dữ liệu — PostgreSQL 15+ (tương thích Neon)
-- Nguồn: "Database - Tổng hợp toàn hệ thống (final)" — chốt sau họp nhóm
--        23/09/2026, cập nhật 24/09/2026 (đổi tên bảng, thêm cột
--        test_attempts, giữ leaderboard làm cache riêng)
-- Người viết: Nguyễn Minh Hồng
--
-- Khác biệt so với bản MySQL:
--  - BIGINT UNSIGNED + AUTO_INCREMENT  -> BIGINT GENERATED ALWAYS AS IDENTITY
--  - ENUM(...) khai báo inline         -> VARCHAR + CHECK (đổi giá trị cho
--    phép chỉ cần sửa 1 dòng CHECK, không cần ALTER TYPE như Postgres ENUM)
--  - DATETIME                          -> TIMESTAMPTZ (có timezone, hợp lý
--    vì Neon chạy trên cloud, user có thể ở nhiều múi giờ)
--  - JSON                              -> JSONB (nhanh hơn, index được)
--  - ON UPDATE CURRENT_TIMESTAMP       -> trigger set_updated_at()
--  - ENGINE=InnoDB / CHARSET           -> bỏ (không có khái niệm này)
--  - backtick `rank`, `date`           -> ngoặc kép "rank", "date"
-- =====================================================================

-- ---------------------------------------------------------------------
-- Hàm dùng chung: tự động cập nhật cột updated_at khi UPDATE 1 dòng
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- NHÓM 1 — NGƯỜI DÙNG
-- =====================================================================

CREATE TABLE users (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name       VARCHAR(150)    NOT NULL,
  email           VARCHAR(255)    NOT NULL UNIQUE,
  password_hash   VARCHAR(255)    NOT NULL,
  role            VARCHAR(20)     NOT NULL DEFAULT 'learner'
                    CHECK (role IN ('learner','admin')),
  current_level   VARCHAR(2)      NULL
                    CHECK (current_level IN ('A1','A2','B1','B2','C1','C2')),
  status          VARCHAR(20)     NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','locked')),
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

-- user_level_history.test_attempt_id -> test_attempts.id được thêm bằng
-- ALTER TABLE ở cuối file (test_attempts được tạo sau, ở NHÓM 5)
CREATE TABLE user_level_history (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id          BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level            VARCHAR(2) NOT NULL
                     CHECK (level IN ('A1','A2','B1','B2','C1','C2')),
  test_attempt_id  BIGINT NULL,
  changed_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ulh_user ON user_level_history(user_id);

-- =====================================================================
-- NHÓM 2 — TỪ VỰNG (module Nguyễn Minh Hồng)
-- =====================================================================

CREATE TABLE topics (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name         VARCHAR(150) NOT NULL,
  description  TEXT NULL,
  image_url    VARCHAR(500) NULL
);

CREATE TABLE vocabulary (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  topic_id          BIGINT NULL REFERENCES topics(id) ON DELETE SET NULL,
  created_by        BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
  word              VARCHAR(150) NOT NULL,
  meaning           TEXT NOT NULL,
  example_sentence  TEXT NULL,
  phonetic          VARCHAR(150) NULL,
  audio_url         VARCHAR(500) NULL,
  image_url         VARCHAR(500) NULL,
  difficulty_level  VARCHAR(2) NOT NULL
                      CHECK (difficulty_level IN ('A1','A2','B1','B2','C1','C2'))
);
CREATE INDEX idx_vocab_topic ON vocabulary(topic_id);
CREATE INDEX idx_vocab_created_by ON vocabulary(created_by);

CREATE TABLE user_vocabulary (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vocabulary_id       BIGINT NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
  status              VARCHAR(20) NOT NULL DEFAULT 'new'
                        CHECK (status IN ('new','learning','mastered')),
  last_review_result  VARCHAR(20) NULL
                        CHECK (last_review_result IN ('forgot','vague','remembered')),
  review_count        INT NOT NULL DEFAULT 0,
  next_review_at      DATE NULL,
  last_reviewed_at    TIMESTAMPTZ NULL,
  first_learned_at    TIMESTAMPTZ NULL,
  UNIQUE (user_id, vocabulary_id)
);
CREATE INDEX idx_uv_vocab ON user_vocabulary(vocabulary_id);
CREATE INDEX idx_uv_next_review ON user_vocabulary(next_review_at);

CREATE TABLE custom_vocabulary_lists (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(150) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_cvl_user ON custom_vocabulary_lists(user_id);

CREATE TABLE custom_vocabulary_list_items (
  list_id        BIGINT NOT NULL REFERENCES custom_vocabulary_lists(id) ON DELETE CASCADE,
  vocabulary_id  BIGINT NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
  PRIMARY KEY (list_id, vocabulary_id)
);
CREATE INDEX idx_cvli_vocab ON custom_vocabulary_list_items(vocabulary_id);

-- =====================================================================
-- NHÓM 3 — BÀI TẬP LUYỆN TẬP (module Lý Quang Đạt)
-- =====================================================================

CREATE TABLE exercise_lessons (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug                VARCHAR(191) NOT NULL UNIQUE,
  skill               VARCHAR(20) NOT NULL
                        CHECK (skill IN ('grammar','listening','pronunciation')),
  title               VARCHAR(255) NOT NULL,
  description         TEXT NULL,
  topic               VARCHAR(150) NULL,
  cefr_level          VARCHAR(2) NOT NULL
                        CHECK (cefr_level IN ('A1','A2','B1','B2','C1','C2')),
  difficulty          VARCHAR(10) NOT NULL DEFAULT 'medium'
                        CHECK (difficulty IN ('easy','medium','hard')),
  estimated_minutes   INT NULL,
  publication_status  VARCHAR(20) NOT NULL DEFAULT 'draft'
                        CHECK (publication_status IN ('draft','published','archived')),
  sort_order          INT NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_exercise_lessons_updated_at
  BEFORE UPDATE ON exercise_lessons
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE exercise_questions (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lesson_id      BIGINT NOT NULL REFERENCES exercise_lessons(id) ON DELETE CASCADE,
  code           VARCHAR(100) NOT NULL,
  question_type  VARCHAR(20) NOT NULL
                    CHECK (question_type IN ('multiple_choice','fill_blank')),
  prompt         TEXT NOT NULL,
  hint_text      TEXT NULL,
  explanation    TEXT NULL,
  points         NUMERIC(6,2) NOT NULL DEFAULT 1,
  sort_order     INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (lesson_id, code)
);

CREATE TABLE question_options (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  question_id  BIGINT NOT NULL REFERENCES exercise_questions(id) ON DELETE CASCADE,
  option_key   VARCHAR(10) NOT NULL,
  option_text  VARCHAR(500) NOT NULL,
  is_correct   BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order   INT NOT NULL DEFAULT 0
);
CREATE INDEX idx_qo_question ON question_options(question_id);

CREATE TABLE question_accepted_answers (
  id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  question_id        BIGINT NOT NULL REFERENCES exercise_questions(id) ON DELETE CASCADE,
  answer_text        VARCHAR(255) NOT NULL,
  normalized_answer  VARCHAR(255) NOT NULL,
  is_primary         BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_qaa_question ON question_accepted_answers(question_id);

CREATE TABLE listening_passages (
  id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lesson_id            BIGINT NOT NULL UNIQUE REFERENCES exercise_lessons(id) ON DELETE CASCADE,
  title                VARCHAR(255) NOT NULL,
  audio_uri            VARCHAR(500) NOT NULL,
  duration_ms          INT NOT NULL,
  full_transcript_en   TEXT NULL,
  full_translation_vi  TEXT NULL
);

CREATE TABLE listening_segments (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  passage_id      BIGINT NOT NULL REFERENCES listening_passages(id) ON DELETE CASCADE,
  segment_order   INT NOT NULL,
  start_ms        INT NOT NULL,
  end_ms          INT NOT NULL,
  speaker_label   VARCHAR(100) NULL,
  transcript_en   TEXT NULL,
  translation_vi  TEXT NULL
);
CREATE INDEX idx_ls_passage ON listening_segments(passage_id);

CREATE TABLE pronunciation_items (
  id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lesson_id            BIGINT NOT NULL REFERENCES exercise_lessons(id) ON DELETE CASCADE,
  sort_order           INT NOT NULL DEFAULT 0,
  reference_text       VARCHAR(500) NOT NULL,
  ipa                  VARCHAR(500) NULL,
  reference_audio_uri  VARCHAR(500) NULL,
  notes                TEXT NULL
);
CREATE INDEX idx_pi_lesson ON pronunciation_items(lesson_id);

CREATE TABLE exercise_attempts (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id        BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id      BIGINT NOT NULL REFERENCES exercise_lessons(id) ON DELETE CASCADE,
  status         VARCHAR(20) NOT NULL DEFAULT 'in_progress'
                    CHECK (status IN ('in_progress','completed','abandoned')),
  playback_rate  NUMERIC(3,2) NOT NULL DEFAULT 1.00,
  total_points   NUMERIC(8,2) NOT NULL DEFAULT 0,
  earned_points  NUMERIC(8,2) NOT NULL DEFAULT 0,
  score_percent  NUMERIC(5,2) NOT NULL DEFAULT 0,
  started_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at    TIMESTAMPTZ NULL
);
CREATE INDEX idx_ea_user ON exercise_attempts(user_id);
CREATE INDEX idx_ea_lesson ON exercise_attempts(lesson_id);

CREATE TABLE pronunciation_attempts (
  id                     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  attempt_id             BIGINT NOT NULL REFERENCES exercise_attempts(id) ON DELETE CASCADE,
  lesson_id              BIGINT NOT NULL REFERENCES exercise_lessons(id) ON DELETE CASCADE,
  pronunciation_item_id  BIGINT NOT NULL REFERENCES pronunciation_items(id) ON DELETE CASCADE,
  try_number             INT NOT NULL DEFAULT 1,
  provider               VARCHAR(100) NULL,
  provider_request_id    VARCHAR(255) NULL,
  recording_uri          VARCHAR(500) NULL,
  recognized_text        TEXT NULL,
  accuracy_score         NUMERIC(5,2) NULL,
  fluency_score          NUMERIC(5,2) NULL,
  completeness_score     NUMERIC(5,2) NULL,
  overall_score          NUMERIC(5,2) NULL,
  assessment_details     JSONB NULL,
  assessed_at            TIMESTAMPTZ NULL
);
CREATE INDEX idx_pa_attempt ON pronunciation_attempts(attempt_id);
CREATE INDEX idx_pa_lesson ON pronunciation_attempts(lesson_id);
CREATE INDEX idx_pa_item ON pronunciation_attempts(pronunciation_item_id);

CREATE TABLE question_responses (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  attempt_id          BIGINT NOT NULL REFERENCES exercise_attempts(id) ON DELETE CASCADE,
  lesson_id           BIGINT NOT NULL REFERENCES exercise_lessons(id) ON DELETE CASCADE,
  question_id         BIGINT NOT NULL REFERENCES exercise_questions(id) ON DELETE CASCADE,
  selected_option_id  BIGINT NULL REFERENCES question_options(id) ON DELETE SET NULL,
  entered_answer      VARCHAR(500) NULL,
  normalized_answer   VARCHAR(500) NULL,
  is_correct          BOOLEAN NOT NULL DEFAULT FALSE,
  awarded_points      NUMERIC(6,2) NOT NULL DEFAULT 0,
  answered_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_qr_attempt ON question_responses(attempt_id);
CREATE INDEX idx_qr_question ON question_responses(question_id);
CREATE INDEX idx_qr_option ON question_responses(selected_option_id);

-- =====================================================================
-- NHÓM 4 — CHATBOT AI (module Lý Quang Đạt)
-- =====================================================================

CREATE TABLE knowledge_chunks (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_key          VARCHAR(191) NOT NULL UNIQUE,
  source_title        VARCHAR(255) NULL,
  lesson_id           BIGINT NULL REFERENCES exercise_lessons(id) ON DELETE SET NULL,
  question_id         BIGINT NULL REFERENCES exercise_questions(id) ON DELETE SET NULL,
  content             TEXT NOT NULL,
  external_vector_id  VARCHAR(255) NULL,
  metadata            JSONB NULL,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_kc_lesson ON knowledge_chunks(lesson_id);
CREATE INDEX idx_kc_question ON knowledge_chunks(question_id);
CREATE TRIGGER trg_knowledge_chunks_updated_at
  BEFORE UPDATE ON knowledge_chunks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE chat_sessions (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id    BIGINT NULL REFERENCES exercise_lessons(id) ON DELETE SET NULL,
  question_id  BIGINT NULL REFERENCES exercise_questions(id) ON DELETE SET NULL,
  title        VARCHAR(255) NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_cs_user ON chat_sessions(user_id);
CREATE INDEX idx_cs_lesson ON chat_sessions(lesson_id);
CREATE INDEX idx_cs_question ON chat_sessions(question_id);
CREATE TRIGGER trg_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE chat_messages (
  id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id         BIGINT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role               VARCHAR(20) NOT NULL
                        CHECK (role IN ('user','assistant','system')),
  content            TEXT NOT NULL,
  provider           VARCHAR(100) NULL,
  model_name         VARCHAR(100) NULL,
  prompt_tokens      INT NULL,
  completion_tokens  INT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_cm_session ON chat_messages(session_id);

CREATE TABLE chat_message_sources (
  message_id          BIGINT NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  knowledge_chunk_id  BIGINT NOT NULL REFERENCES knowledge_chunks(id) ON DELETE CASCADE,
  PRIMARY KEY (message_id, knowledge_chunk_id)
);
CREATE INDEX idx_cms_chunk ON chat_message_sources(knowledge_chunk_id);

-- =====================================================================
-- NHÓM 5 — KIỂM TRA (module Khuất Huy Nhân)
-- =====================================================================

CREATE TABLE tests (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  type        VARCHAR(20) NOT NULL
                CHECK (type IN ('PERIODIC','COMPREHENSIVE')),
  skill       VARCHAR(100) NULL,
  start_date  TIMESTAMPTZ NULL,
  end_date    TIMESTAMPTZ NULL
);

CREATE TABLE test_questions (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  test_id        BIGINT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  vocabulary_id  BIGINT NULL REFERENCES vocabulary(id) ON DELETE SET NULL,
  question_type  VARCHAR(20) NOT NULL
                    CHECK (question_type IN
                      ('MULTIPLE_CHOICE','FILL_BLANK','LISTENING','SPEAKING','READING','WRITING')),
  skill          VARCHAR(100) NULL,
  content        TEXT NOT NULL,
  points         INT NOT NULL DEFAULT 1
);
CREATE INDEX idx_tq_test ON test_questions(test_id);
CREATE INDEX idx_tq_vocab ON test_questions(vocabulary_id);

CREATE TABLE test_question_options (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  question_id  BIGINT NOT NULL REFERENCES test_questions(id) ON DELETE CASCADE,
  content      VARCHAR(500) NOT NULL,
  is_correct   BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_tqo_question ON test_question_options(question_id);

CREATE TABLE test_attempts (
  id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  test_id            BIGINT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  user_id            BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_time         TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_score        NUMERIC(5,2) NOT NULL DEFAULT 0,
  status             VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS'
                        CHECK (status IN ('IN_PROGRESS','SUBMITTED','GRADED')),
  skill_scores       JSONB NULL,  -- {"nghe":.., "noi":.., "doc":.., "viet":..}
  suggested_level    VARCHAR(2) NULL
                        CHECK (suggested_level IN ('A1','A2','B1','B2','C1','C2')),
  suggested_roadmap  TEXT NULL
);
CREATE INDEX idx_ta_test ON test_attempts(test_id);
CREATE INDEX idx_ta_user ON test_attempts(user_id);

CREATE TABLE test_attempt_answers (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  attempt_id      BIGINT NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  question_id     BIGINT NOT NULL REFERENCES test_questions(id) ON DELETE CASCADE,
  answer_content  TEXT NULL,
  is_correct      BOOLEAN NULL,
  score_earned    NUMERIC(5,2) NOT NULL DEFAULT 0
);
CREATE INDEX idx_taa_attempt ON test_attempt_answers(attempt_id);
CREATE INDEX idx_taa_question ON test_attempt_answers(question_id);

-- =====================================================================
-- NHÓM 6 — TRÒ CHƠI TỪ VỰNG (module Khuất Huy Nhân)
-- =====================================================================

CREATE TABLE games (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name                VARCHAR(150) NOT NULL,
  game_type           VARCHAR(20) NOT NULL
                        CHECK (game_type IN ('GUESS_MEANING','QUICK_QUIZ','WORD_MATCH')),
  time_limit_seconds  INT NULL
);

CREATE TABLE game_questions (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  game_id        BIGINT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  vocabulary_id  BIGINT NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
  round_number   INT NULL,
  points         INT NOT NULL DEFAULT 1
);
CREATE INDEX idx_gq_game ON game_questions(game_id);
CREATE INDEX idx_gq_vocab ON game_questions(vocabulary_id);

CREATE TABLE game_question_options (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  game_question_id  BIGINT NOT NULL REFERENCES game_questions(id) ON DELETE CASCADE,
  content           VARCHAR(500) NOT NULL,
  is_correct        BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_gqo_question ON game_question_options(game_question_id);

CREATE TABLE game_sessions (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  game_id    BIGINT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score      INT NOT NULL DEFAULT 0,
  played_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_gs_game ON game_sessions(game_id);
CREATE INDEX idx_gs_user ON game_sessions(user_id);

CREATE TABLE game_session_answers (
  id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id           BIGINT NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  game_question_id     BIGINT NOT NULL REFERENCES game_questions(id) ON DELETE CASCADE,
  selected_option_id   BIGINT NULL REFERENCES game_question_options(id) ON DELETE SET NULL,
  is_correct           BOOLEAN NOT NULL DEFAULT FALSE,
  response_time_ms     INT NULL
);
CREATE INDEX idx_gsa_session ON game_session_answers(session_id);
CREATE INDEX idx_gsa_question ON game_session_answers(game_question_id);
CREATE INDEX idx_gsa_option ON game_session_answers(selected_option_id);

-- leaderboard: bảng cache riêng, KHÔNG tính live — cập nhật bằng batch
-- job GROUP BY user_id trên game_sessions theo period_start (xem cuối
-- file, mục "Batch job gợi ý")
CREATE TABLE leaderboard (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  game_id       BIGINT NULL REFERENCES games(id) ON DELETE CASCADE,  -- NULL = tổng hợp mọi game
  period_type   VARCHAR(10) NOT NULL
                  CHECK (period_type IN ('week','month')),
  period_start  DATE NOT NULL,
  user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_score   INT NOT NULL DEFAULT 0,
  "rank"        INT NOT NULL,
  UNIQUE (game_id, period_type, period_start, user_id)
);
CREATE INDEX idx_lb_user ON leaderboard(user_id);

-- =====================================================================
-- NHÓM 7 — TIẾN ĐỘ & KẾ HOẠCH CÁ NHÂN
-- =====================================================================

CREATE TABLE user_progress (
  id                          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id                     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "date"                      DATE NOT NULL,
  words_learned_count         INT NOT NULL DEFAULT 0,
  exercises_completed_count   INT NOT NULL DEFAULT 0,
  tests_completed_count       INT NOT NULL DEFAULT 0,
  study_time_minutes          INT NOT NULL DEFAULT 0,
  UNIQUE (user_id, "date")
);

CREATE TABLE badges (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name             VARCHAR(150) NOT NULL,
  description      TEXT NULL,
  icon_url         VARCHAR(500) NULL,
  condition_type   VARCHAR(30) NOT NULL
                      CHECK (condition_type IN ('streak_days','words_learned','perfect_score')),
  condition_value  INT NOT NULL
);

CREATE TABLE user_badges (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id   BIGINT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_id)
);
CREATE INDEX idx_ub_badge ON user_badges(badge_id);

CREATE TABLE study_plans (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id           BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_description  TEXT NULL,
  target_level      VARCHAR(2) NULL
                        CHECK (target_level IN ('A1','A2','B1','B2','C1','C2')),
  start_date        DATE NULL,
  end_date          DATE NULL,
  status            VARCHAR(20) NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','completed','paused'))
);
CREATE INDEX idx_sp_user ON study_plans(user_id);

CREATE TABLE study_plan_schedule (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  study_plan_id    BIGINT NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
  week_number      INT NOT NULL,
  description      TEXT NULL,
  target_words     INT NULL,
  target_exercises INT NULL,
  status           VARCHAR(20) NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','in_progress','done'))
);
CREATE INDEX idx_sps_plan ON study_plan_schedule(study_plan_id);

CREATE TABLE reminders (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          VARCHAR(20) NOT NULL
                    CHECK (type IN ('vocab_review','test','study_plan')),
  reference_id  BIGINT NULL,  -- khóa ngoại mềm, tùy type — không có FK cứng
  scheduled_at  TIMESTAMPTZ NOT NULL,
  message       VARCHAR(500) NULL,
  is_sent       BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_rm_user ON reminders(user_id);
CREATE INDEX idx_rm_scheduled ON reminders(scheduled_at);

-- =====================================================================
-- FK còn thiếu do phụ thuộc vòng (user_level_history <-> test_attempts)
-- =====================================================================

ALTER TABLE user_level_history
  ADD CONSTRAINT fk_ulh_test_attempt
  FOREIGN KEY (test_attempt_id) REFERENCES test_attempts(id) ON DELETE SET NULL;

-- =====================================================================
-- Batch job gợi ý cho leaderboard (chạy định kỳ bằng pg_cron trên Neon,
-- hoặc scheduler phía backend — KHÔNG chạy real-time mỗi lần user xem)
-- =====================================================================
-- Ví dụ: tính lại bảng xếp hạng tuần hiện tại cho toàn bộ game
--
-- INSERT INTO leaderboard (game_id, period_type, period_start, user_id, total_score, "rank")
-- SELECT NULL, 'week', :period_start, user_id, SUM(score) AS total_score,
--        RANK() OVER (ORDER BY SUM(score) DESC) AS "rank"
-- FROM game_sessions
-- WHERE played_at >= :period_start AND played_at < :period_end
-- GROUP BY user_id
-- ON CONFLICT (game_id, period_type, period_start, user_id)
-- DO UPDATE SET total_score = EXCLUDED.total_score, "rank" = EXCLUDED."rank";
