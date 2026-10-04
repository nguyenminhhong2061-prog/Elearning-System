-- =====================================================================
-- Module C (Kiểm tra) — chấm trình độ theo bậc CEFR của từng câu hỏi
-- và lưu kết quả AI chấm phần Nói, Viết (docs/api/tests.md).
-- =====================================================================

-- Bậc CEFR của câu hỏi. NULL với câu chưa gắn bậc: kỹ năng đó quy đổi
-- trình độ từ điểm phần trăm như trước.
ALTER TABLE test_questions
  ADD COLUMN level VARCHAR(2) NULL
    CHECK (level IN ('A1','A2','B1','B2','C1','C2'));

-- Trình độ từng kỹ năng của lượt làm bài, cùng khóa với skill_scores:
-- {"nghe":"B1", "noi":"A2", "doc":"B2", "viet":"B1"}.
ALTER TABLE test_attempts ADD COLUMN skill_levels JSONB NULL;

-- Kết quả AI chấm một câu Nói/Viết: bậc 0–6 theo từng tiêu chí
-- ({"task":3, "coherence":3, "vocabulary":4, "grammar":3}) và nhận xét.
-- ai_criteria NULL với câu chấm tự động, hoặc câu đang chờ AI chấm.
ALTER TABLE test_attempt_answers
  ADD COLUMN ai_criteria JSONB NULL,
  ADD COLUMN ai_comment  TEXT NULL;
