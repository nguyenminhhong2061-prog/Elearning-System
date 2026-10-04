-- =====================================================================
-- Module C (Kiểm tra) — ngữ liệu dùng chung cho nhiều câu hỏi (một bài
-- nghe hoặc một đoạn đọc có nhiều câu hỏi) và số lần nghe của mỗi lượt
-- làm bài (docs/api/tests.md).
-- =====================================================================

-- Bài nghe (audio_url) hoặc đoạn đọc (content) của một đề.
-- transcript: lời thoại bài nghe, chỉ trả về sau khi nộp bài.
CREATE TABLE test_passages (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  test_id     BIGINT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  title       VARCHAR(255) NULL,
  content     TEXT NULL,
  audio_url   VARCHAR(500) NULL,
  transcript  TEXT NULL,
  CHECK (content IS NOT NULL OR audio_url IS NOT NULL)
);
CREATE INDEX idx_tp_test ON test_passages(test_id);

-- Câu hỏi thuộc ngữ liệu nào. NULL với câu đứng riêng (đề cũ không đổi).
ALTER TABLE test_questions
  ADD COLUMN passage_id BIGINT NULL REFERENCES test_passages(id) ON DELETE SET NULL;
CREATE INDEX idx_tq_passage ON test_questions(passage_id);

-- Số lần người học đã nghe một bài nghe trong một lượt làm bài
-- (tối đa 2 lần mỗi bài, mỗi lượt). Xóa lượt thì xóa theo.
CREATE TABLE test_passage_plays (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  attempt_id  BIGINT NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  passage_id  BIGINT NOT NULL REFERENCES test_passages(id) ON DELETE CASCADE,
  play_count  INT NOT NULL DEFAULT 0,
  UNIQUE (attempt_id, passage_id)
);
CREATE INDEX idx_tpp_passage ON test_passage_plays(passage_id);
