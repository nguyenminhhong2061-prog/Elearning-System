// Sample vocabulary for `npm run dev:mock` (see vocabularyMockApi.js). The shapes follow docs/api/vocabulary.md.
// The words can also seed the backend in Phase 2; check the CEFR levels against the Oxford 3000/5000 lists first.
// Phonetics are British (Cambridge/Oxford style).

// [word, phonetic, meaning, level, example sentence or null]
const TOPIC_SOURCES = [
  {
    name: 'Kinh doanh',
    description: 'Từ vựng dùng trong công việc, doanh nghiệp và tài chính.',
    learnedShare: 0.45,
    words: [
      ['revenue', '/ˈrevənjuː/', 'doanh thu', 'B2', "The company's revenue grew by 20% last year."],
      ['profit', '/ˈprɒfɪt/', 'lợi nhuận', 'B1', 'They made a small profit this quarter.'],
      ['leverage', '/ˈliːvərɪdʒ/', 'đòn bẩy, tận dụng', 'C1', 'They leveraged their network to close the deal.'],
      ['procurement', '/prəˈkjʊəmənt/', 'hoạt động mua sắm', 'C1', 'The procurement team negotiated a better price.'],
      ['negotiate', '/nɪˈɡəʊʃieɪt/', 'thương lượng, đàm phán', 'B2', 'We need to negotiate a new contract.'],
      ['contract', '/ˈkɒntrækt/', 'hợp đồng', 'B1', 'Please read the contract carefully before signing.'],
      ['invoice', '/ˈɪnvɔɪs/', 'hóa đơn', 'B2', 'The invoice must be paid within 30 days.'],
      ['budget', '/ˈbʌdʒɪt/', 'ngân sách', 'B1', 'The project is still within budget.'],
      ['investment', '/ɪnˈvestmənt/', 'khoản đầu tư', 'B1', 'Training staff is a good investment.'],
      ['shareholder', '/ˈʃeəhəʊldə/', 'cổ đông', 'B2', 'The shareholders approved the plan.'],
      ['merger', '/ˈmɜːdʒə/', 'sự sáp nhập', 'C1', 'The merger created the largest bank in the country.'],
      ['deadline', '/ˈdedlaɪn/', 'hạn chót', 'B1', 'The deadline for the report is Friday.'],
      ['entrepreneur', '/ˌɒntrəprəˈnɜː/', 'doanh nhân', 'B2', 'She became a successful entrepreneur at 25.'],
      ['customer', '/ˈkʌstəmə/', 'khách hàng', 'A2', 'The customer asked for a refund.'],
      ['salary', '/ˈsæləri/', 'tiền lương', 'A2', 'He earns a good salary.'],
      ['meeting', '/ˈmiːtɪŋ/', 'cuộc họp', 'A2', 'The meeting starts at nine.'],
      ['employee', '/ɪmˈplɔɪiː/', 'nhân viên', 'A2', 'The company has 200 employees.'],
      ['market', '/ˈmɑːkɪt/', 'thị trường', 'A2', 'The product sells well in the Asian market.'],
      ['strategy', '/ˈstrætədʒi/', 'chiến lược', 'B2', 'We need a new marketing strategy.'],
      ['competitor', '/kəmˈpetɪtə/', 'đối thủ cạnh tranh', 'B2', 'Our prices are lower than our competitors’.'],
      ['supplier', '/səˈplaɪə/', 'nhà cung cấp', 'B2', 'We changed our paper supplier.'],
      ['loan', '/ləʊn/', 'khoản vay', 'B1', 'They took out a loan to buy new machines.'],
      ['launch', '/lɔːntʃ/', 'ra mắt (sản phẩm)', 'B2', 'The new phone will launch next month.'],
      ['headquarters', '/ˌhedˈkwɔːtəz/', 'trụ sở chính', 'B2', 'The headquarters is in Hanoi.'],
      ['bankrupt', '/ˈbæŋkrʌpt/', 'phá sản', 'B2', 'The shop went bankrupt after two years.'],
      ['partnership', '/ˈpɑːtnəʃɪp/', 'quan hệ đối tác', 'B2', 'The two firms formed a partnership.'],
    ],
  },
  {
    name: 'Du lịch',
    description: 'Sân bay, khách sạn và những chuyến đi.',
    learnedShare: 0.7,
    words: [
      ['passport', '/ˈpɑːspɔːt/', 'hộ chiếu', 'A2', null],
      ['luggage', '/ˈlʌɡɪdʒ/', 'hành lý', 'A2', null],
      ['boarding pass', '/ˈbɔːdɪŋ pɑːs/', 'thẻ lên máy bay', 'B1', null],
      ['itinerary', '/aɪˈtɪnərəri/', 'lịch trình chuyến đi', 'B2', null],
      ['destination', '/ˌdestɪˈneɪʃn/', 'điểm đến', 'B1', null],
      ['accommodation', '/əˌkɒməˈdeɪʃn/', 'chỗ ở', 'B1', null],
      ['souvenir', '/ˌsuːvəˈnɪə/', 'quà lưu niệm', 'B1', null],
      ['departure', '/dɪˈpɑːtʃə/', 'sự khởi hành', 'B1', null],
      ['reservation', '/ˌrezəˈveɪʃn/', 'sự đặt chỗ', 'B1', null],
      ['sightseeing', '/ˈsaɪtsiːɪŋ/', 'tham quan', 'B1', null],
      ['check-in', '/ˈtʃek ɪn/', 'làm thủ tục (lên máy bay, nhận phòng)', 'A2', null],
      ['jet lag', '/ˈdʒet læɡ/', 'mệt mỏi do lệch múi giờ', 'B2', null],
    ],
  },
  {
    name: 'Y tế',
    description: 'Sức khỏe, bệnh tật và khám chữa bệnh.',
    learnedShare: 1,
    words: [
      ['symptom', '/ˈsɪmptəm/', 'triệu chứng', 'B1', null],
      ['prescription', '/prɪˈskrɪpʃn/', 'đơn thuốc', 'B2', null],
      ['diagnosis', '/ˌdaɪəɡˈnəʊsɪs/', 'chẩn đoán', 'C1', null],
      ['fever', '/ˈfiːvə/', 'sốt', 'A2', null],
      ['headache', '/ˈhedeɪk/', 'đau đầu', 'A2', null],
      ['pharmacy', '/ˈfɑːməsi/', 'hiệu thuốc', 'B1', null],
      ['surgery', '/ˈsɜːdʒəri/', 'ca phẫu thuật', 'B2', null],
      ['vaccine', '/ˈvæksiːn/', 'vắc-xin', 'B2', null],
      ['injury', '/ˈɪndʒəri/', 'chấn thương', 'B1', null],
      ['recover', '/rɪˈkʌvə/', 'hồi phục', 'B1', null],
      ['allergy', '/ˈælədʒi/', 'dị ứng', 'B1', null],
      ['nutrition', '/njuˈtrɪʃn/', 'dinh dưỡng', 'B2', null],
    ],
  },
  {
    name: 'Công nghệ',
    description: 'Máy tính, internet và thiết bị số.',
    learnedShare: 0.25,
    words: [
      ['software', '/ˈsɒftweə/', 'phần mềm', 'A2', null],
      ['device', '/dɪˈvaɪs/', 'thiết bị', 'B1', null],
      ['download', '/ˌdaʊnˈləʊd/', 'tải xuống', 'A2', null],
      ['password', '/ˈpɑːswɜːd/', 'mật khẩu', 'A2', null],
      ['network', '/ˈnetwɜːk/', 'mạng lưới', 'B1', null],
      ['database', '/ˈdeɪtəbeɪs/', 'cơ sở dữ liệu', 'B2', null],
      ['update', '/ˌʌpˈdeɪt/', 'cập nhật', 'B1', null],
      ['algorithm', '/ˈælɡərɪðəm/', 'thuật toán', 'C1', null],
      ['storage', '/ˈstɔːrɪdʒ/', 'bộ nhớ lưu trữ', 'B2', null],
      ['wireless', '/ˈwaɪələs/', 'không dây', 'B2', null],
      ['screen', '/skriːn/', 'màn hình', 'A2', null],
      ['artificial intelligence', '/ˌɑːtɪfɪʃl ɪnˈtelɪdʒəns/', 'trí tuệ nhân tạo', 'B2', null],
    ],
  },
  {
    name: 'Giáo dục',
    description: 'Trường lớp, học tập và thi cử.',
    learnedShare: 0,
    words: [
      ['scholarship', '/ˈskɒləʃɪp/', 'học bổng', 'B2', null],
      ['curriculum', '/kəˈrɪkjələm/', 'chương trình giảng dạy', 'C1', null],
      ['lecture', '/ˈlektʃə/', 'bài giảng', 'B1', null],
      ['assignment', '/əˈsaɪnmənt/', 'bài tập được giao', 'B1', null],
      ['graduate', '/ˈɡrædʒuət/', 'người tốt nghiệp', 'B1', null],
      ['semester', '/sɪˈmestə/', 'học kỳ', 'B1', null],
      ['tuition', '/tjuˈɪʃn/', 'học phí', 'B2', null],
      ['thesis', '/ˈθiːsɪs/', 'luận văn', 'C1', null],
      ['exam', '/ɪɡˈzæm/', 'kỳ thi', 'A2', null],
      ['knowledge', '/ˈnɒlɪdʒ/', 'kiến thức', 'B1', null],
      ['classmate', '/ˈklɑːsmeɪt/', 'bạn cùng lớp', 'A1', null],
      ['library', '/ˈlaɪbrəri/', 'thư viện', 'A1', null],
    ],
  },
  {
    name: 'Thể thao',
    description: 'Các môn thể thao và luyện tập.',
    learnedShare: 0,
    words: [],
  },
]

/** Topic rows, without counts (the mock API computes them). */
export const MOCK_TOPICS = TOPIC_SOURCES.map((topic, index) => ({
  id: index + 1,
  name: topic.name,
  description: topic.description,
  imageUrl: null,
}))

/**
 * Word rows in VocabularyItem shape. The first `learnedShare` of each topic's words count as learned by whoever is
 * signed in, alternating LEARNING and MASTERED, so the pages show realistic progress.
 */
export const MOCK_WORDS = TOPIC_SOURCES.flatMap((topic, topicIndex) => {
  const learned = Math.round(topic.learnedShare * topic.words.length)
  return topic.words.map(([word, phonetic, meaning, level, example], wordIndex) => ({
    id: (topicIndex + 1) * 100 + wordIndex + 1,
    topicId: topicIndex + 1,
    createdBy: null,
    word,
    meaning,
    exampleSentence: example,
    phonetic,
    audioUrl: null,
    imageUrl: null,
    difficultyLevel: level,
    learningStatus: wordIndex < learned ? (wordIndex % 2 ? 'MASTERED' : 'LEARNING') : 'NEW',
  }))
})
