-- Server-side grading assumes one saved answer per question in an attempt.
ALTER TABLE question_responses
  ADD CONSTRAINT uq_question_responses_attempt_question UNIQUE (attempt_id, question_id);

-- A retry number is unique for one pronunciation item inside one attempt.
ALTER TABLE pronunciation_attempts
  ADD CONSTRAINT uq_pronunciation_attempt_try
  UNIQUE (attempt_id, pronunciation_item_id, try_number);

-- PostgreSQL partial unique index: at most one unfinished attempt per learner and lesson.
CREATE UNIQUE INDEX uq_exercise_attempt_in_progress
  ON exercise_attempts(user_id, lesson_id)
  WHERE status = 'in_progress';
