-- Extend the existing exercise module with AI-graded writing and long translation responses.
ALTER TABLE exercise_lessons DROP CONSTRAINT IF EXISTS exercise_lessons_skill_check;
ALTER TABLE exercise_lessons ADD CONSTRAINT exercise_lessons_skill_check
  CHECK (skill IN ('grammar','writing','listening','pronunciation'));

ALTER TABLE exercise_questions DROP CONSTRAINT IF EXISTS exercise_questions_question_type_check;
ALTER TABLE exercise_questions ADD CONSTRAINT exercise_questions_question_type_check
  CHECK (question_type IN ('multiple_choice','fill_blank','translation','rewrite','keyword_sentence','paragraph_translation'));
ALTER TABLE exercise_questions ALTER COLUMN question_type TYPE VARCHAR(30);
ALTER TABLE exercise_questions ADD COLUMN starter_text TEXT NULL;
ALTER TABLE exercise_questions ADD COLUMN reference_answer TEXT NULL;

ALTER TABLE question_responses ALTER COLUMN entered_answer TYPE TEXT;
ALTER TABLE question_responses ALTER COLUMN normalized_answer TYPE TEXT;
ALTER TABLE question_responses ALTER COLUMN is_correct DROP NOT NULL;
ALTER TABLE question_responses ALTER COLUMN awarded_points DROP NOT NULL;
ALTER TABLE question_responses ADD COLUMN graded BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE question_responses ADD COLUMN feedback TEXT NULL;
ALTER TABLE question_responses ADD COLUMN ai_explanation TEXT NULL;
ALTER TABLE question_responses ADD COLUMN sample_answers JSONB NULL;
ALTER TABLE question_responses ADD COLUMN ai_assessment JSONB NULL;

INSERT INTO exercise_lessons
  (slug, skill, title, description, topic, cefr_level, difficulty, estimated_minutes, publication_status, sort_order)
VALUES
  ('four-seasons-translation', 'writing', 'Dịch đoạn văn: Bốn mùa',
   'Dịch một đoạn văn tiếng Anh sang tiếng Việt; AI nhận xét theo tiêu chí và chỉ ra lỗi cụ thể.',
   'Thời tiết và các mùa', 'B1', 'medium', 12, 'published', 10)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO exercise_questions
  (lesson_id, code, question_type, prompt, hint_text, explanation, points, sort_order, reference_answer)
SELECT lesson.id, 'four-seasons-01', 'paragraph_translation',
       'The weather changes a lot in my country. We have four distinct seasons. In the winter, it is very cold. The temperature is often below zero, and we get a lot of snow. People wear heavy coats, hats, and gloves. After winter, spring arrives. The weather gets warmer, and the snow melts. It can be rainy in the spring, so you often need an umbrella. Then comes summer. Summer is my favorite season because it is hot and sunny. People go to the beach to swim and relax. The days are very long. After summer, autumn begins. The weather becomes cool again. It is often windy, and the leaves fall from the trees. Every season has its own special character. I like the variety. It is interesting to see how nature and people''s activities change with the weather. Today, the weather is sunny and warm, a perfect summer day.',
       'Ưu tiên truyền đạt đầy đủ ý và diễn đạt tiếng Việt tự nhiên; có thể đối chiếu từng mùa để không bỏ sót chi tiết.',
       NULL, 100, 10,
       'Thời tiết ở đất nước tôi thay đổi rất nhiều. Chúng tôi có bốn mùa rõ rệt. Vào mùa đông, trời rất lạnh. Nhiệt độ thường dưới không, và chúng tôi có rất nhiều tuyết. Mọi người mặc áo khoác dày, đội mũ và đeo găng tay. Sau mùa đông, mùa xuân đến. Thời tiết trở nên ấm hơn, và tuyết tan. Trời có thể mưa vào mùa xuân, vì vậy bạn thường cần một chiếc ô. Sau đó là mùa hè. Mùa hè là mùa yêu thích của tôi vì trời nóng và nắng. Mọi người đi biển để bơi và thư giãn. Ngày rất dài. Sau mùa hè, mùa thu bắt đầu. Thời tiết lại trở nên mát mẻ. Trời thường có gió, và lá rụng khỏi cây. Mỗi mùa đều có đặc điểm riêng. Tôi thích sự đa dạng này. Thật thú vị khi xem thiên nhiên và các hoạt động của con người thay đổi theo thời tiết như thế nào. Hôm nay, thời tiết nắng và ấm, một ngày hè hoàn hảo.'
FROM exercise_lessons lesson
WHERE lesson.slug = 'four-seasons-translation'
ON CONFLICT (lesson_id, code) DO NOTHING;
