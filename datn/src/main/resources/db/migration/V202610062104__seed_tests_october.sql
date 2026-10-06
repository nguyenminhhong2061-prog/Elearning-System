-- =====================================================================
-- Module C (Kiểm tra) — thêm hai đề mẫu dùng đủ các dạng câu hỏi hiện có:
--   101: kiểm tra định kỳ (mở 30 ngày kể từ lúc migration chạy)
--   201: kiểm tra tổng hợp 4 kỹ năng, câu hỏi gắn bậc CEFR
-- Mỗi đề có ngữ liệu dùng chung (test_passages), câu Nói đọc theo câu mẫu
-- (reference_text, chấm bằng OpenPronounce) và câu Nói, Viết mở (AI chấm).
-- Dùng id tường minh cho đề, ngữ liệu, câu hỏi; reset sequence ở cuối.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Đề kiểm tra định kỳ
-- ---------------------------------------------------------------------
INSERT INTO tests (id, title, type, skill, start_date, end_date) OVERRIDING SYSTEM VALUE
VALUES (101, 'Kiểm tra định kỳ — tuần 41', 'PERIODIC', NULL, now() - interval '1 day', now() + interval '30 days');

INSERT INTO test_passages (id, test_id, title, content, audio_url, transcript) OVERRIDING SYSTEM VALUE VALUES
  (1011, 101, 'A note from a neighbour',
   'Hi Lan, I am away from Friday to Sunday. Could you water the plants on my balcony on Saturday morning? The key is under the blue flowerpot. Please don''t give the cat any milk. It makes her ill. Thank you! Mai',
   NULL, NULL);

INSERT INTO test_questions (id, test_id, passage_id, question_type, skill, level, content, points, reference_text)
OVERRIDING SYSTEM VALUE VALUES
  (1101, 101, 1011, 'READING', 'reading', 'A2', 'When is Mai away?', 1, NULL),
  (1102, 101, 1011, 'READING', 'reading', 'A2', 'What does Mai ask Lan to do?', 1, NULL),
  (1103, 101, 1011, 'READING', 'reading', 'A2', 'Why should Lan not give the cat milk?', 1, NULL),
  (1104, 101, NULL, 'MULTIPLE_CHOICE', 'reading', 'A2', 'Choose the correct form: My brother ___ football every weekend.', 1, NULL),
  (1105, 101, NULL, 'MULTIPLE_CHOICE', 'reading', 'B1', 'Choose the correct form: If I ___ more time, I would learn another language.', 1, NULL),
  (1106, 101, NULL, 'MULTIPLE_CHOICE', 'reading', 'B1', 'Choose the correct word: The film was ___ boring that we left early.', 1, NULL),
  (1107, 101, NULL, 'FILL_BLANK', 'writing', 'A2', 'Yesterday we ___ (go) to the market.', 1, NULL),
  (1108, 101, NULL, 'FILL_BLANK', 'writing', 'B1', 'She has ___ (write) three emails this morning.', 1, NULL),
  (1109, 101, NULL, 'WRITING', 'writing', 'B1',
   'Write 40-60 words about what you usually do at the weekend. Say what you do, who you do it with, and why you enjoy it.',
   6, NULL),
  (1110, 101, NULL, 'SPEAKING', 'speaking', 'A2', 'Read the sentence aloud.', 3,
   'I usually have breakfast at seven o''clock.'),
  (1111, 101, NULL, 'SPEAKING', 'speaking', 'B1',
   'Talk about your favourite food. What is it, how often do you eat it, and why do you like it? Answer in 3-5 sentences.',
   6, NULL);

INSERT INTO test_question_options (question_id, content, is_correct) VALUES
  (1101, 'From Friday to Sunday', TRUE),
  (1101, 'Only on Saturday', FALSE),
  (1101, 'From Monday to Friday', FALSE),
  (1101, 'For the whole week', FALSE),
  (1102, 'Water the plants', TRUE),
  (1102, 'Give the cat some milk', FALSE),
  (1102, 'Buy a blue flowerpot', FALSE),
  (1102, 'Clean the balcony', FALSE),
  (1103, 'It makes her ill', TRUE),
  (1103, 'She does not like it', FALSE),
  (1103, 'There is no milk in the house', FALSE),
  (1103, 'Mai will bring some on Sunday', FALSE),
  (1104, 'plays', TRUE),
  (1104, 'play', FALSE),
  (1104, 'playing', FALSE),
  (1104, 'is play', FALSE),
  (1105, 'had', TRUE),
  (1105, 'have', FALSE),
  (1105, 'will have', FALSE),
  (1105, 'would have', FALSE),
  (1106, 'so', TRUE),
  (1106, 'such', FALSE),
  (1106, 'too', FALSE),
  (1106, 'very', FALSE);

INSERT INTO test_question_accepted_answers (question_id, answer_text, normalized_answer, is_primary) VALUES
  (1107, 'went', 'went', TRUE),
  (1108, 'written', 'written', TRUE);

-- ---------------------------------------------------------------------
-- 2. Đề kiểm tra tổng hợp (Nghe, Đọc, Viết, Nói)
-- Bài nghe dùng file mẫu duy nhất đang có trên R2 (media/listening/airport.mp3),
-- nên phần Nghe mới đo được tới bậc A2.
-- ---------------------------------------------------------------------
INSERT INTO tests (id, title, type, skill, start_date, end_date) OVERRIDING SYSTEM VALUE
VALUES (201, 'Kiểm tra tổng hợp tháng 10', 'COMPREHENSIVE', NULL, NULL, NULL);

INSERT INTO test_passages (id, test_id, title, content, audio_url, transcript) OVERRIDING SYSTEM VALUE VALUES
  (2011, 201, 'At the airport', NULL, '/media/r2/media/listening/airport.mp3',
   'The check-in counter is number twelve. Boarding starts at nine forty-five.'),
  (2012, 201, 'City Library',
   'City Library is open from 8 a.m. to 6 p.m., Monday to Saturday. It is closed on Sundays and public holidays. You need a library card to borrow books. A card is free for students.',
   NULL, NULL),
  (2013, 201, 'An email about a course',
   'Dear Mr Tran, Thank you for your interest in the weekend photography course. The course runs for six Saturdays, starting on 7 November. Because the group is small, we can accept only twelve people, and eight places are already taken. You do not need your own camera for the first lesson, but you will need one from the second week. Please pay the fee before 1 November to keep your place. Best regards, Hoa',
   NULL, NULL),
  (2014, 201, 'Working from home',
   'Many companies now let employees work from home for part of the week. Supporters argue that people save hours of travelling and can concentrate better without the noise of an open office. Critics, however, point out that new staff learn less when they rarely meet experienced colleagues, and that the line between work and private life becomes blurred. Recent surveys suggest that most workers prefer a mixture: two or three days in the office for meetings and teamwork, and the rest at home for tasks that need quiet.',
   NULL, NULL),
  (2015, 201, 'Technology and productivity',
   'It is tempting to assume that technology inevitably makes us more productive, yet the evidence is far from conclusive. Each new tool promises to save time, but the time saved is frequently swallowed by the additional demands the tool itself creates: messages multiply because they are effortless to send, and reports lengthen because they are easy to produce. What looks like efficiency at the level of a single task may therefore conceal a loss at the level of the whole working day. The more useful question is not whether a tool is faster, but whether it changes what we choose to do with our attention.',
   NULL, NULL);

INSERT INTO test_questions (id, test_id, passage_id, question_type, skill, level, content, points, reference_text)
OVERRIDING SYSTEM VALUE VALUES
  -- Nghe
  (2101, 201, 2011, 'LISTENING', 'listening', 'A2', 'Which check-in counter should the passenger go to?', 1, NULL),
  (2102, 201, 2011, 'LISTENING', 'listening', 'A2', 'What time does boarding start?', 1, NULL),
  -- Đọc: A2
  (2103, 201, 2012, 'READING', 'reading', 'A2', 'When is the library closed?', 1, NULL),
  (2104, 201, 2012, 'READING', 'reading', 'A2', 'What do you need to borrow books?', 1, NULL),
  (2105, 201, 2012, 'READING', 'reading', 'A2', 'Who can get a library card for free?', 1, NULL),
  -- Đọc: B1
  (2106, 201, 2013, 'READING', 'reading', 'B1', 'How many places on the course are still available?', 1, NULL),
  (2107, 201, 2013, 'READING', 'reading', 'B1', 'When does Mr Tran need his own camera?', 1, NULL),
  (2108, 201, 2013, 'READING', 'reading', 'B1', 'What must Mr Tran do to keep his place?', 1, NULL),
  -- Đọc: B2
  (2109, 201, 2014, 'READING', 'reading', 'B2', 'According to supporters, what is one advantage of working from home?', 1, NULL),
  (2110, 201, 2014, 'READING', 'reading', 'B2', 'What worries critics about new staff?', 1, NULL),
  (2111, 201, 2014, 'READING', 'reading', 'B2', 'What do recent surveys say most workers prefer?', 1, NULL),
  -- Đọc: C1
  (2112, 201, 2015, 'READING', 'reading', 'C1', 'What is the writer''s main point?', 1, NULL),
  (2113, 201, 2015, 'READING', 'reading', 'C1', 'According to the text, why do messages multiply?', 1, NULL),
  (2114, 201, 2015, 'READING', 'reading', 'C1', 'What does "conceal a loss at the level of the whole working day" suggest?', 1, NULL),
  -- Viết: điền từ, rồi hai bài viết mở
  (2115, 201, NULL, 'FILL_BLANK', 'writing', 'A2', 'There ___ (be) two cats in the garden now.', 1, NULL),
  (2116, 201, NULL, 'FILL_BLANK', 'writing', 'B1', 'I have lived in this city ___ 2019.', 1, NULL),
  (2117, 201, NULL, 'WRITING', 'writing', 'B1',
   'You missed your English class yesterday. Write an email to your teacher (60-80 words). Say why you were absent, ask what you missed, and say when you will hand in your homework.',
   6, NULL),
  (2118, 201, NULL, 'WRITING', 'writing', 'B2',
   'Some people think students should learn practical skills such as cooking and managing money at school. Do you agree? Write 100-150 words and give reasons for your opinion.',
   6, NULL),
  -- Nói: ba câu đọc theo câu mẫu, rồi hai câu hỏi mở
  (2119, 201, NULL, 'SPEAKING', 'speaking', 'A2', 'Read the sentence aloud.', 3,
   'My sister works in a small hospital near the river.'),
  (2120, 201, NULL, 'SPEAKING', 'speaking', 'B1', 'Read the sentence aloud.', 3,
   'I would like to book a table for four people at half past seven.'),
  (2121, 201, NULL, 'SPEAKING', 'speaking', 'B2', 'Read the sentence aloud.', 3,
   'Although the weather was terrible, thousands of people attended the outdoor concert.'),
  (2122, 201, NULL, 'SPEAKING', 'speaking', 'B1',
   'Describe your hometown. Where is it, what is it like, and what do you like most about it? Answer in 4-6 sentences.',
   6, NULL),
  (2123, 201, NULL, 'SPEAKING', 'speaking', 'B2',
   'Do you think people spend too much time on their phones? Give your opinion with two reasons and an example. Answer in 5-7 sentences.',
   6, NULL);

INSERT INTO test_question_options (question_id, content, is_correct) VALUES
  (2101, 'Counter 12', TRUE),
  (2101, 'Counter 2', FALSE),
  (2101, 'Counter 20', FALSE),
  (2101, 'Counter 22', FALSE),
  (2102, '9:45', TRUE),
  (2102, '9:15', FALSE),
  (2102, '9:54', FALSE),
  (2102, '10:45', FALSE),
  (2103, 'On Sundays and public holidays', TRUE),
  (2103, 'On Saturdays', FALSE),
  (2103, 'Every afternoon', FALSE),
  (2103, 'On Mondays', FALSE),
  (2104, 'A library card', TRUE),
  (2104, 'A student book', FALSE),
  (2104, 'Some money', FALSE),
  (2104, 'A passport', FALSE),
  (2105, 'Students', TRUE),
  (2105, 'Teachers', FALSE),
  (2105, 'Everyone', FALSE),
  (2105, 'Children under six', FALSE),
  (2106, 'Four', TRUE),
  (2106, 'Six', FALSE),
  (2106, 'Eight', FALSE),
  (2106, 'Twelve', FALSE),
  (2107, 'From the second week', TRUE),
  (2107, 'For the first lesson', FALSE),
  (2107, 'Before 1 November', FALSE),
  (2107, 'He never needs one', FALSE),
  (2108, 'Pay the fee before 1 November', TRUE),
  (2108, 'Buy a camera before the course starts', FALSE),
  (2108, 'Come to the first lesson early', FALSE),
  (2108, 'Find eleven other students', FALSE),
  (2109, 'People can concentrate better', TRUE),
  (2109, 'New staff learn more quickly', FALSE),
  (2109, 'Meetings become shorter', FALSE),
  (2109, 'Offices become quieter', FALSE),
  (2110, 'They learn less because they rarely meet experienced colleagues', TRUE),
  (2110, 'They spend too many hours travelling', FALSE),
  (2110, 'They cannot concentrate at home', FALSE),
  (2110, 'They are paid less than other staff', FALSE),
  (2111, 'A mixture of days in the office and days at home', TRUE),
  (2111, 'Working in the office every day', FALSE),
  (2111, 'Working from home every day', FALSE),
  (2111, 'Shorter working days', FALSE),
  (2112, 'Faster tools do not necessarily make people more productive', TRUE),
  (2112, 'Technology always saves time in the end', FALSE),
  (2112, 'Companies should stop buying new tools', FALSE),
  (2112, 'Reports ought to be longer and more detailed', FALSE),
  (2113, 'Because sending them takes almost no effort', TRUE),
  (2113, 'Because managers ask for more of them', FALSE),
  (2113, 'Because reports have become shorter', FALSE),
  (2113, 'Because people have more free time', FALSE),
  (2114, 'A gain on one task may hide a cost over the whole day', TRUE),
  (2114, 'Workers lose their jobs to new technology', FALSE),
  (2114, 'Companies hide their financial losses', FALSE),
  (2114, 'Single tasks take longer than before', FALSE);

INSERT INTO test_question_accepted_answers (question_id, answer_text, normalized_answer, is_primary) VALUES
  (2115, 'are', 'are', TRUE),
  (2116, 'since', 'since', TRUE);

-- ---------------------------------------------------------------------
-- Reset identity sequences (đã chèn id tường minh) để lần chèn sau không đụng.
-- ---------------------------------------------------------------------
SELECT setval(pg_get_serial_sequence('tests', 'id'), (SELECT MAX(id) FROM tests));
SELECT setval(pg_get_serial_sequence('test_passages', 'id'), (SELECT MAX(id) FROM test_passages));
SELECT setval(pg_get_serial_sequence('test_questions', 'id'), (SELECT MAX(id) FROM test_questions));
