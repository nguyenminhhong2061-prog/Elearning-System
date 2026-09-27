# Database — Toàn hệ thống (CHÍNH THỨC — chốt sau họp nhóm 23/09/2026, cập nhật 24/09/2026)

Nguồn: (1) Nguyễn Minh Hồng — Học từ vựng; (2) Lý Quang Đạt — Bài tập + Chatbot AI; (3) Khuất Huy Nhân — Kiểm tra + Trò chơi từ vựng.

**Phân công sau họp**: bảng `vocabulary`/`topics` do Nguyễn Minh Hồng chỉnh sửa hoàn thiện cuối cùng. Migration/script tạo bảng do Nguyễn Minh Hồng viết.

## Quyết định đã chốt

1. **Role**: bỏ `TEACHER` khỏi `users.role` — chỉ còn `ENUM('learner','admin')`.
2. **Bảng `vocabulary`**: dùng bản chuẩn do Hồng sửa (có `topic_id`, `created_by`, audio/ảnh/ví dụ đầy đủ) — xóa hẳn bảng `VOCABULARY` rút gọn của Nhân; mọi FK (`game_questions.vocabulary_id`, `test_questions.vocabulary_id`) trỏ về bảng này.
3. **Độ khó/trình độ**: chuẩn CEFR (A1–C2) là trường chính toàn hệ thống.
4. **Kiểu id**: `BIGINT UNSIGNED` cho mọi khóa chính và khóa ngoại trong toàn bộ 38 bảng.
5. **Đổi tên bảng tránh trùng**: `questions`→`test_questions`, `answer_options`→`test_question_options`, `attempt_answers`→`test_attempt_answers`.
6. **Bổ sung 3 cột vào `test_attempts`**: `skill_scores` (JSON — điểm từng kỹ năng nghe/nói/đọc/viết), `suggested_level` (ENUM CEFR, nullable), `suggested_roadmap` (TEXT, nullable) — phục vụ nghiệp vụ C3 (kiểm tra tổng hợp → đề xuất lộ trình) và ghi lịch sử vào `user_level_history`.
7. **`leaderboard`**: giữ làm bảng cache riêng, không tính live — cập nhật bằng batch job `GROUP BY user_id` trên `game_sessions` theo `period_start`.

---

# NHÓM 1 — NGƯỜI DÙNG

## users

| Cột           | Kiểu                    | PK/FK  | Ghi chú                |
| ------------- | ----------------------- | ------ | ---------------------- |
| id            | BIGINT UNSIGNED         | PK     |                        |
| full_name     | VARCHAR(150)            |        |                        |
| email         | VARCHAR(255)            | UNIQUE |                        |
| password_hash | VARCHAR(255)            |        |                        |
| role          | ENUM('learner','admin') |        | đã bỏ teacher          |
| current_level | ENUM(A1,A2,B1,B2,C1,C2) |        | trình độ CEFR hiện tại |
| status        | ENUM('active','locked') |        | Admin khóa/mở          |
| created_at    | DATETIME                |        |                        |

## user_level_history

| Cột             | Kiểu            | PK/FK                           |
| --------------- | --------------- | ------------------------------- |
| id              | BIGINT UNSIGNED | PK                              |
| user_id         | BIGINT UNSIGNED | FK → users.id                   |
| level           | ENUM CEFR       |                                 |
| test_attempt_id | BIGINT UNSIGNED | FK → test_attempts.id, nullable |
| changed_at      | DATETIME        |                                 |

Quan hệ: users 1-n user_level_history. Module dùng: Tiến độ, Kiểm tra (D, C3).

---

# NHÓM 2 — TỪ VỰNG (module Nguyễn Minh Hồng — dùng chung toàn hệ thống)

## topics

- id BIGINT UNSIGNED PK, name, description, image_url

## vocabulary

- id BIGINT UNSIGNED PK, topic_id FK→topics.id nullable, created_by FK→users.id nullable
- word, meaning, example_sentence, phonetic, audio_url, image_url
- difficulty_level ENUM CEFR (A1–C2)

## user_vocabulary (Spaced Repetition)

- id BIGINT UNSIGNED PK, user_id FK→users.id, vocabulary_id FK→vocabulary.id, UNIQUE(user_id, vocabulary_id)
- status ENUM(new, learning, mastered)
- last_review_result ENUM(forgot, vague, remembered)
- review_count INT
- next_review_at DATE -- quyết định "từ cần ôn hôm nay"
- last_reviewed_at, first_learned_at
- interval_days INT NULL -- bậc ôn hiện tại tính bằng ngày (1, 3, 7, 14, 30), NULL khi chưa ôn lần nào. Thêm ở migration `V202609252000` (Phase 3) vì không suy ra được bậc từ các cột khác ("Chưa nhớ" đưa về bậc đầu)

## custom_vocabulary_lists

- id BIGINT UNSIGNED PK, user_id FK→users.id, name, created_at

## custom_vocabulary_list_items

- list_id FK→custom_vocabulary_lists.id, vocabulary_id FK→vocabulary.id (bảng nối n-n)

Quan hệ: được tham chiếu bởi test_questions.vocabulary_id và game_questions.vocabulary_id — bảng lõi dùng chung, không có bản sao ở module khác.
Module dùng: Học từ vựng (chính), Kiểm tra, Trò chơi (tham chiếu).

---

# NHÓM 3 — BÀI TẬP LUYỆN TẬP (module Lý Quang Đạt)

## exercise_lessons

- id BIGINT UNSIGNED PK, slug UNIQUE, skill ENUM(grammar,listening,pronunciation), title, description, topic
- cefr_level ENUM(A1–C2), difficulty ENUM(easy,medium,hard) -- lớp phụ trong nội bộ 1 CEFR level
- estimated_minutes, publication_status ENUM(draft,published,archived), sort_order
- created_at, updated_at

## exercise_questions

- id BIGINT UNSIGNED PK, lesson_id FK→exercise_lessons.id
- code UNIQUE per lesson, question_type ENUM(multiple_choice, fill_blank)
- prompt, hint_text, explanation, points DECIMAL(6,2), sort_order, created_at

## question_options

- id BIGINT UNSIGNED PK, question_id FK→exercise_questions.id
- option_key, option_text, is_correct BOOLEAN, sort_order

## question_accepted_answers

- id BIGINT UNSIGNED PK, question_id FK→exercise_questions.id
- answer_text, normalized_answer, is_primary

## listening_passages

- id BIGINT UNSIGNED PK, lesson_id FK→exercise_lessons.id UNIQUE
- title, audio_uri, duration_ms, full_transcript_en, full_translation_vi

## listening_segments

- id BIGINT UNSIGNED PK, passage_id FK→listening_passages.id
- segment_order, start_ms, end_ms, speaker_label, transcript_en, translation_vi

## pronunciation_items

- id BIGINT UNSIGNED PK, lesson_id FK→exercise_lessons.id, sort_order
- reference_text, ipa, reference_audio_uri, notes

## pronunciation_attempts

- id BIGINT UNSIGNED PK, attempt_id FK→exercise_attempts.id, lesson_id FK→exercise_lessons.id
- pronunciation_item_id FK→pronunciation_items.id, try_number
- provider, provider_request_id, recording_uri
- recognized_text, accuracy_score, fluency_score, completeness_score, overall_score DECIMAL(5,2)
- assessment_details JSON, assessed_at

## exercise_attempts

- id BIGINT UNSIGNED PK, user_id FK→users.id, lesson_id FK→exercise_lessons.id
- status ENUM(in_progress, completed, abandoned) DEFAULT in_progress
- playback_rate DECIMAL(3,2) DEFAULT 1.00
- total_points, earned_points, score_percent DECIMAL
- started_at, finished_at

## question_responses

- id BIGINT UNSIGNED PK, attempt_id FK→exercise_attempts.id, lesson_id FK→exercise_lessons.id, question_id FK→exercise_questions.id
- selected_option_id FK→question_options.id nullable, entered_answer, normalized_answer
- is_correct BOOLEAN DEFAULT false, awarded_points DECIMAL(6,2), answered_at

Module dùng: Làm bài tập (ngữ pháp B1, nghe hiểu B2, phát âm B3).

---

# NHÓM 4 — CHATBOT AI (module Lý Quang Đạt)

## knowledge_chunks

- id BIGINT UNSIGNED PK, source_key UNIQUE, source_title
- lesson_id FK→exercise_lessons.id nullable, question_id FK→exercise_questions.id nullable
- content, external_vector_id, metadata JSON, updated_at

## chat_sessions

- id BIGINT UNSIGNED PK, user_id FK→users.id, lesson_id FK nullable, question_id FK nullable
- title, created_at, updated_at

## chat_messages

- id BIGINT UNSIGNED PK, session_id FK→chat_sessions.id
- role ENUM(user, assistant, system), content LONGTEXT
- provider, model_name, prompt_tokens, completion_tokens, created_at

## chat_message_sources (bảng nối n-n)

- message_id FK→chat_messages.id (PK), knowledge_chunk_id FK→knowledge_chunks.id (PK)

Module dùng: Hỏi chatbot AI hỗ trợ giải thích bài tập (B4).

---

# NHÓM 5 — KIỂM TRA (module Khuất Huy Nhân)

## tests

- id BIGINT UNSIGNED PK, title, type ENUM(PERIODIC, COMPREHENSIVE), skill, start_date, end_date

## test_questions (đổi tên từ "questions" — đã chốt)

- id BIGINT UNSIGNED PK, test_id FK→tests.id, vocabulary_id FK→vocabulary.id nullable
- question_type ENUM(MULTIPLE_CHOICE, FILL_BLANK, LISTENING, SPEAKING, READING, WRITING)
- skill, content, audio_url (thêm ở migration V202610010900, cho câu nghe hiểu), points INT DEFAULT 1

## test_question_options (đổi tên từ "answer_options" — đã chốt)

- id BIGINT UNSIGNED PK, question_id FK→test_questions.id, content, is_correct BOOLEAN DEFAULT false

## test_question_accepted_answers (thêm ở migration V202610010900)

- id BIGINT UNSIGNED PK, question_id FK→test_questions.id
- answer_text, normalized_answer, is_primary BOOLEAN DEFAULT false
- Dùng chấm câu điền từ / viết ngắn (FILL_BLANK, WRITING ngắn), đối chiếu question_accepted_answers của module B.

## test_attempts (đã chốt bổ sung 3 cột cuối)

- id BIGINT UNSIGNED PK, test_id FK→tests.id, user_id FK→users.id
- start_time, submitted_at (thêm ở migration V202610010900, thời điểm nộp bài), total_score DECIMAL(5,2) DEFAULT 0
- status ENUM(IN_PROGRESS, SUBMITTED, GRADED)
- skill_scores JSON -- {nghe, noi, doc, viet}
- suggested_level ENUM CEFR nullable
- suggested_roadmap TEXT nullable

## test_attempt_answers (đổi tên từ "attempt_answers" — đã chốt)

- id BIGINT UNSIGNED PK, attempt_id FK→test_attempts.id, question_id FK→test_questions.id
- selected_option_id FK→test_question_options.id nullable (thêm ở migration V202610010900, cho câu trắc nghiệm/nghe/đọc)
- answer_content TEXT, is_correct BOOLEAN nullable, score_earned DECIMAL(5,2) DEFAULT 0

Module dùng: Kiểm tra định kỳ (C1), Kiểm tra tổng hợp (C2) → nguồn dữ liệu cho user_level_history.

---

# NHÓM 6 — TRÒ CHƠI TỪ VỰNG (module Khuất Huy Nhân)

## games

- id BIGINT UNSIGNED PK, name, game_type ENUM(GUESS_MEANING, QUICK_QUIZ, WORD_MATCH), time_limit_seconds nullable

## game_questions

- id BIGINT UNSIGNED PK, game_id FK→games.id, vocabulary_id FK→vocabulary.id
- round_number nullable, points INT DEFAULT 1

## game_question_options

- id BIGINT UNSIGNED PK, game_question_id FK→game_questions.id, content, is_correct BOOLEAN DEFAULT false

## game_sessions

- id BIGINT UNSIGNED PK, game_id FK→games.id, user_id FK→users.id, score INT DEFAULT 0, played_at

## game_session_answers

- id BIGINT UNSIGNED PK, session_id FK→game_sessions.id, game_question_id FK→game_questions.id
- selected_option_id FK→game_question_options.id, is_correct BOOLEAN, response_time_ms INT

## leaderboard (đã chốt giữ làm bảng cache riêng)

- id BIGINT UNSIGNED PK, game_id FK→games.id nullable (NULL = tổng hợp mọi game)
- period_type ENUM(week, month), period_start DATE
- user_id FK→users.id, total_score INT, rank INT

Cơ chế: bảng cache, cập nhật bằng batch job GROUP BY user_id trên game_sessions theo period_start (không tính live).
Module dùng: Trò chơi từ vựng.

---

# NHÓM 7 — TIẾN ĐỘ & KẾ HOẠCH CÁ NHÂN (chưa module nào làm trùng)

## user_progress

- id BIGINT UNSIGNED PK, user_id FK→users.id, date, words_learned_count, exercises_completed_count, tests_completed_count, study_time_minutes
- UNIQUE(user_id, date)

## badges

- id BIGINT UNSIGNED PK, name, description, icon_url, condition_type ENUM(streak_days, words_learned, perfect_score), condition_value INT

## user_badges

- id BIGINT UNSIGNED PK, user_id FK→users.id, badge_id FK→badges.id, earned_at, UNIQUE(user_id, badge_id)

## study_plans

- id BIGINT UNSIGNED PK, user_id FK→users.id, goal_description, target_level ENUM CEFR nullable, start_date, end_date, status ENUM(active, completed, paused)

## study_plan_schedule

- id BIGINT UNSIGNED PK, study_plan_id FK→study_plans.id, week_number, description, target_words INT nullable, target_exercises INT nullable, status ENUM(pending, in_progress, done)

## reminders

- id BIGINT UNSIGNED PK, user_id FK→users.id, type ENUM(vocab_review, test, study_plan)
- reference_id BIGINT UNSIGNED nullable (khóa ngoại mềm, tùy type)
- scheduled_at, message, is_sent BOOLEAN

Module dùng: Tiến độ & Kế hoạch cá nhân (D1, D2).

---

# Sơ đồ quan hệ tổng quát (rút gọn)

```
users 1-n user_level_history
users 1-n user_vocabulary n-1 vocabulary n-1 topics
users 1-n custom_vocabulary_lists n-n vocabulary
users 1-n exercise_attempts n-1 exercise_lessons
exercise_attempts 1-n question_responses n-1 exercise_questions n-1 question_options
exercise_lessons 1-1 listening_passages 1-n listening_segments
exercise_lessons 1-n pronunciation_items 1-n pronunciation_attempts n-1 exercise_attempts
users 1-n chat_sessions 1-n chat_messages n-n knowledge_chunks (qua chat_message_sources)
users 1-n test_attempts n-1 tests 1-n test_questions n-1 vocabulary (nullable)
test_attempts 1-n test_attempt_answers n-1 test_questions
users 1-n game_sessions n-1 games 1-n game_questions n-1 vocabulary
game_sessions 1-n game_session_answers
games/game_sessions -> leaderboard (batch job tổng hợp)
users 1-n user_progress, 1-n user_badges n-1 badges, 1-n study_plans 1-n study_plan_schedule, 1-n reminders
```
