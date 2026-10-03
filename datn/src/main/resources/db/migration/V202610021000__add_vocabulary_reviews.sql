-- Module A (docs/api/learning.md), following the analysis and design documents (docs/English Learning System):
--
-- 1. "Lượt ôn từ" (Business model; Design tbl_vocabulary_review): one row each time a learner rates a flashcard. The
--    session summary counts them per rating, and the learning history can be built from them.
-- 2. The review rule changes from the steps 1/3/7/14/30 days to the rule of the Business model (k kept, doubled or
--    reset; mastered from 16 days). interval_days is k, so every stored interval stays valid; only the status of the
--    words already at 16 days or more (the old 30-day step rated "Nhớ mơ hồ") must become "mastered".

CREATE TABLE vocabulary_reviews (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_vocabulary_id  BIGINT NOT NULL REFERENCES user_vocabulary(id) ON DELETE CASCADE,
  result              VARCHAR(20) NOT NULL
                        CHECK (result IN ('forgot','vague','remembered')),
  reviewed_at         TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_vr_progress ON vocabulary_reviews(user_vocabulary_id);
CREATE INDEX idx_vr_reviewed_at ON vocabulary_reviews(reviewed_at);

UPDATE user_vocabulary
SET status = 'mastered'
WHERE status = 'learning'
  AND interval_days >= 16;
