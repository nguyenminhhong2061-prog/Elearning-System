-- Seed content of module A (vocabulary): the system topics and words shown to every learner.
-- Words are inserted per topic with a CTE because ids are GENERATED ALWAYS (no fixed ids), so the seed also
-- works on a database that already has topics. System words have created_by NULL (see VocabularyService).
-- Generated from frontend/mock/vocabularyFixtures.js so that `npm run dev:mock` and the real API show the same data.

WITH topic AS (
  INSERT INTO topics (name, description) VALUES ('Kinh doanh', 'Từ vựng dùng trong công việc, doanh nghiệp và tài chính.') RETURNING id
)
INSERT INTO vocabulary (topic_id, word, phonetic, meaning, difficulty_level, example_sentence)
SELECT topic.id, w.word, w.phonetic, w.meaning, w.difficulty_level, w.example_sentence
FROM topic, (VALUES
  ('revenue', '/ˈrevənjuː/', 'doanh thu', 'B2', 'The company''s revenue grew by 20% last year.'),
  ('profit', '/ˈprɒfɪt/', 'lợi nhuận', 'B1', 'They made a small profit this quarter.'),
  ('leverage', '/ˈliːvərɪdʒ/', 'đòn bẩy, tận dụng', 'C1', 'They leveraged their network to close the deal.'),
  ('procurement', '/prəˈkjʊəmənt/', 'hoạt động mua sắm', 'C1', 'The procurement team negotiated a better price.'),
  ('negotiate', '/nɪˈɡəʊʃieɪt/', 'thương lượng, đàm phán', 'B2', 'We need to negotiate a new contract.'),
  ('contract', '/ˈkɒntrækt/', 'hợp đồng', 'B1', 'Please read the contract carefully before signing.'),
  ('invoice', '/ˈɪnvɔɪs/', 'hóa đơn', 'B2', 'The invoice must be paid within 30 days.'),
  ('budget', '/ˈbʌdʒɪt/', 'ngân sách', 'B1', 'The project is still within budget.'),
  ('investment', '/ɪnˈvestmənt/', 'khoản đầu tư', 'B1', 'Training staff is a good investment.'),
  ('shareholder', '/ˈʃeəhəʊldə/', 'cổ đông', 'B2', 'The shareholders approved the plan.'),
  ('merger', '/ˈmɜːdʒə/', 'sự sáp nhập', 'C1', 'The merger created the largest bank in the country.'),
  ('deadline', '/ˈdedlaɪn/', 'hạn chót', 'B1', 'The deadline for the report is Friday.'),
  ('entrepreneur', '/ˌɒntrəprəˈnɜː/', 'doanh nhân', 'B2', 'She became a successful entrepreneur at 25.'),
  ('customer', '/ˈkʌstəmə/', 'khách hàng', 'A2', 'The customer asked for a refund.'),
  ('salary', '/ˈsæləri/', 'tiền lương', 'A2', 'He earns a good salary.'),
  ('meeting', '/ˈmiːtɪŋ/', 'cuộc họp', 'A2', 'The meeting starts at nine.'),
  ('employee', '/ɪmˈplɔɪiː/', 'nhân viên', 'A2', 'The company has 200 employees.'),
  ('market', '/ˈmɑːkɪt/', 'thị trường', 'A2', 'The product sells well in the Asian market.'),
  ('strategy', '/ˈstrætədʒi/', 'chiến lược', 'B2', 'We need a new marketing strategy.'),
  ('competitor', '/kəmˈpetɪtə/', 'đối thủ cạnh tranh', 'B2', 'Our prices are lower than our competitors’.'),
  ('supplier', '/səˈplaɪə/', 'nhà cung cấp', 'B2', 'We changed our paper supplier.'),
  ('loan', '/ləʊn/', 'khoản vay', 'B1', 'They took out a loan to buy new machines.'),
  ('launch', '/lɔːntʃ/', 'ra mắt (sản phẩm)', 'B2', 'The new phone will launch next month.'),
  ('headquarters', '/ˌhedˈkwɔːtəz/', 'trụ sở chính', 'B2', 'The headquarters is in Hanoi.'),
  ('bankrupt', '/ˈbæŋkrʌpt/', 'phá sản', 'B2', 'The shop went bankrupt after two years.'),
  ('partnership', '/ˈpɑːtnəʃɪp/', 'quan hệ đối tác', 'B2', 'The two firms formed a partnership.')
) AS w (word, phonetic, meaning, difficulty_level, example_sentence);

WITH topic AS (
  INSERT INTO topics (name, description) VALUES ('Du lịch', 'Sân bay, khách sạn và những chuyến đi.') RETURNING id
)
INSERT INTO vocabulary (topic_id, word, phonetic, meaning, difficulty_level, example_sentence)
SELECT topic.id, w.word, w.phonetic, w.meaning, w.difficulty_level, w.example_sentence
FROM topic, (VALUES
  ('passport', '/ˈpɑːspɔːt/', 'hộ chiếu', 'A2', NULL),
  ('luggage', '/ˈlʌɡɪdʒ/', 'hành lý', 'A2', NULL),
  ('boarding pass', '/ˈbɔːdɪŋ pɑːs/', 'thẻ lên máy bay', 'B1', NULL),
  ('itinerary', '/aɪˈtɪnərəri/', 'lịch trình chuyến đi', 'B2', NULL),
  ('destination', '/ˌdestɪˈneɪʃn/', 'điểm đến', 'B1', NULL),
  ('accommodation', '/əˌkɒməˈdeɪʃn/', 'chỗ ở', 'B1', NULL),
  ('souvenir', '/ˌsuːvəˈnɪə/', 'quà lưu niệm', 'B1', NULL),
  ('departure', '/dɪˈpɑːtʃə/', 'sự khởi hành', 'B1', NULL),
  ('reservation', '/ˌrezəˈveɪʃn/', 'sự đặt chỗ', 'B1', NULL),
  ('sightseeing', '/ˈsaɪtsiːɪŋ/', 'tham quan', 'B1', NULL),
  ('check-in', '/ˈtʃek ɪn/', 'làm thủ tục (lên máy bay, nhận phòng)', 'A2', NULL),
  ('jet lag', '/ˈdʒet læɡ/', 'mệt mỏi do lệch múi giờ', 'B2', NULL)
) AS w (word, phonetic, meaning, difficulty_level, example_sentence);

WITH topic AS (
  INSERT INTO topics (name, description) VALUES ('Y tế', 'Sức khỏe, bệnh tật và khám chữa bệnh.') RETURNING id
)
INSERT INTO vocabulary (topic_id, word, phonetic, meaning, difficulty_level, example_sentence)
SELECT topic.id, w.word, w.phonetic, w.meaning, w.difficulty_level, w.example_sentence
FROM topic, (VALUES
  ('symptom', '/ˈsɪmptəm/', 'triệu chứng', 'B1', NULL),
  ('prescription', '/prɪˈskrɪpʃn/', 'đơn thuốc', 'B2', NULL),
  ('diagnosis', '/ˌdaɪəɡˈnəʊsɪs/', 'chẩn đoán', 'C1', NULL),
  ('fever', '/ˈfiːvə/', 'sốt', 'A2', NULL),
  ('headache', '/ˈhedeɪk/', 'đau đầu', 'A2', NULL),
  ('pharmacy', '/ˈfɑːməsi/', 'hiệu thuốc', 'B1', NULL),
  ('surgery', '/ˈsɜːdʒəri/', 'ca phẫu thuật', 'B2', NULL),
  ('vaccine', '/ˈvæksiːn/', 'vắc-xin', 'B2', NULL),
  ('injury', '/ˈɪndʒəri/', 'chấn thương', 'B1', NULL),
  ('recover', '/rɪˈkʌvə/', 'hồi phục', 'B1', NULL),
  ('allergy', '/ˈælədʒi/', 'dị ứng', 'B1', NULL),
  ('nutrition', '/njuˈtrɪʃn/', 'dinh dưỡng', 'B2', NULL)
) AS w (word, phonetic, meaning, difficulty_level, example_sentence);

WITH topic AS (
  INSERT INTO topics (name, description) VALUES ('Công nghệ', 'Máy tính, internet và thiết bị số.') RETURNING id
)
INSERT INTO vocabulary (topic_id, word, phonetic, meaning, difficulty_level, example_sentence)
SELECT topic.id, w.word, w.phonetic, w.meaning, w.difficulty_level, w.example_sentence
FROM topic, (VALUES
  ('software', '/ˈsɒftweə/', 'phần mềm', 'A2', NULL),
  ('device', '/dɪˈvaɪs/', 'thiết bị', 'B1', NULL),
  ('download', '/ˌdaʊnˈləʊd/', 'tải xuống', 'A2', NULL),
  ('password', '/ˈpɑːswɜːd/', 'mật khẩu', 'A2', NULL),
  ('network', '/ˈnetwɜːk/', 'mạng lưới', 'B1', NULL),
  ('database', '/ˈdeɪtəbeɪs/', 'cơ sở dữ liệu', 'B2', NULL),
  ('update', '/ˌʌpˈdeɪt/', 'cập nhật', 'B1', NULL),
  ('algorithm', '/ˈælɡərɪðəm/', 'thuật toán', 'C1', NULL),
  ('storage', '/ˈstɔːrɪdʒ/', 'bộ nhớ lưu trữ', 'B2', NULL),
  ('wireless', '/ˈwaɪələs/', 'không dây', 'B2', NULL),
  ('screen', '/skriːn/', 'màn hình', 'A2', NULL),
  ('artificial intelligence', '/ˌɑːtɪfɪʃl ɪnˈtelɪdʒəns/', 'trí tuệ nhân tạo', 'B2', NULL)
) AS w (word, phonetic, meaning, difficulty_level, example_sentence);

WITH topic AS (
  INSERT INTO topics (name, description) VALUES ('Giáo dục', 'Trường lớp, học tập và thi cử.') RETURNING id
)
INSERT INTO vocabulary (topic_id, word, phonetic, meaning, difficulty_level, example_sentence)
SELECT topic.id, w.word, w.phonetic, w.meaning, w.difficulty_level, w.example_sentence
FROM topic, (VALUES
  ('scholarship', '/ˈskɒləʃɪp/', 'học bổng', 'B2', NULL),
  ('curriculum', '/kəˈrɪkjələm/', 'chương trình giảng dạy', 'C1', NULL),
  ('lecture', '/ˈlektʃə/', 'bài giảng', 'B1', NULL),
  ('assignment', '/əˈsaɪnmənt/', 'bài tập được giao', 'B1', NULL),
  ('graduate', '/ˈɡrædʒuət/', 'người tốt nghiệp', 'B1', NULL),
  ('semester', '/sɪˈmestə/', 'học kỳ', 'B1', NULL),
  ('tuition', '/tjuˈɪʃn/', 'học phí', 'B2', NULL),
  ('thesis', '/ˈθiːsɪs/', 'luận văn', 'C1', NULL),
  ('exam', '/ɪɡˈzæm/', 'kỳ thi', 'A2', NULL),
  ('knowledge', '/ˈnɒlɪdʒ/', 'kiến thức', 'B1', NULL),
  ('classmate', '/ˈklɑːsmeɪt/', 'bạn cùng lớp', 'A1', NULL),
  ('library', '/ˈlaɪbrəri/', 'thư viện', 'A1', NULL)
) AS w (word, phonetic, meaning, difficulty_level, example_sentence);

INSERT INTO topics (name, description) VALUES ('Thể thao', 'Các môn thể thao và luyện tập.');
