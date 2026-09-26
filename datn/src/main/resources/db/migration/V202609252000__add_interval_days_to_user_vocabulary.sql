-- Spaced repetition step of a word for one learner, stored as the days until the next review (1, 3, 7, 14 or 30,
-- see docs/api/learning.md). The step cannot be derived from the other columns because "forgot" resets it.
-- NULL until the word has been reviewed once.
ALTER TABLE user_vocabulary
  ADD COLUMN interval_days INT NULL CHECK (interval_days > 0);
