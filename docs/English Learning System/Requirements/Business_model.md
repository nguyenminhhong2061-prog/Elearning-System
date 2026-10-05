# Mô tả hệ thống bằng ngôn ngữ tự nhiên

## Mục đích và phạm vi

- Đây là một ứng dụng web học tiếng Anh theo năng lực cá nhân. Hệ thống kết hợp AI để giải thích kiến thức, chấm điểm bài luyện tập và gợi ý lộ trình học phù hợp với trình độ của từng người học.
- Chỉ người đã có tài khoản mới dùng được các chức năng học. Hệ thống có hai loại người dùng: người học và quản trị viên (admin). Hệ thống không có vai trò giáo viên riêng.
- Hệ thống vận hành một kho nội dung học chung (từ vựng, bài tập, đề kiểm tra) do admin quản lý, mọi người học dùng chung kho nội dung này. Hệ thống không phục vụ cho nhiều trung tâm hay tổ chức riêng biệt.
- Người dùng truy cập hệ thống qua trình duyệt web trên nhiều thiết bị khác nhau. Toàn bộ dữ liệu được lưu tập trung trên máy chủ của hệ thống.
- Hệ thống dùng một dịch vụ AI bên ngoài để: nhận diện giọng nói và chấm phát âm, chấm câu viết trong bài tập viết, chấm phần nói và phần viết của bài kiểm tra, trả lời câu hỏi qua chatbot, phân loại trình độ và gợi ý lộ trình học. Hệ thống không tự xây dựng các mô hình AI này.
- Mức độ khó của nội dung và trình độ của người học dùng chung một thang đo CEFR gồm 6 mức: A1, A2, B1, B2, C1, C2.
- Các chức năng nằm ngoài phạm vi của bản demo: thanh toán, lớp học có giáo viên dạy trực tiếp, cộng đồng học tập, giao diện đa ngôn ngữ.

## Người dùng và các chức năng của từng người dùng

- Hệ thống có hai loại người dùng: người học và admin. Cả hai đều là thành viên của hệ thống.
- Mọi thành viên đều dùng được các chức năng: đăng nhập, đăng xuất, đổi mật khẩu.
- Người học dùng được các chức năng sau:
  - Đăng ký tài khoản mới (tài khoản đăng ký công khai luôn là tài khoản người học),
  - Học từ vựng:
    - Học flashcard theo chủ đề có sẵn hoặc theo danh sách từ riêng,
    - Ôn tập các từ đến hạn theo phương pháp lặp lại ngắt quãng (spaced repetition),
    - Quản lý danh sách từ riêng: tạo, sửa, xóa danh sách; thêm từ có sẵn trong kho hoặc tự nhập từ mới,
    - Chơi trò chơi từ vựng: ghép từ, trắc nghiệm nhanh, đoán nghĩa.
  - Làm bài tập:
    - Làm bài tập đọc hiểu gồm ba dạng câu: trắc nghiệm ngữ pháp, điền chỗ trống, trắc nghiệm câu hỏi về một bài đọc; mỗi câu có gợi ý và giải thích,
    - Làm bài tập viết gồm ba dạng câu: dịch câu tiếng Việt sang tiếng Anh, viết lại câu giữ nguyên nghĩa, viết câu theo từ khóa gợi ý; mỗi câu có gợi ý và giải thích, câu trả lời được dịch vụ AI chấm điểm và nhận xét dựa trên đề bài và câu trả lời mẫu,
    - Làm bài tập nghe hiểu (có phụ đề, chỉnh tốc độ phát, bản dịch hỗ trợ),
    - Luyện phát âm: ghi âm giọng đọc, nhận điểm và gợi ý cải thiện từ AI,
    - Hỏi chatbot AI để được giải thích trong khi làm bài tập.
  - Làm bài kiểm tra:
    - Làm kiểm tra định kỳ theo tuần/tháng,
    - Làm kiểm tra tổng hợp 4 kỹ năng (nghe, nói, đọc, viết), xem báo cáo kết quả và lộ trình học đề xuất.
  - Theo dõi tiến độ và kế hoạch học:
    - Xem tiến độ học tập theo ngày/tuần/tháng và các huy hiệu đã đạt,
    - Lập và điều chỉnh kế hoạch học cá nhân.
- Admin dùng được các chức năng sau:
  - Quản lý từ vựng: thêm, sửa, xóa chủ đề và từ vựng,
  - Quản lý bài tập: thêm, sửa, xóa bài tập đọc hiểu (kèm bài đọc), bài tập viết, bài tập nghe hiểu (kèm bài nghe) và bài luyện phát âm (kèm mục luyện phát âm),
  - Quản lý đề kiểm tra: thêm, sửa, xóa đề kiểm tra định kỳ và đề kiểm tra tổng hợp,
  - Quản lý người dùng: xem, tìm kiếm, khóa và mở khóa tài khoản người học,
  - Xem thống kê toàn hệ thống.
- Trò chơi từ vựng lấy câu hỏi trực tiếp từ kho từ vựng, nên admin không cần một chức năng quản lý trò chơi riêng.

## Mô tả nghiệp vụ chi tiết các chức năng

Phần này chỉ trình bày một số chức năng tiêu biểu, mỗi module một chức năng. Các chức năng còn lại được mô tả theo cách tương tự.

**Sửa thông tin từ vựng (Module E – Admin):** Admin đăng nhập vào hệ thống -> Giao diện chính của admin hiện ra với các lựa chọn: quản lý từ vựng, quản lý bài tập, quản lý đề kiểm tra, quản lý người dùng, xem thống kê -> Admin chọn quản lý từ vựng -> Giao diện quản lý từ vựng hiện ra với bốn lựa chọn: quản lý chủ đề, thêm từ, sửa từ, xóa từ -> Admin click chọn sửa từ -> Giao diện tìm kiếm từ vựng hiện ra với một ô nhập từ khóa, một danh sách chọn chủ đề (mặc định là tất cả chủ đề) và một nút tìm kiếm -> Admin nhập từ khóa là một phần của từ tiếng Anh cần sửa, có thể chọn thêm chủ đề, rồi click nút tìm kiếm -> Danh sách tất cả các từ có chứa từ khóa (trong chủ đề đã chọn) hiện ra dưới dạng bảng, mỗi dòng tương ứng với một từ gồm: mã, từ, phiên âm, nghĩa, chủ đề, mức CEFR -> Admin click vào dòng của từ cần sửa -> Giao diện sửa từ vựng hiện ra với các ô nhập đã điền sẵn giá trị hiện tại của từ: từ, phiên âm, nghĩa, câu ví dụ, chủ đề (danh sách chọn), mức CEFR (danh sách chọn từ A1 đến C2), file âm thanh phát âm, hình minh họa (riêng mã từ chỉ hiển thị, không sửa được) -> Admin sửa một số thông tin rồi click nút lưu -> Hệ thống kiểm tra dữ liệu hợp lệ, lưu thay đổi, thông báo sửa thành công và quay về giao diện chính của admin. Nội dung đã sửa được áp dụng ngay cho người học.

**Học flashcard theo chủ đề (Module A – Học từ vựng):** Người học đăng nhập vào hệ thống -> Giao diện chính của người học hiện ra với các lựa chọn: học từ vựng, làm bài tập, làm bài kiểm tra, tiến độ và kế hoạch; nếu có từ đã đến hạn ôn, giao diện hiện thêm thông báo "Bạn có N từ cần ôn hôm nay" -> Người học chọn học từ vựng -> Giao diện học từ vựng hiện ra với bốn lựa chọn: học theo chủ đề, ôn tập từ đến hạn, danh sách từ của tôi, trò chơi từ vựng -> Người học chọn học theo chủ đề -> Giao diện chọn chủ đề hiện ra gồm hai phần: các chủ đề có sẵn của hệ thống và các danh sách từ riêng của người học, mỗi chủ đề hiển thị: hình minh họa, tên chủ đề, mô tả, số từ đã học/tổng số từ -> Người học click vào một chủ đề -> Giao diện flashcard hiện ra. Phiên học gồm các từ của chủ đề đã đến hạn ôn (xếp trước) và các từ chưa học (xếp sau); các từ chưa đến hạn ôn không được đưa vào phiên. Giao diện hiển thị vị trí thẻ hiện tại/tổng số thẻ của phiên; mặt trước của thẻ gồm: từ, phiên âm, nút nghe phát âm (hệ thống tự phát âm một lần khi thẻ hiện ra), nút lật thẻ và nút kết thúc -> Người học click nút lật thẻ -> Mặt sau của thẻ hiện ra với: nghĩa, câu ví dụ, hình minh họa (nếu có) và ba nút đánh giá mức độ nhớ: "Chưa nhớ", "Nhớ mơ hồ", "Nhớ rõ" -> Người học click một nút đánh giá -> Hệ thống ghi nhận lượt ôn, cập nhật trạng thái học của từ, tính lại ngày ôn tiếp theo rồi chuyển sang thẻ tiếp theo -> Người học lặp lại việc lật thẻ và đánh giá cho đến khi hết thẻ hoặc click nút kết thúc -> Giao diện tổng kết phiên học hiện ra với: số thẻ đã học, số thẻ theo từng mức độ nhớ, số từ cần ôn vào ngày mai -> Người học click nút quay lại để trở về giao diện học từ vựng.

**Luyện phát âm (Module B – Làm bài tập):** Người học đăng nhập vào hệ thống -> Giao diện chính của người học hiện ra -> Người học chọn làm bài tập -> Giao diện làm bài tập hiện ra với bốn lựa chọn: đọc hiểu, viết, nghe hiểu, phát âm -> Người học chọn phát âm -> Giao diện danh sách bài luyện phát âm hiện ra với một danh sách chọn mức CEFR để lọc và một bảng các bài học, mỗi dòng tương ứng với một bài gồm: tên bài, chủ đề, mức CEFR, số mục luyện, số mục đã luyện -> Người học click vào một bài -> Giao diện luyện phát âm hiện ra với danh sách các mục luyện (từ hoặc câu mẫu) của bài; mục đầu tiên được chọn sẵn và hiển thị: văn bản mẫu, phiên âm IPA, nút nghe mẫu, nút ghi âm -> Người học click nút nghe mẫu, hệ thống phát âm thanh mẫu -> Người học click nút ghi âm (lần đầu trình duyệt sẽ hỏi quyền dùng micro), đọc theo văn bản mẫu rồi click nút dừng -> Hệ thống hiện trạng thái "đang chấm" và gửi bản ghi âm cùng văn bản mẫu đến dịch vụ AI -> Dịch vụ AI trả về kết quả so sánh với phát âm chuẩn -> Hệ thống lưu lượt luyện và hiển thị kết quả gồm: điểm tổng (thang 0–100), điểm độ chính xác, điểm độ trôi chảy, văn bản mẫu được tô màu theo từng từ (màu đỏ là từ phát âm sai), gợi ý cải thiện; kèm ba nút: ghi âm lại, mục tiếp theo, hỏi chatbot -> Người học click ghi âm lại để thử lại (hệ thống tạo một lượt luyện mới và giữ các lượt cũ) hoặc click mục tiếp theo để chuyển sang mục kế tiếp -> Sau mục cuối cùng, hệ thống hiện bảng tổng kết bài, mỗi dòng tương ứng với một mục gồm: văn bản mẫu, số lần thử, điểm cao nhất -> Người học click nút quay lại để về giao diện làm bài tập.

**Làm kiểm tra tổng hợp (Module C – Kiểm tra):** Người học đăng nhập vào hệ thống -> Giao diện chính của người học hiện ra -> Người học chọn làm bài kiểm tra -> Giao diện kiểm tra hiện ra với ba lựa chọn: kiểm tra định kỳ, kiểm tra tổng hợp, lịch sử kiểm tra -> Người học chọn kiểm tra tổng hợp -> Danh sách các đề kiểm tra tổng hợp đang mở hiện ra dưới dạng bảng, mỗi dòng tương ứng với một đề gồm: tên đề, số câu hỏi, ngày mở, ngày đóng, số lần người học đã làm -> Người học click vào một đề -> Giao diện thông tin đề hiện ra với: tên đề, số câu của từng phần nghe/nói/đọc/viết, hướng dẫn làm bài và nút bắt đầu -> Người học click nút bắt đầu -> Hệ thống tạo một lượt làm bài và hiện phần nghe gồm trình phát âm thanh và các câu hỏi trắc nghiệm -> Người học nghe, chọn đáp án rồi click nút phần tiếp theo -> Phần nói hiện ra với các đề bài nói, mỗi đề có một nút ghi âm -> Người học ghi âm câu trả lời rồi click nút phần tiếp theo -> Phần đọc hiện ra với đoạn văn và các câu hỏi trắc nghiệm -> Người học trả lời rồi click nút phần tiếp theo -> Phần viết hiện ra với đề bài viết và một ô soạn thảo -> Người học viết bài rồi click nút nộp bài -> Hệ thống hiện hộp xác nhận kèm số câu chưa trả lời -> Người học click xác nhận -> Hệ thống chấm ngay phần nghe và phần đọc theo đáp án, gửi bản ghi âm phần nói và bài viết đến dịch vụ AI để chấm -> Dịch vụ AI trả về điểm và nhận xét cho phần nói và phần viết -> Hệ thống tổng hợp điểm 4 kỹ năng và gửi đến dịch vụ AI để phân loại trình độ CEFR và đề xuất lộ trình học -> Hệ thống lưu kết quả, cập nhật trình độ hiện tại của người học và ghi vào lịch sử trình độ -> Giao diện báo cáo kết quả hiện ra với: tổng điểm, điểm từng kỹ năng, trình độ CEFR đề xuất, nhận xét từng kỹ năng, lộ trình học đề xuất và bảng chi tiết, mỗi dòng tương ứng với một câu gồm: câu hỏi, kỹ năng, câu trả lời, đáp án đúng, điểm đạt; kèm hai nút: áp dụng lộ trình vào kế hoạch học, về trang chủ -> Người học click nút về trang chủ để trở về giao diện chính (hoặc click nút áp dụng lộ trình để chuyển sang chức năng lập kế hoạch học với lộ trình được điền sẵn).

**Lập kế hoạch học cá nhân (Module D – Tiến độ và kế hoạch):** Người học đăng nhập vào hệ thống -> Giao diện chính của người học hiện ra -> Người học chọn tiến độ và kế hoạch -> Giao diện hiện ra với hai lựa chọn: tiến độ của tôi, kế hoạch học của tôi -> Người học chọn kế hoạch học của tôi -> Vì người học chưa có kế hoạch nào đang thực hiện, giao diện lập kế hoạch hiện ra với: ô nhập mô tả mục tiêu, trình độ hiện tại (chỉ hiển thị, để trống nếu người học chưa làm kiểm tra tổng hợp), danh sách chọn trình độ mục tiêu (A1 đến C2), ô chọn ngày bắt đầu, ô chọn ngày kết thúc và nút gợi ý lộ trình -> Người học nhập mục tiêu, chọn trình độ mục tiêu, ngày bắt đầu, ngày kết thúc rồi click nút gợi ý lộ trình -> Hệ thống gửi mục tiêu, trình độ hiện tại và kết quả kiểm tra tổng hợp gần nhất (nếu có) đến dịch vụ AI -> Dịch vụ AI trả về lộ trình chia theo tuần -> Giao diện lộ trình đề xuất hiện ra dưới dạng bảng, mỗi dòng tương ứng với một tuần gồm: tuần thứ, mô tả nội dung học, mục tiêu số từ mới, mục tiêu số bài tập (hai ô mục tiêu cho phép sửa); kèm hai nút: gợi ý lại, xác nhận -> Người học sửa mục tiêu của một vài tuần cho phù hợp rồi click nút xác nhận -> Hệ thống lưu kế hoạch với trạng thái đang thực hiện cùng lịch trình từng tuần, tạo các nhắc nhở học theo lịch và thông báo lập kế hoạch thành công -> Giao diện chi tiết kế hoạch hiện ra với: mục tiêu, thời gian, tuần hiện tại, tiến độ từng tuần và nút điều chỉnh kế hoạch. Nếu người học đã có kế hoạch đang thực hiện thì khi chọn kế hoạch học của tôi, hệ thống mở ngay giao diện chi tiết kế hoạch này.

## Thông tin về các đối tượng liên quan

- Người dùng (tài khoản): họ tên, email (dùng để đăng nhập), mật khẩu, vai trò (người học/admin), trình độ hiện tại (CEFR, chỉ áp dụng với người học), trạng thái tài khoản (hoạt động/bị khóa), ngày tạo, thời điểm hoạt động gần nhất.
- Lịch sử trình độ: người học, trình độ, lượt kiểm tra tổng hợp đã sinh ra trình độ này (nếu có), ngày thay đổi.
- Chủ đề từ vựng: tên, mô tả, hình minh họa, ngày cập nhật gần nhất.
- Từ vựng: từ, phiên âm, nghĩa, câu ví dụ, file âm thanh phát âm, hình minh họa, chủ đề, mức CEFR, người tạo (admin hoặc người học tự thêm), trạng thái (hiển thị/đã ẩn).
- Trạng thái học từ của người học: người học, từ vựng, trạng thái (mới/đang học/đã thuộc), kết quả lần ôn gần nhất, số lần đã ôn, ngày học lần đầu, ngày ôn gần nhất, ngày ôn tiếp theo.
- Lượt ôn từ: người học, từ vựng, mức độ nhớ được đánh giá (chưa nhớ/nhớ mơ hồ/nhớ rõ), thời điểm ôn.
- Danh sách từ riêng: người học sở hữu, tên danh sách, ngày tạo, các từ trong danh sách.
- Lượt chơi trò chơi: người học, loại trò chơi (ghép từ/trắc nghiệm nhanh/đoán nghĩa), chủ đề hoặc danh sách từ riêng, số câu đúng/tổng số câu, điểm, thời gian chơi, ngày chơi.
- Bài học luyện tập: kỹ năng (đọc hiểu/viết/nghe hiểu/phát âm), tiêu đề, mô tả, chủ đề, mức CEFR, độ khó (dễ/vừa/khó), thời lượng ước tính, trạng thái (nháp/đã xuất bản/đã ẩn).
- Bài đọc: bài học, tiêu đề, nội dung đoạn văn.
- Câu hỏi bài tập: bài học, bài đọc (chỉ với câu hỏi về bài đọc), loại câu hỏi (trắc nghiệm/điền từ/dịch câu/viết lại câu/viết câu theo từ khóa), nội dung, gợi ý, giải thích, điểm.
  - Câu trắc nghiệm có các đáp án lựa chọn: nội dung, đúng/sai.
  - Câu điền từ có các đáp án được chấp nhận: nội dung đáp án.
  - Ba loại dịch câu, viết lại câu, viết câu theo từ khóa gọi chung là câu viết. Nội dung của câu viết là câu tiếng Việt cần dịch, câu gốc cần viết lại (kèm phần mở đầu cho sẵn nếu có) hoặc các từ khóa gợi ý. Câu viết có các câu trả lời mẫu: nội dung câu mẫu.
- Bài nghe: bài học, tiêu đề, file âm thanh, thời lượng, transcript đầy đủ, bản dịch. Mỗi bài nghe gồm các đoạn: thứ tự, thời điểm bắt đầu/kết thúc, người nói, transcript của đoạn, bản dịch của đoạn.
- Mục luyện phát âm: bài học, văn bản mẫu, phiên âm IPA, âm thanh mẫu, ghi chú cách đọc.
- Lượt luyện phát âm: người học, mục luyện, lần thử thứ mấy, file ghi âm, điểm độ chính xác, điểm độ trôi chảy, điểm tổng, nhận xét chi tiết của AI, thời điểm luyện.
- Lượt làm bài tập: người học, bài học, trạng thái (đang làm/đã nộp), tổng điểm tối đa, điểm đạt, tỷ lệ phần trăm điểm, thời gian bắt đầu, thời gian kết thúc. Mỗi lượt gồm các câu trả lời: câu hỏi, đáp án đã chọn hoặc nội dung đã nhập, đúng/sai (với câu trắc nghiệm và câu điền từ), điểm đạt, nhận xét của AI (với câu viết).
- Phiên chat: người học, bài học/câu hỏi đang làm (nếu có), tiêu đề. Mỗi phiên gồm các tin nhắn: vai trò (người học/AI), nội dung, thời điểm, các đoạn kiến thức được viện dẫn.
- Đoạn kiến thức (dùng cho chatbot): nguồn, tiêu đề, nội dung, bài học/câu hỏi liên quan (nếu có).
- Đề kiểm tra: tiêu đề, loại (định kỳ/tổng hợp), kỹ năng, hướng dẫn làm bài, ngày mở, ngày đóng, trạng thái (nháp/hiển thị/đã ẩn).
- Tài liệu đề kiểm tra: đề kiểm tra, loại (bài nghe/đoạn văn), tiêu đề, file âm thanh (với bài nghe), nội dung văn bản (đoạn văn, hoặc transcript của bài nghe).
- Câu hỏi đề kiểm tra: đề kiểm tra, tài liệu đi kèm (với câu nghe và câu đọc), kỹ năng (nghe/nói/đọc/viết), loại câu hỏi, nội dung, điểm, từ vựng liên quan (nếu có). Câu trắc nghiệm có các đáp án lựa chọn: nội dung, đúng/sai. Câu điền từ có các đáp án được chấp nhận: nội dung đáp án.
- Lượt làm bài kiểm tra: người học, đề kiểm tra, thời gian bắt đầu, thời gian nộp, trạng thái (đang làm/đã nộp/đã chấm), tổng điểm, điểm nghe, điểm nói, điểm đọc, điểm viết, trình độ CEFR đề xuất, lộ trình học đề xuất. Mỗi lượt gồm các câu trả lời: câu hỏi, nội dung trả lời (đáp án chọn, văn bản hoặc file ghi âm), đúng/sai, điểm đạt, nhận xét của AI (với câu nói và câu viết).
- Báo cáo kết quả kiểm tra tổng hợp: thông tin người học (họ tên, trình độ trước khi làm bài), thông tin đề (tên đề, ngày làm), tổng điểm và điểm từng kỹ năng, trình độ CEFR đề xuất, nhận xét từng kỹ năng, lộ trình học đề xuất. Báo cáo có bảng chi tiết, mỗi dòng tương ứng với một câu: câu hỏi, kỹ năng, câu trả lời, đáp án đúng, điểm đạt.
- Tổng kết phiên học flashcard: chủ đề, số thẻ đã học, số thẻ theo từng mức độ nhớ, số từ cần ôn vào ngày mai.
- Tiến độ theo ngày: người học, ngày, số từ đã học, số bài tập hoàn thành, số bài kiểm tra hoàn thành, thời gian học (phút).
- Huy hiệu: tên, mô tả, biểu tượng, loại điều kiện đạt (số ngày học liên tục/số từ đã học/điểm tuyệt đối), giá trị ngưỡng.
- Huy hiệu của người học: người học, huy hiệu, ngày đạt.
- Kế hoạch học: người học, mô tả mục tiêu, trình độ mục tiêu, ngày bắt đầu, ngày kết thúc, trạng thái (đang thực hiện/hoàn thành/tạm dừng). Mỗi kế hoạch có lịch trình theo tuần: tuần thứ, mô tả, mục tiêu số từ, mục tiêu số bài tập, trạng thái (chưa tới/đang làm/xong).
- Nhắc nhở: người học, loại nhắc (ôn từ/kiểm tra/kế hoạch), đối tượng liên quan, thời gian nhắc, nội dung, đã gửi hay chưa.
- Thống kê tiến độ của người học theo kỳ (ngày/tuần/tháng): tên kỳ, số từ đã học, số bài tập hoàn thành, điểm trung bình các bài kiểm tra, tổng thời gian học.
- Thống kê hệ thống theo khoảng thời gian: tổng số người dùng, số người dùng mới, số người dùng hoạt động, tổng lượt học từ, tổng lượt làm bài tập, tổng lượt làm bài kiểm tra.
- Thống kê nội dung được học nhiều nhất: tên nội dung, loại nội dung (chủ đề từ vựng/bài tập/đề kiểm tra), số lượt học, số người học.

## Quan hệ giữa các đối tượng

Tài khoản và trình độ:

- Một người dùng có đúng một vai trò: người học hoặc admin.
- Tài khoản bị khóa không đăng nhập được. Mọi dữ liệu học của tài khoản bị khóa vẫn được giữ nguyên.
- Trình độ hiện tại của người học chỉ thay đổi khi có một lượt kiểm tra tổng hợp đã chấm xong. Mỗi lần thay đổi sinh ra một bản ghi lịch sử trình độ. Người học mới có trình độ hiện tại để trống cho đến lần kiểm tra tổng hợp đầu tiên.

Học từ vựng:

- Một chủ đề có nhiều từ vựng. Một từ vựng thuộc một chủ đề; riêng từ do người học tự nhập vào danh sách từ riêng thì có thể không thuộc chủ đề nào.
- Một người học có thể học nhiều từ vựng. Một từ vựng có thể được nhiều người học học. Với mỗi cặp người học – từ vựng, hệ thống chỉ lưu một trạng thái học.
- Mỗi lần người học đánh giá một thẻ sẽ sinh ra một lượt ôn từ và cập nhật trạng thái học của từ đó. Thẻ đã xem nhưng chưa được đánh giá thì không được tính là đã học.
- Một từ chỉ được đưa vào phiên ôn tập khi ngày ôn tiếp theo của từ đó không muộn hơn ngày hiện tại.
- Ngày ôn tiếp theo được tính theo mức độ nhớ (quy tắc đề xuất, nhóm cần chốt trước bước Analysis). Gọi k là khoảng cách (số ngày) giữa lần ôn gần nhất và ngày ôn tiếp theo đã lên lịch trước đó; với từ mới thì k = 0:
  - "Chưa nhớ": khoảng cách mới là 1 ngày,
  - "Nhớ mơ hồ": khoảng cách mới là max(1, k) ngày, tức giữ nguyên khoảng cách cũ,
  - "Nhớ rõ": khoảng cách mới là max(2, 2k) ngày, tức nhân đôi khoảng cách cũ,
  - Ngày ôn tiếp theo = ngày hiện tại + khoảng cách mới. Nếu khoảng cách mới từ 16 ngày trở lên thì trạng thái của từ là "đã thuộc", ngược lại là "đang học".
- Một người học có thể tạo nhiều danh sách từ riêng. Một danh sách chứa nhiều từ và một từ có thể nằm trong nhiều danh sách, nhưng một từ không lặp lại trong cùng một danh sách. Danh sách từ riêng chỉ người tạo nhìn thấy.
- Một người học có thể chơi nhiều lượt trò chơi. Một lượt chơi chỉ được lưu khi người học chơi hết ván; nếu thoát giữa ván thì điểm của ván đó không được lưu.

Làm bài tập và chatbot:

- Một bài học luyện tập có nhiều câu hỏi. Một câu hỏi thuộc một bài học.
- Loại câu hỏi phụ thuộc kỹ năng của bài học: bài đọc hiểu và bài nghe hiểu chỉ gồm câu trắc nghiệm và câu điền từ; bài tập viết chỉ gồm câu viết (dịch câu, viết lại câu, viết câu theo từ khóa). Bài luyện phát âm không có câu hỏi mà gồm các mục luyện phát âm.
- Câu trắc nghiệm có nhiều đáp án lựa chọn, trong đó có đúng một đáp án đúng. Câu điền từ có một hoặc nhiều đáp án được chấp nhận. Câu viết có một hoặc nhiều câu trả lời mẫu.
- Một bài học đọc hiểu có thể có một hoặc nhiều bài đọc, hoặc không có bài đọc nào nếu bài chỉ gồm câu trắc nghiệm ngữ pháp và câu điền chỗ trống. Một bài đọc thuộc một bài học. Câu hỏi về bài đọc gắn với một bài đọc của chính bài học đó; câu trắc nghiệm ngữ pháp và câu điền chỗ trống không gắn với bài đọc nào.
- Câu trắc nghiệm và câu điền từ được hệ thống chấm ngay theo đáp án. Câu viết có nhiều cách diễn đạt đúng nên không chấm bằng so khớp: hệ thống gửi đề bài, các câu trả lời mẫu và câu trả lời của người học đến dịch vụ AI; dịch vụ AI trả về điểm và nhận xét.
- Hệ thống không tự đặt điểm cho câu viết thay cho dịch vụ AI. Nếu dịch vụ AI chưa chấm được, câu trả lời đó chưa có điểm và người học có thể gửi chấm lại; lượt làm bài chỉ có tổng điểm khi mọi câu đã được chấm.
- Một bài học nghe hiểu có đúng một bài nghe. Một bài nghe có nhiều đoạn, sắp xếp theo thời gian.
- Một bài học phát âm có nhiều mục luyện phát âm. Người học có thể luyện một mục nhiều lần; mỗi lần tạo một lượt luyện phát âm mới và các lượt cũ vẫn được giữ lại.
- Lượt luyện phát âm chỉ được lưu khi dịch vụ AI chấm thành công. Hệ thống không tự đặt điểm thay cho dịch vụ AI.
- Một người học có nhiều lượt làm bài tập. Mỗi lượt thuộc một bài học và gồm nhiều câu trả lời, mỗi câu trả lời ứng với một câu hỏi của chính bài học đó.
- Một người học có nhiều phiên chat. Một phiên chat có nhiều tin nhắn và có thể gắn với bài học/câu hỏi mà người học đang làm. Một tin nhắn của AI có thể viện dẫn nhiều đoạn kiến thức, một đoạn kiến thức có thể được nhiều tin nhắn viện dẫn.

Kiểm tra:

- Một đề kiểm tra có nhiều câu hỏi. Một câu hỏi kiểm tra có thể liên quan đến một từ vựng; một từ vựng có thể xuất hiện trong nhiều câu hỏi kiểm tra.
- Câu hỏi kiểm tra trắc nghiệm có nhiều đáp án lựa chọn, trong đó có đúng một đáp án đúng; câu điền từ có một hoặc nhiều đáp án được chấp nhận. Câu nói và câu viết không có đáp án mà do dịch vụ AI chấm.
- Một đề kiểm tra có thể có nhiều tài liệu (bài nghe, đoạn văn). Một tài liệu thuộc một đề và được nhiều câu hỏi của chính đề đó dùng chung; câu nghe gắn với một bài nghe, câu đọc gắn với một đoạn văn.
- Người học chỉ làm được một đề kiểm tra trong khoảng từ ngày mở đến ngày đóng của đề. Một người học có thể có nhiều lượt làm bài kiểm tra; mỗi lượt thuộc một đề và gồm nhiều câu trả lời.
- Khi nộp bài, câu chưa trả lời được tính 0 điểm.
- Một lượt kiểm tra tổng hợp chỉ có trình độ CEFR và lộ trình đề xuất khi mọi phần đã được chấm. Nếu dịch vụ AI chưa chấm xong phần nói hoặc phần viết, lượt làm bài giữ trạng thái đã nộp và người học xem kết quả sau trong lịch sử kiểm tra.

Tiến độ và kế hoạch học:

- Mỗi người học có tối đa một bản ghi tiến độ cho mỗi ngày. Số liệu của bản ghi được cộng dồn từ các hoạt động học từ vựng, làm bài tập và làm bài kiểm tra trong ngày đó; mỗi hoạt động chỉ được đếm một lần.
- Một huy hiệu có thể được nhiều người học đạt. Mỗi người học chỉ nhận mỗi huy hiệu một lần.
- Một người học có thể có nhiều kế hoạch học theo thời gian, nhưng tại một thời điểm chỉ có tối đa một kế hoạch ở trạng thái đang thực hiện. Một kế hoạch có nhiều tuần; mỗi tuần thuộc một kế hoạch.
- Một kế hoạch học có thể được tạo từ lộ trình đề xuất của một lượt kiểm tra tổng hợp.
- Không đạt mục tiêu tuần không làm thay đổi kết quả đã học. Hệ thống chỉ cảnh báo tiến độ chậm và gợi ý điều chỉnh kế hoạch.
- Một người học có nhiều nhắc nhở. Nhắc nhở được hiển thị khi đến thời gian nhắc nếu người học đang đăng nhập, hoặc ở lần đăng nhập tiếp theo.

Quản trị:

- Admin quản lý toàn bộ nội dung học trong kho chung; admin không có bản sao nội dung riêng.
- Nội dung chưa xuất bản không hiển thị với người học.
- Khi admin xóa một nội dung đã được sử dụng (đã có lượt học, lượt làm bài hoặc câu hỏi tham chiếu), hệ thống cảnh báo trước. Nếu admin xác nhận, nội dung chỉ bị ẩn đối với các lượt học mới; lịch sử học và kết quả cũ vẫn được giữ nguyên.
- Thống kê toàn hệ thống được tính từ dữ liệu hiện có theo khoảng thời gian được chọn, không cần lưu thành đối tượng riêng.

## Ghi chú: các điểm bổ sung so với tài liệu mô tả hệ thống

Các điểm sau không có sẵn trong file "Mô tả hệ thống bằng ngôn ngữ tự nhiên" và được bổ sung để tài liệu đủ chi tiết cho bước Analysis. Nhóm cần xem lại và chốt:

- Đối tượng **Lượt ôn từ**: cần để hiện "lịch sử học" của Module A và đếm số thẻ theo từng mức độ nhớ trong tổng kết phiên học.
- Đối tượng **Lượt chơi trò chơi**: nghiệp vụ trò chơi từ vựng có lưu điểm các ván chơi hết, nhưng tài liệu gốc chưa có đối tượng lưu điểm này.
- **Nhận xét của AI** cho từng câu trả lời phần nói và phần viết: cần để báo cáo kiểm tra tổng hợp có nhận xét từng kỹ năng.
- **Quy tắc tính ngày ôn tiếp theo** (spaced repetition) nêu ở phần quan hệ giữa các đối tượng.
- Các quy tắc được chốt: người học chỉ có tối đa một kế hoạch đang thực hiện; trình độ hiện tại để trống cho đến lần kiểm tra tổng hợp đầu tiên; điểm phát âm dùng thang 0–100.
- **Chia bài tập ngữ pháp thành bài tập đọc hiểu và bài tập viết** (thay đổi ngày 30/09/2026): tài liệu gốc có loại bài tập ngữ pháp (điền chỗ trống, trắc nghiệm). Business model bỏ loại này: câu trắc nghiệm ngữ pháp và câu điền chỗ trống chuyển vào bài tập đọc hiểu, cùng với câu hỏi về bài đọc; bài tập viết là loại mới với ba dạng câu viết. Thay đổi này kéo theo đối tượng mới **Bài đọc**, ba loại câu hỏi viết kèm **câu trả lời mẫu**, và **nhận xét của AI** cho câu viết trong lượt làm bài tập.
- **Dịch vụ AI chấm câu viết của bài tập viết** (đã chốt ngày 30/09/2026): dịch vụ AI chấm điểm và nhận xét câu viết dựa trên đề bài và các câu trả lời mẫu. Lý do: câu viết có nhiều cách diễn đạt đúng, nên nếu chỉ so khớp với câu trả lời mẫu như câu điền từ thì sẽ chấm sai nhiều câu đúng, nhất là dạng viết câu theo từ khóa. Vì vậy Dịch vụ AI tham gia thêm vào chức năng làm bài tập viết.
- **Bổ sung khi trích lớp thực thể** (01/10/2026, đề xuất – cần nhóm chốt): các kịch bản cần những dữ liệu sau nhưng Business model chưa có:
  - Đối tượng mới **Tài liệu đề kiểm tra** (bài nghe, đoạn văn), cần cho phần nghe và phần đọc của đề tổng hợp (kịch bản 15), nơi 10 câu hỏi dùng chung một file âm thanh hoặc một đoạn văn.
  - **Đáp án được chấp nhận** cho câu điền từ của đề kiểm tra, cần cho đề định kỳ (kịch bản 14).
  - **Trạng thái hiển thị/đã ẩn** của từ vựng và đề kiểm tra, cần để thực hiện quy tắc "xóa nội dung đã dùng thì chỉ ẩn" (kịch bản 21, 24). Trạng thái bài học thêm giá trị "đã ẩn".
  - **Hướng dẫn làm bài** của đề kiểm tra, đã xuất hiện trong luồng nghiệp vụ kiểm tra tổng hợp nhưng thiếu trong thông tin đối tượng.
  - Lượt chơi trò chơi gắn với **chủ đề hoặc danh sách từ riêng** (kịch bản 8).
- **Bổ sung khi đối chiếu khu quản trị với tài liệu** (03/10/2026, đề xuất – cần nhóm chốt):
  - **Độ khó** (dễ/vừa/khó) của bài học luyện tập: bộ lọc và cột "Độ khó" của trang "Bài tập" (kịch bản 23).
  - **Người nói** của đoạn bài nghe và **ghi chú cách đọc** của mục luyện phát âm: trang làm bài của người học đang hiển thị hai thông tin này (kịch bản 11, 12).
  - Trạng thái **nháp** của đề kiểm tra: đề mới chưa hiện với người học cho tới khi admin chọn "Mở theo lịch" (kịch bản 24).
  - **Ngày cập nhật** của chủ đề (cột "Cập nhật" của bảng chủ đề, kịch bản 19, 22) và **thời điểm hoạt động gần nhất** của người dùng (cột "Hoạt động gần nhất", kịch bản 25).
  - Một bài học nghe hiểu có **đúng một** bài nghe (trước đây ghi "một hoặc nhiều"): không kịch bản nào cần nhiều bài nghe và trang làm bài chỉ có một trình phát.
  - Câu trắc nghiệm có **đúng một** đáp án đúng (trước đây ghi "ít nhất một"): người học chỉ chọn một đáp án.
  - Admin **không quản lý trò chơi**: trang "Trò chơi" của khu quản trị đã được bỏ, đúng như quy định ở mục chức năng.
