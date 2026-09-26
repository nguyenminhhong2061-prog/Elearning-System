// Sample lessons of module B for `npm run dev:mock` (docs/api/exercises.md). Unlike the API, questions here carry their
// answers (correctOptionId, accepted) and explanations; the mock strips them before sending a lesson. Lesson titles
// follow the design. The backend's seed migration can reuse this content.

const KEYS = 'ABCD'

function choice(id, prompt, options, correctIndex, explanation, hint = null) {
  return {
    id,
    type: 'MULTIPLE_CHOICE',
    prompt,
    hint,
    points: 1,
    options: options.map((text, index) => ({ id: id * 10 + index + 1, key: KEYS[index], text })),
    correctOptionId: id * 10 + correctIndex + 1,
    accepted: [],
    explanation,
  }
}

function blank(id, prompt, accepted, explanation, hint = null) {
  return { id, type: 'FILL_BLANK', prompt, hint, points: 1, options: [], correctOptionId: null, accepted, explanation }
}

function segments(lessonId, rows) {
  return rows.map(([startMs, endMs, speaker, transcript, translation], index) => ({
    id: lessonId * 100 + index + 1,
    order: index + 1,
    startMs,
    endMs,
    speaker,
    transcript,
    translation,
  }))
}

function items(lessonId, rows) {
  return rows.map(([text, ipa, notes], index) => ({ id: lessonId * 100 + index + 1, text, ipa, audioUrl: null, notes }))
}

const lesson = (fields) => ({ description: null, topic: null, questions: [], passage: null, pronunciationItems: [], ...fields })

export const MOCK_LESSONS = [
  // Grammar
  lesson({
    id: 1,
    skill: 'GRAMMAR',
    title: 'Thì hiện tại đơn',
    description: 'Thói quen, sự thật hiển nhiên và cách chia động từ với ngôi thứ ba số ít.',
    topic: 'Thì của động từ',
    cefrLevel: 'A1',
    difficulty: 'EASY',
    estimatedMinutes: 5,
    questions: [
      choice(101, 'She ___ to school every day.', ['go', 'goes', 'going', 'gone'], 1, 'Chủ ngữ ngôi thứ ba số ít (she, he, it) thì động từ ở thì hiện tại đơn thêm -s hoặc -es: goes.', 'Chủ ngữ là "She".'),
      choice(102, 'They ___ like coffee.', ["don't", "doesn't", "isn't", "aren't"], 0, 'Phủ định của thì hiện tại đơn với I, you, we, they: do not (don’t) + động từ nguyên mẫu.'),
      blank(103, 'Water ___ (boil) at 100 degrees Celsius.', ['boils'], 'Sự thật hiển nhiên dùng thì hiện tại đơn; chủ ngữ số ít nên boil thêm -s.'),
      choice(104, '___ your brother play football?', ['Do', 'Does', 'Is', 'Are'], 1, 'Câu hỏi với chủ ngữ ngôi thứ ba số ít: Does + chủ ngữ + động từ nguyên mẫu.'),
      blank(105, 'My father ___ (watch) the news every evening.', ['watches'], 'Động từ tận cùng bằng -ch, -sh, -s, -x, -o thêm -es: watches.'),
    ],
  }),
  lesson({
    id: 2,
    skill: 'GRAMMAR',
    title: 'Mạo từ a, an, the',
    description: 'Chọn a hay an theo âm đầu, và khi nào dùng the.',
    topic: 'Mạo từ',
    cefrLevel: 'A2',
    difficulty: 'EASY',
    estimatedMinutes: 5,
    questions: [
      choice(201, 'I saw ___ elephant at the zoo.', ['a', 'an', 'the'], 1, 'Dùng an trước từ bắt đầu bằng một nguyên âm: elephant /ˈelɪfənt/.'),
      choice(202, 'She is ___ university student.', ['a', 'an', 'the'], 0, 'university đọc là /ˌjuːnɪˈvɜːsəti/, bắt đầu bằng âm /j/ (phụ âm) nên dùng a. Chọn a hay an theo âm đọc, không theo chữ cái.', 'Để ý cách đọc chữ "u" ở đầu từ.'),
      choice(203, '___ sun rises in the east.', ['A', 'An', 'The'], 2, 'Vật duy nhất (the sun, the moon, the earth) luôn dùng the.'),
      blank(204, 'He is ___ honest man.', ['an'], 'Chữ h trong honest là âm câm, từ bắt đầu bằng nguyên âm /ɒ/ nên dùng an.'),
      choice(205, 'Can you close ___ door, please?', ['a', 'an', 'the'], 2, 'Cánh cửa cụ thể mà cả người nói và người nghe đều biết nên dùng the.'),
    ],
  }),
  lesson({
    id: 3,
    skill: 'GRAMMAR',
    title: 'Thì hiện tại hoàn thành',
    description: 'Hành động bắt đầu trong quá khứ và còn liên quan tới hiện tại; phân biệt với quá khứ đơn.',
    topic: 'Thì của động từ',
    cefrLevel: 'B1',
    difficulty: 'MEDIUM',
    estimatedMinutes: 8,
    questions: [
      choice(301, 'She ___ (live) in Hanoi for five years.', ['lives', 'has lived', 'is living', 'lived'], 1, '"has lived": thì hiện tại hoàn thành diễn tả hành động bắt đầu trong quá khứ và kéo dài tới hiện tại. "for five years" là dấu hiệu nhận biết.', 'Có "for five years": hành động kéo dài tới bây giờ.'),
      blank(302, 'I have never ___ (see) such a beautiful beach.', ['seen'], 'Sau have hoặc has dùng quá khứ phân từ (V3): see → seen.'),
      choice(303, 'We ___ each other since 2019.', ['know', 'knew', 'have known', 'are knowing'], 2, '"since + mốc thời gian" đi với thì hiện tại hoàn thành. know là động từ chỉ trạng thái nên không dùng dạng tiếp diễn.'),
      choice(304, '___ you ever been to Japan?', ['Did', 'Have', 'Were', 'Do'], 1, '"Have you ever + V3?" hỏi về trải nghiệm từ trước tới nay.'),
      choice(305, 'He ___ his keys yesterday, so he couldn’t get in.', ['has lost', 'lost', 'loses', 'has been losing'], 1, 'Có mốc thời gian đã kết thúc (yesterday) thì dùng quá khứ đơn, không dùng hiện tại hoàn thành.', 'Chú ý từ "yesterday".'),
      blank(306, 'They have just ___ (finish) their homework.', ['finished'], '"have just + V3": hành động vừa mới xong. finish → finished.'),
    ],
  }),
  lesson({
    id: 4,
    skill: 'GRAMMAR',
    title: 'Câu điều kiện loại 2',
    description: 'Giả định không có thật ở hiện tại: If + quá khứ đơn, would + động từ nguyên mẫu.',
    topic: 'Câu điều kiện',
    cefrLevel: 'B1',
    difficulty: 'MEDIUM',
    estimatedMinutes: 6,
    questions: [
      choice(401, 'If I ___ rich, I would travel around the world.', ['am', 'will be', 'were', 'be'], 2, 'Mệnh đề if của câu điều kiện loại 2 dùng quá khứ đơn; với to be, văn viết chuẩn dùng were cho mọi ngôi.'),
      choice(402, 'If she studied harder, she ___ the exam.', ['will pass', 'would pass', 'passes', 'passed'], 1, 'Mệnh đề chính của câu điều kiện loại 2: would + động từ nguyên mẫu.'),
      blank(403, 'What would you do if you ___ (win) the lottery?', ['won'], 'Mệnh đề if dùng quá khứ đơn: win → won.'),
      choice(404, 'I would call him if I ___ his number.', ['know', 'knew', 'had known', 'will know'], 1, 'Tình huống không có thật ở hiện tại (thực tế là tôi không biết số): If + quá khứ đơn.'),
    ],
  }),
  lesson({
    id: 5,
    skill: 'GRAMMAR',
    title: 'Câu bị động',
    description: 'Bị động ở các thì thường gặp: be + quá khứ phân từ.',
    topic: 'Câu bị động',
    cefrLevel: 'B2',
    difficulty: 'HARD',
    estimatedMinutes: 8,
    questions: [
      choice(501, 'The report ___ by the manager tomorrow.', ['will check', 'will be checked', 'is checking', 'checked'], 1, 'Bị động ở tương lai đơn: will be + V3.'),
      choice(502, 'This bridge ___ in 1995.', ['built', 'was built', 'has built', 'is building'], 1, 'Bị động ở quá khứ đơn: was/were + V3; 1995 là mốc thời gian đã qua.'),
      blank(503, 'English is ___ (speak) in many countries.', ['spoken'], 'Bị động ở hiện tại đơn: am/is/are + V3: speak → spoken.'),
      choice(504, 'The new road ___ at the moment.', ['is being built', 'is built', 'has been building', 'builds'], 0, 'Bị động ở hiện tại tiếp diễn: am/is/are being + V3; "at the moment" là dấu hiệu.'),
      blank(505, 'The letters have already been ___ (send).', ['sent'], 'Bị động ở hiện tại hoàn thành: have/has been + V3: send → sent.'),
    ],
  }),
  lesson({
    id: 6,
    skill: 'GRAMMAR',
    title: 'Đảo ngữ với trạng từ phủ định',
    description: 'Never, rarely, not only, hardly… đứng đầu câu thì đảo trợ động từ lên trước chủ ngữ.',
    topic: 'Cấu trúc câu',
    cefrLevel: 'C1',
    difficulty: 'HARD',
    estimatedMinutes: 7,
    questions: [
      choice(601, 'Never ___ such a beautiful sunset.', ['I have seen', 'have I seen', 'I saw', 'did I saw'], 1, 'Trạng từ phủ định (never, rarely, seldom) đứng đầu câu thì đảo trợ động từ lên trước chủ ngữ: have I seen.', 'Trạng từ phủ định đứng đầu câu.'),
      choice(602, 'Not only ___ late, but he also forgot the documents.', ['he was', 'was he', 'he is', 'is he'], 1, '"Not only" đứng đầu câu kéo theo đảo ngữ: was he.'),
      blank(603, 'Rarely ___ (do) we see such dedication.', ['do'], 'Rarely + do/does/did + chủ ngữ + động từ nguyên mẫu. Chủ ngữ là "we" nên dùng do.'),
      choice(604, 'Hardly had we arrived ___ it started to rain.', ['than', 'when', 'then', 'that'], 1, 'Cấu trúc cố định: Hardly/Scarcely + had + chủ ngữ + V3 + when + quá khứ đơn.'),
      blank(605, 'Only after the meeting ___ (she / realize) her mistake.', ['did she realize', 'did she realise'], '"Only after + cụm từ" đứng đầu câu thì mệnh đề chính đảo ngữ: did she realize.'),
      // No hint and no explanation: the feedback box shows only the verdict.
      choice(606, 'Seldom ___ he complain about his work.', ['does', 'do', 'is', 'has'], 0, null),
    ],
  }),
  lesson({
    id: 7,
    skill: 'GRAMMAR',
    title: 'Thức giả định',
    description: 'Insist that he submit, it is essential that…, wish, if only.',
    topic: 'Thức giả định',
    cefrLevel: 'C2',
    difficulty: 'HARD',
    estimatedMinutes: 6,
    questions: [
      choice(701, 'The committee insisted that he ___ the report by Friday.', ['submits', 'submit', 'submitted', 'will submit'], 1, 'Sau insist, demand, recommend, suggest (that) dùng động từ nguyên mẫu không "to" cho mọi ngôi: he submit.'),
      choice(702, 'It is essential that every student ___ on time.', ['be', 'is', 'was', 'will be'], 0, 'Sau "It is essential/vital/important that" dùng dạng nguyên mẫu: be.'),
      blank(703, 'I wish I ___ (know) the answer right now.', ['knew'], 'Wish cho điều không có thật ở hiện tại: wish + quá khứ đơn: knew.'),
      choice(704, 'If only she ___ told me earlier!', ['has', 'had', 'would', 'did'], 1, '"If only + quá khứ hoàn thành" diễn tả tiếc nuối về quá khứ: had told.'),
      // A long prompt, to see how questions and answers wrap.
      choice(705, 'Had the government invested more heavily in renewable energy two decades ago, the country ___ so dependent on imported fuel today.', ['would not be', 'would not have been', 'will not be', 'is not'], 0, 'Câu điều kiện hỗn hợp: đảo ngữ "Had + chủ ngữ + V3" (điều kiện trong quá khứ), kết quả ở hiện tại (today): would not be.', 'Chú ý "two decades ago" và "today".'),
    ],
  }),

  // Listening
  lesson({
    id: 11,
    skill: 'LISTENING',
    title: 'Hội thoại tại sân bay',
    description: 'Hỏi đường tới quầy làm thủ tục và giờ lên máy bay.',
    topic: 'Du lịch',
    cefrLevel: 'A2',
    difficulty: 'MEDIUM',
    estimatedMinutes: 6,
    passage: {
      title: 'Hội thoại tại sân bay',
      durationMs: 29_000,
      segments: segments(11, [
        [0, 5500, 'Hành khách', 'Excuse me, could you tell me where the check-in counter for flight VN209 is?', 'Xin lỗi, bạn có thể cho tôi biết quầy làm thủ tục cho chuyến bay VN209 ở đâu không?'],
        [6000, 11500, 'Nhân viên', 'Of course. It’s counter number twelve, right next to the information desk.', 'Tất nhiên rồi. Đó là quầy số mười hai, ngay cạnh quầy thông tin.'],
        [12000, 16500, 'Hành khách', 'Thank you. And what time does boarding start?', 'Cảm ơn. Vậy mấy giờ bắt đầu lên máy bay?'],
        [17000, 23500, 'Nhân viên', 'Boarding starts at nine forty-five at gate five. Please be there fifteen minutes early.', 'Lên máy bay lúc chín giờ bốn mươi lăm tại cổng số năm. Vui lòng có mặt sớm mười lăm phút.'],
        [24000, 28000, 'Hành khách', 'Great, thanks for your help!', 'Tuyệt, cảm ơn vì đã giúp đỡ!'],
      ]),
    },
    questions: [
      choice(1101, 'Người nói cần tìm gì?', ['Quầy làm thủ tục', 'Cổng lên máy bay', 'Khu vực hành lý'], 0, 'Câu đầu tiên: "where the check-in counter … is". Check-in counter là quầy làm thủ tục.'),
      choice(1102, 'Quầy làm thủ tục là quầy số mấy?', ['2', '12', '20'], 1, '"It’s counter number twelve": quầy số 12.'),
      choice(1103, 'Hành khách lên máy bay ở cổng nào?', ['Cổng 5', 'Cổng 9', 'Cổng 15'], 0, '"Boarding starts at nine forty-five at gate five": nine forty-five là giờ (9:45), gate five là cổng 5.'),
      blank(1104, 'Mấy giờ bắt đầu lên máy bay? (viết dạng 9:45)', ['9:45', '9.45', '9h45', 'nine forty-five'], '"Boarding starts at nine forty-five": 9 giờ 45.'),
    ],
  }),
  lesson({
    id: 12,
    skill: 'LISTENING',
    title: 'Cuộc gọi công việc',
    description: 'Gọi điện tới một công ty và để lại lời nhắn.',
    topic: 'Công việc',
    cefrLevel: 'A2',
    difficulty: 'EASY',
    estimatedMinutes: 4,
    passage: {
      title: 'Cuộc gọi công việc',
      durationMs: 24_000,
      segments: segments(12, [
        [0, 4500, 'Linda', 'Good morning, ABC Company. Linda speaking. How can I help you?', 'Chào buổi sáng, công ty ABC. Linda nghe đây. Tôi có thể giúp gì cho anh?'],
        [5000, 10500, 'Tom', 'Hi Linda, this is Tom from Green Office. I’d like to speak to Mr. Brown, please.', 'Chào Linda, tôi là Tom từ Green Office. Tôi muốn nói chuyện với ông Brown.'],
        [11000, 17000, 'Linda', 'I’m sorry, he’s in a meeting until three o’clock. Would you like to leave a message?', 'Xin lỗi, ông ấy họp đến ba giờ. Anh có muốn để lại lời nhắn không?'],
        [17500, 23000, 'Tom', 'Yes, please ask him to call me back this afternoon.', 'Vâng, nhờ chị bảo ông ấy gọi lại cho tôi chiều nay.'],
      ]),
    },
    questions: [
      choice(1201, 'Tom muốn nói chuyện với ai?', ['Linda', 'Ông Brown', 'Ông Green'], 1, '"I’d like to speak to Mr. Brown".'),
      choice(1202, 'Vì sao ông Brown không nghe máy được?', ['Ông ấy đang họp', 'Ông ấy đi công tác', 'Ông ấy đang ăn trưa'], 0, '"he’s in a meeting until three o’clock": ông ấy họp đến 3 giờ.'),
      choice(1203, 'Tom nhờ Linda làm gì?', ['Gửi email cho ông Brown', 'Nhắn ông Brown gọi lại', 'Đặt lịch họp mới'], 1, '"please ask him to call me back this afternoon".'),
    ],
  }),
  lesson({
    id: 13,
    skill: 'LISTENING',
    title: 'Bản tin thời sự',
    description: 'Bản tin ngắn về lũ lụt và kế hoạch trồng cây.',
    topic: 'Tin tức',
    cefrLevel: 'B2',
    difficulty: 'HARD',
    estimatedMinutes: 6,
    passage: {
      title: 'Bản tin thời sự',
      durationMs: 28_000,
      segments: segments(13, [
        [0, 7000, 'Phát thanh viên', 'Good evening. Here is the news. Heavy rain has caused flooding in several northern provinces since Monday.', 'Chào buổi tối. Sau đây là bản tin. Mưa lớn đã gây ngập lụt ở nhiều tỉnh phía Bắc từ thứ Hai.'],
        [7500, 14000, 'Phát thanh viên', 'More than two thousand families have been moved to safer areas, and schools will remain closed until Friday.', 'Hơn hai nghìn hộ gia đình đã được di dời tới nơi an toàn, và các trường học sẽ tiếp tục đóng cửa đến thứ Sáu.'],
        [14500, 21000, 'Phát thanh viên', 'Meanwhile, the government has announced a new plan to plant one billion trees by 2030.', 'Trong khi đó, chính phủ đã công bố kế hoạch trồng một tỷ cây xanh đến năm 2030.'],
        [21500, 27000, 'Phát thanh viên', 'Experts say the trees will help reduce the risk of floods in the future.', 'Các chuyên gia cho rằng số cây này sẽ giúp giảm nguy cơ lũ lụt trong tương lai.'],
      ]),
    },
    questions: [
      choice(1301, 'Mưa lớn gây ngập lụt từ khi nào?', ['Chủ nhật', 'Thứ Hai', 'Thứ Sáu'], 1, '"since Monday": từ thứ Hai. Thứ Sáu là ngày trường học mở cửa lại.'),
      blank(1302, 'Hơn bao nhiêu hộ gia đình đã được di dời? (ghi bằng số)', ['2000', '2,000', '2.000', 'two thousand'], '"More than two thousand families have been moved": hơn 2.000 hộ.'),
      choice(1303, 'Kế hoạch mới của chính phủ là gì?', ['Xây thêm trường học', 'Trồng một tỷ cây xanh', 'Xây đê chống lũ'], 1, '"a new plan to plant one billion trees by 2030".'),
    ],
  }),
  lesson({
    id: 14,
    skill: 'LISTENING',
    title: 'Bài giảng ngắn về giấc ngủ',
    description: 'Một người nói (không có tên người nói), 9 đoạn: thử phụ đề dài và cột bài nghe cuộn riêng trên màn rộng.',
    topic: 'Sức khỏe',
    cefrLevel: 'C1',
    difficulty: 'HARD',
    estimatedMinutes: 8,
    passage: {
      title: 'Bài giảng ngắn về giấc ngủ',
      durationMs: 56_000,
      segments: segments(14, [
        [0, 5500, null, 'Today I’d like to talk about something we all do, but rarely think about: sleep.', 'Hôm nay tôi muốn nói về một việc ai cũng làm nhưng hiếm khi nghĩ tới: giấc ngủ.'],
        [6000, 12000, null, 'Most adults need between seven and nine hours of sleep every night to function well.', 'Phần lớn người trưởng thành cần ngủ từ bảy đến chín tiếng mỗi đêm để hoạt động tốt.'],
        [12500, 18500, null, 'However, surveys show that nearly a third of people regularly sleep less than six hours.', 'Tuy nhiên, các khảo sát cho thấy gần một phần ba số người thường xuyên ngủ ít hơn sáu tiếng.'],
        [19000, 25000, null, 'During deep sleep, the brain sorts the information collected during the day and stores the important parts.', 'Trong giấc ngủ sâu, não sắp xếp thông tin thu được trong ngày và lưu lại những phần quan trọng.'],
        [25500, 31000, null, 'That is why students who sleep well before an exam often remember more.', 'Đó là lý do học sinh ngủ đủ trước kỳ thi thường nhớ được nhiều hơn.'],
        [31500, 37500, null, 'Screens are one of the biggest enemies of good sleep, because their blue light delays the release of melatonin.', 'Màn hình là một trong những kẻ thù lớn nhất của giấc ngủ, vì ánh sáng xanh làm chậm quá trình tiết melatonin.'],
        [38000, 43500, null, 'Experts recommend putting phones away at least an hour before going to bed.', 'Các chuyên gia khuyên nên cất điện thoại ít nhất một tiếng trước khi đi ngủ.'],
        [44000, 50000, null, 'Keeping the same bedtime, even at weekends, also helps your body clock stay regular.', 'Đi ngủ cùng một giờ, kể cả cuối tuần, cũng giúp đồng hồ sinh học của bạn ổn định.'],
        [50500, 55500, null, 'So tonight, try to give your brain the rest it deserves.', 'Vậy tối nay, hãy thử cho bộ não được nghỉ ngơi xứng đáng.'],
      ]),
    },
    questions: [
      choice(1401, 'Người trưởng thành cần ngủ bao nhiêu tiếng mỗi đêm?', ['5–6 tiếng', '7–9 tiếng', '10–12 tiếng'], 1, '"between seven and nine hours".'),
      choice(1402, 'Khoảng bao nhiêu người thường xuyên ngủ dưới 6 tiếng?', ['Một phần mười', 'Một phần ba', 'Một nửa'], 1, '"nearly a third of people".'),
      choice(1403, 'Trong giấc ngủ sâu, não làm gì?', ['Nghỉ hoàn toàn', 'Sắp xếp và lưu thông tin', 'Tiết ra ánh sáng xanh'], 1, '"the brain sorts the information … and stores the important parts".'),
      blank(1404, 'Nên cất điện thoại trước khi ngủ ít nhất mấy tiếng? (ghi bằng số)', ['1', 'một', 'one', '1 tiếng', 'một tiếng'], '"at least an hour before going to bed": ít nhất 1 tiếng.'),
      choice(1405, 'Vì sao màn hình ảnh hưởng tới giấc ngủ?', ['Tiếng ồn từ thiết bị', 'Ánh sáng xanh làm chậm tiết melatonin', 'Màn hình làm nóng phòng'], 1, '"their blue light delays the release of melatonin".'),
    ],
  }),

  // Pronunciation
  lesson({
    id: 21,
    skill: 'PRONUNCIATION',
    title: 'Từ vựng chủ đề Kinh doanh',
    description: 'Các từ nhiều âm tiết hay gặp ở nơi làm việc.',
    topic: 'Kinh doanh',
    cefrLevel: 'B1',
    difficulty: 'MEDIUM',
    estimatedMinutes: 6,
    pronunciationItems: items(21, [
      ['sustainability', '/səˌsteɪnəˈbɪləti/', 'Trọng âm chính rơi vào âm tiết "bil".'],
      ['revenue', '/ˈrevənjuː/', 'Trọng âm ở âm tiết đầu "rev".'],
      ['negotiate', '/nɪˈɡəʊʃieɪt/', 'Phần "-tiate" đọc là /ʃieɪt/.'],
      ['schedule', '/ˈʃedjuːl/', 'Anh-Anh đọc /ˈʃedjuːl/, Anh-Mỹ đọc /ˈskedʒuːl/.'],
      ['entrepreneur', '/ˌɒntrəprəˈnɜː(r)/', 'Trọng âm ở âm tiết cuối "neur".'],
      ['We need to reach an agreement.', '/wi niːd tə riːtʃ ən əˈɡriːmənt/', 'Nối âm "reach an" thành /riːtʃən/.'],
    ]),
  }),
  lesson({
    id: 22,
    skill: 'PRONUNCIATION',
    title: 'Âm cuối -ed',
    description: 'Ba cách đọc đuôi -ed: /t/, /d/ và /ɪd/.',
    topic: 'Âm cuối',
    cefrLevel: 'A2',
    difficulty: 'EASY',
    estimatedMinutes: 5,
    pronunciationItems: items(22, [
      ['worked', '/wɜːkt/', 'Sau âm vô thanh /k/, -ed đọc là /t/.'],
      ['played', '/pleɪd/', 'Sau âm hữu thanh, -ed đọc là /d/.'],
      ['wanted', '/ˈwɒntɪd/', 'Sau /t/ và /d/, -ed đọc là /ɪd/.'],
      ['watched', '/wɒtʃt/', 'Sau /tʃ/, -ed đọc là /t/.'],
      ['decided', '/dɪˈsaɪdɪd/', 'Sau /d/, -ed đọc là /ɪd/.'],
    ]),
  }),
  lesson({
    id: 23,
    skill: 'PRONUNCIATION',
    title: 'Trọng âm từ 2 âm tiết',
    description: 'Danh từ thường nhấn âm đầu, động từ thường nhấn âm sau.',
    topic: 'Trọng âm',
    cefrLevel: 'B1',
    difficulty: 'HARD',
    estimatedMinutes: 5,
    pronunciationItems: items(23, [
      ['a record', '/ə ˈrekɔːd/', 'Danh từ: nhấn âm đầu "REC-ord".'],
      ['to record', '/tə rɪˈkɔːd/', 'Động từ: nhấn âm sau "re-CORD".'],
      ['a present', '/ə ˈpreznt/', 'Danh từ: nhấn âm đầu "PRES-ent".'],
      ['to present', '/tə prɪˈzent/', 'Động từ: nhấn âm sau "pre-SENT".'],
      ['happy', '/ˈhæpi/', 'Tính từ 2 âm tiết thường nhấn âm đầu.'],
      ['begin', '/bɪˈɡɪn/', 'Động từ 2 âm tiết thường nhấn âm sau.'],
    ]),
  }),
  lesson({
    id: 24,
    skill: 'PRONUNCIATION',
    title: 'Từ quen thuộc hằng ngày',
    description: 'Từ ngắn cho người mới bắt đầu; vài mục không có ghi chú.',
    topic: 'Giao tiếp',
    cefrLevel: 'A1',
    difficulty: 'EASY',
    estimatedMinutes: 3,
    pronunciationItems: items(24, [
      ['hello', '/həˈləʊ/', null],
      ['water', '/ˈwɔːtə(r)/', 'Âm "t" giữa từ: Anh-Mỹ thường đọc gần như /d/.'],
      ['thank you', '/ˈθæŋk juː/', 'Âm /θ/: đặt đầu lưỡi giữa hai hàm răng rồi thổi hơi.'],
      ['family', '/ˈfæməli/', null],
    ]),
  }),
  lesson({
    id: 25,
    skill: 'PRONUNCIATION',
    title: 'Câu dài và ngữ điệu',
    description: 'Câu nhiều từ, không có phiên âm: thử phần tô màu từng từ, từ đọc chưa chuẩn và từ bị bỏ sót.',
    topic: 'Ngữ điệu',
    cefrLevel: 'C1',
    difficulty: 'HARD',
    estimatedMinutes: 5,
    pronunciationItems: items(25, [
      ['I would appreciate it if you could send me the report.', null, 'Nối âm "appreciate it"; nhấn vào "report".'],
      ['The environmental impact of tourism is often underestimated.', null, 'Trọng âm: enviRONmental, underEStimated.'],
      ['She thoroughly enjoyed the performance.', null, 'Âm /θ/ trong "thoroughly".'],
    ]),
  }),

  // Not listed (no questions): only reachable by URL, /exercises/lessons/99, for the "no questions yet" screen.
  lesson({
    id: 99,
    skill: 'GRAMMAR',
    title: 'Bài đang soạn',
    description: null,
    topic: null,
    cefrLevel: 'A2',
    difficulty: 'EASY',
    estimatedMinutes: null,
  }),
]
