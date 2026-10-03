-- Module A games (docs/api/games.md), following scenario 8 and the design ("Lượt chơi trò chơi", Design tbl_game_play):
-- a round takes its words from a topic or a personal list, chosen by the player, and is dealt from those words when it
-- starts, instead of from the question bank of V202609252100. A finished round now records where its words came from,
-- the right answers out of the questions and the time played.
--
-- The bank tables (game_questions, game_question_options, game_session_answers) are no longer written or read. They
-- are kept, with their data, until the team agrees to drop them.

ALTER TABLE game_sessions
  ADD COLUMN topic_id          BIGINT NULL REFERENCES topics(id) ON DELETE SET NULL,
  ADD COLUMN custom_list_id    BIGINT NULL REFERENCES custom_vocabulary_lists(id) ON DELETE SET NULL,
  ADD COLUMN correct_count     INT NULL,
  ADD COLUMN question_count    INT NULL,
  ADD COLUMN duration_seconds  INT NULL;

-- Rounds played before: their counts come from their answers; their time played is unknown and stays NULL.
UPDATE game_sessions s
SET correct_count = a.correct,
    question_count = a.total
FROM (
  SELECT session_id, count(*) FILTER (WHERE is_correct) AS correct, count(*) AS total
  FROM game_session_answers
  GROUP BY session_id
) a
WHERE a.session_id = s.id;

UPDATE game_sessions SET correct_count = 0, question_count = 0 WHERE correct_count IS NULL;

ALTER TABLE game_sessions
  ALTER COLUMN correct_count SET NOT NULL,
  ALTER COLUMN question_count SET NOT NULL,
  ADD CONSTRAINT chk_gs_one_source CHECK (topic_id IS NULL OR custom_list_id IS NULL),
  ADD CONSTRAINT chk_gs_counts CHECK (correct_count >= 0 AND correct_count <= question_count),
  ADD CONSTRAINT chk_gs_duration CHECK (duration_seconds IS NULL OR duration_seconds >= 0);

CREATE INDEX idx_gs_topic ON game_sessions(topic_id);
CREATE INDEX idx_gs_list ON game_sessions(custom_list_id);
