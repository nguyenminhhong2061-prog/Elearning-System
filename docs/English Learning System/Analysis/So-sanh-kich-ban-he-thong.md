# So sánh kịch bản và hệ thống thực tế

Tài liệu này đối chiếu 26 kịch bản trong `Scenarios.md` (cùng thư mục) với hệ thống đang chạy. Với từng use case, tài liệu ghi hệ thống khác kịch bản ở đâu, vì sao, và đề xuất cách giải quyết.

## Phạm vi và mốc so sánh

- Ngày đối chiếu: 01/10/2026.
- **Backend:** nhánh `dev`, commit `1afe0d2`. Đã có module A (từ vựng, trò chơi), B (bài tập, chatbot) và C (kiểm tra). Chưa có backend của module D (tiến độ, kế hoạch) và E (admin), trừ API thêm, sửa, xóa từ vựng và chủ đề của module A.
- **Giao diện người học:** nhánh `dev`.
- **Giao diện admin:** nhánh `feature/admin-frontend` (chưa push), chạy bằng dữ liệu giả (`npm run dev:mock`).
- Tài liệu là ảnh chụp tại ngày trên. Khi code thay đổi thì cần cập nhật lại.

## Cách đọc

- **KB n** là kịch bản số n trong `Scenarios.md`. "6a" là nhánh ngoại lệ 6a của kịch bản đó.
- Cách chọn hướng giải quyết:
  - kịch bản đòi một thứ hệ thống chưa có → **sửa code**;
  - hệ thống làm khác nhưng có lý do tốt, hoặc làm nhiều hơn kịch bản → **sửa kịch bản**.
- Người làm theo phân công: Hồng (backend module A, `user`, `auth` và toàn bộ giao diện), Đạt (backend module B), Nhân (backend module C, D). Backend thống kê admin chưa có người.

## Tổng quan

| KB | Use case | Mức lệch | Việc chính để khớp | Người làm |
|---|---|---|---|---|
| 1 | Đăng ký | Nhỏ | Sau đăng ký về trang đăng nhập | Hồng |
| 2 | Đăng nhập | Vừa | Backend tiến độ cho trang chủ; thông báo đề đang mở | Nhân, Hồng |
| 3 | Đăng xuất | Vừa | Hết phiên khi không thao tác | Hồng |
| 4 | Đổi mật khẩu | Nhỏ | Vài chi tiết giao diện | Hồng |
| 5 | Học flashcard | Vừa | Công thức ôn, giới hạn 20 thẻ, màn tổng kết | Hồng |
| 6 | Ôn tập | Nhỏ | Thứ tự ôn | Hồng |
| 7 | Danh sách riêng | Nhỏ | Chặn trùng tên | Hồng |
| 8 | Trò chơi | **Lớn** | Chọn chủ đề, luật từng trò, bảng câu sai | Hồng |
| 9 | Đọc hiểu | **Lớn** | Chưa có bài đọc (hệ thống chỉ có "Ngữ pháp") | Đạt, Hồng |
| 10 | Bài viết | **Chưa có** | Toàn bộ | Đạt, Hồng |
| 11 | Nghe hiểu | Vừa | Ẩn phụ đề, cho nộp khi còn câu trống, file âm thanh | Hồng, Đạt |
| 12 | Phát âm | **Lớn** | Backend luôn báo lỗi 503 | Đạt |
| 13 | Chatbot | Nhỏ | Mất tin nhắn khi AI lỗi; không từ chối câu ngoài phạm vi | Đạt |
| 14 | Kiểm tra định kỳ | Vừa | Cách tính điểm, tự nộp, lịch sử | Nhân, Hồng |
| 15 | Kiểm tra tổng hợp | **Lớn** | Ghi âm, AI chấm thật, chia theo phần | Nhân, Hồng |
| 16 | Xem tiến độ | **Lớn** | Backend chưa có | Nhân, Hồng |
| 17 | Lập kế hoạch | **Lớn** | Backend chưa có; cách nhập mục tiêu, cách nhắc | Nhân, Hồng |
| 18 | Điều chỉnh kế hoạch | **Chưa có** | Sửa tuần, đổi ngày kết thúc, kết thúc kế hoạch | Nhân, Hồng |
| 19–22 | Admin từ vựng | Vừa | Backend thiếu luật trùng, ẩn từ, tải file | Hồng |
| 23 | Quản lý bài tập | **Chưa có backend** | API admin | Đạt |
| 24 | Quản lý đề | **Chưa có backend** | API admin | Nhân |
| 25 | Quản lý người dùng | **Chưa có backend** | API admin, khóa có hiệu lực ngay | Hồng |
| 26 | Thống kê | **Chưa có backend** | Chưa ai nhận | Chưa có |

## Chi tiết theo use case

### KB 1. Đăng ký

| Khác biệt (hệ thống ↔ kịch bản) | Vì sao | Đề xuất |
|---|---|---|
| Đăng ký xong thì tự đăng nhập và vào trang chủ; kịch bản quay về trang đăng nhập, điền sẵn email | Chọn lúc làm phần đăng nhập để người dùng bớt một bước | Sửa code nhỏ (Hồng): chuyển về `/login` kèm email |
| 6a: báo email trùng nhưng vẫn giữ hai ô mật khẩu; kịch bản xóa hai ô này | Mặc định của thư viện form | Sửa code nhỏ (Hồng) |
| Hệ thống còn chặn mật khẩu dài quá 72 byte | BCrypt chỉ đọc 72 byte đầu | Sửa kịch bản: thêm vào nhánh 6b |

### KB 2. Đăng nhập

| Khác biệt | Vì sao | Đề xuất |
|---|---|---|
| Màn chính là bảng tiến độ (thẻ số liệu, biểu đồ) cùng thanh bên; kịch bản là lời chào, 4 lựa chọn và khu thông báo | Làm theo thiết kế LinguaStep | Sửa kịch bản: bước 5 ghi thanh bên chính là 4 lựa chọn |
| Không có thông báo "Kiểm tra tuần 41 đang mở đến 11/10" | Chưa làm | Sửa code nhỏ (Hồng): dùng `GET /api/tests` đã có |
| Chạy với backend thật thì các khối tiến độ đều báo lỗi 404 | Backend D chưa có | Sửa code (Nhân) theo `docs/api/progress.md`; **ưu tiên số 1** vì đây là màn đầu tiên khi demo |
| 3a: báo lỗi riêng từng ô thay vì một câu chung; 4a: không xóa ô mật khẩu | Chi tiết giao diện | 3a sửa kịch bản; 4a sửa code nhỏ |
| Admin: trên `dev`, admin đăng nhập vào khu người học. Khu `/admin` chỉ có ở nhánh chưa push, và có thêm mục Tổng quan, Trò chơi | Nhóm đã bỏ Admin khỏi demo | Merge nhánh admin; kịch bản thêm mục Trò chơi (hoặc bỏ trang Trò chơi) |

### KB 3. Đăng xuất

| Khác biệt | Vì sao | Đề xuất |
|---|---|---|
| Đăng xuất là nút ở thanh bên, không có menu tài khoản | Thiết kế | Sửa kịch bản |
| 4a: không hỏi xác nhận khi đang làm bài kiểm tra | Mỗi câu trả lời đã được lưu ngay nên đăng xuất không mất gì | Sửa code nhỏ (Hồng): hỏi khi đang ở trang làm bài |
| 1a: không có hết phiên khi không thao tác; token hết hạn cứng sau 8 giờ, đang học dở cũng bị đẩy ra. Đăng xuất chỉ xóa token ở trình duyệt | JWT không lưu phiên ở server, và chưa có cơ chế gia hạn token | Sửa code (Hồng, khoảng 0,5–1 ngày): token ngắn (khoảng 30 phút), tự gia hạn khi người dùng còn thao tác |

### KB 4. Đổi mật khẩu

| Khác biệt | Vì sao | Đề xuất |
|---|---|---|
| Đổi xong vẫn ở lại trang (kịch bản: quay về màn chính); không có nút Hủy; 4a không xóa 3 ô | Chi tiết giao diện | Sửa code nhỏ (Hồng, khoảng 1 giờ) |

### KB 5. Học flashcard theo chủ đề

| Khác biệt | Vì sao | Đề xuất |
|---|---|---|
| **Công thức ôn.** Hệ thống dùng các bậc cố định 1/3/7/14/30 ngày: Nhớ rõ lên 1 bậc, Mơ hồ giữ bậc, lên bậc 30 ngày là đã thuộc. Kịch bản tính theo k: Mơ hồ là max(1, k), Nhớ rõ là max(2, 2k), từ 16 ngày trở lên là đã thuộc. Ví dụ từ passport: kịch bản ra 16 ngày, đã thuộc; hệ thống ra 14 ngày, vẫn đang học | Bảng bậc được chốt ngày 25/09 (`docs/api/learning.md`); kịch bản lấy theo Business model | Sửa code (Hồng, khoảng 0,5 ngày): đổi `ReviewScheduler` (module `vocabulary`), `frontend/mock/scheduler.js` và test. Dữ liệu cũ dùng tiếp được vì `interval_days` chính là k |
| Mỗi phiên tối đa 20 thẻ; kịch bản lấy hết từ đến hạn và mọi từ chưa học (30 thẻ) | Giới hạn để phiên không quá dài | Sửa code nhỏ (Hồng): bỏ giới hạn cho phiên theo chủ đề, giữ trần khoảng 100 thẻ |
| Nút "Thoát" ra ngoài luôn, không có màn tổng kết. Màn tổng kết chỉ hiện khi học hết thẻ, và thiếu tên chủ đề cùng "số từ cần ôn ngày mai" | Thiết kế chỉ vẽ màn hoàn thành | Sửa code (Hồng): nút "Kết thúc" mở màn tổng kết các thẻ đã đánh giá; `GET /api/learning/summary` trả thêm số từ đến hạn ngày mai |
| Chủ đề và danh sách riêng nằm ở 2 tab; kịch bản để chung một màn, chia 2 phần | Thiết kế | Sửa kịch bản |
| 6a, 6b: phải bấm vào chủ đề rồi mới báo, và dùng chung một câu cho cả hai trường hợp; kịch bản báo ngay tại màn chọn chủ đề, mỗi trường hợp một câu | Chưa tách hai trường hợp | Sửa code nhỏ (Hồng) |
| 7a: từ không có file âm thanh vẫn nghe được bằng giọng đọc của trình duyệt; kịch bản vô hiệu nút nghe | Cả 180 từ mẫu đều chưa có file âm thanh | Sửa kịch bản |
| Bước 11 "ghi một lượt ôn": hệ thống chỉ cập nhật trạng thái học, không lưu lịch sử từng lượt | Schema V1 không có bảng lượt ôn | Sửa code (Hồng): thêm bảng lượt ôn; KB 16 và KB 26 cũng cần bảng này |

### KB 6. Ôn tập từ đến hạn

| Khác biệt | Vì sao | Đề xuất |
|---|---|---|
| Thứ tự ôn: từ "Mơ hồ" trước, rồi từ quá hạn lâu nhất; kịch bản: Chưa nhớ → Mơ hồ → Nhớ rõ | Chọn lúc làm Phase 3 | Sửa code nhỏ (Hồng): đổi `ORDER BY` trong `findDue` |
| Tối đa 20 thẻ; màn tổng kết thiếu "số từ cần ôn ngày mai" | Như KB 5 | Như KB 5 |
| 1a: khi không có từ cần ôn thì không gợi ý học theo chủ đề | Còn thiếu | Sửa code nhỏ (Hồng) |

Nhánh 3a (từ quá hạn) đã khớp kịch bản.

### KB 7. Quản lý danh sách từ riêng

| Khác biệt | Vì sao | Đề xuất |
|---|---|---|
| Tạo danh sách bằng hộp thoại: gõ "từ — nghĩa" hoặc chọn từ gợi ý. Kịch bản có khu tìm kiếm (bảng kết quả có chủ đề, CEFR) và khu tự nhập 4 ô. Hiện chỉ nhập được phiên âm và câu ví dụ ở trang chi tiết, sau khi đã tạo | Muốn hộp thoại gọn | Sửa code nhỏ (Hồng): thêm ô phiên âm, câu ví dụ, cột chủ đề và CEFR |
| 11a: không chặn hai danh sách trùng tên của cùng một người | Chưa làm | Sửa code (Hồng, backend): trả 409, ràng buộc trùng không phân biệt hoa thường |
| 2a: sửa ngay trên trang chi tiết, mỗi thao tác lưu luôn; kịch bản dùng form sửa rồi bấm Lưu | Lưu từng thao tác thì lỡ thoát cũng không mất | Sửa kịch bản |

### KB 8. Chơi trò chơi từ vựng

| Khác biệt | Vì sao | Đề xuất |
|---|---|---|
| **Không chọn được chủ đề hay danh sách riêng.** Câu hỏi lấy ngẫu nhiên từ ngân hàng câu hỏi dựng sẵn cho 180 từ hệ thống | Ngân hàng câu hỏi được nạp sẵn bằng migration | Sửa code (Hồng, khoảng 1 ngày): sinh câu hỏi từ các từ của chủ đề hoặc danh sách lúc tạo ván; thêm 3a "chưa đủ từ". Làm xong thì từ admin thêm cũng tự vào trò chơi |
| Luật từng trò khác kịch bản: Ghép từ 6 cặp (kịch bản 8 cặp); Trắc nghiệm nhanh hiện nghĩa để chọn từ, 12 câu (kịch bản hiện từ để chọn nghĩa, 10 câu); Đoán nghĩa chọn 1 trong 4, 10 câu, chỉ hiện từ (kịch bản 5 câu, hiện câu ví dụ có từ in đậm) | Làm theo thiết kế LinguaStep | Số câu và chiều hỏi: sửa code nhỏ. **Đoán nghĩa: đã sửa kịch bản (chốt 01/10/2026)** thành đọc câu ví dụ rồi *chọn* nghĩa trong 4 lựa chọn, không gõ nghĩa; code cần thêm câu ví dụ vào câu hỏi |
| Điểm = số câu đúng × 10 + thưởng thời gian; kịch bản không có thưởng (8/10 câu là 80 điểm) | Có thưởng thì đồng hồ mới có ý nghĩa | Sửa kịch bản: thêm luật thưởng |
| Màn kết quả không có bảng các câu sai | Server không trả lại câu sai | Sửa code (Hồng): kết quả nộp ván trả kèm danh sách câu sai |
| 6a: có hỏi xác nhận khi thoát, nhưng đồng hồ vẫn chạy | Còn thiếu | Sửa code nhỏ (Hồng) |
| Hệ thống có thêm bảng xếp hạng tuần/tháng | Thiết kế LinguaStep | Sửa kịch bản: thêm bước xem bảng xếp hạng |

### KB 9. Làm bài đọc hiểu

| Khác biệt | Vì sao | Đề xuất |
|---|---|---|
| **Không có kỹ năng Đọc hiểu.** Tab tương ứng là "Ngữ pháp"; không có bài đọc gắn với câu hỏi, không có bố cục 2 cột | Schema V1 chỉ có grammar, listening, pronunciation | Sửa code: Đạt thêm bảng bài đọc và cột nối câu hỏi, đổi grammar thành đọc hiểu; Hồng làm bố cục 2 cột (khoảng 1,5 ngày cho cả hai) |
| Danh sách bài xếp theo cột trình độ, không lọc được theo chủ đề | Thiết kế | Sửa code nhỏ (Hồng) |
| 12a: mở lại bài thì tự làm tiếp, kèm dải "Làm lại từ đầu" (không hỏi trước); lượt bỏ dở quá 7 ngày thì không làm tiếp | Đã chốt ngày 27/09 (`docs/api/exercises.md`) | Sửa kịch bản: ghi đúng cách này và luật 7 ngày |
| Bước 17 "cộng 1 bài tập vào tiến độ": chưa có | Module B chưa phát `ExerciseCompletedEvent`; backend D chưa có | Sửa code: Đạt phát sự kiện, Nhân ghi nhận vào tiến độ |
| Dữ liệu mẫu chỉ có 1 bài ngữ pháp 2 câu | Mới nạp tối thiểu | Đạt nạp thêm cho demo |

### KB 10. Làm bài viết: chưa có

Còn thiếu toàn bộ:

- kỹ năng Viết với 3 dạng câu (dịch câu, viết lại câu, viết câu theo từ khóa);
- câu trả lời mẫu;
- AI chấm từng câu, từ 0 đến điểm tối đa, bước 0,5, kèm nhận xét;
- trạng thái "Chưa chấm" và nút gửi chấm lại;
- lượt làm chỉ hoàn thành khi mọi câu đã có điểm.

**Đề xuất:** Đạt làm backend, dùng lại Groq đang chạy cho chatbot để chấm; Hồng làm giao diện dựa trên khung bài ngữ pháp. Tổng khoảng 2–3 ngày. Nếu không kịp demo thì ghi KB 10 là "làm sau demo".

### KB 11. Làm bài nghe hiểu

| Khác biệt | Vì sao | Đề xuất |
|---|---|---|
| Câu hỏi hiện ngay cạnh trình phát, không có bước "làm câu hỏi"; phụ đề vẫn bật được khi đang trả lời | Thiết kế | Sửa code nhỏ (Hồng): tự ẩn phụ đề khi bắt đầu trả lời |
| 9a: còn câu trống thì không cho nộp; kịch bản cảnh báo rồi vẫn cho nộp, câu trống tính sai | Chọn chặn để tránh nộp nhầm | Sửa code nhỏ (Hồng): hộp xác nhận giống bài kiểm tra |
| Kết quả không tô vàng đoạn chứa đáp án của câu sai | Database không lưu câu hỏi thuộc đoạn nào | Sửa code: Đạt thêm cột đoạn cho câu hỏi; Hồng tô màu |
| Thư mục `datn/src/main/resources/static/media/listening/` đang rỗng, chưa có `airport.mp3`, nên với backend thật bài nghe mẫu không phát được | Chưa thu âm | Đạt thêm file (tạo bằng TTS là đủ) |

### KB 12. Luyện phát âm

| Khác biệt | Vì sao | Đề xuất |
|---|---|---|
| **Backend luôn trả 503 "chưa cấu hình dịch vụ"**: với backend thật thì không chấm được, chỉ chạy được trên dữ liệu giả | Chưa tích hợp dịch vụ chấm phát âm | Sửa code (Đạt): tích hợp một dịch vụ chấm phát âm, ví dụ Azure Speech có gói miễn phí. Đây là việc lớn nhất của module B |
| Bài phát âm gắn với một lượt làm bài và kết thúc bằng thẻ "Hoàn thành" có % điểm. Kịch bản chỉ có lượt luyện từng mục: tổng kết theo mục (số lần thử, điểm cao nhất) và danh sách bài hiện "đã luyện x/y mục" | Dùng chung khung lượt làm bài với ngữ pháp và nghe | Sửa code nhỏ (Hồng): thêm bảng tổng kết theo mục (dữ liệu đã có sẵn) |
| Hiện 3 điểm phụ (chính xác, trôi chảy, đầy đủ); kịch bản có 2 | Theo chuẩn của Azure | Sửa kịch bản |
| 7a: bản ghi dưới 0,3 giây là quá ngắn; kịch bản dùng 1 giây | Chọn khi làm | Sửa code: đổi 1 hằng số (Hồng) |
| Dữ liệu mẫu chỉ có 2 mục, không có âm thanh mẫu | Mới nạp tối thiểu | Đạt nạp thêm |

### KB 13. Hỏi chatbot

| Khác biệt | Vì sao | Đề xuất |
|---|---|---|
| 6a: AI lỗi thì mất luôn tin nhắn của người học | `ChatService` (module `exercise`) lưu tin nhắn và gọi AI trong cùng một transaction, AI lỗi là hủy cả hai | Sửa code (Đạt): lưu tin của người học trước, gọi AI ngoài transaction |
| 6b: không từ chối câu hỏi ngoài phạm vi học tiếng Anh | Prompt hệ thống chưa có luật này | Sửa code (Đạt): thêm một dòng vào prompt |
| 2a: rời trang rồi quay lại là mở phiên chat mới; phiên cũ phải tự tìm trong "Lịch sử" | Phiên được tạo theo mỗi lần mở trang | Sửa code nhỏ (Đạt và Hồng): tự mở lại phiên gần nhất của bài đó |
| Cần biến `GROQ_API_KEY`; thiếu khóa thì câu hỏi nào cũng báo lỗi | — | Nhóm chốt ai giữ khóa cho buổi demo |

### KB 14. Kiểm tra định kỳ

| Khác biệt | Vì sao | Đề xuất |
|---|---|---|
| Điểm theo thang 0–100, tổng điểm là trung bình % của các kỹ năng; kịch bản thang 10, tổng là điểm các câu cộng lại (8/10) | Đề định kỳ gắn câu vào kỹ năng đọc/viết rồi tính trung bình như đề tổng hợp | Sửa code (Nhân): đề định kỳ tính điểm đạt / tổng điểm; mọi điểm quy về thang 10 |
| 9b: đề đóng khi đang làm thì không tự nộp; lượt làm dở bị treo và không mở lại được | Module kiểm tra không có tác vụ chạy định kỳ | Sửa code (Nhân): tác vụ `@Scheduled` tự nộp lượt dở của đề đã đóng |
| Không có mục "Lịch sử kiểm tra"; đề đã hết hạn thì không xem lại được bài cũ, vì trang kết quả cần nội dung đề qua `GET /api/tests/{id}` mà API này chỉ trả đề đang mở (404) | Chưa làm | Sửa code: Nhân thêm API lịch sử và cho xem đề đã đóng; Hồng làm trang lịch sử |
| Có thêm nút "Làm lại từ đầu" (xóa lượt dở) | Thêm khi làm giao diện | Sửa kịch bản: thêm nhánh này (hoặc bỏ nút) |
| Đề mẫu mở tính từ lúc chạy migration và tự hết hạn sau 7 ngày | Dữ liệu mẫu tính theo `now()` | Nhân: nạp đề theo tuần, hoặc tạo đề ngay trước buổi demo |

Thông báo đề đang mở trên trang chủ: xem KB 2.

### KB 15. Kiểm tra tổng hợp

| Khác biệt | Vì sao | Đề xuất |
|---|---|---|
| Phần Nói gõ chữ thay vì ghi âm | Chưa có chỗ lưu file và chưa chấm giọng nói | Sửa code: Hồng dùng lại bộ ghi âm của phần phát âm; Nhân lưu file và gửi đi chấm (việc lớn) |
| Chấm Nói và Viết là bản giả: Nói so độ giống câu mẫu, Viết chấm theo số từ; không có nhận xét | Chưa nối AI | Sửa code (Nhân): chấm bằng Groq; phần Nói chuyển giọng nói thành chữ trước (ví dụ Whisper) |
| Trình độ đề xuất tính theo bảng ngưỡng điểm, lộ trình là một câu mẫu cố định; kịch bản để AI đề xuất cả hai. Đề 5 câu dễ vẫn ra trình độ C2 | Chưa nối AI; ngưỡng tính trên % và không đòi số câu tối thiểu | Trình độ: **sửa kịch bản** sang bảng quy đổi điểm (minh bạch, lần chấm nào cũng ra cùng kết quả). Lộ trình: sửa code (Nhân) để AI viết. Đề tổng hợp phải đủ 4 phần |
| 14a: AI lỗi thì lượt làm nằm mãi ở "đã nộp", không có chấm lại | Không có tác vụ chạy định kỳ | Sửa code (Nhân): chấm lại định kỳ |
| Làm từng câu một, mỗi câu nghe có file riêng; không có đoạn đọc chung, không chia "phần tiếp theo" | Bảng câu hỏi kiểm tra không có tài liệu chung của đề | Sửa code: Nhân thêm tài liệu đề (bài nghe, đoạn đọc); Hồng hiển thị theo phần |
| 18a: chỉ có link "Xem kế hoạch cá nhân →", không điền sẵn mục tiêu và lộ trình | Backend kế hoạch (D2) chưa có | Sửa code (Hồng và Nhân): chuyển lượt kiểm tra sang trang kế hoạch |

### KB 16. Xem tiến độ

| Khác biệt | Vì sao | Đề xuất |
|---|---|---|
| **Backend tiến độ chưa có** | Chưa làm | Sửa code (Nhân), ưu tiên cao nhất |
| Không có trang "Tiến độ của tôi" riêng; mọi số liệu nằm trên trang chủ | Thiết kế LinguaStep | Sửa kịch bản |
| Chỉ chọn Ngày/Tuần/Tháng với khoảng cố định (7 ngày, 12 tuần, 6 tháng); không chọn được ngày bắt đầu, kết thúc; không có bảng số liệu | Thiết kế | Sửa code (Hồng và Nhân, mức vừa): thêm `from`, `to` cho API và bảng số liệu dưới biểu đồ |
| Tổng quan có 4 thẻ; kịch bản có 6 số (thêm số từ đã thuộc, số bài kiểm tra, điểm trung bình) | Thiết kế | Sửa code nhỏ (Hồng) |
| 7a: chưa có thông báo chúc mừng khi đạt huy hiệu | Backend chưa có | Sửa code (Nhân và Hồng) |
| Có thêm radar 4 kỹ năng, hành trình trình độ, thẻ "Học tiếp" | Thiết kế | Sửa kịch bản: bổ sung |

### KB 17. Lập kế hoạch mới

| Khác biệt | Vì sao | Đề xuất |
|---|---|---|
| **Backend chưa có**, giao diện đang chạy dữ liệu giả | Chưa làm | Sửa `docs/api/plans.md` theo các dòng dưới, rồi Nhân làm backend |
| Chọn mục tiêu gợi ý, hoặc tự chọn trình độ và số tháng; ghi chú không bắt buộc. Kịch bản: mô tả mục tiêu là bắt buộc, chọn ngày bắt đầu và kết thúc | Thiết kế ("Đạt B1 trong 3 tháng") | Sửa code (Hồng) và contract |
| Bảng xem trước không sửa được mục tiêu từng tuần | Chưa làm | Sửa code (Hồng và Nhân) |
| 5a: AI lỗi thì lặng lẽ dùng lộ trình dựng theo luật | Để demo không bị AI làm gián đoạn | Sửa kịch bản (cách này an toàn hơn) |
| Nhắc nhở là công tắc "nhắc học hằng ngày" kèm giờ; kịch bản có 12 nhắc nhở vào 8:00 thứ Hai đầu mỗi tuần | Thiết kế | Sửa code (Nhân và Hồng) theo kịch bản, hiện nhắc nhở trên trang chủ |
| 2b: kế hoạch cũ chuyển "Hoàn thành" mà không hỏi; kịch bản chuyển "Tạm dừng" sau khi hỏi xác nhận | Contract đề xuất như vậy | Sửa contract và code (Hồng) |
| 4b: chỉ chọn được trình độ từ mức hiện tại trở lên, không có cảnh báo | Còn thiếu | Sửa code nhỏ (Hồng) |

### KB 18. Điều chỉnh kế hoạch: chưa có

| Khác biệt | Vì sao | Đề xuất |
|---|---|---|
| "Điều chỉnh mục tiêu" thực chất là lập kế hoạch mới. Không sửa được mục tiêu từng tuần, không đổi được ngày kết thúc, không có "Kết thúc kế hoạch" | Contract chỉ có tạm dừng/tiếp tục | Sửa code: Nhân thêm API sửa tuần, đổi ngày kết thúc, kết thúc kế hoạch; Hồng làm màn điều chỉnh (khoảng 1–1,5 ngày) |

Đã khớp: tạm dừng, tiếp tục, cảnh báo tuần chưa đạt.

### KB 19–22. Admin quản lý từ vựng và chủ đề

Backend đã có API thêm, sửa, xóa từ và chủ đề (module A). Giao diện admin làm đúng luật của kịch bản nhưng chỉ chạy với dữ liệu giả; **backend thật thì còn thiếu các luật đó**.

| KB | Khác biệt | Đề xuất |
|---|---|---|
| 19, 20 | Backend không chặn từ trùng trong cùng chủ đề | Sửa code (Hồng): trả 409 |
| 19, 20 | Không có API tải file âm thanh/ảnh; nút tải lên chỉ chạy với dữ liệu giả | Sửa code (Hồng): API tải file và chỗ lưu file |
| 20 | Từ admin thêm không vào trò chơi | Giải quyết cùng KB 8 |
| 21 | **Backend xóa hẳn từ, kéo theo xóa luôn tiến độ học của mọi người** (`ON DELETE CASCADE`); kịch bản chỉ ẩn từ và giữ lịch sử | Sửa code (Hồng): thêm trạng thái ẩn; chỉ xóa hẳn khi chưa ai học. Thêm cột "số người đã học", "số câu hỏi tham chiếu" |
| 22 | Không chặn trùng tên chủ đề; xóa chủ đề còn từ thì các từ chỉ mất chủ đề, không bị chặn | Sửa code (Hồng) |
| 19–22 | Luồng là vào chủ đề → bảng từ → ngăn kéo sửa; kịch bản là menu 4 lựa chọn | Sửa kịch bản |

### KB 23. Quản lý bài tập

| Khác biệt | Đề xuất |
|---|---|
| Backend chưa có (`docs/api/admin.md` đã đề xuất API) | Sửa code (Đạt) |
| Giao diện soạn bài có 3 kỹ năng (ngữ pháp, nghe, phát âm); kịch bản có đọc hiểu kèm bài đọc và viết kèm câu trả lời mẫu | Sửa code (Hồng), làm sau khi KB 9 và KB 10 có backend |

Đã khớp: trạng thái Nháp/Xuất bản/Ẩn; xóa bài đã có lượt làm thì chỉ ẩn.

### KB 24. Quản lý đề kiểm tra

| Khác biệt | Đề xuất |
|---|---|
| Backend chưa có | Sửa code (Nhân) |
| Không có "thêm câu hỏi từ kho từ vựng" | Sửa code (Hồng và Nhân) |
| Đề tổng hợp luôn mở, không có ngày mở/đóng; kịch bản có (01/10–31/10) | Sửa code nhỏ (Hồng) |
| Có thêm đề nháp và nhân bản đề | Sửa kịch bản: bổ sung |

Đã khớp: đề đã có bài nộp chỉ sửa được tiêu đề và ngày đóng; đề tổng hợp phải đủ 4 kỹ năng; đề đã có lượt làm thì xóa là ẩn.

### KB 25. Quản lý người dùng

| Khác biệt | Đề xuất |
|---|---|
| Backend chưa có (thuộc module `user`) | Sửa code (Hồng) |
| Khóa tài khoản không có hiệu lực ngay: token cũ vẫn dùng được tới 8 giờ, vì chỉ kiểm tra lúc đăng nhập | Sửa code (Hồng): kiểm tra trạng thái ở mỗi request, làm cùng KB 3 |
| Trang chi tiết hiện "Hoạt động gần nhất", chưa có số phiên chat | Sửa code nhỏ (Hồng) |

### KB 26. Xem thống kê

| Khác biệt | Đề xuất |
|---|---|
| Backend chưa có và **chưa ai nhận** | Nhóm chốt người làm |
| "Tổng lượt ôn" không tính được từ database hiện tại | Cần bảng lượt ôn (xem KB 5) |
| Chỉ số khác kịch bản: hệ thống có hai bảng riêng (chủ đề, bài tập); kịch bản gộp thành một bảng, gồm cả đề kiểm tra và cột "số người học" | Sửa code nhỏ (Hồng) |

## Ưu tiên cho buổi demo

1. **Nhân:** backend tiến độ (KB 2, 16), vì trang chủ là màn đầu tiên khi demo.
2. **Đạt:** chấm phát âm thật (KB 12), file âm thanh bài nghe (KB 11), giữ tin nhắn khi AI lỗi và từ chối câu ngoài phạm vi (KB 13).
3. **Hồng:** công thức ôn, thứ tự ôn, màn tổng kết (KB 5, 6); trò chơi theo chủ đề (KB 8); hết phiên khi không thao tác và khóa có hiệu lực ngay (KB 3, 25).
4. **Cả nhóm:** chốt đọc hiểu và bài viết (KB 9, 10) làm trước hay sau demo, vì cả hai đều là việc lớn của module B.

## Điểm cần nhóm quyết định

1. Công thức ôn: đổi theo kịch bản (tính theo k), hay sửa kịch bản theo bảng bậc 1/3/7/14/30 ngày đã chốt?
2. ~~Trò Đoán nghĩa: người học gõ nghĩa hay chọn đáp án?~~ Đã chốt 01/10/2026: chọn nghĩa đúng trong 4 lựa chọn.
3. Trình độ sau kiểm tra tổng hợp: do AI đề xuất hay theo bảng quy đổi điểm?
4. Đọc hiểu (KB 9) và bài viết (KB 10): làm trước hay sau demo?
5. Ai làm backend thống kê (KB 26)?
