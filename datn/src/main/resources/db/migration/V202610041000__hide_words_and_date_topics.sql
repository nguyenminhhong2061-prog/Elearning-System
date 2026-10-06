-- Module A, admin rules of docs/api/admin.md (scenarios 19–22), following the design (tbl_vocabulary.status,
-- tbl_topic.updated_date):
--
-- 1. A word learners study, keep in a list or that a test question uses is hidden instead of deleted, so that its
--    progress and history stay (scenario 21). Learners no longer meet a hidden word anywhere.
-- 2. "Cập nhật" column of the topic and word tables: when an admin last changed them (NULL for seeded rows).
-- 3. No two topics with the same name, and no two visible system words with the same text in one topic, both ignoring
--    case (scenarios 20 and 22). The service checks first; the indexes also stop two admins saving at the same time.

ALTER TABLE vocabulary
  ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'visible'
    CHECK (status IN ('visible', 'hidden')),
  ADD COLUMN updated_at TIMESTAMPTZ NULL;

ALTER TABLE topics
  ADD COLUMN updated_at TIMESTAMPTZ NULL;

-- Databases where an admin already saved a duplicate through the API: keep the first one as it is.
UPDATE topics t
SET name = left(t.name, 140) || ' (' || t.id || ')'
WHERE EXISTS (
  SELECT 1 FROM topics older
  WHERE lower(btrim(older.name)) = lower(btrim(t.name)) AND older.id < t.id
);

-- Same for words: the later copy is hidden rather than deleted, so nobody's progress is lost.
UPDATE vocabulary v
SET status = 'hidden'
WHERE v.created_by IS NULL
  AND v.topic_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM vocabulary older
    WHERE older.created_by IS NULL
      AND older.topic_id = v.topic_id
      AND lower(btrim(older.word)) = lower(btrim(v.word))
      AND older.id < v.id
  );

CREATE UNIQUE INDEX uq_topics_name ON topics (lower(btrim(name)));

CREATE UNIQUE INDEX uq_vocabulary_topic_word ON vocabulary (topic_id, lower(btrim(word)))
  WHERE created_by IS NULL AND topic_id IS NOT NULL AND status = 'visible';

CREATE INDEX idx_vocab_status ON vocabulary (status);
