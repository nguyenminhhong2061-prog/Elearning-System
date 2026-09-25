-- The three vocabulary games (A4, docs/api/games.md) and their question banks, built from the system words seeded by
-- V202609251600 and V202609251700: one question per word and game. A round draws its questions from the bank at random.
--
-- Choice games get the right option and three wrong ones taken from other words of the same topic (harder to guess
-- than words from anywhere). The wrong options are ordered by an md5 hash instead of random(), so every database
-- gets the same bank. WORD_MATCH questions only have their right option: the meanings to match.

INSERT INTO games (name, game_type, time_limit_seconds) VALUES
  ('Đoán nghĩa', 'GUESS_MEANING', 90),
  ('Trắc nghiệm nhanh', 'QUICK_QUIZ', 60),
  ('Ghép từ', 'WORD_MATCH', 60);

INSERT INTO game_questions (game_id, vocabulary_id, points)
SELECT g.id, v.id, 1
FROM games g
CROSS JOIN vocabulary v
WHERE v.created_by IS NULL
  AND v.topic_id IS NOT NULL
ORDER BY g.id, v.id;

-- The right option: the meaning, or the English word in QUICK_QUIZ (which shows the meaning).
INSERT INTO game_question_options (game_question_id, content, is_correct)
SELECT q.id, CASE WHEN g.game_type = 'QUICK_QUIZ' THEN v.word ELSE v.meaning END, TRUE
FROM game_questions q
JOIN games g ON g.id = q.game_id
JOIN vocabulary v ON v.id = q.vocabulary_id;

-- Three wrong options per question of the choice games.
INSERT INTO game_question_options (game_question_id, content, is_correct)
SELECT q.id, CASE WHEN g.game_type = 'QUICK_QUIZ' THEN d.word ELSE d.meaning END, FALSE
FROM game_questions q
JOIN games g ON g.id = q.game_id AND g.game_type <> 'WORD_MATCH'
JOIN vocabulary v ON v.id = q.vocabulary_id
CROSS JOIN LATERAL (
  SELECT o.word, o.meaning
  FROM vocabulary o
  WHERE o.topic_id = v.topic_id
    AND o.created_by IS NULL
    AND o.id <> v.id
    AND lower(o.word) <> lower(v.word)
    AND o.meaning <> v.meaning
  ORDER BY md5(q.id::text || '-' || o.id::text)
  LIMIT 3
) d;
