-- =====================================================================
-- Module C (Kiểm tra) — mở rộng schema cho chấm điểm và nộp bài
-- Bổ sung cho V1__init.sql (các bảng tests, test_questions, ...).
-- Không sửa file cũ; thêm cột/bảng bằng migration mới.
-- =====================================================================

-- Thời điểm nộp bài (progress.md: cần để sắp "gần nhất" và gộp theo kỳ).
-- V1 chỉ có start_time, không đủ để biết bài được nộp khi nào.
ALTER TABLE test_attempts ADD COLUMN submitted_at TIMESTAMPTZ NULL;

-- Lựa chọn người học đã chọn cho câu trắc nghiệm/nghe/đọc.
-- V1 chỉ có answer_content TEXT, không lưu được id lựa chọn để chấm trắc nghiệm.
ALTER TABLE test_attempt_answers
  ADD COLUMN selected_option_id BIGINT NULL REFERENCES test_question_options(id) ON DELETE SET NULL;
CREATE INDEX idx_taa_option ON test_attempt_answers(selected_option_id);

-- File audio cho câu hỏi nghe hiểu (LISTENING). NULL với các loại câu khác.
ALTER TABLE test_questions ADD COLUMN audio_url VARCHAR(500) NULL;

-- Đáp án chấp nhận cho câu điền từ / viết ngắn (FILL_BLANK, WRITING ngắn).
-- Đối chiếu với question_accepted_answers của module B (bài tập).
CREATE TABLE test_question_accepted_answers (
  id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  question_id        BIGINT NOT NULL REFERENCES test_questions(id) ON DELETE CASCADE,
  answer_text        VARCHAR(255) NOT NULL,
  normalized_answer  VARCHAR(255) NOT NULL,
  is_primary         BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_tqaa_question ON test_question_accepted_answers(question_id);
