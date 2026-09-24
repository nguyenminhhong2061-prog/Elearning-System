# Tài liệu thu thập yêu cầu — Bước 1 đến Bước 4 (theo module)

*Tài liệu này gộp Bước 1 (Mục đích), Bước 2 (Phạm vi), Bước 3 (Nghiệp vụ chi tiết), Bước 4 (Đối tượng dữ liệu) và tổ chức lại theo từng module để mỗi thành viên chỉ cần đọc đúng phần việc của mình là hiểu đủ, không phải lật qua nhiều file. Khi module thay đổi (thêm/bớt chức năng, đổi luồng, đổi bảng dữ liệu), người phụ trách module đó cập nhật trực tiếp vào đúng mục tương ứng bên dưới — không tạo file rời để tránh tài liệu bị phân mảnh.*

*Các file gốc vẫn giữ để tham chiếu chi tiết hơn khi cần: "Mục đích và Phạm vi hệ thống", "Bước 3 - Mô tả nghiệp vụ hệ thống", "Database - Tổng hợp toàn hệ thống".*

---

## Bước 1: Mục đích hệ thống

Hệ thống là một **nền tảng web học tiếng Anh theo năng lực cá nhân**, kết hợp AI để hỗ trợ giải thích kiến thức, chấm điểm luyện tập và gợi ý lộ trình học phù hợp trình độ (CEFR) của từng người học. Hệ thống giúp người học:

- Học và ghi nhớ từ vựng theo phương pháp Spaced Repetition, có trò chơi từ vựng tạo động lực
- Luyện tập ngữ pháp, nghe hiểu, phát âm với phản hồi/chấm điểm tự động và chatbot AI hỗ trợ giải thích
- Tự kiểm tra trình độ định kỳ, làm kiểm tra tổng hợp 4 kỹ năng, nhận báo cáo và đề xuất lộ trình học tiếp theo
- Theo dõi tiến độ học tập cá nhân, nhận huy hiệu thành tích và điều chỉnh kế hoạch học

## Bước 2: Phạm vi hệ thống (tổng quan actor)

**Thành viên hệ thống** (actor cha) — Đăng ký tài khoản, Đăng nhập, Đăng xuất, Đổi mật khẩu.

**Người học** (kế thừa Thành viên) — thực hiện 4 nhóm chức năng chính, mỗi nhóm do 1 thành viên phụ trách:

| Module | Phụ trách | Nội dung chính |
|---|---|---|
| A. Học từ vựng | Nguyễn Minh Hồng | Flashcard, Spaced Repetition, chủ đề từ vựng, danh sách từ riêng, trò chơi từ vựng |
| B. Làm bài tập | Lý Quang Đạt | Ngữ pháp, nghe hiểu, phát âm, chatbot AI hỗ trợ |
| C. Kiểm tra | Khuất Huy Nhân | Kiểm tra định kỳ, kiểm tra tổng hợp 4 kỹ năng |
| D. Tiến độ & Kế hoạch cá nhân | Khuất Huy Nhân | Theo dõi tiến độ, huy hiệu, kế hoạch học, nhắc nhở |

**Admin** (kế thừa Thành viên) — Module E: quản lý nội dung học (từ vựng, ngữ pháp, bài nghe, đề kiểm tra, trò chơi), quản lý người dùng, xem thống kê hệ thống.

**Actor gián tiếp** — Dịch vụ AI ngoài (Speech-to-Text chấm phát âm, chatbot giải thích, phân loại CEFR/gợi ý lộ trình).

**Ngoài phạm vi (demo 3 tuần)** — Thanh toán, học nhóm có giáo viên dạy trực tiếp, Cộng đồng học tập (đẩy sang giai đoạn sau demo), hỗ trợ đa ngôn ngữ. Chi tiết roadmap Cộng đồng xem tài liệu "Mục đích và Phạm vi hệ thống".

**Quy ước chung toàn hệ thống** (áp dụng mọi module, chốt sau họp 23/09/2026):
- Không có role Giáo viên riêng — chỉ 1 role Người học dùng chung.
- Chuẩn độ khó/trình độ: CEFR (A1–C2) xuyên suốt mọi module.
- Mọi khóa chính/khóa ngoại trong database: kiểu `BIGINT UNSIGNED`.

---

## Module A — Học từ vựng
**Phụ trách:** Nguyễn Minh Hồng

### Phạm vi chức năng
- Flashcard 2 mặt (từ/nghĩa/ví dụ, phát âm tự động), đánh dấu đã học/cần ôn
- Ghi nhớ dài hạn theo Spaced Repetition, nhắc ôn theo lịch cá nhân, xem lịch sử học
- Từ vựng theo chủ đề, có hình minh họa; tùy chỉnh danh sách từ riêng
- Trò chơi từ vựng: ghép từ, trắc nghiệm nhanh, đoán nghĩa

### Nghiệp vụ chi tiết

**A1. Học flashcard theo chủ đề**
Người học đăng nhập -> chọn "Học từ vựng" -> hệ thống hiện danh sách chủ đề kèm số từ đã học/tổng số từ -> Người học chọn 1 chủ đề -> hệ thống hiện flashcard, ưu tiên từ chưa học hoặc đến hạn ôn -> Người học click flashcard -> mặt trước hiện từ + phát âm tự động -> Người học lật thẻ -> mặt sau hiện nghĩa, ví dụ, hình ảnh (nếu có) -> Người học tự đánh giá mức độ nhớ ("Chưa nhớ"/"Nhớ mơ hồ"/"Nhớ rõ") -> hệ thống ghi nhận, cập nhật trạng thái từ và tính lại ngày ôn tiếp theo -> chuyển thẻ tiếp theo, lặp lại đến khi hết danh sách hoặc Người học thoát -> hệ thống lưu tiến độ phiên học.
*Ngoại lệ:* chủ đề chưa có từ nào; Người học thoát giữa chừng vẫn lưu tiến độ các từ đã đánh giá.

**A2. Ôn tập theo lịch nhắc (Spaced Repetition)**
Hệ thống kiểm tra (khi đăng nhập) các từ có ngày ôn tiếp theo ≤ ngày hiện tại -> nếu có, hiện nhắc "Bạn có N từ cần ôn hôm nay" -> Người học click -> chuyển sang luồng A1, chỉ hiện từ đến hạn, ưu tiên từ nhớ mơ hồ -> đánh giá lại -> hệ thống tính lại ngày ôn tiếp theo cho từng từ.
*Ngoại lệ:* không có từ đến hạn -> không hiện nhắc.

**A3. Tùy chỉnh danh sách từ riêng**
Người học chọn "Danh sách từ của tôi" -> hệ thống hiện danh sách đã tạo + nút "Tạo danh sách mới" -> đặt tên, thêm từ (chọn từ kho có sẵn hoặc tự nhập) -> lưu -> danh sách xuất hiện như một "chủ đề" bổ sung trong luồng A1.
*Ngoại lệ:* từ tự nhập không có phát âm/ví dụ tự động -> cho phép để trống.

**A4. Trò chơi từ vựng**
Người học chọn "Trò chơi từ vựng" -> hệ thống hiện danh sách trò chơi -> chọn 1 trò chơi -> hệ thống bắt đầu, tính giờ, hiện hiệu ứng khi trả lời đúng/sai -> chơi đến hết lượt/hết giờ -> hệ thống tính điểm, hiện kết quả.
*Ngoại lệ:* thoát giữa ván -> điểm ván đó không được lưu.

### Đối tượng dữ liệu (Bước 4)

| Đối tượng | Thuộc tính chính |
|---|---|
| **Chủ đề** (topics) | tên, mô tả, hình ảnh minh họa |
| **Từ vựng** (vocabulary) | từ, nghĩa, câu ví dụ, phiên âm, audio, hình ảnh, thuộc chủ đề nào, mức độ khó (CEFR), người tạo (Admin hoặc do người học tự thêm) |
| **Từ vựng của người học** (user_vocabulary) | người học nào, từ vựng nào, trạng thái (mới/đang học/đã thuộc), kết quả lần ôn gần nhất, số lần đã ôn, ngày cần ôn tiếp theo, ngày học lần đầu, ngày ôn gần nhất |
| **Danh sách từ tùy chỉnh** (custom_vocabulary_lists) | thuộc người học nào, tên danh sách, ngày tạo |
| **Mục trong danh sách** (custom_vocabulary_list_items) | thuộc danh sách nào, từ vựng nào |

Quan hệ: 1 người học có nhiều từ đang theo dõi (user_vocabulary); 1 chủ đề có nhiều từ vựng; 1 người học có nhiều danh sách tùy chỉnh, mỗi danh sách chứa nhiều từ (n-n qua bảng mục). Bảng **Từ vựng** là bảng lõi, được Module C (Kiểm tra) và Module trò chơi tham chiếu tới — không có bản sao ở module khác.

---

## Module B — Làm bài tập (gồm Chatbot AI)
**Phụ trách:** Lý Quang Đạt

### Phạm vi chức năng
- Bài tập ngữ pháp: điền chỗ trống/trắc nghiệm, gợi ý/giải thích, lưu điểm theo dõi tiến độ
- Bài tập nghe hiểu: hội thoại/bản tin có phụ đề, câu hỏi sau khi nghe, chỉnh tốc độ, bản dịch hỗ trợ
- Bài tập phát âm: ghi âm, AI nhận diện giọng nói, so sánh mẫu chuẩn, chấm + gợi ý cải thiện
- Hỏi chatbot AI hỗ trợ giải thích bài tập (ngữ pháp/nghe/phát âm)

### Nghiệp vụ chi tiết

**B1. Bài tập ngữ pháp**
Người học chọn "Bài tập ngữ pháp" -> hệ thống hiện danh sách chủ điểm (cơ bản -> nâng cao) kèm mức độ hoàn thành -> chọn 1 chủ điểm -> hệ thống hiện lần lượt câu hỏi (điền chỗ trống/trắc nghiệm) -> chọn/nhập đáp án -> click "Kiểm tra" -> hệ thống chấm ngay, hiện đúng/sai kèm gợi ý giải thích -> chuyển câu tiếp theo đến hết -> hệ thống hiện tổng điểm, lưu vào lịch sử.
*Ngoại lệ:* chủ điểm chưa có câu hỏi nào.

**B2. Bài tập nghe hiểu**
Người học chọn "Bài tập nghe hiểu" -> hệ thống hiện danh sách bài nghe theo chủ đề/độ khó -> chọn 1 bài -> hệ thống hiện trình phát audio kèm tùy chọn tốc độ và nút hiện phụ đề -> nghe (có thể nghe lại, đổi tốc độ) -> click "Làm câu hỏi" -> trả lời -> nộp -> hệ thống chấm điểm, hiện đáp án đúng + bản dịch để đối chiếu, lưu kết quả.
*Ngoại lệ:* làm câu hỏi luôn mà chưa nghe hết bài -> vẫn cho phép.

**B3. Bài tập phát âm**
Người học chọn "Bài tập phát âm" -> hệ thống hiện danh sách từ/câu mẫu -> chọn 1 mục -> hệ thống phát âm mẫu -> Người học ghi âm, đọc theo -> dừng ghi -> hệ thống gửi bản ghi âm đến dịch vụ nhận diện giọng nói (AI) -> AI trả kết quả so sánh với mẫu chuẩn -> hệ thống hiện điểm đánh giá + gợi ý cải thiện -> có thể ghi âm lại hoặc chuyển mục tiếp -> lưu lịch sử luyện tập.
*Ngoại lệ:* không nhận được giọng nói -> báo "không nhận diện được, thử lại"; AI timeout/lỗi -> báo không chấm được lúc này.

**B4. Hỏi chatbot AI hỗ trợ giải thích**
Đang làm bài tập -> click biểu tượng chatbot -> giao diện chat hiện lên, mang ngữ cảnh bài tập đang làm (câu hỏi, đáp án của Người học) -> nhập câu hỏi -> hệ thống gửi câu hỏi + ngữ cảnh đến dịch vụ AI -> AI trả lời -> hiện trong khung chat -> hỏi tiếp hoặc đóng chat, quay lại làm bài.
*Ngoại lệ:* dịch vụ AI lỗi/timeout -> báo "không thể trả lời lúc này, thử lại sau".

### Đối tượng dữ liệu (Bước 4)

| Đối tượng | Thuộc tính chính |
|---|---|
| **Bài học luyện tập** (exercise_lessons) | kỹ năng (ngữ pháp/nghe/phát âm), tiêu đề, mô tả, chủ đề, mức độ CEFR, thời lượng ước tính, trạng thái xuất bản |
| **Câu hỏi bài tập** (exercise_questions) | thuộc bài học nào, loại câu hỏi (trắc nghiệm/điền từ), nội dung, gợi ý, giải thích, điểm |
| **Đáp án lựa chọn** (question_options) | thuộc câu hỏi nào, nội dung, đúng/sai |
| **Đáp án chấp nhận cho điền từ** (question_accepted_answers) | thuộc câu hỏi nào, nội dung đáp án |
| **Bài nghe** (listening_passages) | thuộc bài học nào, tiêu đề, file audio, thời lượng, transcript đầy đủ, bản dịch |
| **Đoạn trong bài nghe** (listening_segments) | thuộc bài nghe nào, thứ tự đoạn, mốc thời gian bắt đầu/kết thúc, transcript đoạn, bản dịch |
| **Mục luyện phát âm** (pronunciation_items) | thuộc bài học nào, văn bản mẫu, phiên âm IPA, audio mẫu |
| **Lượt luyện phát âm** (pronunciation_attempts) | người học, mục luyện âm, lần thử thứ mấy, file ghi âm, điểm độ chính xác/độ trôi chảy/điểm tổng, chi tiết đánh giá AI |
| **Lượt làm bài tập** (exercise_attempts) | người học, bài học, trạng thái, tổng điểm, điểm đạt, % điểm, thời gian bắt đầu/kết thúc |
| **Câu trả lời** (question_responses) | thuộc lượt làm bài nào, câu hỏi nào, đáp án chọn/nhập, đúng/sai, điểm đạt được |
| **Đoạn kiến thức cho chatbot** (knowledge_chunks) | nguồn, tiêu đề, liên kết tới bài học/câu hỏi (nếu có), nội dung |
| **Phiên chat** (chat_sessions) | người học, bài học/câu hỏi liên quan (nếu có), tiêu đề |
| **Tin nhắn chat** (chat_messages) | thuộc phiên chat nào, vai trò (người học/AI), nội dung |
| **Nguồn tham chiếu của tin nhắn** (chat_message_sources) | tin nhắn nào, đoạn kiến thức nào |

Quan hệ: 1 bài học có nhiều câu hỏi; 1 lượt làm bài gắn với 1 bài học và có nhiều câu trả lời; bài nghe/mục phát âm đều gắn 1-1 hoặc 1-n với bài học; 1 phiên chat có nhiều tin nhắn, mỗi tin nhắn có thể tham chiếu nhiều đoạn kiến thức.

---

## Module C — Kiểm tra
**Phụ trách:** Khuất Huy Nhân

### Phạm vi chức năng
- Kiểm tra định kỳ theo tuần/tháng: nhiều dạng câu hỏi, chấm tự động, hiện kết quả ngay
- Kiểm tra tổng hợp 4 kỹ năng (nghe, nói, đọc, viết), báo cáo chi tiết, đề xuất lộ trình học tiếp theo

### Nghiệp vụ chi tiết

**C1. Kiểm tra định kỳ**
Người học chọn "Kiểm tra định kỳ" -> hệ thống hiện các bài kiểm tra theo tuần/tháng đang mở -> chọn 1 bài -> hệ thống hiện lần lượt câu hỏi -> trả lời từng câu, click "Nộp bài" -> hệ thống chấm điểm tự động, hiện kết quả ngay -> lưu vào lịch sử.
*Ngoại lệ:* nộp bài khi chưa trả lời hết -> câu chưa trả lời tính sai, vẫn cho nộp.

**C2. Kiểm tra tổng hợp**
Người học chọn "Kiểm tra tổng hợp" -> hệ thống hiện bài kiểm tra gồm 4 kỹ năng: nghe, nói, đọc, viết -> làm lần lượt từng phần -> nộp bài -> hệ thống chấm tự động phần trắc nghiệm/nghe/đọc ngay, gửi phần nói/viết cho AI đánh giá -> tổng hợp kết quả, hiện báo cáo chi tiết theo từng kỹ năng -> hệ thống (qua AI phân loại CEFR) đề xuất lộ trình học tiếp theo -> Người học xem báo cáo, có thể áp dụng lộ trình đề xuất vào Kế hoạch học cá nhân (Module D).
*Ngoại lệ:* AI chấm nói/viết lỗi/timeout -> báo "đang xử lý, kết quả sẽ có sau".

### Đối tượng dữ liệu (Bước 4)

| Đối tượng | Thuộc tính chính |
|---|---|
| **Đề kiểm tra** (tests) | tiêu đề, loại (định kỳ/tổng hợp), kỹ năng, ngày mở/đóng |
| **Câu hỏi đề kiểm tra** (test_questions) | thuộc đề nào, liên kết từ vựng (nếu có, tham chiếu Module A), loại câu hỏi, kỹ năng, nội dung, điểm |
| **Đáp án lựa chọn đề kiểm tra** (test_question_options) | thuộc câu hỏi nào, nội dung, đúng/sai |
| **Lượt làm bài kiểm tra** (test_attempts) | người học, đề kiểm tra, thời gian bắt đầu, tổng điểm, trạng thái (đang làm/đã nộp/đã chấm), **điểm từng kỹ năng** (nghe/nói/đọc/viết), **trình độ CEFR đề xuất**, **lộ trình học đề xuất** |
| **Câu trả lời bài kiểm tra** (test_attempt_answers) | thuộc lượt làm bài nào, câu hỏi nào, nội dung trả lời, đúng/sai, điểm đạt được |

Quan hệ: 1 đề kiểm tra có nhiều câu hỏi; 1 người học có nhiều lượt làm bài; kết quả `test_attempts` (trình độ đề xuất) được ghi lại vào **Lịch sử trình độ** của người dùng và có thể trở thành đầu vào cho **Kế hoạch học cá nhân** (Module D).

---

## Module D — Tiến độ & Kế hoạch cá nhân
**Phụ trách:** Khuất Huy Nhân

### Phạm vi chức năng
- Theo dõi tiến độ: biểu đồ ngày/tuần/tháng, tổng số từ/bài tập đã hoàn thành, huy hiệu/thành tích
- Kế hoạch học cá nhân: gợi ý lộ trình theo mục tiêu, lịch nhắc nhở, điều chỉnh kế hoạch

### Nghiệp vụ chi tiết

**D1. Theo dõi tiến độ**
Người học chọn "Tiến độ của tôi" -> hệ thống hiện biểu đồ theo ngày/tuần/tháng: số từ đã học, số bài tập hoàn thành, điểm trung bình kiểm tra -> hiện huy hiệu đã đạt và sắp đạt -> có thể chọn khoảng thời gian khác.
*Ngoại lệ:* người học mới chưa có dữ liệu -> hiện biểu đồ trống + gợi ý bắt đầu học.

**D2. Kế hoạch học cá nhân**
Người học chọn "Kế hoạch học của tôi" -> nếu chưa có kế hoạch, hệ thống hỏi mục tiêu -> nhập mục tiêu -> hệ thống (qua AI) gợi ý lộ trình -> xác nhận hoặc chỉnh sửa -> hệ thống lưu kế hoạch, gửi nhắc nhở theo lịch -> có thể vào lại để điều chỉnh khi cần.
*Ngoại lệ:* không hoàn thành mục tiêu tuần -> hệ thống không phạt, chỉ cảnh báo tiến độ chậm và gợi ý điều chỉnh.

### Đối tượng dữ liệu (Bước 4)

| Đối tượng | Thuộc tính chính |
|---|---|
| **Tiến độ theo ngày** (user_progress) | người học, ngày, số từ đã học, số bài tập hoàn thành, số bài kiểm tra hoàn thành, thời gian học (phút) |
| **Huy hiệu** (badges) | tên, mô tả, icon, điều kiện đạt (loại: số ngày liên tục/số từ đã học/điểm tuyệt đối, giá trị ngưỡng) |
| **Huy hiệu của người dùng** (user_badges) | người học, huy hiệu, ngày đạt |
| **Kế hoạch học** (study_plans) | người học, mô tả mục tiêu, trình độ mục tiêu (CEFR), ngày bắt đầu/kết thúc, trạng thái (đang thực hiện/hoàn thành/tạm dừng) |
| **Lịch trình theo tuần** (study_plan_schedule) | thuộc kế hoạch nào, tuần thứ mấy, mô tả, mục tiêu số từ/số bài tập, trạng thái (chưa tới/đang làm/xong) |
| **Nhắc nhở** (reminders) | người học, loại nhắc (ôn từ/kiểm tra/kế hoạch), đối tượng liên quan (tùy loại), thời gian nhắc, nội dung, đã gửi hay chưa |

Quan hệ: `user_progress` là bảng cộng dồn theo ngày, tổng hợp dữ liệu từ Module A/B/C; `study_plans` có thể được khởi tạo từ kết quả `test_attempts` (Module C, lộ trình đề xuất); mỗi kế hoạch chia thành nhiều `study_plan_schedule` theo tuần.

---

## Module E — Admin (Quản lý nội dung & hệ thống)
**Phụ trách:** thành viên còn lại phân công sau (theo file phân chia công việc)

### Phạm vi chức năng
- Quản lý nội dung học: thêm/sửa/xóa từ vựng theo chủ đề, câu hỏi ngữ pháp, bài nghe, đề kiểm tra, trò chơi từ vựng
- Quản lý người dùng: xem/khóa/mở tài khoản người học
- Xem thống kê toàn hệ thống

### Nghiệp vụ chi tiết

**E1. Quản lý từ vựng theo chủ đề**
Admin đăng nhập -> "Quản lý nội dung" -> "Từ vựng" -> hệ thống hiện danh sách chủ đề -> chọn/tạo chủ đề -> hệ thống hiện danh sách từ -> thêm/sửa/xóa từ (từ, nghĩa, ví dụ, audio, hình ảnh) -> lưu -> cập nhật kho từ vựng, áp dụng ngay cho Người học.

**E2. Quản lý câu hỏi ngữ pháp/bài nghe/đề kiểm tra**
Admin chọn loại nội dung tương ứng -> hệ thống hiện danh sách hiện có -> thêm mới hoặc sửa/xóa -> lưu -> áp dụng ngay cho Người học.
*Ngoại lệ chung (E1–E2):* xóa nội dung đã có Người học học/làm dở -> hệ thống cảnh báo trước khi xóa, không ảnh hưởng lịch sử đã lưu của Người học.

**E3. Quản lý người dùng**
Admin chọn "Quản lý người dùng" -> hệ thống hiện danh sách Người học -> tìm kiếm/lọc -> click vào 1 tài khoản -> hiện chi tiết + nút khóa/mở khóa -> click khóa (hoặc mở) -> hệ thống cập nhật trạng thái tài khoản.

**E4. Xem thống kê toàn hệ thống**
Admin chọn "Thống kê hệ thống" -> hệ thống hiện chỉ số tổng quan: số người dùng, hoạt động theo ngày/tuần, tổng lượt học/bài tập/kiểm tra, nội dung được học nhiều nhất -> có thể lọc theo khoảng thời gian.

### Đối tượng dữ liệu (Bước 4)

Module Admin không có bảng dữ liệu riêng — thao tác trực tiếp trên các bảng nội dung của Module A/B/C (topics, vocabulary, exercise_lessons, tests...) và bảng **Người dùng**:

| Đối tượng | Thuộc tính chính |
|---|---|
| **Người dùng** (users) | họ tên, email, mật khẩu (đã băm), vai trò (learner/admin), trình độ hiện tại (CEFR), trạng thái tài khoản (active/locked), ngày tạo |
| **Lịch sử trình độ** (user_level_history) | người dùng, trình độ, lượt kiểm tra liên quan (nếu có), ngày thay đổi |

---

## Ghi chú cho việc cập nhật tài liệu

- Mỗi thành viên khi đổi luồng nghiệp vụ hoặc thêm/bớt bảng dữ liệu trong module mình phụ trách: cập nhật trực tiếp vào đúng mục "Nghiệp vụ chi tiết" / "Đối tượng dữ liệu" của module đó trong file này.
- Nếu thay đổi ảnh hưởng đến bảng được **module khác tham chiếu tới** (ví dụ: đổi cấu trúc `vocabulary`, `test_attempts`, `users`) — phải báo cho cả nhóm trước khi đổi, vì các module khác đang có FK trỏ tới các bảng này (xem chi tiết đầy đủ từng cột, kiểu dữ liệu, FK tại file "Database - Tổng hợp toàn hệ thống").
- Tài liệu "Database - Tổng hợp toàn hệ thống" là nguồn chuẩn cho **kiểu dữ liệu SQL chi tiết** (dùng khi viết migration); tài liệu này tập trung vào **nghiệp vụ + ý nghĩa đối tượng dữ liệu** để dễ đọc, dễ hiểu khi mới tham gia hoặc khi trình bày với giảng viên hướng dẫn.
