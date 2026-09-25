-- More seed content for module A, so that every topic has 20 to 30 words (8 topics, 180 words in total with
-- V202609251600). This content goes beyond frontend/mock/vocabularyFixtures.js, which keeps its smaller set because
-- the frontend tests rely on it.
-- A new migration instead of an edit of V202609251600: Flyway refuses to start when a migration that already ran
-- has changed.
-- Existing topics are found by name (their ids are generated); nothing is inserted if one has been renamed.

-- Du lịch: 12 → 22 words
INSERT INTO vocabulary (topic_id, word, phonetic, meaning, difficulty_level, example_sentence)
SELECT topic.id, w.word, w.phonetic, w.meaning, w.difficulty_level, w.example_sentence
FROM (SELECT min(id) AS id FROM topics WHERE name = 'Du lịch') AS topic, (VALUES
  ('ticket', '/ˈtɪkɪt/', 'vé', 'A1', 'I bought a train ticket to Hue.'),
  ('hotel', '/həʊˈtel/', 'khách sạn', 'A1', 'We stayed at a small hotel near the beach.'),
  ('map', '/mæp/', 'bản đồ', 'A1', 'Can you show me where we are on the map?'),
  ('flight', '/flaɪt/', 'chuyến bay', 'A2', 'Our flight was delayed by two hours.'),
  ('tourist', '/ˈtʊərɪst/', 'khách du lịch', 'A2', 'The old town is full of tourists in summer.'),
  ('guide', '/ɡaɪd/', 'hướng dẫn viên', 'A2', 'Our guide spoke excellent English.'),
  ('journey', '/ˈdʒɜːni/', 'hành trình, chuyến đi', 'A2', 'The journey from Hanoi to Sapa takes six hours.'),
  ('abroad', '/əˈbrɔːd/', 'ở nước ngoài', 'A2', 'She wants to study abroad next year.'),
  ('customs', '/ˈkʌstəmz/', 'hải quan', 'B1', 'It took an hour to get through customs.'),
  ('delay', '/dɪˈleɪ/', 'sự trì hoãn', 'B1', 'There was a long delay because of the storm.')
) AS w (word, phonetic, meaning, difficulty_level, example_sentence)
WHERE topic.id IS NOT NULL;

-- Y tế: 12 → 22 words
INSERT INTO vocabulary (topic_id, word, phonetic, meaning, difficulty_level, example_sentence)
SELECT topic.id, w.word, w.phonetic, w.meaning, w.difficulty_level, w.example_sentence
FROM (SELECT min(id) AS id FROM topics WHERE name = 'Y tế') AS topic, (VALUES
  ('doctor', '/ˈdɒktə/', 'bác sĩ', 'A1', 'You should see a doctor about that cough.'),
  ('hospital', '/ˈhɒspɪtl/', 'bệnh viện', 'A1', 'He was taken to hospital after the accident.'),
  ('nurse', '/nɜːs/', 'y tá', 'A1', 'The nurse checked my temperature.'),
  ('medicine', '/ˈmedsn/', 'thuốc', 'A2', 'Take this medicine three times a day.'),
  ('pain', '/peɪn/', 'cơn đau', 'A2', 'I have a pain in my back.'),
  ('cough', '/kɒf/', 'ho, cơn ho', 'B1', 'She has had a bad cough for a week.'),
  ('patient', '/ˈpeɪʃnt/', 'bệnh nhân', 'B1', 'The doctor sees about thirty patients a day.'),
  ('treatment', '/ˈtriːtmənt/', 'sự điều trị', 'B1', 'The treatment lasted six weeks.'),
  ('disease', '/dɪˈziːz/', 'bệnh tật', 'B1', 'Heart disease is common in older people.'),
  ('blood pressure', '/ˈblʌd preʃə/', 'huyết áp', 'B2', 'Regular exercise can lower your blood pressure.')
) AS w (word, phonetic, meaning, difficulty_level, example_sentence)
WHERE topic.id IS NOT NULL;

-- Công nghệ: 12 → 22 words
INSERT INTO vocabulary (topic_id, word, phonetic, meaning, difficulty_level, example_sentence)
SELECT topic.id, w.word, w.phonetic, w.meaning, w.difficulty_level, w.example_sentence
FROM (SELECT min(id) AS id FROM topics WHERE name = 'Công nghệ') AS topic, (VALUES
  ('computer', '/kəmˈpjuːtə/', 'máy tính', 'A1', 'I use my computer for work and study.'),
  ('email', '/ˈiːmeɪl/', 'thư điện tử', 'A1', 'Please send me an email with the details.'),
  ('website', '/ˈwebsaɪt/', 'trang web', 'A2', 'You can book tickets on our website.'),
  ('keyboard', '/ˈkiːbɔːd/', 'bàn phím', 'A2', 'The keyboard on this laptop is very quiet.'),
  ('app', '/æp/', 'ứng dụng', 'A2', 'This app helps you learn new words every day.'),
  ('online', '/ˌɒnˈlaɪn/', 'trực tuyến', 'A2', 'More and more people shop online.'),
  ('battery', '/ˈbætri/', 'pin', 'B1', 'My phone battery is almost empty.'),
  ('upload', '/ˌʌpˈləʊd/', 'tải lên', 'B1', 'Upload your photos to the cloud to keep them safe.'),
  ('digital', '/ˈdɪdʒɪtl/', 'kỹ thuật số', 'B1', 'Most photos today are digital.'),
  ('privacy', '/ˈprɪvəsi/', 'quyền riêng tư', 'B2', 'Read the privacy policy before you sign up.')
) AS w (word, phonetic, meaning, difficulty_level, example_sentence)
WHERE topic.id IS NOT NULL;

-- Giáo dục: 12 → 22 words
INSERT INTO vocabulary (topic_id, word, phonetic, meaning, difficulty_level, example_sentence)
SELECT topic.id, w.word, w.phonetic, w.meaning, w.difficulty_level, w.example_sentence
FROM (SELECT min(id) AS id FROM topics WHERE name = 'Giáo dục') AS topic, (VALUES
  ('teacher', '/ˈtiːtʃə/', 'giáo viên', 'A1', 'Our teacher gives us homework every day.'),
  ('student', '/ˈstjuːdnt/', 'học sinh, sinh viên', 'A1', 'There are thirty students in my class.'),
  ('homework', '/ˈhəʊmwɜːk/', 'bài tập về nhà', 'A1', 'Have you finished your homework?'),
  ('subject', '/ˈsʌbdʒɪkt/', 'môn học', 'A1', 'Maths is my favourite subject.'),
  ('university', '/ˌjuːnɪˈvɜːsəti/', 'trường đại học', 'A1', 'She studies law at university.'),
  ('research', '/rɪˈsɜːtʃ/', 'nghiên cứu', 'A2', 'She is doing research on climate change.'),
  ('vocabulary', '/vəˈkæbjələri/', 'từ vựng', 'A2', 'Reading helps you learn new vocabulary.'),
  ('degree', '/dɪˈɡriː/', 'bằng cấp', 'B1', 'He has a degree in computer science.'),
  ('certificate', '/səˈtɪfɪkət/', 'chứng chỉ', 'B1', 'You will get a certificate at the end of the course.'),
  ('revise', '/rɪˈvaɪz/', 'ôn tập', 'B1', 'I need to revise for my exam next week.')
) AS w (word, phonetic, meaning, difficulty_level, example_sentence)
WHERE topic.id IS NOT NULL;

-- Thể thao: 0 → 22 words
INSERT INTO vocabulary (topic_id, word, phonetic, meaning, difficulty_level, example_sentence)
SELECT topic.id, w.word, w.phonetic, w.meaning, w.difficulty_level, w.example_sentence
FROM (SELECT min(id) AS id FROM topics WHERE name = 'Thể thao') AS topic, (VALUES
  ('football', '/ˈfʊtbɔːl/', 'bóng đá', 'A1', 'They play football every Sunday.'),
  ('swimming', '/ˈswɪmɪŋ/', 'bơi lội', 'A1', 'Swimming is good exercise for your whole body.'),
  ('team', '/tiːm/', 'đội', 'A1', 'Our team won the match.'),
  ('player', '/ˈpleɪə/', 'cầu thủ, người chơi', 'A1', 'He is the best player on the team.'),
  ('win', '/wɪn/', 'thắng', 'A1', 'We hope to win the next game.'),
  ('exercise', '/ˈeksəsaɪz/', 'tập thể dục', 'A1', 'I exercise for 30 minutes every morning.'),
  ('lose', '/luːz/', 'thua', 'A2', 'Nobody likes to lose.'),
  ('match', '/mætʃ/', 'trận đấu', 'A2', 'The match starts at seven.'),
  ('score', '/skɔː/', 'ghi bàn, ghi điểm', 'A2', 'She scored two goals in the final.'),
  ('goal', '/ɡəʊl/', 'bàn thắng', 'A2', 'That was a fantastic goal!'),
  ('stadium', '/ˈsteɪdiəm/', 'sân vận động', 'A2', 'The stadium holds 40,000 people.'),
  ('gym', '/dʒɪm/', 'phòng tập thể hình', 'A2', 'He goes to the gym after work.'),
  ('coach', '/kəʊtʃ/', 'huấn luyện viên', 'B1', 'The coach told us to run faster.'),
  ('champion', '/ˈtʃæmpiən/', 'nhà vô địch', 'B1', 'She became world champion at 19.'),
  ('referee', '/ˌrefəˈriː/', 'trọng tài', 'B1', 'The referee stopped the game.'),
  ('athlete', '/ˈæθliːt/', 'vận động viên', 'B1', 'Athletes train for years before the Olympics.'),
  ('competition', '/ˌkɒmpəˈtɪʃn/', 'cuộc thi', 'B1', 'She entered a swimming competition.'),
  ('training', '/ˈtreɪnɪŋ/', 'sự luyện tập', 'B1', 'Training starts at six in the morning.'),
  ('medal', '/ˈmedl/', 'huy chương', 'B1', 'He won a gold medal at the SEA Games.'),
  ('tournament', '/ˈtʊənəmənt/', 'giải đấu', 'B2', 'The tournament lasts two weeks.'),
  ('opponent', '/əˈpəʊnənt/', 'đối thủ', 'B2', 'She beat her opponent in straight sets.'),
  ('stamina', '/ˈstæmɪnə/', 'sức bền', 'C1', 'Marathon runners need a lot of stamina.')
) AS w (word, phonetic, meaning, difficulty_level, example_sentence)
WHERE topic.id IS NOT NULL;

-- Đời sống hằng ngày (new topic): 22 words
WITH topic AS (
  INSERT INTO topics (name, description) VALUES ('Đời sống hằng ngày', 'Sinh hoạt, mua sắm và việc nhà mỗi ngày.') RETURNING id
)
INSERT INTO vocabulary (topic_id, word, phonetic, meaning, difficulty_level, example_sentence)
SELECT topic.id, w.word, w.phonetic, w.meaning, w.difficulty_level, w.example_sentence
FROM topic, (VALUES
  ('breakfast', '/ˈbrekfəst/', 'bữa sáng', 'A1', 'I usually have breakfast at seven.'),
  ('kitchen', '/ˈkɪtʃɪn/', 'nhà bếp', 'A1', 'My mother is cooking in the kitchen.'),
  ('shopping', '/ˈʃɒpɪŋ/', 'việc mua sắm', 'A1', 'We go shopping on Saturdays.'),
  ('neighbour', '/ˈneɪbə/', 'hàng xóm', 'A2', 'Our neighbours are very friendly.'),
  ('bill', '/bɪl/', 'hóa đơn', 'A2', 'Have you paid the electricity bill?'),
  ('traffic', '/ˈtræfɪk/', 'giao thông', 'A2', 'The traffic is terrible in the morning.'),
  ('furniture', '/ˈfɜːnɪtʃə/', 'đồ nội thất', 'A2', 'We bought some new furniture for the living room.'),
  ('tidy', '/ˈtaɪdi/', 'gọn gàng', 'A2', 'Please keep your room tidy.'),
  ('borrow', '/ˈbɒrəʊ/', 'mượn', 'A2', 'Can I borrow your umbrella?'),
  ('electricity', '/ɪˌlekˈtrɪsəti/', 'điện', 'A2', 'The electricity went off during the storm.'),
  ('rent', '/rent/', 'tiền thuê nhà', 'B1', 'The rent is due at the end of the month.'),
  ('appointment', '/əˈpɔɪntmənt/', 'cuộc hẹn', 'B1', 'I have a dentist appointment at three.'),
  ('routine', '/ruːˈtiːn/', 'thói quen hằng ngày', 'B1', 'Exercise is part of my daily routine.'),
  ('housework', '/ˈhaʊswɜːk/', 'việc nhà', 'B1', 'We share the housework equally.'),
  ('recipe', '/ˈresəpi/', 'công thức nấu ăn', 'B1', 'This recipe is easy to follow.'),
  ('receipt', '/rɪˈsiːt/', 'biên lai', 'B1', 'Keep the receipt in case you need to return it.'),
  ('queue', '/kjuː/', 'hàng người xếp hàng', 'B1', 'There was a long queue at the bank.'),
  ('bargain', '/ˈbɑːɡən/', 'món hời', 'B1', 'This jacket was a real bargain.'),
  ('neighbourhood', '/ˈneɪbəhʊd/', 'khu phố', 'B1', 'It is a quiet neighbourhood with lots of trees.'),
  ('laundry', '/ˈlɔːndri/', 'việc giặt giũ, đồ cần giặt', 'B2', 'I do the laundry on Sundays.'),
  ('commute', '/kəˈmjuːt/', 'đi lại hằng ngày (đi làm, đi học)', 'B2', 'I commute to work by bus.'),
  ('groceries', '/ˈɡrəʊsəriz/', 'thực phẩm, hàng tạp hóa', 'B2', 'I buy groceries at the market near my house.')
) AS w (word, phonetic, meaning, difficulty_level, example_sentence);

-- Môi trường (new topic): 22 words
WITH topic AS (
  INSERT INTO topics (name, description) VALUES ('Môi trường', 'Thiên nhiên, khí hậu và bảo vệ môi trường.') RETURNING id
)
INSERT INTO vocabulary (topic_id, word, phonetic, meaning, difficulty_level, example_sentence)
SELECT topic.id, w.word, w.phonetic, w.meaning, w.difficulty_level, w.example_sentence
FROM topic, (VALUES
  ('environment', '/ɪnˈvaɪrənmənt/', 'môi trường', 'A2', 'We must protect the environment.'),
  ('recycle', '/ˌriːˈsaɪkl/', 'tái chế', 'A2', 'We recycle paper and plastic bottles.'),
  ('rubbish', '/ˈrʌbɪʃ/', 'rác', 'A2', 'Please put your rubbish in the bin.'),
  ('forest', '/ˈfɒrɪst/', 'rừng', 'A2', 'The forest is home to many animals.'),
  ('plastic', '/ˈplæstɪk/', 'nhựa', 'A2', 'Try to use less plastic every day.'),
  ('energy', '/ˈenədʒi/', 'năng lượng', 'A2', 'Turn off the lights to save energy.'),
  ('protect', '/prəˈtekt/', 'bảo vệ', 'A2', 'We need laws to protect our rivers.'),
  ('natural', '/ˈnætʃrəl/', 'tự nhiên', 'A2', 'The country is rich in natural resources.'),
  ('pollution', '/pəˈluːʃn/', 'sự ô nhiễm', 'B1', 'Air pollution is a serious problem in big cities.'),
  ('climate', '/ˈklaɪmət/', 'khí hậu', 'B1', 'The climate here is hot and humid.'),
  ('flood', '/flʌd/', 'lũ lụt', 'B1', 'The flood destroyed hundreds of homes.'),
  ('wildlife', '/ˈwaɪldlaɪf/', 'động vật hoang dã', 'B1', 'The national park is full of wildlife.'),
  ('waste', '/weɪst/', 'chất thải', 'B1', 'Factories produce a lot of waste.'),
  ('global warming', '/ˌɡləʊbl ˈwɔːmɪŋ/', 'sự nóng lên toàn cầu', 'B1', 'Global warming is causing sea levels to rise.'),
  ('earthquake', '/ˈɜːθkweɪk/', 'động đất', 'B1', 'The earthquake was felt 200 km away.'),
  ('drought', '/draʊt/', 'hạn hán', 'B2', 'The drought killed most of the crops.'),
  ('renewable', '/rɪˈnjuːəbl/', 'có thể tái tạo', 'B2', 'Solar power is a renewable source of energy.'),
  ('endangered', '/ɪnˈdeɪndʒəd/', 'có nguy cơ tuyệt chủng', 'B2', 'Tigers are an endangered species.'),
  ('sustainable', '/səˈsteɪnəbl/', 'bền vững', 'B2', 'We need a more sustainable way of living.'),
  ('conservation', '/ˌkɒnsəˈveɪʃn/', 'sự bảo tồn', 'B2', 'The group works on wildlife conservation.'),
  ('emission', '/iˈmɪʃn/', 'khí thải, sự phát thải', 'C1', 'Cars are a major source of carbon emissions.'),
  ('deforestation', '/ˌdiːˌfɒrɪˈsteɪʃn/', 'nạn phá rừng', 'C1', 'Deforestation destroys the homes of many animals.')
) AS w (word, phonetic, meaning, difficulty_level, example_sentence);
