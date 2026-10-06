-- =====================================================================
-- Module C (Kiểm tra) — câu Nói "đọc theo câu mẫu": người học ghi âm,
-- dịch vụ OpenPronounce chấm phát âm (docs/api/tests.md).
-- =====================================================================

-- Câu mẫu người học phải đọc. Khác NULL: câu hỏi được trả lời bằng bản
-- ghi âm và chấm phát âm. NULL: mọi loại câu khác (kể cả câu Nói mở).
ALTER TABLE test_questions ADD COLUMN reference_text TEXT NULL;

-- Kết quả chấm phát âm của một câu trả lời ghi âm: điểm 0–100 và chi
-- tiết ({"phonemeAccuracy":.., "wordAccuracy":.., "errors":[..]}).
-- Văn bản dịch vụ nghe được lưu ở answer_content; file ghi âm không lưu.
ALTER TABLE test_attempt_answers
  ADD COLUMN pronunciation_score   NUMERIC(5,2) NULL,
  ADD COLUMN pronunciation_details JSONB NULL;

-- Câu Nói của đề tổng hợp mẫu vốn là câu đọc theo mẫu viết lẫn trong đề
-- bài: tách câu mẫu ra cột riêng và gắn bậc để chấm theo bậc.
UPDATE test_questions
SET content = 'Read the sentence aloud.',
    reference_text = 'Sustainability is a shared responsibility.',
    level = 'B2'
WHERE id = 2004 AND question_type = 'SPEAKING';
