-- Module A (docs/api/custom-lists.md), following the design (Design/Database.md: UNIQUE (learner_id, name) on
-- tbl_custom_list) and scenario 7, branch 11a: two lists of one learner cannot share a name, ignoring case. The service
-- already refuses it with 409; the index also stops two requests that arrive at the same time (two tabs).
--
-- Lists created before the rule may already share a name: every one but the oldest gets its id appended, which is
-- unique, so the index can be created on any database.

UPDATE custom_vocabulary_lists l
SET name = left(l.name, 150 - length(' (' || l.id || ')')) || ' (' || l.id || ')'
FROM (
  SELECT id, row_number() OVER (PARTITION BY user_id, lower(name) ORDER BY id) AS position
  FROM custom_vocabulary_lists
) ranked
WHERE ranked.id = l.id
  AND ranked.position > 1;

CREATE UNIQUE INDEX uq_cvl_user_name ON custom_vocabulary_lists (user_id, lower(name));
