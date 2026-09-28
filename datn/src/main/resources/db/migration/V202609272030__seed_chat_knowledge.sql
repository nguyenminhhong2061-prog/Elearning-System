-- Initial grounded knowledge for the three seed lessons. Later content migrations can add more chunks.
INSERT INTO knowledge_chunks (source_key, source_title, lesson_id, question_id, content, metadata)
SELECT
  'lesson:present-simple-basics',
  'Ngữ pháp: thì hiện tại đơn',
  l.id,
  NULL,
  'Thì hiện tại đơn diễn tả thói quen, sự thật và lịch trình. Với chủ ngữ he, she hoặc it, động từ thường thêm s hoặc es. Với I, you, we và they, dùng động từ nguyên mẫu.',
  '{"language":"vi","kind":"grammar_rule"}'::jsonb
FROM exercise_lessons l
WHERE l.slug = 'present-simple-basics'
ON CONFLICT (source_key) DO NOTHING;

INSERT INTO knowledge_chunks (source_key, source_title, lesson_id, question_id, content, metadata)
SELECT
  'question:present-simple:ps-01',
  'Giải thích: ngôi thứ ba số ít',
  q.lesson_id,
  q.id,
  'Trong câu "She goes to school every day", chủ ngữ she là ngôi thứ ba số ít nên động từ go đổi thành goes.',
  '{"language":"vi","kind":"answer_explanation"}'::jsonb
FROM exercise_questions q
JOIN exercise_lessons l ON l.id = q.lesson_id
WHERE l.slug = 'present-simple-basics' AND q.code = 'ps-01'
ON CONFLICT (source_key) DO NOTHING;

INSERT INTO knowledge_chunks (source_key, source_title, lesson_id, question_id, content, metadata)
SELECT
  'lesson:airport-conversation',
  'Nghe hiểu: hội thoại tại sân bay',
  l.id,
  NULL,
  'Khi nghe thông tin sân bay, cần phân biệt số quầy, số cổng và thời gian. Đọc câu hỏi trước khi nghe, ghi lại từ khóa và kiểm tra xem con số nghe được chỉ thời gian hay địa điểm.',
  '{"language":"vi","kind":"listening_tip"}'::jsonb
FROM exercise_lessons l
WHERE l.slug = 'airport-conversation'
ON CONFLICT (source_key) DO NOTHING;

INSERT INTO knowledge_chunks (source_key, source_title, lesson_id, question_id, content, metadata)
SELECT
  'lesson:everyday-pronunciation',
  'Phát âm giao tiếp hằng ngày',
  l.id,
  NULL,
  'Khi luyện phát âm, chú ý trọng âm, vị trí lưỡi và so sánh âm đọc với IPA. Với âm /θ/ trong "thank", đặt nhẹ đầu lưỡi giữa hai hàm răng và đẩy luồng hơi ra ngoài.',
  '{"language":"vi","kind":"pronunciation_tip"}'::jsonb
FROM exercise_lessons l
WHERE l.slug = 'everyday-pronunciation'
ON CONFLICT (source_key) DO NOTHING;
