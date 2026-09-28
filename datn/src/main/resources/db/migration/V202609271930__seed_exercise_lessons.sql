-- Small real dataset for Module B. More lesson content can be added in later migrations.
INSERT INTO exercise_lessons
  (slug, skill, title, description, topic, cefr_level, difficulty, estimated_minutes, publication_status, sort_order)
VALUES
  ('present-simple-basics', 'grammar', 'Thì hiện tại đơn',
   'Cách dùng thì hiện tại đơn trong thói quen và sự thật.', 'Thì của động từ', 'A1', 'easy', 5, 'published', 10),
  ('airport-conversation', 'listening', 'Hội thoại tại sân bay',
   'Nghe hội thoại và tìm thông tin chuyến bay.', 'Du lịch', 'A2', 'medium', 6, 'published', 10),
  ('everyday-pronunciation', 'pronunciation', 'Phát âm giao tiếp hằng ngày',
   'Luyện các từ và cụm từ thường dùng.', 'Giao tiếp', 'A1', 'easy', 4, 'published', 10);

INSERT INTO exercise_questions (lesson_id, code, question_type, prompt, hint_text, explanation, points, sort_order)
VALUES
  ((SELECT id FROM exercise_lessons WHERE slug = 'present-simple-basics'), 'ps-01', 'multiple_choice',
   'She ___ to school every day.', 'Chủ ngữ ngôi thứ ba số ít.',
   'Với she/he/it ở hiện tại đơn, động từ thường thêm s hoặc es.', 1, 10),
  ((SELECT id FROM exercise_lessons WHERE slug = 'present-simple-basics'), 'ps-02', 'fill_blank',
   'They ___ (play) football on Sundays.', NULL,
   'Chủ ngữ they dùng động từ nguyên mẫu: play.', 1, 20),
  ((SELECT id FROM exercise_lessons WHERE slug = 'airport-conversation'), 'airport-01', 'multiple_choice',
   'Quầy làm thủ tục là quầy số mấy?', NULL,
   'Trong hội thoại, nhân viên nói: counter number twelve.', 1, 10),
  ((SELECT id FROM exercise_lessons WHERE slug = 'airport-conversation'), 'airport-02', 'fill_blank',
   'Mấy giờ bắt đầu lên máy bay? (viết dạng 9:45)', NULL,
   'Boarding starts at nine forty-five.', 1, 20);

INSERT INTO question_options (question_id, option_key, option_text, is_correct, sort_order)
VALUES
  ((SELECT id FROM exercise_questions WHERE code = 'ps-01'), 'A', 'go', FALSE, 10),
  ((SELECT id FROM exercise_questions WHERE code = 'ps-01'), 'B', 'goes', TRUE, 20),
  ((SELECT id FROM exercise_questions WHERE code = 'ps-01'), 'C', 'going', FALSE, 30),
  ((SELECT id FROM exercise_questions WHERE code = 'airport-01'), 'A', '2', FALSE, 10),
  ((SELECT id FROM exercise_questions WHERE code = 'airport-01'), 'B', '12', TRUE, 20),
  ((SELECT id FROM exercise_questions WHERE code = 'airport-01'), 'C', '20', FALSE, 30);

INSERT INTO question_accepted_answers (question_id, answer_text, normalized_answer, is_primary)
VALUES
  ((SELECT id FROM exercise_questions WHERE code = 'ps-02'), 'play', 'play', TRUE),
  ((SELECT id FROM exercise_questions WHERE code = 'airport-02'), '9:45', '9:45', TRUE),
  ((SELECT id FROM exercise_questions WHERE code = 'airport-02'), 'nine forty-five', 'nine forty-five', FALSE);

INSERT INTO listening_passages (lesson_id, title, audio_uri, duration_ms, full_transcript_en, full_translation_vi)
VALUES (
  (SELECT id FROM exercise_lessons WHERE slug = 'airport-conversation'),
  'Hội thoại tại sân bay', '/media/listening/airport.mp3', 18000,
  'The check-in counter is number twelve. Boarding starts at nine forty-five.',
  'Quầy làm thủ tục là quầy số mười hai. Việc lên máy bay bắt đầu lúc chín giờ bốn mươi lăm.'
);

INSERT INTO listening_segments
  (passage_id, segment_order, start_ms, end_ms, speaker_label, transcript_en, translation_vi)
VALUES
  ((SELECT id FROM listening_passages WHERE lesson_id =
      (SELECT id FROM exercise_lessons WHERE slug = 'airport-conversation')),
   1, 0, 8500, 'Nhân viên', 'The check-in counter is number twelve.',
   'Quầy làm thủ tục là quầy số mười hai.'),
  ((SELECT id FROM listening_passages WHERE lesson_id =
      (SELECT id FROM exercise_lessons WHERE slug = 'airport-conversation')),
   2, 9000, 18000, 'Nhân viên', 'Boarding starts at nine forty-five.',
   'Việc lên máy bay bắt đầu lúc chín giờ bốn mươi lăm.');

INSERT INTO pronunciation_items (lesson_id, sort_order, reference_text, ipa, reference_audio_uri, notes)
VALUES
  ((SELECT id FROM exercise_lessons WHERE slug = 'everyday-pronunciation'), 10,
   'hello', '/həˈləʊ/', NULL, 'Nhấn âm tiết thứ hai.'),
  ((SELECT id FROM exercise_lessons WHERE slug = 'everyday-pronunciation'), 20,
   'thank you', '/ˈθæŋk juː/', NULL, 'Đặt đầu lưỡi giữa hai hàm răng khi đọc âm /θ/.');
