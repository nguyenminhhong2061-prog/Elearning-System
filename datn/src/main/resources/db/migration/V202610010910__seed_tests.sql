-- =====================================================================
-- Module C (Kiểm tra) — dữ liệu mẫu để demo.
-- Một đề định kỳ (trắc nghiệm + điền từ, chấm xong ngay) và một đề tổng
-- hợp (đủ 4 kỹ năng; câu Nói để "đang chấm" khi chưa có dịch vụ AI).
-- Dùng id tường minh để dễ đọc; reset sequence sau khi chèn.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Đề kiểm tra định kỳ (tự chấm ngay)
-- ---------------------------------------------------------------------
INSERT INTO tests (id, title, type, skill, start_date, end_date) OVERRIDING SYSTEM VALUE
VALUES (100, 'Kiểm tra định kỳ — tuần 40', 'PERIODIC', NULL, now() - interval '3 days', now() + interval '4 days');

INSERT INTO test_questions (id, test_id, question_type, skill, content, points, audio_url) OVERRIDING SYSTEM VALUE VALUES
  (1001, 100, 'MULTIPLE_CHOICE', 'reading', 'Choose the correct form: She ___ (live) in Hanoi for five years.', 1, NULL),
  (1002, 100, 'MULTIPLE_CHOICE', 'reading', 'Choose the correct form: If it ___ tomorrow, we will stay home.', 1, NULL),
  (1003, 100, 'FILL_BLANK', 'writing', 'I have never ___ (see) such a beautiful beach.', 1, NULL),
  (1004, 100, 'FILL_BLANK', 'writing', 'They ___ (go) to the cinema last night.', 1, NULL),
  (1005, 100, 'MULTIPLE_CHOICE', 'reading', 'Choose the correct word: She has worked here ___ 2010.', 1, NULL);

INSERT INTO test_question_options (id, question_id, content, is_correct) OVERRIDING SYSTEM VALUE VALUES
  (10001, 1001, 'lives', FALSE),
  (10002, 1001, 'has lived', TRUE),
  (10003, 1001, 'is living', FALSE),
  (10004, 1001, 'lived', FALSE),
  (10005, 1002, 'rains', TRUE),
  (10006, 1002, 'rained', FALSE),
  (10007, 1002, 'will rain', FALSE),
  (10008, 1002, 'raining', FALSE),
  (10009, 1005, 'since', TRUE),
  (10010, 1005, 'for', FALSE),
  (10011, 1005, 'during', FALSE),
  (10012, 1005, 'from', FALSE);

INSERT INTO test_question_accepted_answers (question_id, answer_text, normalized_answer, is_primary)
VALUES (1003, 'seen', 'seen', TRUE), (1004, 'went', 'went', TRUE);

-- ---------------------------------------------------------------------
-- 2. Đề kiểm tra tổng hợp (4 kỹ năng)
-- ---------------------------------------------------------------------
INSERT INTO tests (id, title, type, skill, start_date, end_date) OVERRIDING SYSTEM VALUE
VALUES (200, 'Kiểm tra tổng hợp tháng 9', 'COMPREHENSIVE', NULL, NULL, NULL);

INSERT INTO test_questions (id, test_id, question_type, skill, content, points, audio_url) OVERRIDING SYSTEM VALUE VALUES
  (2001, 200, 'LISTENING', 'listening',
   'Announcement: "Flight VN209 is now boarding at Gate 5. All passengers should proceed to the gate." Question: What should passengers do?',
   2, NULL),
  (2002, 200, 'READING', 'reading',
   'Read the text: "Hanoi is the capital of Vietnam. It is known for its Old Quarter and Hoan Kiem Lake." Question: What is Hanoi known for?',
   2, NULL),
  (2003, 200, 'WRITING', 'writing',
   'Complete the sentence with a reason: I stayed home ___ it was raining.',
   2, NULL),
  (2004, 200, 'SPEAKING', 'speaking',
   'Read this sentence aloud: "Sustainability is a shared responsibility."',
   5, NULL),
  (2005, 200, 'READING', 'reading',
   'Read the text: "The museum opens at 9 a.m. and closes at 5 p.m. every day except Monday." Question: When is the museum closed?',
   2, NULL);

INSERT INTO test_question_options (id, question_id, content, is_correct) OVERRIDING SYSTEM VALUE VALUES
  (20001, 2001, 'Go to Gate 5', TRUE),
  (20002, 2001, 'Wait at the check-in counter', FALSE),
  (20003, 2001, 'Collect luggage', FALSE),
  (20004, 2001, 'Leave the airport', FALSE),
  (20005, 2002, 'Its beaches', FALSE),
  (20006, 2002, 'Its Old Quarter and lake', TRUE),
  (20007, 2002, 'Its mountains', FALSE),
  (20008, 2002, 'Its desert', FALSE),
  (20009, 2005, 'Monday', TRUE),
  (20010, 2005, 'Tuesday', FALSE),
  (20011, 2005, 'Sunday', FALSE),
  (20012, 2005, 'Every day', FALSE);

INSERT INTO test_question_accepted_answers (question_id, answer_text, normalized_answer, is_primary)
VALUES (2003, 'because', 'because', TRUE);

-- ---------------------------------------------------------------------
-- Reset identity sequences (đã chèn id tường minh) để lần chèn sau không đụng.
-- ---------------------------------------------------------------------
SELECT setval(pg_get_serial_sequence('tests', 'id'), (SELECT MAX(id) FROM tests));
SELECT setval(pg_get_serial_sequence('test_questions', 'id'), (SELECT MAX(id) FROM test_questions));
SELECT setval(pg_get_serial_sequence('test_question_options', 'id'), (SELECT MAX(id) FROM test_question_options));
SELECT setval(pg_get_serial_sequence('test_question_accepted_answers', 'id'), (SELECT MAX(id) FROM test_question_accepted_answers));
