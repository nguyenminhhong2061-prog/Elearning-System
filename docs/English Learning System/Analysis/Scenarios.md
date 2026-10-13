# Kịch bản (Scenarios)

Mỗi use case cụ thể trong biểu đồ use case tổng quát có một **kịch bản chuẩn** (standard scenario) với dữ liệu cụ thể và các **kịch bản ngoại lệ** (exceptional scenarios). Kịch bản ngoại lệ được đánh số theo bước xảy ra rẽ nhánh: ví dụ **4a** là nhánh thứ nhất tại bước 4 của kịch bản chuẩn.

## Phạm vi và quy ước

- Use case trừu tượng (Học từ vựng, Làm bài tập, Làm bài kiểm tra, Chọn chủ đề, Làm phần kỹ năng) không có kịch bản riêng. Chúng được thực hiện thông qua kịch bản của các use case con.
- Use case con có quan hệ include (tìm kiếm từ vựng, chọn chủ đề, học thẻ và đánh giá mức nhớ, chọn mục luyện phát âm, ghi âm và chấm phát âm, chọn đề kiểm tra, làm các phần kỹ năng, xem báo cáo kết quả, nhận gợi ý lộ trình) là các bước nằm trong kịch bản của use case chính.
- Use case con có quan hệ extend và có luồng riêng (thêm từ vựng, xóa từ vựng, quản lý chủ đề, lập kế hoạch mới, điều chỉnh kế hoạch) có kịch bản riêng.
- Với quản lý bài tập, quản lý đề kiểm tra và quản lý người dùng, kịch bản chuẩn đi theo chức năng con chính. Các chức năng sửa/xóa đi theo cùng mẫu với sửa/xóa từ vựng; điểm khác biệt được ghi ở kịch bản ngoại lệ.
- Trừ kịch bản 1 (Đăng ký) và 2 (Đăng nhập), mọi kịch bản bắt đầu khi actor đã đăng nhập thành công. Các bước đăng nhập chỉ được mô tả một lần ở kịch bản 2.

**Cách mô tả giao diện (cập nhật 01/10/2026).**

- Giao diện được mô tả theo hệ thống LinguaStep đang chạy, để tận dụng tối đa các màn hình đã có: tên mục trên thanh bên, tên nút, tiêu đề và thông báo ghi đúng chữ trên màn hình (đặt trong ngoặc kép).
- Phần đánh dấu **[Đề xuất]** là giao diện hệ thống chưa có, cần làm thêm. Danh sách tổng hợp ở mục "Giao diện đề xuất thêm" cuối tài liệu.
- Logic nghiệp vụ giữ nguyên: dữ liệu, quy tắc tính, điều kiện kiểm tra, trạng thái được lưu. Chỗ nào hệ thống hiện chạy khác logic này thì kịch bản vẫn theo logic, và phần code cần sửa được ghi ở `So-sanh-kich-ban-he-thong.md`.
- Số thứ tự bước và nhánh ngoại lệ giữ nguyên như bản trước, để các tài liệu thiết kế trích dẫn vẫn đúng.

**Khung giao diện chung.**

- Người học: bên trái là thanh bên gồm năm mục "Tiến độ" (trang chủ), "Từ vựng", "Bài tập", "Kiểm tra", "Kế hoạch"; khối "Trình độ hiện tại"; họ tên người dùng cùng hai liên kết "Đổi mật khẩu" và "← Đăng xuất". Trên điện thoại, thanh bên thu vào nút menu.
- Admin: thanh bên gồm "Tổng quan"; nhóm "Nội dung học" với "Từ vựng", "Bài tập", "Đề kiểm tra"; nhóm "Hệ thống" với "Người dùng"; cùng liên kết "Đổi mật khẩu" và "← Đăng xuất". Thông báo sau khi lưu hiện ở góc màn hình (toast) rồi tự ẩn. Không có mục "Trò chơi": trò chơi lấy từ thẳng từ kho từ vựng và tham số ván chơi cố định, nên admin không cần quản lý trò chơi (Business model).

## Bảng truy vết use case – kịch bản

| Use case | Actor | Kịch bản |
|---|---|---|
| Đăng ký | Người học | 1 |
| Đăng nhập | Thành viên | 2 (và bước đầu của mọi kịch bản khác) |
| Đăng xuất | Thành viên | 3 |
| Đổi mật khẩu | Thành viên | 4 |
| Học flashcard theo chủ đề (gồm Chọn chủ đề, Học thẻ và đánh giá mức nhớ) | Người học | 5 |
| Ôn tập từ đến hạn | Người học | 6 |
| Quản lý danh sách từ riêng | Người học | 7 |
| Chơi trò chơi từ vựng | Người học | 8 |
| Làm bài đọc hiểu | Người học | 9 |
| Làm bài viết | Người học, Dịch vụ AI | 10 |
| Làm bài nghe hiểu | Người học | 11 |
| Luyện phát âm (gồm Chọn mục luyện phát âm, Ghi âm và chấm phát âm) | Người học, Dịch vụ AI | 12 |
| Hỏi chatbot | Người học, Dịch vụ AI | 13 |
| Kiểm tra định kỳ (gồm Chọn đề kiểm tra) | Người học | 14 |
| Kiểm tra tổng hợp (gồm Chọn đề, 4 phần kỹ năng, Xem báo cáo kết quả, Áp dụng lộ trình đề xuất) | Người học, Dịch vụ AI | 15 |
| Xem tiến độ | Người học | 16 |
| Quản lý kế hoạch học – Lập kế hoạch mới (gồm Nhận gợi ý lộ trình) | Người học, Dịch vụ AI | 17 |
| Quản lý kế hoạch học – Điều chỉnh kế hoạch | Người học | 18 |
| Quản lý từ vựng – Sửa từ vựng (gồm Tìm kiếm từ vựng) | Admin | 19 |
| Quản lý từ vựng – Thêm từ vựng | Admin | 20 |
| Quản lý từ vựng – Xóa từ vựng | Admin | 21 |
| Quản lý từ vựng – Quản lý chủ đề | Admin | 22 |
| Quản lý bài tập | Admin | 23 |
| Quản lý đề kiểm tra | Admin | 24 |
| Quản lý người dùng | Admin | 25 |
| Xem thống kê | Admin | 26 |

## Dữ liệu mẫu dùng chung

Các kịch bản dùng chung một bộ dữ liệu để kết quả khớp nhau giữa các kịch bản và dùng lại được cho sequence diagram và test case ở các bước sau.

- Ngày hiện tại: thứ Ba 06/10/2026 (trừ khi kịch bản ghi ngày khác).
- Người học **Trần Thị Lan**: email `lan.tran@gmail.com`, mật khẩu `Lan@2026`, tạo tài khoản ngày 01/09/2026, trình độ hiện tại A2 (theo bài kiểm tra tổng hợp ngày 02/09/2026).
- Admin **Lê Văn Hùng**: email `admin01@englishapp.vn`.
- Người học **Phạm Văn Nam**: email `nam.pv@gmail.com` (dùng ở kịch bản 25).
- **Đỗ Minh Khoa**: người chưa có tài khoản (dùng ở kịch bản 1).
- Chủ đề từ vựng có sẵn: Du lịch (40 từ), Công việc (35 từ), Gia đình (30 từ), Thức ăn (45 từ).
- Trạng thái học của Lan với một số từ thuộc chủ đề Du lịch trước kịch bản 5 (k là khoảng cách giữa ngày ôn gần nhất và ngày ôn tiếp theo):

| Từ | Trạng thái | Ngày ôn gần nhất | Ngày ôn tiếp theo | k |
|---|---|---|---|---|
| itinerary | Đang học | 02/10/2026 | 06/10/2026 | 4 |
| passport | Đang học | 28/09/2026 | 06/10/2026 | 8 |
| luggage | Chưa học | – | – | 0 |
| departure | Chưa học | – | – | 0 |

- Quy tắc tính ngày ôn tiếp theo (theo đề xuất trong Business model): "Chưa nhớ" cho khoảng cách mới 1 ngày; "Nhớ mơ hồ" cho max(1, k) ngày; "Nhớ rõ" cho max(2, 2k) ngày. Nếu khoảng cách mới từ 16 ngày trở lên thì từ ở trạng thái "đã thuộc", ngược lại là "đang học".

## I. Chức năng chung của thành viên

### 1. Use case: Đăng ký

**Kịch bản chuẩn**

1. Đỗ Minh Khoa muốn học tiếng Anh trên hệ thống nhưng chưa có tài khoản. Khoa mở trang web của hệ thống.
2. Giao diện "Đăng nhập" hiện ra với: ô "Email", ô "Mật khẩu", nút "Đăng nhập →" và dòng "Chưa có tài khoản? Đăng ký".
3. Khoa click liên kết "Đăng ký".
4. Giao diện "Tạo tài khoản" hiện ra với: ô "Họ và tên", ô "Email", ô "Mật khẩu", ô "Nhập lại mật khẩu", nút "Đăng ký →" và dòng "Đã có tài khoản? Đăng nhập".
5. Khoa nhập họ tên "Đỗ Minh Khoa", email "khoa.do@gmail.com", mật khẩu "Khoa@1234", nhập lại mật khẩu "Khoa@1234" rồi click nút "Đăng ký →".
6. Hệ thống kiểm tra: không ô nào để trống, email đúng định dạng và chưa được dùng cho tài khoản nào, mật khẩu có ít nhất 8 ký tự, hai lần nhập mật khẩu trùng nhau. Dữ liệu hợp lệ nên hệ thống tạo tài khoản mới với vai trò người học, trạng thái hoạt động, trình độ hiện tại để trống, mật khẩu được lưu ở dạng đã băm.
7. Hệ thống chuyển về giao diện "Đăng nhập". Đầu form có thông báo xanh "Tạo tài khoản thành công. Hãy đăng nhập để bắt đầu học." và ô "Email" được điền sẵn "khoa.do@gmail.com" **[Đề xuất: điền sẵn email]**.

**Kịch bản ngoại lệ**

- **6a.** Email "khoa.do@gmail.com" đã được dùng cho một tài khoản khác: dưới ô "Email" hiện lỗi "Email này đã được đăng ký. Hãy đăng nhập hoặc dùng email khác."; các ô đã nhập được giữ nguyên. Khoa nhập email khác và quay lại bước 5.
- **6b.** Mật khẩu ít hơn 8 ký tự hoặc hai lần nhập mật khẩu không khớp: lỗi hiện ngay dưới ô tương ứng ("Mật khẩu phải có ít nhất 8 ký tự." hoặc "Mật khẩu nhập lại không khớp."). Quay lại bước 5.
- **6c.** Để trống một ô hoặc email sai định dạng (ví dụ "khoa.do@gmail"): lỗi hiện dưới ô đó ("Vui lòng nhập họ và tên.", "Vui lòng nhập email.", "Email không hợp lệ."...). Quay lại bước 5.

### 2. Use case: Đăng nhập

**Kịch bản chuẩn**

1. Buổi sáng 06/10/2026, Trần Thị Lan mở trang web của hệ thống để học.
2. Giao diện "Đăng nhập" hiện ra với: ô "Email", ô "Mật khẩu", nút "Đăng nhập →" và dòng "Chưa có tài khoản? Đăng ký".
3. Lan nhập email "lan.tran@gmail.com", mật khẩu "********" rồi click nút "Đăng nhập →".
4. Hệ thống kiểm tra email và mật khẩu khớp với một tài khoản đang ở trạng thái hoạt động. Tài khoản có vai trò người học.
5. Giao diện chính của người học (trang "Tiến độ") hiện ra với:
   - Thanh bên trái: năm mục "Tiến độ", "Từ vựng", "Bài tập", "Kiểm tra", "Kế hoạch"; khối "Trình độ hiện tại" ghi A2; tên "Trần Thị Lan" cùng hai liên kết "Đổi mật khẩu", "← Đăng xuất",
   - Lời chào "Chào Lan 👋" ở đầu trang, bên dưới là các khối tiến độ (xem kịch bản 16),
   - Khu thông báo gồm: thẻ "Từ cần ôn hôm nay · 2 · Ôn tập ngay →" và thẻ **[Đề xuất]** "Kiểm tra tuần 41 – 2026 đang mở đến 11/10/2026 · Làm bài →" (cùng kiểu với thẻ từ cần ôn).

Nếu tài khoản có vai trò admin (ví dụ admin01@englishapp.vn), ở bước 5 giao diện chính của admin (trang "Tổng quan hệ thống") hiện ra. Thanh bên của admin ứng với năm chức năng: "Từ vựng" (quản lý từ vựng), "Bài tập" (quản lý bài tập), "Đề kiểm tra" (quản lý đề kiểm tra), "Người dùng" (quản lý người dùng) và "Tổng quan" (xem thống kê). Mục "Trò chơi" trên thanh bên của admin cho sửa thời gian ván chơi, trái quy tắc "tham số ván chơi cố định" (mục 6 ở cuối tài liệu) **[Đề xuất: bỏ mục này hoặc chỉ để xem]**.

**Kịch bản ngoại lệ**

- **3a.** Lan để trống email hoặc mật khẩu: lỗi hiện dưới ô còn trống ("Vui lòng nhập email." hoặc "Vui lòng nhập mật khẩu.") và hệ thống không kiểm tra đăng nhập.
- **4a.** Email hoặc mật khẩu không đúng: đầu form hiện thông báo đỏ "Email hoặc mật khẩu không đúng." (không nói rõ sai ở ô nào). Quay lại bước 3.
- **4b.** Tài khoản đã bị admin khóa (xem kịch bản 25): đầu form hiện thông báo đỏ "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên." và hệ thống không cho đăng nhập.

### 3. Use case: Đăng xuất

**Kịch bản chuẩn**

1. Lan đã học xong và đang ở trang "Tiến độ".
2. Lan nhìn xuống cuối thanh bên trái, nơi có tên "Trần Thị Lan".
3. Ngay dưới tên là hai liên kết: "Đổi mật khẩu", "← Đăng xuất".
4. Lan click "← Đăng xuất".
5. Hệ thống kết thúc phiên làm việc của Lan và chuyển về giao diện "Đăng nhập".

**Kịch bản ngoại lệ**

- **4a.** Lan đang làm dở một bài kiểm tra: hộp thoại **[Đề xuất]** "Đăng xuất?" (cùng kiểu hộp thoại "Nộp bài kiểm tra?") hỏi "Bài kiểm tra đang làm sẽ được lưu ở trạng thái đang làm. Bạn có muốn đăng xuất?" với hai nút "Ở lại làm bài" và "Đăng xuất". Nếu Lan chọn ở lại, Lan ở lại trang làm bài; nếu chọn đăng xuất, hệ thống thực hiện bước 5.
- **1a.** Lan không thao tác trong thời gian quá quy định: hệ thống tự kết thúc phiên làm việc. Ở thao tác tiếp theo, Lan được chuyển về giao diện "Đăng nhập" với thông báo "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.".

### 4. Use case: Đổi mật khẩu

**Kịch bản chuẩn**

1. Lan muốn đổi mật khẩu. Lan click liên kết "Đổi mật khẩu" ở cuối thanh bên.
2. Giao diện "Đổi mật khẩu" hiện ra với: ô "Mật khẩu hiện tại", ô "Mật khẩu mới" (gợi ý "Từ 8 đến 72 ký tự."), ô "Nhập lại mật khẩu mới" và nút "Đổi mật khẩu".
3. Lan nhập mật khẩu hiện tại "Lan@2026", mật khẩu mới "Lan#Hoc2026", nhập lại "Lan#Hoc2026" rồi click nút "Đổi mật khẩu".
4. Hệ thống kiểm tra: mật khẩu hiện tại đúng; mật khẩu mới có ít nhất 8 ký tự, khác mật khẩu hiện tại; hai lần nhập mật khẩu mới khớp nhau. Dữ liệu hợp lệ nên hệ thống lưu mật khẩu mới ở dạng đã băm.
5. Đầu form hiện thông báo xanh "Đã đổi mật khẩu thành công." và ba ô được làm trống. Từ lần đăng nhập sau, Lan dùng mật khẩu mới.

**Kịch bản ngoại lệ**

- **3a.** Lan chuyển sang trang khác bằng thanh bên (ví dụ "Tiến độ") mà không bấm "Đổi mật khẩu": hệ thống không thay đổi gì.
- **4a.** Mật khẩu hiện tại không đúng: dưới ô "Mật khẩu hiện tại" hiện lỗi "Mật khẩu hiện tại không đúng.". Quay lại bước 3.
- **4b.** Mật khẩu mới ít hơn 8 ký tự, trùng mật khẩu hiện tại, hoặc hai lần nhập không khớp: lỗi hiện dưới ô tương ứng ("Mật khẩu phải có ít nhất 8 ký tự.", "Mật khẩu mới phải khác mật khẩu hiện tại.", "Mật khẩu nhập lại không khớp."). Quay lại bước 3.

## II. Module A — Học từ vựng

### 5. Use case: Học flashcard theo chủ đề

**Kịch bản chuẩn**

1. Lan đăng nhập thành công (kịch bản 2). Trang "Tiến độ" có thẻ "Từ cần ôn hôm nay · 2 · Ôn tập ngay →". Lan muốn học thêm từ vựng về du lịch.
2. Lan chọn mục "Từ vựng" trên thanh bên.
3. Giao diện "Từ vựng" hiện ra với: dòng "Đã học 87 / 150 từ · 4 chủ đề", ô tìm kiếm "Tìm chủ đề hoặc từ…", dải nhắc "Bạn có 2 từ cần ôn hôm nay · Ôn tập ngay →" (ôn tập từ đến hạn), dải "Trò chơi từ vựng & Bảng xếp hạng · Chơi ngay →" (trò chơi từ vựng) và ba tab "Chủ đề có sẵn" (học theo chủ đề), "Danh sách của tôi (1)" (danh sách từ của tôi), "Lịch sử học".
4. Tab "Chủ đề có sẵn" đang được chọn sẵn.
5. Tab "Chủ đề có sẵn" hiện lưới thẻ chủ đề. Mỗi thẻ có ảnh minh họa (hoặc chữ cái đầu của tên), tên chủ đề và dòng tiến độ "số từ · phần trăm đã học":

| STT | Chủ đề | Dòng tiến độ trên thẻ | Đã học/Tổng số từ |
|---|---|---|---|
| 1 | Du lịch | 40 từ · 30% đã học | 12/40 |
| 2 | Công việc | 35 từ · 57% đã học | 20/35 |
| 3 | Gia đình | 30 từ · 100% đã học | 30/30 |
| 4 | Thức ăn | 45 từ · 56% đã học | 25/45 |

   Danh sách từ riêng nằm ở tab "Danh sách của tôi (1)", mỗi danh sách là một thẻ cùng kiểu:

| STT | Tên danh sách | Dòng tiến độ trên thẻ | Đã học/Tổng số từ |
|---|---|---|---|
| 1 | Từ khó tuần này | 6 từ · 33% đã học | 2/6 |

6. Lan click thẻ "Du lịch". Trang chủ đề "Du lịch" mở ra với mô tả "Sân bay, khách sạn, tham quan", danh sách từ của chủ đề (chấm đánh dấu từ đã học, nhãn CEFR, sắp từ A1 đến C2, nút "Xem thêm từ") và nút "Học 30 từ →" (số thẻ của phiên sắp lập). Lan click nút "Học 30 từ →".
7. Hệ thống lập phiên học gồm 2 từ đến hạn ôn (itinerary, passport) xếp trước và 28 từ chưa học xếp sau, tổng cộng 30 thẻ. 10 từ đã học nhưng chưa đến hạn ôn không được đưa vào phiên. Giao diện "Học chủ đề: Du lịch" hiện ra với:
   - Thanh tiến độ phía trên: mỗi thẻ đã đánh giá là một chấm màu theo mức nhớ, bộ đếm "1/30" và nút **[Đề xuất]** "Kết thúc" (thay cho nút ✕ hiện tại, vốn thoát thẳng mà không có màn tổng kết),
   - Mặt trước của thẻ: từ "itinerary", nút "🔊 Nghe phát âm" và dòng "Bấm vào thẻ để lật",
   - Dòng phím tắt "Space lật thẻ · 1 Chưa nhớ · 2 Nhớ mơ hồ · 3 Nhớ rõ".

   Hệ thống tự phát âm từ "itinerary" một lần.
8. Lan click "🔊 Nghe phát âm" để nghe lại, rồi bấm vào thẻ (hoặc phím Space) để lật.
9. Mặt sau của thẻ hiện ra với: từ "itinerary" kèm phiên âm /aɪˈtɪn.ər.ər.i/, nghĩa "lịch trình (chuyến đi)", hình minh họa, câu ví dụ "Our itinerary includes three days in Da Nang."; bên dưới là ba nút "Chưa nhớ", "Nhớ mơ hồ", "Nhớ rõ".
10. Lan nhớ nghĩa nhưng chưa chắc chắn nên click "Nhớ mơ hồ".
11. Hệ thống ghi một lượt ôn (itinerary, nhớ mơ hồ, 06/10/2026) và cập nhật trạng thái học của từ: k = 4 nên khoảng cách mới là max(1, 4) = 4 ngày, ngày ôn tiếp theo là 10/10/2026, trạng thái "đang học". Thanh tiến độ thêm một chấm và bộ đếm chuyển sang "2/30"; thẻ hiện mặt trước của từ "passport".
12. Lan lặp lại bước 8–11 với ba thẻ tiếp theo. Kết quả hệ thống ghi nhận cho bốn thẻ:

| Thẻ | Từ | Loại | k | Lan đánh giá | Khoảng cách mới | Ngày ôn tiếp theo | Trạng thái mới |
|---|---|---|---|---|---|---|---|
| 1 | itinerary | Đến hạn ôn | 4 | Nhớ mơ hồ | 4 | 10/10/2026 | Đang học |
| 2 | passport | Đến hạn ôn | 8 | Nhớ rõ | 16 | 22/10/2026 | Đã thuộc |
| 3 | luggage | Chưa học | 0 | Nhớ rõ | 2 | 08/10/2026 | Đang học |
| 4 | departure | Chưa học | 0 | Chưa nhớ | 1 | 07/10/2026 | Đang học |

13. Ở thẻ "5/30" (mặt trước của từ "souvenir"), Lan click nút "Kết thúc".
14. Thẻ tổng kết "Hoàn thành phiên học · Du lịch" **[Đề xuất: thêm tên chủ đề vào tiêu đề]** hiện ra với: số thẻ đã học 4 (vòng tròn lớn); dòng mức nhớ "Chưa nhớ: 1 · Nhớ mơ hồ: 1 · Nhớ rõ: 2"; dòng **[Đề xuất]** "Cần ôn vào ngày mai (07/10/2026): 5 từ"; hai nút "Học tiếp" và "Về chủ đề". Thẻ "souvenir" chưa được đánh giá nên không được tính là đã học.
15. Lan click nút "Về chủ đề", rồi quay lại tab "Chủ đề có sẵn". Thẻ chủ đề Du lịch hiển thị "40 từ · 35% đã học" (14/40).

**Kịch bản ngoại lệ**

- **6a.** Lan chọn chủ đề "Gia đình" (đã học 30/30 và chưa có từ nào đến hạn ôn): trang chủ đề "Gia đình" mở ra, nhưng thay cho nút học là khung "Bạn đã học hết chủ đề này. Các từ sẽ được nhắc ôn lại theo lịch."; Lan không bắt đầu được phiên học và quay lại tab "Chủ đề có sẵn".
- **6b.** Lan chọn một chủ đề chưa có từ nào (admin vừa tạo, xem kịch bản 22): thẻ chủ đề ghi "Chưa có từ"; trang chủ đề báo "Chủ đề này chưa có từ nào." và không có nút học.
- **7a.** Từ không có file âm thanh: nút "🔊 Nghe phát âm" bị vô hiệu và hệ thống không tự phát âm **[Đề xuất: hiện hệ thống đọc bằng giọng của trình duyệt khi thiếu file]**. Các bước còn lại giữ nguyên.
- **11a.** Lưu kết quả đánh giá thất bại (ví dụ mất kết nối): dưới thẻ hiện thông báo đỏ "Chưa lưu được kết quả của thẻ này. Vui lòng đánh giá lại." và giữ nguyên mặt sau của thẻ hiện tại. Lan click lại nút đánh giá. Hệ thống không chuyển sang thẻ tiếp theo khi chưa lưu thành công.
- **13a.** Lan đóng trình duyệt thay vì click nút "Kết thúc": kết quả của các thẻ 1–4 đã được lưu ở bước 11; thẻ đang hiển thị không được tính. Không có thẻ tổng kết.

### 6. Use case: Ôn tập từ đến hạn

**Kịch bản chuẩn**

1. Ngày 07/10/2026, Lan đăng nhập thành công. Trang "Tiến độ" có thẻ "Từ cần ôn hôm nay · 5 · Ôn tập ngay →".
2. Lan click thẻ đó. (Lan cũng có thể chọn "Từ vựng" trên thanh bên rồi click dải "Bạn có 5 từ cần ôn hôm nay · Ôn tập ngay →".)
3. Hệ thống lấy tất cả các từ của Lan, thuộc mọi chủ đề, có ngày ôn tiếp theo không muộn hơn 07/10/2026, và sắp xếp theo kết quả lần ôn gần nhất: "Chưa nhớ" trước, rồi "Nhớ mơ hồ", rồi "Nhớ rõ". Giao diện "Ôn tập hôm nay" hiện ra (cùng giao diện thẻ của kịch bản 5) với bộ đếm "1/5" và mặt trước của từ "departure".
4. Lan lật thẻ và đánh giá lần lượt 5 thẻ như bước 8–11 của kịch bản 5. Kết quả hệ thống ghi nhận:

| Thẻ | Từ | Chủ đề | Kết quả lần trước | Ngày ôn gần nhất | k | Lan đánh giá | Khoảng cách mới | Ngày ôn tiếp theo | Trạng thái mới |
|---|---|---|---|---|---|---|---|---|---|
| 1 | departure | Du lịch | Chưa nhớ | 06/10/2026 | 1 | Nhớ rõ | 2 | 09/10/2026 | Đang học |
| 2 | colleague | Công việc | Nhớ mơ hồ | 05/10/2026 | 2 | Nhớ mơ hồ | 2 | 09/10/2026 | Đang học |
| 3 | deadline | Công việc | Nhớ mơ hồ | 03/10/2026 | 4 | Nhớ rõ | 8 | 15/10/2026 | Đang học |
| 4 | recipe | Thức ăn | Nhớ rõ | 29/09/2026 | 8 | Chưa nhớ | 1 | 08/10/2026 | Đang học |
| 5 | ingredient | Thức ăn | Nhớ rõ | 21/09/2026 | 16 | Nhớ rõ | 32 | 08/11/2026 | Đã thuộc |

5. Sau thẻ cuối, thẻ tổng kết "Hoàn thành phiên ôn tập" hiện ra với: số thẻ đã ôn 5; dòng "Chưa nhớ: 1 · Nhớ mơ hồ: 1 · Nhớ rõ: 3"; dòng **[Đề xuất]** "Cần ôn vào ngày mai (08/10/2026): 2 từ (luggage, recipe)"; hai nút "Học tiếp" và "Về từ vựng".
6. Lan click nút "Về từ vựng". Hệ thống trở về giao diện "Từ vựng"; dải "Bạn có … từ cần ôn hôm nay" không còn hiện vì không còn từ đến hạn.

**Kịch bản ngoại lệ**

- **1a.** Lan không có từ nào đến hạn: trang "Tiến độ" và giao diện "Từ vựng" không hiện thẻ, dải nhắc ôn. Nếu Lan vẫn mở trang ôn tập (ví dụ từ một đường dẫn cũ), hệ thống báo "Hôm nay bạn không có từ nào cần ôn. Hãy quay lại vào ngày mai nhé!" kèm nút "← Về từ vựng" và liên kết **[Đề xuất]** "Học theo chủ đề →".
- **3a.** Có từ quá hạn (ví dụ Lan không đăng nhập ba ngày): các từ quá hạn vẫn được đưa vào phiên. Khoảng cách mới được tính theo k đã lên lịch trước đó, và ngày ôn tiếp theo được tính từ ngày Lan thực sự ôn.
- **4a.** Lan kết thúc phiên giữa chừng: các từ chưa được đánh giá giữ nguyên ngày ôn cũ và tiếp tục xuất hiện ở lần ôn sau.
- **4b.** Lưu kết quả đánh giá thất bại: xử lý như 11a của kịch bản 5.

### 7. Use case: Quản lý danh sách từ riêng

**Kịch bản chuẩn**

1. Lan chuẩn bị phỏng vấn xin việc và muốn gom các từ liên quan để học. Lan đăng nhập, chọn "Từ vựng" trên thanh bên rồi mở tab "Danh sách của tôi (1)".
2. Tab "Danh sách của tôi" hiện mỗi danh sách là một thẻ (tên danh sách và dòng "số từ · phần trăm đã học"), cuối cùng là dòng "+ Tạo danh sách mới":

| STT | Tên danh sách | Dòng trên thẻ | Ngày tạo |
|---|---|---|---|
| 1 | Từ khó tuần này | 6 từ · 33% đã học | 28/09/2026 |

   Ngày tạo được lưu cùng danh sách nhưng thẻ không hiển thị; nó được ghi ở bảng để đối chiếu dữ liệu.

3. Lan click "+ Tạo danh sách mới".
4. Hộp thoại "Tạo danh sách riêng" hiện ra với:
   - Ô "Tên danh sách" (gợi ý "VD: Từ vựng du lịch cá nhân"),
   - Ô "Thêm từ" cùng nút "Thêm": gõ chữ để tìm từ trong kho, hoặc gõ từ tự nhập theo dạng "từ — nghĩa" (gợi ý "VD: negotiate — thương lượng"),
   - Khu gợi ý "Có sẵn trong kho từ vựng:" hiện các từ trong kho khớp với chữ đang gõ,
   - Khu "Từ đã chọn" (mỗi từ là một nhãn có nút ✕ để bỏ), nút "Hủy" và nút "Tạo danh sách".
5. Lan nhập tên danh sách "Phỏng vấn xin việc", rồi gõ "interv" vào ô "Thêm từ".
6. Khu "Có sẵn trong kho từ vựng:" hiện các từ trong kho có chứa từ khóa:

| STT | Từ — nghĩa | Chủ đề | CEFR |
|---|---|---|---|
| 1 | interview — buổi phỏng vấn | Công việc | A2 |
| 2 | interviewer — người phỏng vấn | Công việc | B1 |
| 3 | interviewee — người được phỏng vấn | Công việc | B2 |

   Mỗi gợi ý hiện "từ — nghĩa"; chủ đề và mức CEFR được ghi ở bảng trên để đối chiếu dữ liệu.
7. Lan click gợi ý 1 và gợi ý 3. Hai từ được đưa vào khu "Từ đã chọn".
8. Lan gõ "icebreaker — câu chuyện mở đầu để làm quen" vào ô "Thêm từ" rồi click nút "Thêm". Phiên âm và câu ví dụ để trống (có thể bổ sung sau ở trang danh sách, xem nhánh 2a).
9. Khu "Từ đã chọn" hiện ba nhãn, mỗi nhãn có nút ✕ để bỏ:

| STT | Từ — nghĩa | Nguồn |
|---|---|---|
| 1 | interview — buổi phỏng vấn | Kho từ vựng |
| 2 | interviewee — người được phỏng vấn | Kho từ vựng |
| 3 | icebreaker — câu chuyện mở đầu để làm quen | Tự nhập |

10. Lan click nút "Tạo danh sách".
11. Hệ thống kiểm tra tên danh sách không trống và không trùng với danh sách khác của Lan. Hệ thống lưu từ "icebreaker" vào kho từ vựng với người tạo là Lan, không thuộc chủ đề nào, chỉ Lan nhìn thấy; sau đó lưu danh sách "Phỏng vấn xin việc" cùng ba mục trong danh sách.
12. Hộp thoại đóng và trang danh sách "Phỏng vấn xin việc" mở ra với: tên danh sách, dòng "3 từ", nút "Học danh sách này →", danh sách ba từ và khung "Thêm từ vào danh sách". Tab "Danh sách của tôi (2)" có thêm thẻ "Phỏng vấn xin việc · 3 từ · Chưa học" (ngày tạo 06/10/2026); Lan học danh sách này bằng nút "Học danh sách này →" như một chủ đề (kịch bản 5).

**Kịch bản ngoại lệ**

- **2a.** Sửa danh sách: Lan click thẻ một danh sách. Trang danh sách có nút "Đổi tên", nút ✕ "Bỏ khỏi danh sách" ở mỗi từ, và khung "Thêm từ vào danh sách" gồm ô "Tìm từ trong kho từ vựng" (mỗi kết quả có nút "+ Thêm") cùng form tự nhập "Từ tiếng Anh", "Nghĩa", "Phiên âm (không bắt buộc)", "Câu ví dụ (không bắt buộc)". Mỗi thao tác được lưu ngay. Trạng thái học của các từ bị bỏ khỏi danh sách vẫn được giữ.
- **2b.** Xóa danh sách: ở trang danh sách, Lan click "Xóa"; hộp thoại "Xóa danh sách?" hỏi xác nhận, Lan xác nhận. Danh sách và các mục trong danh sách bị xóa; trạng thái học của các từ không bị ảnh hưởng.
- **6a.** Không có từ nào chứa từ khóa: khu gợi ý không hiện từ nào **[Đề xuất: hiện dòng "Không tìm thấy từ phù hợp. Bạn có thể tự nhập theo dạng “từ — nghĩa”."]**. Lan có thể tự nhập từ (bước 8).
- **7a.** Lan thêm một từ đã có trong khu "Từ đã chọn": dưới ô "Thêm từ" hiện lỗi "Từ này đã có trong danh sách." và từ không bị thêm lặp.
- **8a.** Lan để trống phần từ hoặc phần nghĩa của từ tự nhập: dưới ô "Thêm từ" hiện lỗi "Nhập theo dạng “từ — nghĩa”, ví dụ: negotiate — thương lượng. Hoặc chọn một từ gợi ý." và từ không được thêm.
- **11a.** Tên danh sách để trống hoặc trùng với tên một danh sách khác của Lan: lỗi hiện dưới ô "Tên danh sách" **[Đề xuất: "Vui lòng nhập tên danh sách." / "Bạn đã có danh sách tên này."]** và hộp thoại giữ nguyên dữ liệu đã nhập. Quay lại bước 10.

### 8. Use case: Chơi trò chơi từ vựng

**Kịch bản chuẩn**

1. Lan đăng nhập, chọn "Từ vựng" trên thanh bên rồi click dải "Trò chơi từ vựng & Bảng xếp hạng · Chơi ngay →".
2. Trang "Trò chơi từ vựng" hiện ra với: ô chọn **[Đề xuất]** "Chủ đề" ở đầu trang (gồm các chủ đề có sẵn và các danh sách từ riêng), các thẻ trò chơi, và bên cạnh là khối "Bảng xếp hạng tuần" (hệ thống có sẵn, không thuộc kịch bản này). Mỗi thẻ trò chơi có tên, mô tả cách chơi, nhãn thời gian, dòng kỷ lục ("Kỷ lục …" hoặc "Chưa chơi") và nút "Chơi":

| STT | Trò chơi | Mô tả cách chơi trên thẻ | Nhãn thời gian | Dòng kỷ lục |
|---|---|---|---|---|
| 1 | Ghép từ | Ghép 8 cặp từ – nghĩa | 60 giây | Kỷ lục 70 |
| 2 | Trắc nghiệm nhanh | Chọn nghĩa đúng của 10 từ, mỗi từ 4 lựa chọn | 60 giây | Kỷ lục 60 |
| 3 | Đoán nghĩa | Đọc câu ví dụ, chọn nghĩa đúng của từ in đậm trong 4 lựa chọn, 5 câu | 90 giây | Chưa chơi |

   Mô tả cách chơi trên thẻ được ghi theo luật ở bảng trên **[Đề xuất: sửa mô tả hiện có cho khớp luật]**.
3. Lan chọn chủ đề "Du lịch" ở ô "Chủ đề" và click nút "Chơi" ở thẻ "Trắc nghiệm nhanh".
4. Trang trò chơi mở ra với phần giới thiệu (cách chơi, dòng "10 câu · 60 giây · Kỷ lục của bạn: 60", nút "Bắt đầu"); Lan click "Bắt đầu". Hệ thống chọn ngẫu nhiên 10 từ của chủ đề Du lịch; mỗi câu gồm nghĩa đúng và 3 nghĩa sai lấy từ các từ khác cùng chủ đề. Giao diện chơi hiện ra với: ô "Thời gian còn lại 1:00", ô "Điểm tạm tính 0 điểm", nút ✕ "Thoát ván", số thứ tự câu "1/10", từ "souvenir" và bốn ô lựa chọn: A. hộ chiếu, B. quà lưu niệm, C. hành lý, D. lịch trình.
5. Lan click ô B. Ô chuyển xanh kèm dòng "Chính xác!", điểm tạm tính cộng 10 và trò chơi chuyển sang câu 2.
6. Lan trả lời tiếp các câu 2–10. Ở câu 4 (từ "accommodation"), Lan chọn "sự khởi hành": ô Lan chọn chuyển đỏ, đáp án đúng "chỗ ở" được tô xanh kèm dòng "Chưa đúng, đáp án đúng được tô xanh.", rồi trò chơi chuyển câu.
7. Lan trả lời xong câu 10 khi đồng hồ còn 8 giây. Ván chơi kết thúc.
8. Hệ thống tính điểm và lưu lượt chơi: trò chơi trắc nghiệm nhanh, chủ đề Du lịch, đúng 8/10 câu, điểm 80, thời gian 52 giây, ngày 06/10/2026. Kết quả trò chơi không làm thay đổi trạng thái học và lịch ôn của các từ. Thẻ kết quả hiện ra với: nhãn "Kỷ lục mới!" (điểm cao nhất cũ là 60), dòng "Điểm của bạn" và số điểm 80, các dòng "Đúng 8/10 câu", **[Đề xuất]** "Thời gian 52 giây", "Kỷ lục: 80"; hai nút "Chơi lại" và "Chọn trò chơi khác". Bên dưới thẻ là bảng **[Đề xuất]** "Các câu sai":

| Câu | Từ | Lan chọn | Nghĩa đúng |
|---|---|---|---|
| 4 | accommodation | sự khởi hành | chỗ ở |
| 9 | boarding pass | hộ chiếu | thẻ lên máy bay |

9. Lan click nút "Chọn trò chơi khác" để về trang "Trò chơi từ vựng". Thẻ "Trắc nghiệm nhanh" hiển thị "Kỷ lục 80".

**Kịch bản ngoại lệ**

- **3a.** Chủ đề được chọn có ít hơn 4 từ (không đủ để tạo 4 lựa chọn): dưới ô "Chủ đề" hiện thông báo **[Đề xuất]** "Chủ đề chưa đủ từ để chơi trò chơi này" và nút "Bắt đầu" bị vô hiệu.
- **6a.** Lan click nút ✕ "Thoát ván" giữa ván: đồng hồ tạm dừng và hộp thoại "Thoát ván này?" hỏi "Thoát bây giờ sẽ không lưu điểm ván này. Bạn có chắc?". Nếu Lan xác nhận "Thoát ván", hệ thống về trang "Trò chơi từ vựng" và không lưu lượt chơi; nếu Lan hủy, ván chơi tiếp tục.
- **7a.** Hết giờ khi Lan mới trả lời đến câu 7: ván chơi kết thúc, các câu chưa trả lời được tính sai. Hệ thống vẫn tính điểm và lưu lượt chơi như bước 8.

## III. Module B — Làm bài tập

### 9. Use case: Làm bài đọc hiểu

**Kịch bản chuẩn**

1. Lan đăng nhập và chọn mục "Bài tập" trên thanh bên.
2. Giao diện "Bài tập" hiện ra với bốn tab kỹ năng: "Đọc hiểu", "Viết", "Nghe hiểu", "Phát âm" **[Đề xuất: hai tab "Đọc hiểu" và "Viết" thay cho tab "Ngữ pháp" hiện có]**.
3. Lan chọn tab "Đọc hiểu".
4. Tab "Đọc hiểu" hiện dòng "Đã hoàn thành 3 / 5 bài đọc hiểu" và các bài xếp thành cột theo mức CEFR từ A1 đến C2 (từ cơ bản đến nâng cao); cột ứng với trình độ của Lan có nhãn "Trình độ của bạn". Mỗi bài là một thẻ: tiêu đề, nhãn độ khó, dòng "số câu · khoảng N phút", và thanh "Tốt nhất …% · N lần" hoặc dòng "Chưa làm":

| STT | Bài học | Chủ đề | Cột CEFR | Số câu | Dòng kết quả trên thẻ (điểm cao nhất) |
|---|---|---|---|---|---|
| 1 | Thì hiện tại đơn | Thì động từ | A1 | 10 | Tốt nhất 100% |
| 2 | Thì quá khứ đơn | Thì động từ | A2 | 10 | Tốt nhất 90% |
| 3 | A trip to Ha Long Bay | Du lịch | A2 | 8 | Tốt nhất 75% |
| 4 | Thì hiện tại hoàn thành | Thì động từ | B1 | 10 | Chưa làm |
| 5 | Câu bị động | Cấu trúc câu | B1 | 12 | Chưa làm |

5. Lan click thẻ "Thì hiện tại hoàn thành". Bài gồm 7 câu ngữ pháp (trắc nghiệm ngữ pháp và điền chỗ trống) và 3 câu hỏi về bài đọc "Anna's life in Hanoi".
6. Hệ thống tạo một lượt làm bài ở trạng thái đang làm. Giao diện làm bài hiện ra (cùng khung với bài ngữ pháp hiện có) với: liên kết "← Bài tập đọc hiểu" và bộ đếm "Câu 1/10" ở đầu trang, thanh tiến độ các câu, câu 1 (điền chỗ trống) "She ___ (live) in Hanoi since 2020." cùng ô "Đáp án của bạn" (gợi ý "Nhập từ còn thiếu"), liên kết "Gợi ý", nút "Kiểm tra", và nút nổi "Hỏi trợ lý AI" ở góc màn hình.
7. Lan nhập "has lived" và click nút "Kiểm tra".
8. Hệ thống so sánh đáp án với các đáp án được chấp nhận của câu ("has lived", "'s lived"), không phân biệt chữ hoa/thường và bỏ qua khoảng trắng thừa. Đáp án đúng nên hệ thống cộng 1 điểm và hiện khung xanh "✓ Chính xác!" kèm giải thích "Dùng hiện tại hoàn thành với since + mốc thời gian để diễn tả hành động bắt đầu trong quá khứ và kéo dài đến hiện tại.", liên kết "Hỏi trợ lý AI về câu này →" và nút "Câu tiếp theo →".
9. Lan click nút "Câu tiếp theo →". Câu 2/10 (trắc nghiệm ngữ pháp) hiện ra: "I ___ this film before." với bốn lựa chọn: A. see, B. saw, C. have seen, D. am seeing.
10. Lan chọn B và click nút "Kiểm tra".
11. Hệ thống hiện khung đỏ "✗ Chưa đúng. Đáp án đúng: have seen", lựa chọn B tô đỏ, lựa chọn C tô xanh, kèm giải thích "Câu nói về trải nghiệm và không có mốc thời gian cụ thể trong quá khứ nên dùng hiện tại hoàn thành." (Tại bước này Lan có thể hỏi chatbot, xem kịch bản 13.)
12. Lan làm tiếp câu 3–7 theo cách tương tự.
13. Lan click nút "Câu tiếp theo →". Câu 8/10 (câu hỏi về bài đọc) hiện ra. Giao diện chia hai cột **[Đề xuất: khung "Bài đọc" bên trái, cùng bố cục hai cột với bài nghe hiểu]**: cột trái là bài đọc "Anna's life in Hanoi" (4 đoạn, khoảng 200 từ), cột phải là câu hỏi. Đoạn 1 của bài đọc: "Anna is a teacher from Australia. She has lived in Hanoi since 2020. She has visited Ha Long Bay twice, but she hasn't been to Sa Pa yet because she has been busy with her new job." Câu 8: "Why hasn't Anna been to Sa Pa yet?" với bốn lựa chọn: A. She doesn't like cold weather, B. She has been busy with her new job, C. She has already been there twice, D. She lives too far away.
14. Lan chọn B và click nút "Kiểm tra". Hệ thống cộng 1 điểm và hiện khung xanh "✓ Chính xác!" kèm giải thích "Câu cuối của đoạn 1 nêu lý do: because she has been busy with her new job." và nút "Câu tiếp theo →".
15. Lan làm tiếp câu 9 ("How many times has Anna visited Ha Long Bay?") và câu 10 ("Which sentence is TRUE about Anna?") theo cách tương tự; bài đọc vẫn hiển thị ở cột trái.
16. Sau câu 10, Lan click "Xem kết quả". Hệ thống chuyển lượt làm bài sang trạng thái đã nộp với tổng điểm 8/10 (80%) và hiện thẻ kết quả "Hoàn thành bài tập": vòng điểm "Đúng 8 trên 10 câu", dòng "Điểm 80% · Cao nhất 80%", hai nút "Làm lại" và "Bài tiếp theo" (hoặc "Về danh sách" khi không còn bài kế tiếp). Bên dưới là danh sách xem lại từng câu: đề bài, dòng "Bạn trả lời: …", đáp án đúng, giải thích và liên kết "Hỏi trợ lý AI về câu này →":

| Câu | Dạng | Đáp án của Lan | Đáp án đúng | Kết quả |
|---|---|---|---|---|
| 1 | Điền chỗ trống | has lived | has lived | Đúng |
| 2 | Trắc nghiệm ngữ pháp | saw | have seen | Sai |
| 3 | Trắc nghiệm ngữ pháp | have finished | have finished | Đúng |
| 4 | Điền chỗ trống | have known | have known | Đúng |
| 5 | Trắc nghiệm ngữ pháp | yet | yet | Đúng |
| 6 | Điền chỗ trống | has went | has gone | Sai |
| 7 | Trắc nghiệm ngữ pháp | for | for | Đúng |
| 8 | Câu hỏi về bài đọc | She has been busy with her new job | She has been busy with her new job | Đúng |
| 9 | Câu hỏi về bài đọc | Twice | Twice | Đúng |
| 10 | Câu hỏi về bài đọc | She has learned some Vietnamese | She has learned some Vietnamese | Đúng |

17. Hệ thống lưu kết quả vào lịch sử làm bài và cộng 1 bài tập hoàn thành vào tiến độ ngày 06/10/2026. Lan click liên kết "← Bài tập đọc hiểu"; thẻ bài "Thì hiện tại hoàn thành" hiển thị "Tốt nhất 80% · 1 lần".

**Kịch bản ngoại lệ**

- **7a.** Lan chưa nhập hoặc chưa chọn đáp án: nút "Kiểm tra" bị vô hiệu cho đến khi có đáp án.
- **7b.** Lan click liên kết "Gợi ý": dòng "Gợi ý: Chú ý từ since" hiện ra mà không có đáp án; điểm của câu không bị trừ.
- **12a.** Lan thoát giữa bài (ví dụ sau câu 5) bằng liên kết "← Bài tập đọc hiểu" hoặc thanh bên: các câu đã trả lời đã được lưu từng câu nên hệ thống không cần hỏi xác nhận. Lượt làm bài giữ trạng thái đang làm và chưa được tính vào tiến độ; thẻ bài hiện dòng "Đang làm dở · 5/10 câu". Lần sau mở bài này, hệ thống mở đúng câu 6 kèm dải "Làm tiếp từ lần trước. Giữ lại 5 câu đã trả lời." có nút "Làm lại từ đầu": Lan cứ làm tiếp, hoặc bấm nút này để làm lại từ đầu.
- **16a.** Lan click nút "Làm lại": hệ thống tạo một lượt làm bài mới. Thẻ bài hiển thị điểm cao nhất trong các lượt.

### 10. Use case: Làm bài viết

Toàn bộ giao diện bài viết là **[Đề xuất]**. Nó dùng lại khung của bài đọc hiểu (kịch bản 9): danh sách bài theo cột CEFR, màn làm từng câu, thẻ kết quả và danh sách xem lại. Phần mới chỉ gồm ô soạn câu nhiều dòng, trạng thái chấm của AI và khung điểm có nhận xét.

**Kịch bản chuẩn**

1. Lan đăng nhập, chọn mục "Bài tập" trên thanh bên rồi chọn tab "Viết".
2. Tab "Viết" hiện dòng "Đã hoàn thành 1 / 4 bài viết" và các bài xếp thành cột theo mức CEFR, mỗi bài là một thẻ như bài đọc hiểu:

| STT | Bài học | Chủ đề | Cột CEFR | Số câu | Dòng kết quả trên thẻ (điểm cao nhất) |
|---|---|---|---|---|---|
| 1 | Viết câu về gia đình | Gia đình | A1 | 5 | Tốt nhất 90% |
| 2 | Gọi món ở nhà hàng | Thức ăn | A2 | 6 | Chưa làm |
| 3 | Viết về chuyến đi | Du lịch | A2 | 6 | Chưa làm |
| 4 | Email công việc ngắn | Công việc | B1 | 5 | Chưa làm |

3. Lan click thẻ "Viết về chuyến đi". Bài gồm 6 câu, mỗi câu 2 điểm: 2 câu dịch câu, 2 câu viết lại câu, 2 câu viết câu theo từ khóa.
4. Hệ thống tạo một lượt làm bài ở trạng thái đang làm. Giao diện làm bài hiện ra với: liên kết "← Bài tập viết" và bộ đếm "Câu 1/6", thanh tiến độ các câu, nhãn dạng câu "Dịch câu", đề bài "Dịch sang tiếng Anh: Tôi đã đặt phòng khách sạn trước hai tuần.", ô soạn câu trả lời nhiều dòng, liên kết "Gợi ý", nút "Kiểm tra" và nút nổi "Hỏi trợ lý AI".
5. Lan nhập "I booked the hotel room before two weeks." và click nút "Kiểm tra".
6. Hệ thống lưu câu trả lời, hiện trạng thái "Đang chấm…" thay cho nút "Kiểm tra" và gửi đến Dịch vụ AI: đề bài, dạng câu, điểm tối đa của câu (2), các câu trả lời mẫu ("I booked the hotel room two weeks in advance.", "I booked a hotel room two weeks ahead.") và câu trả lời của Lan.
7. Dịch vụ AI trả về điểm 1.0/2 và nhận xét: "Chia đúng thì quá khứ đơn và đủ ý. 'before two weeks' không phải cách nói tự nhiên; để nói làm việc gì trước bao lâu, dùng 'two weeks in advance' hoặc 'two weeks ahead'. Câu gợi ý: I booked the hotel room two weeks in advance."
8. Hệ thống lưu điểm và nhận xét vào câu trả lời, rồi hiện khung chấm (mở rộng từ khung "✓ Chính xác!" của bài đọc hiểu) gồm: điểm "1.0/2", nhận xét của AI, các câu trả lời mẫu, giải thích của câu ("in advance nghĩa là trước một thời điểm; before chỉ đứng sau khoảng thời gian khi có mốc đi kèm, ví dụ two weeks before the trip."), liên kết "Hỏi trợ lý AI về câu này →" và nút "Câu tiếp theo →". (Tại bước này Lan có thể hỏi chatbot, xem kịch bản 13.)
9. Lan click nút "Câu tiếp theo →". Câu 2/6 (viết lại câu) hiện ra: câu gốc "It took us three hours to get to Da Lat." và phần mở đầu cho sẵn "We spent …".
10. Lan nhập "We spent three hours getting to Da Lat." và click nút "Kiểm tra". Hệ thống thực hiện như bước 6–8; Dịch vụ AI trả về điểm 2.0/2 và nhận xét "Chính xác, giữ nguyên nghĩa câu gốc và dùng đúng cấu trúc spend + thời gian + V-ing."
11. Lan click nút "Câu tiếp theo →". Câu 3/6 (viết câu theo từ khóa) hiện ra với các từ khóa gợi ý: "luggage / heavy / carry".
12. Lan nhập "My luggage was too heavy to carry." và click nút "Kiểm tra". Dịch vụ AI trả về điểm 2.0/2 và nhận xét "Dùng đủ ba từ khóa, câu đúng ngữ pháp (too + tính từ + to V)."
13. Lan làm tiếp câu 4–6 theo cách tương tự.
14. Sau khi câu 6 được chấm, Lan click "Xem kết quả". Mọi câu đều đã có điểm nên hệ thống chuyển lượt làm bài sang trạng thái đã nộp với tổng điểm 10/12 (83%) và hiện thẻ kết quả "Hoàn thành bài tập": vòng điểm, dòng "Điểm 83% · Cao nhất 83%", hai nút "Làm lại" và "Bài tiếp theo". Bên dưới là danh sách xem lại từng câu (đề bài, câu trả lời của Lan, điểm, tóm tắt nhận xét); mỗi câu có liên kết **[Đề xuất]** "Xem chi tiết" để đọc lại nhận xét đầy đủ, các câu trả lời mẫu và giải thích.

| Câu | Dạng | Đề bài | Câu trả lời của Lan | Điểm | Nhận xét của AI (tóm tắt) |
|---|---|---|---|---|---|
| 1 | Dịch câu | Tôi đã đặt phòng khách sạn trước hai tuần. | I booked the hotel room before two weeks. | 1.0/2 | "before two weeks" chưa tự nhiên, nên dùng "two weeks in advance" |
| 2 | Viết lại câu | It took us three hours to get to Da Lat. → We spent … | We spent three hours getting to Da Lat. | 2.0/2 | Chính xác |
| 3 | Viết câu theo từ khóa | luggage / heavy / carry | My luggage was too heavy to carry. | 2.0/2 | Đủ từ khóa, đúng ngữ pháp |
| 4 | Dịch câu | Chuyến bay của chúng tôi bị hoãn vì thời tiết xấu. | Our flight was delay because of bad weather. | 1.5/2 | Câu bị động cần "was delayed" |
| 5 | Viết lại câu | This is the first time I have visited Hue. → I have never … | I have never visited Hue before. | 2.0/2 | Chính xác |
| 6 | Viết câu theo từ khóa | passport / check / airport | The officer check my passport at the airport. | 1.5/2 | Chia động từ: "checked" |

15. Hệ thống lưu kết quả vào lịch sử làm bài và cộng 1 bài tập hoàn thành vào tiến độ ngày 06/10/2026. Lan click liên kết "← Bài tập viết"; thẻ bài "Viết về chuyến đi" hiển thị "Tốt nhất 83% · 1 lần".

**Kịch bản ngoại lệ**

- **5a.** Ô trả lời trống: nút "Kiểm tra" bị vô hiệu cho đến khi Lan nhập câu trả lời.
- **5b.** Lan click liên kết "Gợi ý": dòng "Gợi ý: Chú ý cách nói 'trước bao lâu' trong tiếng Anh" hiện ra mà không có câu trả lời mẫu; điểm của câu không bị trừ.
- **7a.** Câu trả lời lạc đề, không viết bằng tiếng Anh hoặc không dùng đủ từ khóa: Dịch vụ AI vẫn trả về điểm (có thể là 0) kèm nhận xét nêu rõ lỗi, ví dụ "Thiếu từ khóa carry". Hệ thống lưu và hiển thị như bước 8.
- **7b.** Dịch vụ AI lỗi hoặc quá thời gian chờ: khung chấm hiện thông báo đỏ "Chưa chấm được câu này" kèm nút "Gửi chấm lại" (dùng lại câu trả lời đã lưu). Câu trả lời chưa có điểm và hệ thống không tự đặt điểm. Lan có thể gửi chấm lại ngay hoặc click "Câu tiếp theo →"; câu này được đánh dấu "Chưa chấm" trên thanh tiến độ.
- **8a.** Lan muốn sửa câu trả lời đã được chấm: ô soạn câu đã khóa, không sửa được trong lượt này. Muốn viết lại, Lan click nút "Làm lại" ở thẻ kết quả (nhánh 14b).
- **13a.** Lan thoát giữa bài (ví dụ sau câu 3): như nhánh 12a của kịch bản 9, các câu đã chấm được giữ và lượt làm bài chưa được tính vào tiến độ. Lần sau mở bài, hệ thống mở câu 4 kèm dải "Làm tiếp từ lần trước…" có nút "Làm lại từ đầu".
- **14a.** Làm xong câu 6 nhưng còn câu chưa chấm (nhánh 7b): thẻ kết quả chưa có tổng điểm mà báo "Còn 1 câu chưa chấm" kèm nút "Gửi chấm lại các câu chưa chấm". Lượt làm bài giữ trạng thái đang làm và chưa được tính vào tiến độ; khi mọi câu đã có điểm, hệ thống thực hiện bước 14–15. Nếu Lan thoát, lần sau mở bài hệ thống cho gửi chấm lại các câu này.
- **14b.** Lan click nút "Làm lại": hệ thống tạo một lượt làm bài mới. Thẻ bài hiển thị điểm cao nhất trong các lượt.

### 11. Use case: Làm bài nghe hiểu

**Kịch bản chuẩn**

1. Lan đăng nhập, chọn mục "Bài tập" trên thanh bên rồi chọn tab "Nghe hiểu".
2. Tab "Nghe hiểu" hiện các bài nghe xếp thành cột theo mức CEFR; mỗi bài là một thẻ: tiêu đề, nhãn độ khó, dòng "số câu · khoảng N phút" và dòng kết quả gần nhất **[Đề xuất: thẻ bài nghe hiện kết quả gần nhất, ví dụ "Gần nhất 4/5", thay cho thanh điểm cao nhất]** hoặc "Chưa làm":

| STT | Bài nghe | Chủ đề | Cột CEFR | Thời lượng | Kết quả gần nhất |
|---|---|---|---|---|---|
| 1 | Booking a hotel room | Du lịch | A2 | 1:40 | 4/5 |
| 2 | At the airport check-in | Du lịch | A2 | 2:15 | Chưa làm |
| 3 | A job interview | Công việc | B1 | 3:05 | Chưa làm |

3. Lan click thẻ "At the airport check-in".
4. Giao diện bài nghe hiện ra, chia hai cột. Cột trái là khung "Bài nghe": trình phát (nút "Phát"/"Tạm dừng", thanh tua có thời gian, nút **[Đề xuất]** "Lùi 5 giây", các nút tốc độ "0.75x", "1x", "1.25x", mặc định 1x), khu "Bản chép lời" với công tắc "Hiện phụ đề" (mặc định tắt) và dòng hướng dẫn "Nghe trước, bật phụ đề khi cần đọc theo. Bạn có thể trả lời câu hỏi bất cứ lúc nào, kể cả khi chưa nghe hết." Cột phải là danh sách câu hỏi của bài cùng nút "Nộp bài".
5. Lan chọn tốc độ "0.75x", bật công tắc "Hiện phụ đề" rồi click nút "Phát".
6. Hệ thống phát bài nghe; phụ đề hiện theo từng đoạn trong khu "Bản chép lời" và đoạn đang phát được tô sáng, ví dụ đoạn 2 (0:18–0:31): "Could I see your passport and boarding pass, please?".
7. Lan nghe hết bài, bấm vào đoạn 3 trong "Bản chép lời" để nghe lại đoạn đó (bấm một đoạn là phát từ đầu đoạn) rồi bắt đầu trả lời ở cột câu hỏi.
8. Cột câu hỏi có 5 câu trắc nghiệm và nút "Nộp bài". Khi Lan chọn đáp án đầu tiên, công tắc "Hiện phụ đề" tự tắt và bị khóa để bài làm khách quan **[Đề xuất: hiện công tắc vẫn bật được trong lúc trả lời]**; trình phát vẫn dùng được. Ví dụ câu 1: "Where is the man flying to?" với bốn lựa chọn: A. Hanoi, B. Da Nang, C. Singapore, D. Bangkok.
9. Lan chọn đáp án cho cả 5 câu rồi click nút "Nộp bài".
10. Hệ thống chấm điểm, lưu lượt làm bài và hiện thẻ kết quả "Hoàn thành bài nghe" ở đầu cột câu hỏi: vòng điểm "Đúng 4 trên 5 câu", dòng "Điểm 80% · Cao nhất 80%", nút "Làm lại" và nút "Bài tiếp theo"/"Về danh sách". Dưới mỗi câu hiện khung xanh "✓ Chính xác!" hoặc khung đỏ "✗ Chưa đúng. Đáp án đúng: …":

| Câu | Câu hỏi | Đáp án của Lan | Đáp án đúng | Kết quả |
|---|---|---|---|---|
| 1 | Where is the man flying to? | Singapore | Singapore | Đúng |
| 2 | How many bags does he check in? | Two | One | Sai |
| 3 | What seat does he ask for? | Window seat | Window seat | Đúng |
| 4 | What time does boarding start? | 9:15 | 9:15 | Đúng |
| 5 | Which gate should he go to? | Gate 12 | Gate 12 | Đúng |

   Cột trái hiện transcript đầy đủ theo từng đoạn và có thêm công tắc "Hiện bản dịch" để xem bản dịch tiếng Việt của từng đoạn. Đoạn chứa đáp án của câu sai được tô vàng **[Đề xuất]** (đoạn 3: "Just one suitcase to check in, and this backpack as hand luggage."). Bấm một đoạn để nghe lại đoạn đó.

11. Lan bấm đoạn 3 để nghe lại và đối chiếu, sau đó click liên kết "← Bài tập nghe hiểu". Thẻ bài nghe hiển thị kết quả gần nhất 4/5; tiến độ ngày được cộng 1 bài tập hoàn thành.

**Kịch bản ngoại lệ**

- **5a.** File âm thanh không tải được: trình phát bị vô hiệu và khung "Bài nghe" hiện thông báo **[Đề xuất]** "Không tải được bài nghe, vui lòng thử lại" kèm nút "Tải lại". Các câu hỏi bị khóa **[Đề xuất]** cho đến khi tải được bài nghe.
- **7a.** Lan trả lời câu hỏi khi chưa nghe hết bài: hệ thống vẫn cho phép (như dòng hướng dẫn ở bước 4).
- **9a.** Lan nộp bài khi còn câu chưa trả lời: hộp thoại **[Đề xuất]** "Nộp bài?" (cùng kiểu hộp thoại "Nộp bài kiểm tra?") cảnh báo "Còn 1 câu chưa trả lời. Câu chưa trả lời được tính sai." Nếu Lan xác nhận nộp, câu chưa trả lời được tính sai. (Hiện hệ thống chỉ báo "Bạn còn 1 câu chưa trả lời." và không cho nộp.)

### 12. Use case: Luyện phát âm

**Kịch bản chuẩn**

1. Lan đăng nhập, chọn mục "Bài tập" trên thanh bên rồi chọn tab "Phát âm".
2. Tab "Phát âm" hiện các bài luyện xếp thành cột theo mức CEFR; mỗi bài là một thẻ: tiêu đề, dòng "số mục · khoảng N phút" và dòng **[Đề xuất]** "Đã luyện x/y mục":

| STT | Bài luyện | Chủ đề | Cột CEFR | Số mục | Đã luyện |
|---|---|---|---|---|---|
| 1 | Nguyên âm dài và ngắn /iː/ – /ɪ/ | Phát âm cơ bản | A1 | 6 | 6 |
| 2 | Âm /θ/ và /ð/ | Phát âm cơ bản | A2 | 5 | 0 |
| 3 | Câu giao tiếp ở sân bay | Du lịch | A2 | 5 | 2 |

3. Lan click thẻ "Âm /θ/ và /ð/".
4. Giao diện luyện phát âm hiện ra với: liên kết "← Bài tập phát âm" và tên bài ở đầu trang, mục 1 (nhãn "Câu 1/5") hiển thị văn bản mẫu "Thank you for the three tickets.", phiên âm IPA /θæŋk juː fɔː ðə θriː ˈtɪk.ɪts/, nút "Nghe mẫu", nút micro tròn với dòng "Bấm micro để ghi âm và chấm điểm phát âm", và nút "Bỏ qua mục này". Các mục được luyện lần lượt từng mục một.
5. Lan click nút "Nghe mẫu"; hệ thống phát âm thanh mẫu.
6. Lan click nút micro. Đây là lần đầu nên trình duyệt hỏi quyền dùng micro; Lan chọn cho phép. Nút micro chuyển thành nút dừng, dòng chữ đổi thành "Đang ghi âm 0:01 / 0:10, bấm để dừng".
7. Lan đọc câu mẫu rồi bấm nút dừng (bản ghi dài 3 giây).
8. Hệ thống hiện trạng thái đang chấm (vòng quay) và gửi bản ghi âm cùng văn bản mẫu đến Dịch vụ AI.
9. Dịch vụ AI trả về kết quả: điểm độ chính xác 68, điểm độ trôi chảy 80, điểm tổng 72; hai từ "the" và "three" phát âm chưa đúng, kèm nhận xét cho từng từ.
10. Hệ thống lưu lượt luyện (mục 1, lần thử 1, điểm tổng 72) và hiển thị kết quả gồm:
    - Vòng điểm 72/100 và dòng "Chính xác 68 · Trôi chảy 80" **[Đề xuất: bỏ chỉ số "Đầy đủ" mà màn hiện có]**,
    - Câu mẫu với hai từ "the" và "three" tô đỏ, mỗi từ kèm điểm và lỗi (ví dụ "three (40 điểm, đọc chưa chuẩn)"),
    - Danh sách gợi ý: "three: âm /θ/ bị đọc thành /t/. Đặt đầu lưỡi giữa hai hàm răng và đẩy hơi nhẹ ra, không bật lưỡi.",
    - Nút "▶ Nghe lại giọng bạn", nút micro để ghi âm lại, nút "Tiếp tục" sang mục tiếp theo, và nút nổi "Hỏi trợ lý AI".
11. Lan bấm nút micro lần nữa để ghi âm lại và thực hiện lại bước 6–9. Lần này Dịch vụ AI trả về điểm tổng 86 (độ chính xác 85, độ trôi chảy 88). Hệ thống lưu lượt luyện mới (mục 1, lần thử 2) và vẫn giữ lượt thử 1.
12. Lan click nút "Tiếp tục" và luyện các mục 2–5 theo cách tương tự.
13. Ở mục 5, nút "Tiếp tục" đổi thành "Xem kết quả"; Lan click nút này. Thẻ kết quả "Hoàn thành bài luyện phát âm" hiện vòng điểm trung bình, dòng "Đã luyện 5/5 mục · điểm trung bình 84" và danh sách "Điểm tốt nhất từng mục", mỗi dòng thêm số lần thử **[Đề xuất]**:

| Mục | Văn bản mẫu | Số lần thử | Điểm cao nhất |
|---|---|---|---|
| 1 | Thank you for the three tickets. | 2 | 86 |
| 2 | this – these – those | 1 | 90 |
| 3 | I think my brother is thirty. | 3 | 78 |
| 4 | Both of them went together. | 1 | 82 |
| 5 | The weather is better on Thursday. | 2 | 84 |

14. Lan click "Về danh sách" để về tab "Phát âm". Thẻ bài "Âm /θ/ và /ð/" hiển thị "Đã luyện 5/5 mục"; tiến độ ngày được cộng 1 bài tập hoàn thành.

**Kịch bản ngoại lệ**

- **6a.** Lan từ chối quyền dùng micro: hệ thống báo "Trình duyệt chưa cho phép dùng micro. Hãy cho phép quyền micro (biểu tượng ổ khóa cạnh thanh địa chỉ)…"; nút micro không ghi âm được cho đến khi có quyền. Không có lượt luyện nào được tạo.
- **7a.** Bản ghi rỗng hoặc ngắn hơn 1 giây: hệ thống báo "Bản ghi quá ngắn. Hãy bấm dừng sau khi đọc xong." và không gửi đến Dịch vụ AI.
- **9a.** Dịch vụ AI không nhận diện được giọng nói (quá ồn hoặc đọc sai câu): hệ thống báo "Không nhận diện được giọng nói. Hãy nói to, rõ và gần micro hơn rồi thử lại." và không lưu điểm.
- **9b.** Dịch vụ AI lỗi hoặc quá thời gian chờ: hệ thống báo "Chưa chấm được lúc này vì dịch vụ chấm phát âm đang bận. Hãy thử lại sau ít phút." kèm nút "Thử lại" (dùng lại bản ghi vừa rồi). Hệ thống không lưu lượt luyện và không hiển thị điểm giả.
- **10a.** Lan click nút "Hỏi trợ lý AI": khung chat mở ra với ngữ cảnh là mục đang luyện và kết quả chấm (xem kịch bản 13).
- **12a.** Lan thoát giữa bài (liên kết "← Bài tập phát âm" hoặc thanh bên): các lượt luyện đã chấm thành công vẫn được lưu; dòng "Đã luyện" của bài đếm các mục có ít nhất một lượt chấm thành công.

### 13. Use case: Hỏi chatbot

**Kịch bản chuẩn**

1. Lan đang làm bài đọc hiểu "Thì hiện tại hoàn thành" (kịch bản 9) và vừa nhận kết quả sai ở câu 2 (chọn "saw", đáp án đúng là "have seen").
2. Lan click liên kết "Hỏi trợ lý AI về câu này →" dưới khung "✗ Chưa đúng" (hoặc nút nổi "Hỏi trợ lý AI" ở góc màn hình).
3. Khung chat "Trợ lý AI" mở ra bên cạnh bài tập với: liên kết "Lịch sử", nút ✕ đóng, dòng ngữ cảnh **[Đề xuất]** "Câu 2 – Thì hiện tại hoàn thành: I ___ this film before. Bạn chọn: saw (sai)", lời chào "Bạn cần giải thích gì trong bài đang làm?", các câu hỏi gợi ý bấm nhanh, ô "Nhập câu hỏi của bạn…" và nút gửi. Hệ thống tạo một phiên chat gắn với bài học và câu hỏi này.
4. Lan nhập "Tại sao không dùng saw? Mình đã xem phim đó trong quá khứ mà." và click nút gửi.
5. Hệ thống hiện câu hỏi của Lan trong khung chat kèm biểu tượng "Trợ lý đang trả lời" (ba chấm). Hệ thống tìm các đoạn kiến thức liên quan ("Hiện tại hoàn thành – dấu hiệu nhận biết", "Phân biệt quá khứ đơn và hiện tại hoàn thành") rồi gửi câu hỏi, ngữ cảnh bài tập và các đoạn kiến thức đó đến Dịch vụ AI.
6. Dịch vụ AI trả lời: "Câu này không nói thời điểm xem phim. Khi chỉ muốn nói về trải nghiệm (đã từng làm gì) mà không có mốc thời gian, ta dùng hiện tại hoàn thành: I have seen this film before. Nếu có mốc thời gian cụ thể như last week, ta dùng quá khứ đơn: I saw this film last week."
7. Hệ thống lưu tin nhắn của Lan, câu trả lời của AI và các đoạn kiến thức được viện dẫn, rồi hiện câu trả lời trong khung chat, bên dưới có dòng "Nguồn: Phân biệt quá khứ đơn và hiện tại hoàn thành".
8. Lan hỏi tiếp: "Cho mình thêm 2 ví dụ với ever và never." Hệ thống thực hiện lại bước 5–7 trong cùng phiên chat, và AI trả lời bằng hai ví dụ.
9. Lan click nút ✕ "Đóng trợ lý AI". Hệ thống ẩn khung chat; Lan tiếp tục bài tập ở đúng câu 2 như trước khi mở chat.

**Kịch bản ngoại lệ**

- **2a.** Lan mở lại chatbot trong cùng bài tập: hệ thống mở lại phiên chat đã gắn với bài học và hiển thị các tin nhắn cũ **[Đề xuất: tự nạp phiên của bài khi Lan quay lại bài vào lần sau; hiện phiên chỉ được giữ trong lần mở trang, phiên cũ phải mở thủ công ở "Lịch sử" → "Lịch sử trò chuyện"]**.
- **4a.** Ô nhập câu hỏi trống: nút gửi bị vô hiệu.
- **5a.** Lan hỏi về một câu chưa được kiểm tra (ví dụ câu 3 khi chưa click nút "Kiểm tra"): chatbot chỉ gợi ý hướng suy nghĩ, không nêu đáp án.
- **6a.** Dịch vụ AI lỗi hoặc quá thời gian chờ: dưới câu hỏi của Lan hiện "Trợ lý AI không thể trả lời lúc này, hãy thử lại sau." kèm nút "Gửi lại". Tin nhắn của Lan vẫn được lưu; hệ thống không lưu câu trả lời rỗng.
- **6b.** Câu hỏi không liên quan đến việc học tiếng Anh: chatbot lịch sự từ chối và gợi ý quay lại nội dung bài học.

## IV. Module C — Kiểm tra

### 14. Use case: Kiểm tra định kỳ

**Kịch bản chuẩn**

1. Tối 06/10/2026, Lan đăng nhập. Trang "Tiến độ" có thẻ thông báo **[Đề xuất]** "Kiểm tra tuần 41 – 2026 đang mở đến 11/10/2026 · Làm bài →" (kịch bản 2). Lan chọn mục "Kiểm tra" trên thanh bên.
2. Trang "Kiểm tra" hiện ra với ba khối: "Kiểm tra định kỳ", "Kiểm tra tổng hợp" và **[Đề xuất]** "Lịch sử kiểm tra" (các lượt đã nộp, mở lại được báo cáo kết quả).
3. Lan xem khối "Kiểm tra định kỳ".
4. Khối "Kiểm tra định kỳ" liệt kê các đề đang mở, mỗi đề là một thẻ: tên đề, dòng "số câu · hạn · số lần đã làm" và nút "Bắt đầu" (hoặc "Làm tiếp", "Làm lại"):

| STT | Tên đề | Dòng trên thẻ | Ngày mở | Ngày đóng | Số lần đã làm |
|---|---|---|---|---|---|
| 1 | Kiểm tra tuần 41 – 2026 | 10 câu · Còn 5 ngày · Chưa làm lần nào | 05/10/2026 | 11/10/2026 | 0 |
| 2 | Kiểm tra tháng 10/2026 | 30 câu · Còn 25 ngày · Chưa làm lần nào | 01/10/2026 | 31/10/2026 | 0 |

   Thẻ ghi số ngày còn lại; ngày mở và ngày đóng ghi ở bảng để đối chiếu dữ liệu.
5. Lan click nút "Bắt đầu" ở thẻ "Kiểm tra tuần 41 – 2026".
6. Màn giới thiệu đề hiện ra với: tên đề; dòng "10 câu (… câu chọn đáp án, … câu tự gõ)", mỗi câu 1 điểm; dòng nội dung **[Đề xuất]** "Từ vựng chủ đề Du lịch và thì hiện tại hoàn thành" cùng hướng dẫn làm bài do admin nhập; danh sách lưu ý có sẵn ("Câu trả lời được lưu ngay khi bạn chọn hoặc gõ; rời trang rồi quay lại vẫn làm tiếp được.", "Câu bỏ trống khi nộp bài được tính 0 điểm."); nút "Bắt đầu".
7. Lan click nút "Bắt đầu". Hệ thống tạo lượt làm bài ở trạng thái đang làm, thời gian bắt đầu 20:05 06/10/2026.
8. Giao diện làm bài hiện ra với: dãy nút số câu 1–10 để chuyển câu (câu đã trả lời được tô màu), dòng trạng thái lưu ("Đang lưu…"/"Đã lưu"), câu đang làm (câu 1/10, nhãn "Câu 1"), nút "← Câu trước", nút "Câu tiếp theo →" (ở câu cuối là nút "Nộp bài") và nút "Nộp bài sớm". Câu 1 (trắc nghiệm, liên kết từ vựng "itinerary"): "The travel agent sent us the ___ for our trip." với bốn lựa chọn: A. luggage, B. itinerary, C. departure, D. souvenir.
9. Lan chọn B. Hệ thống lưu câu trả lời vào lượt làm bài và dòng trạng thái hiện "Đã lưu". Lan làm tiếp các câu còn lại và bỏ qua câu 7 vì chưa chắc.
10. Lan click nút "Nộp bài" ở câu 10.
11. Hộp thoại "Nộp bài kiểm tra?" hiện ra: "Bạn còn 1 câu chưa trả lời (câu 7) **[Đề xuất: nêu số thứ tự câu]**. Câu bỏ trống được tính 0 điểm."
12. Lan click nút "Nộp bài" trong hộp thoại.
13. Hệ thống chấm tự động tất cả các câu, chuyển lượt làm bài sang trạng thái đã chấm với tổng điểm 80/100 (đúng 8/10 câu, mỗi câu 1 điểm) và cộng 1 bài kiểm tra hoàn thành vào tiến độ ngày.
14. Trang "Kết quả kiểm tra" hiện ra ngay với: tổng điểm 80/100 và dòng "Đúng 8/10 câu · 8/10 điểm"; khối "Xem lại bài làm" liệt kê từng câu với đề bài, dòng "Bạn trả lời: …", dòng "Đáp án đúng: …" và nhãn "Đúng" hoặc điểm của câu; cuối trang là các nút "← Về danh sách bài kiểm tra", "Làm lại" và "Xem kế hoạch cá nhân →":

| Câu | Câu hỏi (rút gọn) | Câu trả lời của Lan | Đáp án đúng | Điểm |
|---|---|---|---|---|
| 1 | The travel agent sent us the ___ for our trip. | itinerary | itinerary | 1 |
| 2 | I have ___ my passport. (lose) | lost | lost | 1 |
| 3 | You can check in two pieces of ___. | luggage | luggage | 1 |
| 4 | She has lived here ___ 2020. | since | since | 1 |
| 5 | Our ___ is at 7 a.m. tomorrow. | departure | departure | 1 |
| 6 | Have you ___ been to Hue? | ever | ever | 1 |
| 7 | We bought some ___ for our friends. | (bỏ trống) | souvenirs | 0 |
| 8 | They ___ just arrived at the hotel. | has | have | 0 |
| 9 | We need ___ for three nights. | accommodation | accommodation | 1 |
| 10 | I haven't packed my bag ___. | yet | yet | 1 |

15. Lan click mục "Tiến độ" trên thanh bên để về trang chủ.

**Kịch bản ngoại lệ**

- **4a.** Không có đề định kỳ nào đang mở: khối "Kiểm tra định kỳ" báo "Hiện chưa có bài kiểm tra định kỳ nào đang mở" **[Đề xuất: hiện khối trống đang bị ẩn]** (khi cả hai loại đều trống, trang báo "Chưa có bài kiểm tra · Hiện chưa có bài kiểm tra nào đang mở. Hãy quay lại sau nhé.").
- **7a.** Lan đã có một lượt làm dở của đề này: thẻ đề ghi "Đang làm dở · đã trả lời 6/10 câu" và nút "Làm tiếp"; hệ thống mở lại lượt đó cùng các câu đã trả lời, không tạo lượt mới. **[Đề xuất: bỏ nút "Làm lại từ đầu" ở màn giới thiệu đề, vì nút này xóa lượt dở và tạo lượt mới.]**
- **9a.** Mất kết nối khi đang làm: dòng trạng thái báo "Không lưu được câu trả lời. Vui lòng thử lại."; các câu đã lưu ở bước 9 được giữ. Khi vào lại, Lan tiếp tục lượt đang làm bằng nút "Làm tiếp".
- **9b.** Đề đóng (hết ngày 11/10/2026) khi Lan vẫn đang làm: hệ thống tự nộp bài với các câu đã trả lời và chấm như bước 13. Lan xem kết quả ở khối "Lịch sử kiểm tra".
- **12a.** Lan đóng hộp thoại thay vì nộp: hệ thống quay lại giao diện làm bài để Lan trả lời câu 7.

### 15. Use case: Kiểm tra tổng hợp

**Kịch bản chuẩn**

1. Lan đăng nhập (06/10/2026, trình độ hiện tại A2), chọn mục "Kiểm tra" trên thanh bên rồi xem khối "Kiểm tra tổng hợp".
2. Khối "Kiểm tra tổng hợp" liệt kê các đề đang mở:

| STT | Tên đề | Dòng trên thẻ | Ngày mở | Ngày đóng | Số lần đã làm |
|---|---|---|---|---|---|
| 1 | Kiểm tra tổng hợp tháng 10/2026 | 23 câu · Còn 25 ngày · Chưa làm lần nào | 01/10/2026 | 31/10/2026 | 0 |

3. Lan click nút "Bắt đầu" ở thẻ "Kiểm tra tổng hợp tháng 10/2026".
4. Màn giới thiệu đề hiện ra với: tên đề; dòng "23 câu … · Kỹ năng: Nghe, Nói, Đọc, Viết"; bảng cấu trúc đề theo phần **[Đề xuất]**: phần nghe 10 câu trắc nghiệm, phần nói 2 câu (1 câu đọc theo câu mẫu trả lời bằng ghi âm, 1 đề bài nói), phần đọc 10 câu trắc nghiệm, phần viết 1 đề bài (120–150 từ); mỗi câu hỏi được gắn một bậc CEFR, mỗi kỹ năng có điểm trên thang 100 và một trình độ; danh sách lưu ý có sẵn, gồm "Mỗi bài nghe được nghe tối đa 2 lần.", "Kết quả bài này xác định lại trình độ CEFR của bạn." và "Bài này chỉ làm được một lần: sau khi nộp bạn không làm lại được."; nút "Bắt đầu".
5. Lan click nút "Bắt đầu". Hệ thống tạo lượt làm bài ở trạng thái đang làm. Giao diện làm bài (cùng giao diện của kịch bản 14) hiện câu 1 thuộc phần Nghe. Dãy nút số câu được chia theo phần: Nghe 1–10, Nói 11–12, Đọc 13–22, Viết 23 **[Đề xuất]**. Phía trên câu hỏi là trình phát bài nghe chung của phần, "Planning a weekend trip" **[Đề xuất: tài liệu chung của phần, dùng lại trình phát của bài nghe hiểu]**.
6. Lan nghe, chọn đáp án cho câu 1–10, rồi click "Câu tiếp theo →" để sang phần Nói.
7. Phần Nói gồm hai câu. Câu 11 là câu đọc theo câu mẫu: lời dẫn "Read the sentence aloud." và câu mẫu "I usually travel to work by bus because it is cheaper than driving."; câu có nút "Ghi âm" (tối đa 15 giây), ghi xong có trình phát để nghe lại và nút "Ghi lại". Câu 12 là đề bài nói "Describe a place you would like to visit and explain why." với ô gõ câu trả lời. **Hạn chế hiện tại: câu nói theo đề bài chưa thu âm, người học gõ điều mình sẽ nói; chỉ câu đọc theo câu mẫu được ghi âm.**
8. Lan ghi âm câu 11 (9 giây). Hệ thống gửi bản ghi đến Dịch vụ chấm phát âm ngay lúc đó và lưu kết quả chấm, không lưu file ghi âm; kết quả chỉ hiện sau khi nộp bài. Lan gõ câu trả lời cho câu 12 rồi click "Câu tiếp theo →".
9. Phần Đọc hiện đoạn văn chung "Eco-tourism in Vietnam" phía trên các câu 13–22 **[Đề xuất: tài liệu chung của phần]**. Lan trả lời 10 câu rồi click "Câu tiếp theo →".
10. Phần Viết hiện đề bài câu 23 "Write an email to a friend about your last holiday (120–150 words)." và ô "Bài viết của bạn" kèm bộ đếm số từ **[Đề xuất: bộ đếm số từ]**.
11. Lan viết bài 136 từ rồi click nút "Nộp bài".
12. Hộp thoại "Nộp bài kiểm tra?" hiện "Bạn đã trả lời tất cả các câu. Sau khi nộp, bạn không sửa được câu trả lời nữa." Lan click nút "Nộp bài".
13. Hệ thống ghi thời gian nộp, chuyển lượt làm bài sang trạng thái đã nộp và chấm phần nghe (đúng 7/10 câu, 70 điểm) và phần đọc (đúng 8/10 câu, 80 điểm) theo đáp án; câu 11 đã có điểm phát âm 72/100 từ lúc ghi âm. Hệ thống gửi câu trả lời của câu 12 và bài viết đến Dịch vụ AI. Trang "Kết quả kiểm tra" hiện tiêu đề "Đang chấm phần Nói, Viết" và dòng "Phần trắc nghiệm, điền từ đã chấm xong. Phần Nói, Viết do AI chấm…".
14. Dịch vụ AI chấm mỗi câu theo bốn tiêu chí (đúng yêu cầu đề, mạch lạc, từ vựng, ngữ pháp), mỗi tiêu chí một mức từ 0 đến 6 (1 ứng với A1 … 6 ứng với C2), kèm nhận xét: câu 12 được 3, 3, 2, 3 (trung bình 2,75; nhận xét: "Ý rõ ràng, vốn từ về du lịch còn hạn chế"); bài viết được 3, 3, 3, 2 (trung bình 2,75; nhận xét: "Bố cục email đúng, còn lỗi chia thì quá khứ: 'we go' → 'we went'").
15. Hệ thống tính điểm và trình độ của từng kỹ năng. Điểm kỹ năng (thang 100) là phần điểm đạt được trên tổng điểm các câu của kỹ năng. Trình độ kỹ năng không quy đổi từ điểm mà tính theo bậc của câu hỏi và mức AI chấm:
    - Nghe: 70 điểm. Lan được từ 60% điểm các câu bậc A2 (4/4) và bậc B1 (2/3) nhưng không đạt bậc B2 (1/3) → B1.
    - Đọc: 80 điểm. Đạt bậc A2 (4/4), B1 (2/3) và B2 (2/3) → B2.
    - Nói: câu 11 (3 điểm) được 3 × 72/100 = 2,16; câu 12 (6 điểm) được 6 × 2,75/6 = 2,75; điểm kỹ năng (2,16 + 2,75)/9 = 55. Phát âm đạt bậc B1 của câu mẫu (72 ≥ 60) nên được tính như tiêu chí thứ năm ở mức 3: (4 × 2,75 + 3)/5 = 2,8 → B1.
    - Viết: bài viết (6 điểm) được 2,75 → 46 điểm; mức trung bình 2,75 → B1.

    Tổng điểm là trung bình bốn kỹ năng: (70 + 55 + 80 + 46)/4 = 63. Trình độ đề xuất là trung bình trình độ bốn kỹ năng (A1 = 1 … C2 = 6): (3 + 3 + 4 + 3)/4 = 3,25 → B1. Sau đó hệ thống gửi trình độ B1 cùng điểm bốn kỹ năng đến Dịch vụ AI để viết lộ trình.
16. Dịch vụ AI trả về lộ trình đề xuất: "12 tuần hướng tới B2: ưu tiên nói và viết; mỗi tuần 40–50 từ mới, 1 bài đọc hiểu, 2 bài viết, 2 bài nghe, 2 bài phát âm."
17. Hệ thống chuyển lượt làm bài sang trạng thái đã chấm, lưu điểm từng kỹ năng, tổng điểm, trình độ đề xuất và lộ trình đề xuất. Hệ thống cập nhật trình độ hiện tại của Lan từ A2 lên B1, thêm một bản ghi lịch sử trình độ (B1, lượt kiểm tra này, 06/10/2026) và cộng 1 bài kiểm tra hoàn thành vào tiến độ ngày.
18. Trang "Kết quả kiểm tra" hiện báo cáo với:
    - Tên đề "Kiểm tra tổng hợp tháng 10/2026" và dòng **[Đề xuất]** "Người học: Trần Thị Lan · Ngày làm: 06/10/2026 · Trình độ trước khi làm bài: A2" (hiện chỉ có ghi chú "Trình độ của bạn đổi từ A2 thành B1." ngay sau khi nộp),
    - Tổng điểm 63/100 và trình độ đề xuất B1,
    - Khối "Lộ trình đề xuất" (như bước 16),
    - Bảng điểm theo kỹ năng; mỗi dòng có điểm và trình độ của kỹ năng, thêm cột nhận xét **[Đề xuất]**:

| Kỹ năng | Điểm | Trình độ | Nhận xét |
|---|---|---|---|
| Nghe | 70 | B1 | Đúng 7/10 câu |
| Nói | 55 | B1 | Ý rõ ràng, vốn từ về du lịch còn hạn chế; phát âm câu mẫu 72/100 |
| Đọc | 80 | B2 | Đúng 8/10 câu |
| Viết | 46 | B1 | Bố cục email đúng, còn lỗi chia thì quá khứ |

   - Khối "Xem lại bài làm" (trích):

| Câu | Kỹ năng | Câu trả lời của Lan | Đáp án đúng | Điểm |
|---|---|---|---|---|
| 1 | Nghe | B | B | 1 |
| 4 | Nghe | A | C | 0 |
| 11 | Nói | Bản ghi âm câu mẫu | – (chấm phát âm 72/100) | 2,16/3 |
| 12 | Nói | Câu trả lời đã gõ | – (AI chấm) | 2,75/6 |
| 13 | Đọc | D | D | 1 |
| 23 | Viết | Bài viết 136 từ | – (AI chấm) | 2,75/6 |

   - Các nút "Áp dụng lộ trình vào kế hoạch học →" **[Đề xuất: thay nút "Xem kế hoạch cá nhân →" hiện có, mang theo lượt kiểm tra sang trang Kế hoạch]** và "← Về danh sách bài kiểm tra".

19. Lan click mục "Tiến độ" trên thanh bên. Khối "Trình độ hiện tại" ở thanh bên hiển thị B1.

**Kịch bản ngoại lệ**

- **2a.** Không có đề tổng hợp nào đang mở: khối "Kiểm tra tổng hợp" báo "Hiện chưa có bài kiểm tra tổng hợp nào đang mở" **[Đề xuất: như nhánh 4a của kịch bản 14]**.
- **5a.** Lan đóng trình duyệt giữa chừng: lượt làm bài giữ trạng thái đang làm cùng các câu đã trả lời. Lần sau, thẻ đề ghi "Đang làm dở · đã trả lời …/23 câu" với nút "Làm tiếp"; Lan làm tiếp từ phần đang dở.
- **7a.** Lan từ chối quyền micro ở phần nói: hệ thống hiện hướng dẫn cấp quyền như nhánh 6a của kịch bản 12. Nếu Lan vẫn bỏ qua, câu 11 (đọc theo câu mẫu) không có câu trả lời và được tính 0 điểm khi nộp; câu 12 gõ văn bản nên không cần micro. Dịch vụ chấm phát âm không chạy thì bản ghi không được lưu và Lan gửi lại sau.
- **12a.** Còn câu chưa trả lời: hộp thoại "Nộp bài kiểm tra?" nêu số câu chưa trả lời; nếu Lan vẫn nộp, các câu đó được tính 0 điểm.
- **14a.** Dịch vụ AI lỗi hoặc quá thời gian khi chấm phần nói/viết: lượt làm bài giữ trạng thái đã nộp. Trang kết quả báo "Bài của bạn đang được chấm, kết quả sẽ có trong lịch sử kiểm tra" và Lan quay về trang "Kiểm tra". Hệ thống gửi chấm lại sau; khi có đủ điểm mới thực hiện bước 15–17. Trình độ hiện tại của Lan chưa thay đổi khi bài chưa chấm xong. Lan xem báo cáo sau ở khối **[Đề xuất]** "Lịch sử kiểm tra".
- **16a.** Trình độ đề xuất trùng trình độ hiện tại: lượt kiểm tra vẫn được lưu đầy đủ nhưng hệ thống không thêm bản ghi lịch sử trình độ.
- **18a.** Lan click nút "Áp dụng lộ trình vào kế hoạch học →": hệ thống chuyển sang kịch bản 17 (nhánh 2a) với trình độ mục tiêu và lộ trình đề xuất được điền sẵn.

## V. Module D — Tiến độ và kế hoạch

### 16. Use case: Xem tiến độ

**Kịch bản chuẩn**

1. Tối 06/10/2026, sau khi học xong, Lan chọn mục "Tiến độ" trên thanh bên (mục đầu tiên, cũng là trang chủ).
2. Tiến độ và kế hoạch là hai mục riêng trên thanh bên: "Tiến độ" (tiến độ của tôi) và "Kế hoạch" (kế hoạch học của tôi).
3. Trang "Tiến độ" đang mở.
4. Trang "Tiến độ" hiện ra với:
   - Lời chào "Chào Lan 👋",
   - Hàng thẻ tổng quan: "Từ đã học" 89 (dòng phụ "Đang học 65 · Đã thuộc 24"), "Bài tập đã hoàn thành" 18, thẻ **[Đề xuất]** "Bài kiểm tra đã làm" 7 kèm dòng phụ "điểm trung bình 6.7", "Streak" 28 ngày, "Từ cần ôn hôm nay",
   - Khối "Hoạt động học tập": nút chọn kỳ "Ngày", "Tuần", "Tháng" (mặc định Ngày, 7 ngày gần nhất); ô **[Đề xuất]** "Từ ngày", "Đến ngày" cùng nút "Xem" (dùng lại form chọn khoảng thời gian ở trang "Tổng quan" của admin); các nút chỉ số "Từ mới", "Bài tập", "Điểm kiểm tra", "Thời gian học"; biểu đồ cột số từ đã học theo ngày của 7 ngày gần nhất,
   - Khối "Thành tích" (huy hiệu),
   - Các khối khác đã có trên trang: "Điểm theo kỹ năng" (radar 4 kỹ năng), "Hành trình trình độ", thẻ "Tiếp tục: …"/"Học tiếp: …".
5. Lan chọn kỳ "Tuần", nhập ngày bắt đầu 31/08/2026, ngày kết thúc 06/10/2026 rồi click nút "Xem".
6. Hệ thống tổng hợp các bản ghi tiến độ theo ngày của Lan trong khoảng thời gian đã chọn, gộp theo tuần, rồi hiển thị biểu đồ cột và bảng số liệu bên dưới biểu đồ **[Đề xuất: bảng hiện mọi chỉ số cùng lúc; biểu đồ hiện có chỉ hiện một chỉ số mỗi lần]**:

| Tuần | Số từ đã học | Bài tập hoàn thành | Bài kiểm tra | Điểm TB kiểm tra | Thời gian học |
|---|---|---|---|---|---|
| 36 (31/08–06/09) | 18 | 2 | 1 | 55 | 180 phút |
| 37 (07/09–13/09) | 20 | 3 | 1 | 60 | 210 phút |
| 38 (14/09–20/09) | 15 | 2 | 1 | 65 | 150 phút |
| 39 (21/09–27/09) | 17 | 4 | 1 | 70 | 200 phút |
| 40 (28/09–04/10) | 14 | 3 | 1 | 70 | 170 phút |
| 41 (05/10–06/10) | 5 | 4 | 2 | 72 | 95 phút |
| **Tổng** | **89** | **18** | **7** | **66** | **1 005 phút** |

7. Khối "Thành tích" hiển thị hai phần. Phần "Đạt gần đây" (huy hiệu và ngày đạt):

| Huy hiệu | Điều kiện | Ngày đạt |
|---|---|---|
| Khởi đầu | Học ngày đầu tiên | 01/09/2026 |
| Chuỗi 7 ngày | Học 7 ngày liên tục | 15/09/2026 |
| 50 từ đầu tiên | Học được 50 từ | 20/09/2026 |

   Phần "Sắp đạt" (huy hiệu kèm thanh tiến độ "đã đạt/điều kiện"):

| Huy hiệu | Điều kiện | Tiến độ |
|---|---|---|
| 100 từ | Học được 100 từ | 89/100 từ |
| Chuỗi 30 ngày | Học 30 ngày liên tục | 28/30 ngày |

8. Lan xem xong và chọn mục khác trên thanh bên.

**Kịch bản ngoại lệ**

- **4a.** Người học mới chưa có dữ liệu: đầu trang hiện khung "Chào mừng bạn đến với LinguaStep" với dòng "Bạn chưa có dữ liệu học tập. Hãy bắt đầu với 20 từ vựng đầu tiên, hoặc làm bài kiểm tra tổng hợp để biết trình độ và điểm từng kỹ năng." cùng hai nút "Học 20 từ đầu tiên →", "Làm bài kiểm tra tổng hợp"; khu tổng quan hiển thị 0 và biểu đồ trống.
- **5a.** Ngày bắt đầu sau ngày kết thúc, hoặc ngày kết thúc sau hôm nay: dưới form báo lỗi ("Ngày bắt đầu phải trước hoặc trùng ngày kết thúc." hoặc "Ngày kết thúc không được sau hôm nay.") và hệ thống không tổng hợp.
- **6a.** Trong khoảng thời gian đã chọn không có hoạt động: biểu đồ báo "Chưa có hoạt động nào trong …"; các tuần hiển thị 0 và điểm trung bình kiểm tra hiển thị "–" ("Kỳ không làm bài kiểm tra để trống (—), không tính là 0 điểm.").
- **7a.** Hoạt động học làm Lan đạt đủ điều kiện một huy hiệu (ví dụ học đủ 100 từ): hệ thống ghi nhận huy hiệu ngay khi đạt và hiện thông báo chúc mừng ở góc màn hình **[Đề xuất: dùng lại thông báo (toast) của khu admin]**; ở trang "Tiến độ", huy hiệu đó chuyển sang phần "Đạt gần đây". Mỗi huy hiệu chỉ được nhận một lần.

### 17. Use case: Quản lý kế hoạch học – Lập kế hoạch mới

**Kịch bản chuẩn**

1. Chiều 06/10/2026, sau khi làm kiểm tra tổng hợp (kịch bản 15, trình độ hiện tại B1), Lan chọn mục "Kế hoạch" trên thanh bên.
2. Lan chưa có kế hoạch nào đang thực hiện nên trang "Kế hoạch học cá nhân" hiện thẻ trình độ (trình độ hiện tại B1, radar 4 kỹ năng của lần kiểm tra tổng hợp gần nhất), khối "Việc nên làm" và khối "Đặt mục tiêu học tập" với dòng "Bạn chưa có kế hoạch học. Chọn mục tiêu, trợ lý AI sẽ gợi ý lộ trình theo từng tuần để bạn xem trước." Khối này gồm:
   - Các thẻ mục tiêu gợi ý (ví dụ "Đạt B2 trong 3 tháng", có nhãn "Gợi ý"), chọn một thẻ để điền nhanh trình độ mục tiêu và thời gian,
   - Thẻ "Mục tiêu khác" với danh sách chọn "Trình độ mục tiêu" (A1–C2) **[Đề xuất: liệt kê cả trình độ thấp hơn hiện tại]**,
   - Ô "Mô tả mục tiêu" (bắt buộc) **[Đề xuất: đổi từ ô "Ghi chú mục tiêu (không bắt buộc)" hiện có]**,
   - Ô "Ngày bắt đầu" và ô "Ngày kết thúc" **[Đề xuất: thay danh sách chọn "Thời gian" tính theo tháng]**,
   - Nút "Gợi ý lộ trình".
3. Lan chọn "Mục tiêu khác", nhập mô tả "Đạt B2 để phỏng vấn học bổng vào tháng 1/2027", chọn trình độ mục tiêu B2, ngày bắt đầu 12/10/2026, ngày kết thúc 03/01/2027 rồi click nút "Gợi ý lộ trình".
4. Hệ thống kiểm tra dữ liệu hợp lệ: mục tiêu không trống, ngày bắt đầu không trước hôm nay, ngày kết thúc sau ngày bắt đầu. Sau đó hệ thống gửi mục tiêu, trình độ hiện tại B1, trình độ mục tiêu B2, thời gian 12 tuần và kết quả kiểm tra tổng hợp gần nhất (nghe 7.0, nói 6.5, đọc 8.0, viết 6.5) đến Dịch vụ AI; nút "Gợi ý lộ trình" hiện trạng thái đang tạo lộ trình.
5. Dịch vụ AI trả về lộ trình 12 tuần.
6. Khối xem trước lộ trình hiện ra dưới khối mục tiêu với: dòng "12/10/2026 – 03/01/2027 · 12 tuần", danh sách các tuần (mỗi tuần một dòng, hai ô mục tiêu cho phép sửa **[Đề xuất: ô số ở cột mục tiêu]**), dòng hướng dẫn "Muốn khác, đổi mục tiêu ở trên rồi bấm “Gợi ý lộ trình” lần nữa." (gợi ý lại) và nút "Áp dụng kế hoạch" (xác nhận):

| Tuần | Thời gian | Nội dung học | Mục tiêu số từ mới | Mục tiêu số bài tập |
|---|---|---|---|---|
| 1 | 12/10–18/10 | Từ vựng Công việc; câu bị động; nghe hội thoại công sở | 50 | 6 |
| 2 | 19/10–25/10 | Từ vựng Công việc; mệnh đề quan hệ; luyện nói giới thiệu bản thân | 50 | 6 |
| 3 | 26/10–01/11 | Từ vựng Giáo dục; câu điều kiện loại 1–2; viết email trang trọng | 50 | 7 |
| … | … | … | … | … |
| 11 | 21/12–27/12 | Ôn tập tổng hợp nói và viết | 30 | 8 |
| 12 | 28/12–03/01 | Ôn tập và làm kiểm tra tổng hợp | 20 | 5 |

7. Tuần 1 và tuần 2 Lan bận nên sửa mục tiêu số từ mới của hai tuần này từ 50 xuống 40, rồi click nút "Áp dụng kế hoạch".
8. Hệ thống kiểm tra các mục tiêu là số nguyên không âm. Hệ thống lưu kế hoạch (mục tiêu, trình độ mục tiêu B2, 12/10/2026–03/01/2027, trạng thái đang thực hiện) cùng 12 tuần lịch trình ở trạng thái chưa tới. Hệ thống tạo 12 nhắc nhở loại kế hoạch, mỗi nhắc nhở vào 8:00 thứ Hai đầu tuần với nội dung là mục tiêu của tuần đó. Thẻ "Nhắc học hằng ngày" hiện có được thay bằng dòng **[Đề xuất]** "Nhắc nhở: 8:00 thứ Hai đầu mỗi tuần".
9. Đầu trang hiện thông báo xanh "Đã áp dụng kế hoạch mới. Chúc bạn học tốt!" và khối "Kế hoạch của bạn" hiện ra với: mục tiêu ("Mục tiêu của bạn: “Đạt B2 để phỏng vấn học bổng vào tháng 1/2027”"); trình độ B1 → B2; thời gian 12/10/2026 – 03/01/2027; nhãn trạng thái "Đang thực hiện"; tuần hiện tại "chưa bắt đầu" **[Đề xuất: trạng thái trước ngày bắt đầu]**; danh sách 12 tuần (mở bằng "Xem lịch trình ▾") với mục tiêu và tiến độ (đều bằng 0); nút "Điều chỉnh kế hoạch" (xem kịch bản 18).

**Kịch bản ngoại lệ**

- **2a.** Lan đến từ nút "Áp dụng lộ trình vào kế hoạch học →" của báo cáo kiểm tra tổng hợp (bước 18a của kịch bản 15): khối "Đặt mục tiêu học tập" hiện ra với trình độ mục tiêu B2 và lộ trình đề xuất của lượt kiểm tra được điền sẵn **[Đề xuất]**. Lan nhập mục tiêu và thời gian rồi tiếp tục từ bước 3; hệ thống gửi thêm lộ trình đề xuất này đến Dịch vụ AI để chia theo tuần.
- **2b.** Lan đã có một kế hoạch đang thực hiện: trang hiện khối "Kế hoạch của bạn" của kế hoạch đó (xem kịch bản 18). Nếu Lan đến từ nhánh 2a, hộp thoại **[Đề xuất]** hỏi "Kế hoạch hiện tại sẽ chuyển sang tạm dừng. Tiếp tục?". Chỉ khi Lan xác nhận, hệ thống mới mở khối "Đặt lại mục tiêu học tập" để lập kế hoạch mới, để đảm bảo mỗi người học chỉ có tối đa một kế hoạch đang thực hiện.
- **4a.** Mục tiêu để trống, ngày bắt đầu trước hôm nay, hoặc ngày kết thúc không sau ngày bắt đầu: lỗi hiện dưới ô tương ứng **[Đề xuất]** và hệ thống chưa gửi đến Dịch vụ AI.
- **4b.** Trình độ mục tiêu không cao hơn trình độ hiện tại: dưới danh sách chọn hiện cảnh báo **[Đề xuất]** nhưng vẫn cho tiếp tục (người học có thể muốn củng cố trình độ; danh sách chọn hiện có ghi "B1 (giữ vững)" cho trình độ hiện tại).
- **5a.** Dịch vụ AI lỗi hoặc quá thời gian chờ: khối mục tiêu báo "Trợ lý AI chưa gợi ý được lộ trình lúc này. Vui lòng thử lại sau." kèm hai lựa chọn: bấm lại "Gợi ý lộ trình", hoặc nút **[Đề xuất]** "Tự lập kế hoạch" (khối xem trước hiện 12 tuần trống để Lan tự nhập). Kế hoạch chỉ được lưu khi Lan click nút "Áp dụng kế hoạch".
- **6a.** Lan muốn lộ trình khác: Lan bấm "Gợi ý lộ trình" lần nữa, quay lại bước 4 để nhận lộ trình khác; lộ trình đang hiển thị không được lưu.
- **8a.** Một mục tiêu bị nhập âm hoặc không phải số: lỗi hiện tại ô đó **[Đề xuất]** và hệ thống chưa lưu.

### 18. Use case: Quản lý kế hoạch học – Điều chỉnh kế hoạch

**Kịch bản chuẩn**

1. Ngày 27/10/2026 (tuần 3 của kế hoạch), Lan đăng nhập. Khu thông báo của trang "Tiến độ" (kịch bản 2) hiện nhắc nhở **[Đề xuất]** "Tuần 3: mục tiêu 50 từ mới, 7 bài tập" và cảnh báo **[Đề xuất]** "Tuần 2 chưa đạt mục tiêu (32/40 từ)".
2. Lan chọn mục "Kế hoạch" trên thanh bên.
3. Khối "Kế hoạch của bạn" hiện ra với: mục tiêu; trình độ B1 → B2; thời gian 12/10/2026 – 03/01/2027; nhãn trạng thái "Đang thực hiện"; cảnh báo "Tuần 2 chưa đạt mục tiêu (32/40 từ, 4/6 bài)"; khối "Tuần này · tuần 3/12" với hai thanh tiến độ "Từ mới 6/50 từ" và "Bài tập 1/7 bài"; khối "Lời khuyên của trợ lý AI"; nút "Xem lịch trình ▾"; nút "Tạm dừng kế hoạch" và nút "Điều chỉnh kế hoạch" **[Đề xuất: nút "Điều chỉnh mục tiêu" hiện có chỉ mở lại form lập kế hoạch mới]**. Mở "Xem lịch trình ▾" thì thấy danh sách tuần; nhãn trạng thái của mỗi tuần là "✓ Đạt", "Chưa đạt", "Đang học" hoặc không có nhãn (chưa tới), tuần đã qua có dòng "Đã làm: … từ, … bài":

| Tuần | Thời gian | Mục tiêu số từ | Đã học | Mục tiêu bài tập | Đã làm | Trạng thái | Nhãn trên giao diện |
|---|---|---|---|---|---|---|---|
| 1 | 12/10–18/10 | 40 | 41 | 6 | 6 | Xong | ✓ Đạt |
| 2 | 19/10–25/10 | 40 | 32 | 6 | 4 | Xong (chưa đạt) | Chưa đạt |
| 3 | 26/10–01/11 | 50 | 6 | 7 | 1 | Đang làm | Đang học |
| 4 | 02/11–08/11 | 50 | – | 7 | – | Chưa tới | (không có nhãn) |
| … | … | … | … | … | … | … | … |

4. Lan click nút "Điều chỉnh kế hoạch".
5. Giao diện điều chỉnh **[Đề xuất: dùng lại danh sách tuần của khối xem trước ở kịch bản 17]** hiện ra với: các tuần đã qua (1–2) chỉ hiển thị; các ô mục tiêu của tuần 3–12 cho phép sửa; ô "Ngày kết thúc"; nút "Tạm dừng kế hoạch" (đã có), nút "Kết thúc kế hoạch", nút "Lưu" và nút "Hủy".
6. Lan giảm mục tiêu số từ mới của tuần 3–6 từ 50 xuống 40 rồi click nút "Lưu".
7. Hệ thống kiểm tra các mục tiêu hợp lệ, lưu lịch trình của tuần 3–6 và cập nhật nội dung nhắc nhở của tuần 4–6 (nhắc nhở tuần 3 đã gửi ngày 26/10/2026 nên không thay đổi).
8. Hệ thống hiện thông báo "Cập nhật kế hoạch thành công" và hiện lại khối "Kế hoạch của bạn" với các mục tiêu mới.

**Kịch bản ngoại lệ**

- **1a.** Lan không đạt mục tiêu tuần: hệ thống chỉ cảnh báo (như dòng "Tuần 2 chưa đạt mục tiêu…" ở bước 3) và gợi ý điều chỉnh; kết quả đã học không bị xóa hay trừ.
- **5a.** Lan click nút "Tạm dừng kế hoạch": hộp thoại **[Đề xuất]** hỏi xác nhận, sau đó hệ thống chuyển kế hoạch sang trạng thái tạm dừng và ngừng các nhắc nhở chưa gửi. Khối "Kế hoạch của bạn" hiện nhãn "Tạm dừng", dòng "Kế hoạch đang tạm dừng. Tiếp tục bất cứ lúc nào, các tuần vẫn giữ nguyên ngày." và nút "Tiếp tục kế hoạch" để Lan kích hoạt lại khi cần.
- **5b.** Lan click nút **[Đề xuất]** "Kết thúc kế hoạch": hộp thoại hỏi xác nhận, sau đó hệ thống chuyển kế hoạch sang trạng thái hoàn thành (nhãn "Đã kết thúc") và hủy các nhắc nhở chưa gửi. Lan có thể lập kế hoạch mới (kịch bản 17).
- **6a.** Một mục tiêu bị nhập âm hoặc không phải số: lỗi hiện tại ô đó và hệ thống chưa lưu.
- **6b.** Lan đổi ngày kết thúc: nếu rút ngắn, các tuần nằm sau ngày kết thúc mới bị xóa khỏi lịch trình; nếu kéo dài, hệ thống thêm các tuần mới với mục tiêu trống để Lan nhập trước khi lưu.
- **6c.** Lan click nút "Hủy": hệ thống không lưu thay đổi và quay về khối "Kế hoạch của bạn".

## VI. Module E — Admin

### 19. Use case: Quản lý từ vựng – Sửa từ vựng

**Kịch bản chuẩn**

1. Admin Lê Văn Hùng nhận phản hồi rằng nghĩa của từ "luggage" chưa đầy đủ. Hùng mở hệ thống và đăng nhập bằng tài khoản admin01@englishapp.vn (kịch bản 2).
2. Giao diện chính của admin (trang "Tổng quan hệ thống") hiện ra cùng thanh bên của admin (kịch bản 2).
3. Hùng chọn mục "Từ vựng" trên thanh bên.
4. Trang "Từ vựng" hiện ra với: dòng tóm tắt "4 chủ đề · 150 từ hệ thống"; nút "+ Thêm từ" và "+ Thêm chủ đề"; ô "Tìm từ trong toàn bộ kho"; dòng "Nội dung còn thiếu: …"; bảng "Danh sách chủ đề" với cột "Chủ đề", "Số từ", "Trình độ", "Còn thiếu", "Người học đã học", "Cập nhật" và thao tác "Sửa", "Xóa" ở mỗi dòng. Trang này gom bốn chức năng: quản lý chủ đề (bảng chủ đề), thêm từ ("+ Thêm từ"), sửa từ và xóa từ (thao tác "Sửa", "Xóa" ở bảng từ).
5. Hùng dùng ô "Tìm từ trong toàn bộ kho" để tìm từ cần sửa.
6. Ô tìm kiếm tìm theo từ hoặc nghĩa trong mọi chủ đề, kết quả hiện ngay khi gõ. Muốn giới hạn trong một chủ đề, Hùng mở chủ đề đó từ bảng chủ đề rồi dùng ô "Tìm trong chủ đề" (kèm bộ lọc "Trình độ", "Nội dung").
7. Hùng gõ "lugg" vào ô "Tìm từ trong toàn bộ kho".
8. Bảng "Kết quả tìm kiếm" hiện các từ có chứa "lugg", với cột "Từ", "Nghĩa", "Chủ đề", "Trình độ", "Câu ví dụ" (Có/Thiếu), audio (Có/Thiếu), "Người học" và thao tác "Sửa", "Xóa":

| Mã | Từ | Phiên âm | Nghĩa | Chủ đề | CEFR |
|---|---|---|---|---|---|
| 105 | luggage | /ˈlʌɡ.ɪdʒ/ | hành lý | Du lịch | A2 |
| 131 | hand luggage | /ˈhænd ˌlʌɡ.ɪdʒ/ | hành lý xách tay | Du lịch | B1 |
| 342 | luggage rack | /ˈlʌɡ.ɪdʒ ræk/ | giá để hành lý | Du lịch | B2 |

   Mã và phiên âm không hiện thành cột; chúng được ghi ở bảng trên để đối chiếu dữ liệu.
9. Hùng click "Sửa" ở dòng "luggage" (mã 105).
10. Ngăn kéo "Sửa từ “luggage”" mở ra bên phải, dòng phụ "Chủ đề Du lịch · cập nhật lần cuối …" và dòng cho biết số người học đang học từ này. Các ô chứa giá trị hiện tại của từ:
    - "Từ *": luggage,
    - "Phiên âm": /ˈlʌɡ.ɪdʒ/,
    - "Nghĩa *": hành lý,
    - "Câu ví dụ": Please put your luggage here.,
    - "Chủ đề *": Du lịch,
    - "Trình độ *": A2,
    - Âm thanh: luggage.mp3 (nút nghe, nút "Thay file"),
    - "Ảnh minh họa": luggage.png (nút "Thay file"),
    - Nút "Hủy" và nút "Lưu" ở chân ngăn kéo.
11. Hùng sửa nghĩa thành "hành lý (va li, túi xách mang theo khi đi xa)", sửa câu ví dụ thành "How many pieces of luggage are you checking in?" rồi click nút "Lưu".
12. Hệ thống kiểm tra từ và nghĩa không trống, trong chủ đề Du lịch không có từ "luggage" nào khác, rồi lưu thay đổi của từ 105.
13. Ngăn kéo đóng và thông báo "Đã lưu · Nghĩa và câu ví dụ của “luggage” đã được cập nhật." hiện ở góc màn hình; bảng kết quả tìm kiếm giữ nguyên. Người học thấy nghĩa mới ngay từ lần xem thẻ tiếp theo; trạng thái học của người học với từ này không thay đổi.

**Kịch bản ngoại lệ**

- **8a.** Không có từ nào chứa từ khóa: bảng kết quả báo "Không có từ nào khớp với “lugg”.". Hùng nhập từ khóa khác và quay lại bước 7.
- **11a.** Hùng click nút "Hủy": hệ thống không lưu; nếu đã sửa, hệ thống hỏi trước khi bỏ thay đổi. Ngăn kéo đóng và bảng kết quả tìm kiếm giữ nguyên.
- **12a.** Hùng xóa trống ô từ hoặc ô nghĩa: lỗi hiện dưới ô đó ("Vui lòng nhập từ.", "Vui lòng nhập nghĩa.") cùng dòng báo số ô bắt buộc chưa điền, dữ liệu đang nhập được giữ. Quay lại bước 11.
- **12b.** Hùng đổi từ thành một từ đã có trong cùng chủ đề (ví dụ "hand luggage"): dưới ô "Từ *" hiện lỗi "Từ “hand luggage” đã có trong chủ đề Du lịch." và hệ thống không lưu.
- **12c.** File thay thế không phải file âm thanh hoặc file ảnh hợp lệ: ô tải file báo lỗi và giữ file cũ.
- **12d.** Lưu thất bại: chân ngăn kéo báo "Chưa lưu được từ. Vui lòng thử lại." và giữ nguyên form để Hùng thử lại.

### 20. Use case: Quản lý từ vựng – Thêm từ vựng

**Kịch bản chuẩn**

1. Hùng đăng nhập, chọn mục "Từ vựng" trên thanh bên, mở chủ đề "Du lịch" từ bảng chủ đề rồi click nút "+ Thêm từ" (nút này cũng có ở trang "Từ vựng").
2. Ngăn kéo "Thêm từ vào chủ đề “Du lịch”" mở ra, dòng phụ "Từ mới là từ hệ thống: người học gặp từ này ở phiên học tiếp theo.", với các ô trống: "Từ *", "Phiên âm", "Nghĩa *", "Câu ví dụ", "Chủ đề *" (đã chọn sẵn Du lịch), "Trình độ *", âm thanh, "Ảnh minh họa". Chân ngăn kéo có nút "Hủy", "Lưu và thêm tiếp", "Lưu" và dòng "“Lưu và thêm tiếp” giữ lại chủ đề và trình độ vừa chọn."
3. Hùng nhập: từ "customs", phiên âm /ˈkʌs.təmz/, nghĩa "hải quan", câu ví dụ "We went through customs quickly.", chủ đề Du lịch, trình độ B1; tải lên file customs.mp3 và customs.png; rồi click nút "Lưu".
4. Hệ thống kiểm tra: từ, nghĩa, chủ đề và mức CEFR không trống; chủ đề Du lịch chưa có từ "customs". Dữ liệu hợp lệ nên hệ thống lưu từ mới với mã 356, người tạo là admin.
5. Ngăn kéo đóng và thông báo "Đã lưu · Đã thêm “customs” vào chủ đề Du lịch." hiện ở góc màn hình. Chủ đề Du lịch có 41 từ; từ "customs" được đưa vào phiên học của người học như một từ chưa học.

**Kịch bản ngoại lệ**

- **3a.** Hùng click nút "Lưu và thêm tiếp": sau khi lưu thành công, form được làm trống nhưng giữ chủ đề và trình độ vừa chọn để Hùng nhập từ tiếp theo.
- **3b.** Hùng không tải file âm thanh: hệ thống vẫn cho lưu; bảng từ ghi audio "Thiếu"; ở flashcard, từ này không có nút nghe phát âm.
- **4a.** Thiếu từ, nghĩa, chủ đề hoặc mức CEFR: lỗi hiện dưới ô tương ứng ("Vui lòng nhập từ.", "Vui lòng nhập nghĩa.", "Vui lòng chọn chủ đề.", "Vui lòng chọn trình độ.") và hệ thống không lưu.
- **4b.** Từ đã tồn tại trong chủ đề được chọn: dưới ô "Từ *" hiện lỗi "Từ “customs” đã có trong chủ đề Du lịch." và hệ thống không lưu.

### 21. Use case: Quản lý từ vựng – Xóa từ vựng

**Kịch bản chuẩn**

1. Hùng phát hiện có một từ bị nhập sai chính tả và trùng nghĩa với từ đã có. Hùng đăng nhập và chọn mục "Từ vựng" trên thanh bên.
2. Hùng mở chủ đề "Du lịch" từ bảng chủ đề. Trang chủ đề hiện ô "Tìm trong chủ đề", bộ lọc "Trình độ", "Nội dung" và bảng từ của chủ đề.
3. Hùng gõ "souv" vào ô "Tìm trong chủ đề".
4. Bảng từ hiện kết quả, với cột "Người học" (số người đã học) và cột **[Đề xuất]** "Câu hỏi tham chiếu":

| Mã | Từ | Nghĩa | Chủ đề | CEFR | Số người đã học | Số câu hỏi tham chiếu |
|---|---|---|---|---|---|---|
| 112 | souvenir | quà lưu niệm | Du lịch | A2 | 128 | 2 |
| 349 | souvenier | quà lưu niệm | Du lịch | A2 | 3 | 0 |

5. Hùng click "Xóa" ở dòng "souvenier" (mã 349, từ gõ sai chính tả).
6. Hệ thống kiểm tra thấy từ 349 đã được 3 người học học, nên hiện hộp thoại "Xóa từ “souvenier”?" với nội dung "Từ “souvenier” đã được 3 người học học. Từ sẽ bị ẩn đối với các lượt học mới; lịch sử học cũ được giữ nguyên." (dùng lại hộp thoại chuyển vào "Lưu trữ" hiện có) cùng nút "Hủy" và nút "Xóa từ".
7. Hùng click nút "Xóa từ".
8. Hệ thống đánh dấu từ 349 là đã ẩn (trên giao diện admin gọi là "Lưu trữ"). Từ này không còn được đưa vào phiên học, phiên ôn tập, trò chơi hay kết quả tìm kiếm của người học; trạng thái học và các lượt ôn cũ của 3 người học vẫn được giữ.
9. Thông báo "Đã chuyển vào Lưu trữ · Người học không gặp lại “souvenier”…" hiện ở góc màn hình; dòng của từ rời khỏi bảng từ.

**Kịch bản ngoại lệ**

- **4a.** Không tìm thấy từ nào: bảng báo "Không có từ phù hợp", xử lý như 8a của kịch bản 19.
- **6a.** Từ chưa được người học nào học và không có câu hỏi tham chiếu: hộp thoại "Xóa vĩnh viễn từ “…”?" chỉ hỏi xác nhận, với nút "Xóa vĩnh viễn". Khi Hùng xác nhận, từ bị xóa hẳn khỏi hệ thống.
- **6b.** Từ đang được câu hỏi của một đề kiểm tra đang mở tham chiếu: hộp thoại nêu thêm tên đề đó **[Đề xuất]**. Nếu Hùng xác nhận, từ bị ẩn còn câu hỏi của đề giữ nguyên nội dung.
- **7a.** Hùng click "Hủy": hệ thống không xóa và quay lại bảng kết quả.

### 22. Use case: Quản lý từ vựng – Quản lý chủ đề

**Kịch bản chuẩn**

1. Hùng muốn mở thêm chủ đề "Mua sắm". Hùng đăng nhập và chọn mục "Từ vựng" trên thanh bên.
2. Trang "Từ vựng" hiện nút "+ Thêm chủ đề" và bảng "Danh sách chủ đề", mỗi dòng có thao tác "Sửa", "Xóa":

| STT | Chủ đề | Mô tả | Số từ | Thao tác |
|---|---|---|---|---|
| 1 | Du lịch | Sân bay, khách sạn, tham quan | 41 | Sửa, Xóa |
| 2 | Công việc | Văn phòng, phỏng vấn, cuộc họp | 35 | Sửa, Xóa |
| 3 | Gia đình | Thành viên, quan hệ, sinh hoạt | 30 | Sửa, Xóa |
| 4 | Thức ăn | Món ăn, nấu nướng, nhà hàng | 45 | Sửa, Xóa |

   Bảng trên giao diện còn có các cột "Trình độ", "Còn thiếu", "Người học đã học", "Cập nhật"; mô tả của chủ đề xem trong hộp thoại "Sửa" hoặc ở trang chủ đề.
3. Hùng click nút "+ Thêm chủ đề".
4. Hộp thoại "Thêm chủ đề" hiện ra với: ô "Tên chủ đề *" (gợi ý "Tối đa 150 ký tự, không trùng tên chủ đề khác."), ô "Mô tả", ô tải "Ảnh minh họa", nút "Hủy" và nút "Lưu".
5. Hùng nhập tên "Mua sắm", mô tả "Cửa hàng, giá cả, thanh toán", tải lên hình mua_sam.png rồi click nút "Lưu".
6. Hệ thống kiểm tra tên chủ đề không trống và không trùng với chủ đề khác, rồi lưu chủ đề mới.
7. Thông báo "Đã lưu · Đã thêm chủ đề “Mua sắm”." hiện ở góc màn hình. Bảng có thêm dòng "Mua sắm" với số từ 0. Khi chủ đề chưa có từ, thẻ chủ đề của người học ghi "Chưa có từ" và trang chủ đề báo "Chủ đề này chưa có từ nào." (nhánh 6b của kịch bản 5).

**Kịch bản ngoại lệ**

- **2a.** Sửa chủ đề: Hùng click "Sửa" ở một dòng, hộp thoại "Sửa chủ đề “…”" hiện ra với dữ liệu đã điền sẵn; Hùng sửa rồi click nút "Lưu". Các từ thuộc chủ đề không bị ảnh hưởng.
- **2b.** Xóa chủ đề còn từ vựng: hộp thoại "Chưa xóa được chủ đề “Du lịch”" báo "Chủ đề còn 41 từ, hãy chuyển các từ sang chủ đề khác hoặc xóa từ trước." với nút "Đóng". Với chủ đề không còn từ nào, hộp thoại "Xóa chủ đề “…”?" ghi "Chủ đề chưa có từ nào. Người học sẽ không còn thấy thẻ chủ đề này." và hỏi xác nhận rồi xóa.
- **6a.** Tên chủ đề để trống hoặc trùng với chủ đề khác: dưới ô "Tên chủ đề *" hiện lỗi "Vui lòng nhập tên chủ đề." hoặc "Đã có chủ đề tên “…”." và hệ thống không lưu.

### 23. Use case: Quản lý bài tập

Kịch bản chuẩn đi theo chức năng thêm một bài tập đọc hiểu có bài đọc.

**Kịch bản chuẩn**

1. Hùng đăng nhập và chọn mục "Bài tập" trên thanh bên.
2. Trang "Bài tập" hiện ra với: dòng tóm tắt "… bài đã xuất bản · … bản nháp"; nút "+ Tạo bài tập"; các tab kỹ năng "Tất cả", "Đọc hiểu", "Viết", "Nghe hiểu", "Phát âm" **[Đề xuất: "Đọc hiểu" và "Viết" thay cho "Ngữ pháp"]**; bộ lọc "Trạng thái" (Mọi trạng thái / Đã xuất bản / Nháp / Lưu trữ), "Trình độ"; ô "Tìm theo tên bài"; bảng "Danh sách bài tập" với cột "Bài tập", "Kỹ năng", "Trình độ", "Độ khó", "Nội dung" (số câu hỏi, số bài đọc), "Trạng thái", "Lượt làm", "Cập nhật" và thao tác sửa, xóa. Tab "Đọc hiểu" đang được chọn:

| Mã | Tiêu đề | Chủ đề | CEFR | Số bài đọc | Số câu | Trạng thái |
|---|---|---|---|---|---|---|
| 20 | A trip to Ha Long Bay | Du lịch | A2 | 1 | 8 | Đã xuất bản |
| 21 | Thì hiện tại đơn | Thì động từ | A1 | 0 | 10 | Đã xuất bản |
| 22 | Thì quá khứ đơn | Thì động từ | A2 | 0 | 10 | Đã xuất bản |
| 23 | Thì hiện tại hoàn thành | Thì động từ | B1 | 1 | 10 | Đã xuất bản |
| 24 | Câu bị động | Cấu trúc câu | B1 | 0 | 12 | Đã xuất bản |

3. Hùng click nút "+ Tạo bài tập".
4. Trang "Bài tập mới" hiện ra gồm:
   - Phần thông tin bài học: "Tiêu đề *", "Mô tả", "Kỹ năng" (không đổi được sau khi tạo), "Trình độ *", "Chủ đề (không bắt buộc)", "Độ khó" (Dễ / Vừa / Khó), "Thời gian ước tính (phút)", "Trạng thái" (Nháp / Đã xuất bản / Lưu trữ),
   - Phần **[Đề xuất]** "Bài đọc" (đang trống) với nút "+ Thêm bài đọc",
   - Danh sách câu hỏi (đang trống) với nút "+ Thêm câu hỏi"; mỗi câu có nút sửa và nút chuyển lên, xuống,
   - Nút "Tạo bài" ở đầu trang.
5. Hùng nhập tiêu đề "Câu điều kiện loại 1", mô tả "Diễn tả điều có thể xảy ra ở hiện tại hoặc tương lai", chủ đề "Cấu trúc câu", trình độ B1, thời gian 15 phút, trạng thái nháp, rồi click nút "+ Thêm bài đọc".
6. Form bài đọc **[Đề xuất]** hiện ra với ô tiêu đề và ô nội dung đoạn văn. Hùng nhập tiêu đề "Plans for the weekend" và một đoạn văn khoảng 150 từ, bắt đầu bằng "If the weather is nice on Saturday, Minh will go camping with his friends. If it rains, they will watch a film at home instead…", rồi click thêm vào bài.
7. Hùng click nút "+ Thêm câu hỏi". Form câu hỏi hiện ra với: "Loại câu" (Trắc nghiệm / Điền từ), danh sách chọn **[Đề xuất]** "Bài đọc liên quan" (các bài đọc của bài học này, mặc định "Không gắn bài đọc"), "Đề bài *" (gợi ý "Dùng ___ cho chỗ trống."), "Gợi ý (hiện khi người học bấm “Gợi ý”)", "Giải thích (chỉ hiện sau khi người học trả lời)", "Điểm". Với câu trắc nghiệm, form có khu "Lựa chọn (chọn 1 đáp án đúng)" gồm các ô A, B, C, D và nút chọn đáp án đúng; với câu điền từ, form có khu "Đáp án chấp nhận (không phân biệt hoa thường)" và nút thêm đáp án.
8. Hùng thêm câu 1 (điền chỗ trống, không gắn bài đọc): nội dung "If it ___ (rain) tomorrow, we will stay at home."; đáp án được chấp nhận "rains"; gợi ý "Mệnh đề if dùng thì hiện tại đơn"; giải thích "Câu điều kiện loại 1: If + hiện tại đơn, will + động từ nguyên mẫu."; điểm 1. Hùng thêm câu vào bài.
9. Hùng thêm câu 2 (trắc nghiệm ngữ pháp, không gắn bài đọc): nội dung "If she studies hard, she ___ the exam."; các lựa chọn A. passes, B. will pass, C. passed, D. would pass; đánh dấu B là đáp án đúng; điểm 1. Hùng thêm câu vào bài.
10. Hùng thêm câu 3 (câu hỏi về bài đọc): loại trắc nghiệm; bài đọc liên quan "Plans for the weekend"; nội dung "What will Minh do if it rains on Saturday?"; các lựa chọn A. Go camping, B. Watch a film at home, C. Visit his grandparents, D. Go to school; đánh dấu B là đáp án đúng; giải thích "Câu thứ hai của bài đọc: If it rains, they will watch a film at home instead."; điểm 1. Hùng thêm câu vào bài.
11. Hùng thêm tiếp câu 4–10 theo cách tương tự, đổi trạng thái sang "Đã xuất bản" rồi click nút "Tạo bài" **[Đề xuất: cho chọn "Đã xuất bản" ngay khi tạo; hiện bài mới luôn được lưu ở dạng Nháp]**.
12. Hệ thống kiểm tra: tiêu đề và mức CEFR không trống; bài xuất bản có ít nhất một câu hỏi; mỗi bài đọc có tiêu đề và nội dung; mỗi câu trắc nghiệm có ít nhất hai lựa chọn và đúng một đáp án đúng; mỗi câu điền từ có ít nhất một đáp án được chấp nhận; câu hỏi gắn bài đọc thì bài đọc đó thuộc chính bài học này. Dữ liệu hợp lệ nên hệ thống lưu bài học (mã 25) cùng 1 bài đọc và 10 câu hỏi.
13. Thông báo "Đã lưu · Đã tạo bài “Câu điều kiện loại 1”." hiện ở góc màn hình. Bảng ở tab "Đọc hiểu" có thêm dòng "25 | Câu điều kiện loại 1 | Cấu trúc câu | B1 | 1 | 10 | Đã xuất bản". Bài xuất hiện ngay trong tab "Đọc hiểu" của người học (bước 4 của kịch bản 9).

**Kịch bản ngoại lệ**

- **2a.** Sửa bài tập: Hùng tìm bài bằng ô "Tìm theo tên bài" rồi mở bài. Trang bài tập giống bước 4 hiện ra với dữ liệu đã điền sẵn, dòng "N lượt làm" và nhãn "Có thay đổi chưa lưu" khi có sửa đổi; Hùng sửa rồi click nút "Lưu thay đổi". Sửa đáp án (hoặc câu trả lời mẫu) của một câu đã có người làm không làm thay đổi điểm của các lượt làm trước đó.
- **2b.** Xóa bài tập: Hùng click xóa ở một dòng. Nếu bài đã có lượt làm của người học, hộp thoại "Xóa bài “…”?" báo "Bài đã có N lượt làm nên sẽ được chuyển sang Lưu trữ…" với nút "Chuyển vào Lưu trữ": bài chỉ bị ẩn (như kịch bản 21). Nếu chưa có lượt làm nào, hộp thoại "Xóa vĩnh viễn bài “…”?" ghi "Chưa có ai làm bài này. Bài sẽ bị xóa khỏi hệ thống và không khôi phục được." và bài bị xóa hẳn sau khi Hùng xác nhận.
- **3a.** Tạo bài ở kỹ năng "Viết" **[Đề xuất]**: trang không có phần bài đọc. Form câu hỏi có: loại câu hỏi (dịch câu/viết lại câu/viết câu theo từ khóa), nội dung (câu tiếng Việt cần dịch; câu gốc kèm phần mở đầu cho sẵn nếu có; hoặc các từ khóa gợi ý), danh sách câu trả lời mẫu với nút thêm câu mẫu, gợi ý, giải thích, điểm. Ví dụ câu 4 của bài "Viết về chuyến đi" (kịch bản 10): loại dịch câu; nội dung "Chuyến bay của chúng tôi bị hoãn vì thời tiết xấu."; hai câu trả lời mẫu "Our flight was delayed because of bad weather." và "Our flight was delayed due to bad weather."; điểm 2. Mỗi câu viết phải có ít nhất một câu trả lời mẫu vì Dịch vụ AI dựa vào đề bài và câu trả lời mẫu để chấm.
- **3b.** Tạo bài ở kỹ năng "Nghe hiểu": trang có phần bài nghe thay cho phần bài đọc, gồm file âm thanh, transcript đầy đủ, bản dịch và danh sách đoạn (thứ tự, mốc thời gian bắt đầu/kết thúc dạng "0:00.0", người nói, transcript và bản dịch của đoạn); file âm thanh và transcript là bắt buộc. Câu hỏi chỉ có loại trắc nghiệm và điền từ.
- **3c.** Tạo bài ở kỹ năng "Phát âm": danh sách câu hỏi được thay bằng danh sách "Câu mẫu", mỗi câu mẫu gồm văn bản mẫu, phiên âm IPA và âm thanh mẫu (cả ba đều bắt buộc), kèm ghi chú cách đọc không bắt buộc.
- **8a.** Câu trắc nghiệm chưa đánh dấu đáp án đúng hoặc có ít hơn hai lựa chọn; câu điền từ chưa có đáp án được chấp nhận; câu viết chưa có câu trả lời mẫu: form câu hỏi báo lỗi tại chỗ thiếu, câu trong danh sách hiện dòng "Câu này còn lỗi, bấm “Sửa” để xem." và chưa được tính vào bài.
- **12a.** Hùng chọn xuất bản khi bài chưa có câu hỏi: hệ thống báo "Bài xuất bản phải có ít nhất một câu hỏi". Hùng có thể lưu bài ở trạng thái "Nháp"; người học không nhìn thấy bài nháp.

### 24. Use case: Quản lý đề kiểm tra

Kịch bản chuẩn đi theo chức năng thêm một đề kiểm tra định kỳ.

**Kịch bản chuẩn**

1. Hùng chuẩn bị đề cho tuần 42. Hùng đăng nhập và chọn mục "Đề kiểm tra" trên thanh bên.
2. Trang "Đề kiểm tra" hiện ra với: dòng tóm tắt "… đề định kỳ đang mở · … đề tổng hợp"; nút "+ Tạo đề"; bộ lọc "Loại đề" (Tất cả / Định kỳ / Tổng hợp) và "Trạng thái" (Tất cả / Nháp / Sắp mở / Đang mở / Đã đóng); bảng "Danh sách đề kiểm tra" với cột "Đề", "Thời gian mở", "Trạng thái", "Câu hỏi", "Bài đã nộp", "Điểm TB" và thao tác:

| Mã | Tiêu đề | Loại | Số câu | Ngày mở | Ngày đóng | Số lượt làm | Thao tác |
|---|---|---|---|---|---|---|---|
| 40 | Kiểm tra tuần 40 – 2026 | Định kỳ | 10 | 28/09/2026 | 04/10/2026 | 412 | Sửa, Xóa |
| 41 | Kiểm tra tuần 41 – 2026 | Định kỳ | 10 | 05/10/2026 | 11/10/2026 | 150 | Sửa, Xóa |
| 42 | Kiểm tra tháng 10/2026 | Định kỳ | 30 | 01/10/2026 | 31/10/2026 | 96 | Sửa, Xóa |
| 43 | Kiểm tra tổng hợp tháng 10/2026 | Tổng hợp | 23 | 01/10/2026 | 31/10/2026 | 64 | Sửa, Xóa |

3. Hùng click nút "+ Tạo đề".
4. Trang "Đề kiểm tra mới" hiện ra với: ô "Tên đề *", lựa chọn "Loại đề" (Định kỳ / Tổng hợp 4 kỹ năng), ô **[Đề xuất]** "Kỹ năng" (nội dung của đề), ô "Ngày mở *", ô "Ngày đóng *" (dd/mm/yyyy); danh sách câu hỏi (đang trống) với hai nút "+ Thêm câu hỏi" và **[Đề xuất]** "Thêm câu hỏi từ kho từ vựng"; lựa chọn cách mở đề "Mở theo lịch" ("Hiện với người học từ ngày mở đến hết ngày đóng."); nút "Lưu đề".
5. Hùng nhập tên đề "Kiểm tra tuần 42 – 2026", chọn loại "Định kỳ", kỹ năng "Từ vựng và ngữ pháp", ngày mở 12/10/2026, ngày đóng 18/10/2026.
6. Hùng click nút "Thêm câu hỏi từ kho từ vựng", tìm từ "customs" và chọn từ này. Hệ thống tạo sẵn một câu trắc nghiệm liên kết với từ "customs": nội dung "___ officers checked our bags at the airport.", đáp án đúng "Customs" và ba lựa chọn nhiễu lấy từ các từ khác cùng chủ đề (luggage, departure, itinerary). Hùng giữ nội dung, đặt điểm 1 và thêm câu vào đề.
7. Hùng thêm tiếp 9 câu trắc nghiệm và điền từ bằng nút "+ Thêm câu hỏi" (mỗi câu có "Kỹ năng", "Cách chấm" Trắc nghiệm / Điền từ, "Điểm", "Bậc CEFR", "Đề bài *"), theo cách thêm câu hỏi ở kịch bản 23. Câu tạo từ kho từ vựng nhận sẵn bậc của từ; bậc của câu hỏi dùng để xếp trình độ người học (kịch bản 15, bước 15).
8. Hùng chọn "Mở theo lịch" rồi click nút "Lưu đề".
9. Hệ thống kiểm tra: tiêu đề không trống, ngày đóng sau ngày mở, đề có ít nhất một câu hỏi, mỗi câu có đáp án đúng. Dữ liệu hợp lệ nên hệ thống lưu đề (mã 44) cùng 10 câu hỏi.
10. Thông báo "Đã lưu" hiện ở góc màn hình. Bảng có thêm dòng mã 44 với trạng thái "Sắp mở". Đề hiện trong danh sách đề đang mở của người học từ 12/10/2026 đến hết 18/10/2026.

**Kịch bản ngoại lệ**

- **2a.** Sửa đề đã có lượt làm (ví dụ đề 41 đã có 150 lượt): trang đề báo "Đề đã có 150 bài nộp: chỉ sửa được tên đề, ngày đóng…"; hệ thống chỉ cho sửa tiêu đề, ngày đóng và trạng thái hiện/ẩn, không cho thêm, sửa hay xóa câu hỏi (kể cả lời văn câu hỏi), để điểm của các lượt đã làm luôn thống nhất. Đề chưa có lượt làm nào được sửa đầy đủ như bước 4–9.
- **2b.** Xóa đề: nếu đề đã có lượt làm, hệ thống cảnh báo và chỉ ẩn đề, lịch sử kiểm tra của người học giữ nguyên; nếu chưa có lượt làm, đề bị xóa hẳn sau khi Hùng xác nhận (cùng mẫu hộp thoại xóa bài tập ở nhánh 2b của kịch bản 23).
- **2c.** Nhân bản đề: Hùng click "Nhân bản" ở dòng của một đề, hoặc nút "Nhân bản đề tuần … thành tuần …" ở khối nhắc "Chưa có đề định kỳ cho tuần …" khi tuần tới chưa có đề. Hộp thoại "Nhân bản “…”" hiện ô "Tên đề mới *", "Ngày mở *", "Ngày đóng *" (điền sẵn cho tuần kế tiếp) và nút "Tạo bản nháp". Hệ thống tạo đề mới ở trạng thái "Nháp" với toàn bộ câu hỏi của đề gốc (không chép bài nộp), báo "Đã tạo bản nháp" và mở trang của đề mới; Hùng sửa nếu cần rồi chọn "Mở theo lịch" và lưu như bước 8–10.
- **5a.** Thêm đề loại "Tổng hợp 4 kỹ năng": đề phải có câu hỏi của đủ bốn kỹ năng nghe, nói, đọc, viết, và có ngày mở, ngày đóng như đề định kỳ. Câu nghe phải có file âm thanh (ô "Âm thanh của câu", hoặc bài nghe chung của phần, kèm ô "Lời thoại" hiện cho người học sau khi nộp bài). Câu viết chọn cách chấm "Tự luận (AI chấm)". Câu nói chọn "Tự luận (AI chấm)" (đề bài nói, người học gõ câu trả lời) hoặc "Đọc theo mẫu" (admin nhập "Câu mẫu *", người học ghi âm, hệ thống chấm phát âm); cả hai không có đáp án đúng.
- **9a.** Ngày đóng không sau ngày mở: dưới ô ngày đóng hiện lỗi "Ngày đóng phải sau ngày mở." và hệ thống không lưu.
- **9b.** Đề tổng hợp thiếu câu hỏi của một kỹ năng: hệ thống báo "Đề tổng hợp cần đủ 4 kỹ năng: còn thiếu …" và không lưu.

### 25. Use case: Quản lý người dùng

Kịch bản chuẩn đi theo chức năng khóa một tài khoản người học.

**Kịch bản chuẩn**

1. Hùng nhận báo cáo rằng tài khoản nam.pv@gmail.com dùng chatbot để gửi nội dung quảng cáo. Hùng đăng nhập và chọn mục "Người dùng" trên thanh bên.
2. Trang "Người dùng" hiện ra với: dòng tóm tắt "… người học · … tài khoản đang bị khóa"; ô "Tìm theo họ tên hoặc email"; lựa chọn "Trạng thái tài khoản" (Tất cả / Đang hoạt động / Đã khóa); bộ lọc "Trình độ"; lựa chọn "Sắp xếp"; bảng "Danh sách người học" (có phân trang) với cột "Người học", "Email", "Trình độ", "Trạng thái", "Ngày đăng ký", "Hoạt động gần nhất".
3. Hùng gõ "nam.pv" vào ô tìm kiếm.
4. Bảng "Kết quả tìm kiếm" hiện dòng "1 kết quả cho “nam.pv”":

| Mã | Họ tên | Email | Trình độ | Ngày tạo | Trạng thái |
|---|---|---|---|---|---|
| 1087 | Phạm Văn Nam | nam.pv@gmail.com | A2 | 15/09/2026 | Hoạt động |

5. Hùng click dòng "Phạm Văn Nam".
6. Trang chi tiết tài khoản hiện ra với: đường dẫn "Người dùng" để quay lại; khối hồ sơ (họ tên, email, trình độ, nhãn trạng thái "Đang hoạt động", dòng "Đăng ký 15/09/2026 · Hoạt động gần nhất: …") cùng nút "Khóa tài khoản"; các thẻ số liệu học tập "Từ đã học" 12, "Chuỗi ngày học" (dòng phụ "học gần nhất 05/10", tức ngày học gần nhất 05/10/2026), "Bài tập hoàn thành" 1, "Bài kiểm tra đã nộp" 0, thẻ **[Đề xuất]** "Phiên chat" 37; khối kế hoạch học và khối "Hoạt động gần đây".
7. Hùng click nút "Khóa tài khoản".
8. Hộp thoại "Khóa tài khoản Phạm Văn Nam?" hiện ra với các ý: "Người học bị đăng xuất ngay trên mọi thiết bị.", "Không đăng nhập được; màn đăng nhập báo tài khoản đã bị khóa.", "Toàn bộ dữ liệu học tập được giữ nguyên; mở khóa là học tiếp được."; nút "Hủy" và nút "Khóa tài khoản". Hùng click "Khóa tài khoản".
9. Hệ thống đổi trạng thái tài khoản 1087 sang bị khóa và kết thúc các phiên đăng nhập đang mở của tài khoản này.
10. Thông báo "Đã khóa tài khoản Phạm Văn Nam" hiện ở góc màn hình. Trang chi tiết hiển thị nhãn "Đã khóa" và nút "Mở khóa" thay cho nút "Khóa tài khoản". Lần đăng nhập tiếp theo của Nam bị từ chối (nhánh 4b của kịch bản 2).

**Kịch bản ngoại lệ**

- **2a.** Bảng chỉ liệt kê tài khoản người học; admin không khóa được tài khoản admin (kể cả tài khoản của chính mình) từ giao diện này. Nếu yêu cầu khóa nhắm vào tài khoản admin, hệ thống báo "Không thể khóa tài khoản quản trị.".
- **4a.** Không tìm thấy tài khoản nào: bảng báo "Không tìm thấy người dùng phù hợp".
- **7a.** Mở khóa tài khoản: với tài khoản đang bị khóa, Hùng click nút "Mở khóa"; hộp thoại "Mở khóa tài khoản …?" ghi "Người học đăng nhập lại được bình thường và học tiếp với dữ liệu cũ." và Hùng xác nhận. Trạng thái tài khoản trở lại hoạt động và người học đăng nhập được bình thường.
- **8a.** Hùng click "Hủy" trong hộp thoại xác nhận: trạng thái tài khoản không thay đổi.

### 26. Use case: Xem thống kê

**Kịch bản chuẩn**

1. Đầu tháng 10, Hùng muốn xem tình hình sử dụng hệ thống trong tháng 9/2026. Hùng đăng nhập; trang "Tổng quan hệ thống" (mục "Tổng quan" trên thanh bên) là trang đầu tiên của admin.
2. Trang "Tổng quan hệ thống" hiện ra với lựa chọn "Khoảng thời gian" gồm "7 ngày", "30 ngày" (mặc định), "90 ngày" và "Tùy chọn…"; khi chọn "Tùy chọn…" sẽ hiện ô "Từ ngày", "Đến ngày" và nút "Xem".
3. Hùng chọn "Tùy chọn…", nhập từ ngày 01/09/2026, đến ngày 30/09/2026 rồi click nút "Xem".
4. Hệ thống tính số liệu từ dữ liệu hiện có trong khoảng thời gian đã chọn. Người dùng hoạt động là người học có ít nhất một ngày học trong kỳ. Khối "Chỉ số chính" hiển thị các thẻ:

| Chỉ số | Giá trị | Thẻ trên giao diện |
|---|---|---|
| Tổng số người dùng (đến 30/09/2026) | 1 250 | Thẻ "Người học" |
| Người dùng mới trong kỳ | 180 | Dòng phụ "+180 người mới trong kỳ" của thẻ "Người học" |
| Người dùng hoạt động trong kỳ | 640 | Thẻ "Hoạt động trong kỳ" **[Đề xuất: thay thẻ "Hoạt động hôm nay" hiện có]** |
| Tổng lượt ôn từ vựng | 25 430 | Thẻ "Lượt ôn từ vựng" |
| Tổng lượt làm bài tập | 8 120 | Thẻ "Lượt làm bài tập" **[Đề xuất: đổi từ "Bài tập hoàn thành"]** |
| Tổng lượt làm bài kiểm tra | 1 045 | Thẻ "Bài kiểm tra đã nộp" |

   Bên dưới là biểu đồ cột số người học hoạt động theo ngày và bảng **[Đề xuất]** "Nội dung được học nhiều nhất" (gộp hai danh sách "Chủ đề được ôn nhiều nhất", "Bài tập được làm nhiều nhất" hiện có, thêm đề kiểm tra và cột số người học), sắp xếp theo số người học:

| STT | Nội dung | Loại | Số lượt học | Số người học |
|---|---|---|---|---|
| 1 | Du lịch | Chủ đề từ vựng | 6 820 | 410 |
| 2 | Kiểm tra tổng hợp tháng 9/2026 | Đề kiểm tra | 420 | 395 |
| 3 | Thì hiện tại hoàn thành | Bài đọc hiểu | 1 150 | 380 |
| 4 | Công việc | Chủ đề từ vựng | 5 240 | 350 |
| 5 | Booking a hotel room | Bài nghe hiểu | 610 | 300 |

   Trang còn có khối "Trình độ người học" (phân bố trình độ) và khối "Cần chú ý" (từ chưa có audio hoặc câu ví dụ, bài tập thiếu file âm thanh hoặc chưa có câu hỏi, tuần tới chưa có đề định kỳ, tài khoản đang bị khóa; mỗi dòng dẫn tới trang để xử lý), không thuộc kịch bản này.

5. Hùng xem xong và chọn mục khác trên thanh bên.

**Kịch bản ngoại lệ**

- **3a.** Ngày bắt đầu sau ngày kết thúc: dưới form báo lỗi "Ngày bắt đầu phải trước hoặc trùng ngày kết thúc." và hệ thống không tính số liệu.
- **4a.** Trong kỳ không có hoạt động nào: các chỉ số bằng 0 và bảng nội dung được học nhiều nhất trống (như dòng "Chưa có lượt ôn nào trong kỳ này." hiện có).

## Giao diện đề xuất thêm

Tổng hợp các chỗ đánh dấu **[Đề xuất]** ở trên, tức giao diện hệ thống chưa có. Mỗi đề xuất ưu tiên dùng lại thành phần sẵn có (ghi ở cột "Dùng lại"). Phần backend cần sửa để chạy đúng logic được ghi ở `So-sanh-kich-ban-he-thong.md`.

**Khu người học**

| Màn hình | Đề xuất | Dùng lại | Kịch bản |
|---|---|---|---|
| Đăng nhập | Điền sẵn email sau khi đăng ký | Thông báo "Tạo tài khoản thành công…" đã có | 1 |
| Tiến độ (trang chủ) | Khu thông báo: đề định kỳ đang mở, nhắc nhở mục tiêu tuần, cảnh báo tuần chưa đạt | Thẻ "Từ cần ôn hôm nay" | 2, 14, 18 |
| Tiến độ (trang chủ) | Thẻ "Bài kiểm tra đã làm" kèm điểm trung bình | Thẻ số liệu hiện có | 16 |
| Tiến độ (trang chủ) | Ô "Từ ngày", "Đến ngày", nút "Xem"; bảng số liệu dưới biểu đồ | Form khoảng thời gian của trang "Tổng quan" (admin) | 16 |
| Tiến độ (trang chủ) | Thông báo chúc mừng khi đạt huy hiệu | Thông báo (toast) của khu admin | 16 |
| Mọi trang | Hộp thoại "Đăng xuất?" khi đang làm bài kiểm tra | Hộp thoại "Nộp bài kiểm tra?" | 3 |
| Học thẻ | Nút "Kết thúc" mở màn tổng kết (thay nút ✕) | Thẻ "Hoàn thành phiên ôn tập" | 5 |
| Học thẻ | Tổng kết: tên chủ đề, dòng "Cần ôn vào ngày mai" | Thẻ "Hoàn thành phiên ôn tập" | 5, 6 |
| Học thẻ | Vô hiệu nút "🔊 Nghe phát âm" khi từ thiếu file (hiện đọc bằng giọng của trình duyệt) | — | 5 |
| Ôn tập | Liên kết "Học theo chủ đề →" khi không có từ cần ôn | — | 6 |
| Tạo danh sách riêng | Dòng "Không tìm thấy từ phù hợp…"; lỗi tên trống hoặc trùng | Hộp thoại "Tạo danh sách riêng" | 7 |
| Trò chơi | Ô chọn "Chủ đề" (chủ đề có sẵn và danh sách riêng); mô tả cách chơi theo luật mới; thông báo chủ đề chưa đủ từ | Trang "Trò chơi từ vựng" | 8 |
| Trò chơi | Dòng "Thời gian …" và bảng "Các câu sai" ở kết quả | Thẻ kết quả ván chơi | 8 |
| Bài tập | Tab "Đọc hiểu", "Viết" thay tab "Ngữ pháp" | Thanh tab kỹ năng | 9, 10 |
| Bài đọc hiểu | Khung "Bài đọc" bên trái câu hỏi | Bố cục hai cột của bài nghe | 9 |
| Bài viết | Ô soạn nhiều dòng; trạng thái "Đang chấm…"; khung điểm kèm nhận xét AI, câu mẫu; "Gửi chấm lại"; "Xem chi tiết"; "Còn N câu chưa chấm" | Khung bài ngữ pháp, khung "✓ Chính xác!", thẻ kết quả | 10 |
| Bài nghe | Nút "Lùi 5 giây"; khóa phụ đề khi bắt đầu trả lời | Trình phát hiện có | 11 |
| Bài nghe | Thông báo tải lỗi kèm "Tải lại", khóa câu hỏi khi chưa tải được bài nghe | — | 11 |
| Bài nghe | Hộp thoại xác nhận nộp khi còn câu trống (thay việc chặn nộp) | Hộp thoại "Nộp bài kiểm tra?" | 11 |
| Bài nghe | Tô vàng đoạn chứa đáp án câu sai; thẻ bài hiện kết quả gần nhất | Khu "Bản chép lời" | 11 |
| Luyện phát âm | Thẻ bài hiện "Đã luyện x/y mục"; cột số lần thử ở tổng kết; bỏ chỉ số "Đầy đủ" | Danh sách "Điểm tốt nhất từng mục" | 12 |
| Chatbot | Dòng ngữ cảnh ở đầu khung chat; tự nạp phiên của bài khi quay lại | Khung "Trợ lý AI", mục "Lịch sử" | 13 |
| Kiểm tra | Khối "Lịch sử kiểm tra"; thông báo khi một loại đề không có đề đang mở | Thẻ đề, trang "Kết quả kiểm tra" | 14, 15 |
| Kiểm tra | Màn giới thiệu: nội dung, hướng dẫn của đề; bảng cấu trúc theo phần | Màn giới thiệu hiện có | 14, 15 |
| Kiểm tra | Hộp thoại nộp bài nêu số thứ tự câu trống; bỏ "Làm lại từ đầu" | Hộp thoại "Nộp bài kiểm tra?" | 14 |
| Làm bài kiểm tra tổng hợp | Dãy số câu chia theo phần; bài nghe, đoạn văn chung của phần; ghi âm phần Nói (tối đa 1 phút); bộ đếm số từ phần Viết | Trình phát bài nghe, bộ ghi âm bài phát âm | 15 |
| Kết quả kiểm tra | Dòng người học, ngày làm, trình độ trước; cột nhận xét theo kỹ năng; nút "Áp dụng lộ trình vào kế hoạch học →" | Trang "Kết quả kiểm tra" | 15 |
| Kế hoạch | Ô "Mô tả mục tiêu" bắt buộc; ô ngày bắt đầu, kết thúc; mọi trình độ mục tiêu kèm cảnh báo; lỗi tại ô | Khối "Đặt mục tiêu học tập" | 17 |
| Kế hoạch | Ô sửa mục tiêu tuần ở bản xem trước; nút "Tự lập kế hoạch"; điền sẵn khi đến từ báo cáo kiểm tra; hộp thoại tạm dừng kế hoạch cũ | Khối xem trước lộ trình | 17 |
| Kế hoạch | Dòng "Nhắc nhở: 8:00 thứ Hai đầu mỗi tuần" thay thẻ "Nhắc học hằng ngày"; trạng thái "chưa bắt đầu" | Khối "Kế hoạch của bạn" | 17 |
| Kế hoạch | Giao diện điều chỉnh: sửa mục tiêu các tuần chưa qua, đổi ngày kết thúc, "Lưu", "Hủy"; nút "Kết thúc kế hoạch"; hộp thoại xác nhận tạm dừng | Danh sách tuần của bản xem trước | 18 |

**Khu admin**

| Màn hình | Đề xuất | Dùng lại | Kịch bản |
|---|---|---|---|
| Trò chơi | **Đã chốt (03/10/2026): bỏ trang**, vì tham số ván chơi cố định và Business model không có chức năng này | — | 2 |
| Từ vựng | Cột "Câu hỏi tham chiếu"; hộp thoại xóa nêu tên đề đang mở | Bảng từ, hộp thoại xóa từ | 21 |
| Bài tập | Tab "Đọc hiểu", "Viết"; phần "Bài đọc" cùng form bài đọc; ô "Bài đọc liên quan" của câu hỏi | Trang soạn bài | 23 |
| Bài tập | Form câu hỏi viết (dạng câu, câu trả lời mẫu); cho chọn "Đã xuất bản" ngay khi tạo | Form câu hỏi hiện có | 23 |
| Đề kiểm tra | Ô "Kỹ năng" (nội dung đề); nút "Thêm câu hỏi từ kho từ vựng"; ngày mở, đóng cho đề tổng hợp; bài nghe chung của phần | Trang soạn đề | 24 |
| Đề kiểm tra | Khóa lời văn câu hỏi khi đề đã có bài nộp | — | 24 |
| Người dùng | Thẻ "Phiên chat" ở trang chi tiết | Thẻ số liệu hiện có | 25 |
| Tổng quan | Thẻ "Hoạt động trong kỳ", "Lượt làm bài tập"; bảng "Nội dung được học nhiều nhất" | Khối "Chỉ số chính", hai danh sách hiện có | 26 |

## Các điểm mới phát sinh cần nhóm chốt

Khi viết kịch bản chi tiết, một số quy tắc chưa có trong Business model đã được đề xuất. Nhóm cần xem lại trước khi sang bước trích lớp thực thể:

1. **Tài khoản:** mật khẩu tối thiểu 8 ký tự; khi đăng nhập sai, thông báo không nói rõ sai email hay sai mật khẩu; khóa tài khoản thì kết thúc ngay các phiên đang mở.
2. **Chấm câu điền từ:** không phân biệt chữ hoa/thường và bỏ qua khoảng trắng thừa khi so với đáp án được chấp nhận.
3. **Làm dở bài:** lượt làm bài tập và bài kiểm tra được lưu theo từng câu, giữ trạng thái đang làm và cho làm tiếp; đề đóng khi người học đang làm thì hệ thống tự nộp bài.
4. **Chatbot:** không nêu đáp án của câu chưa được kiểm tra/nộp; từ chối câu hỏi ngoài phạm vi học tiếng Anh.
5. **Nội dung đã có người dùng:** đề đã có lượt làm chỉ được sửa tiêu đề và ngày đóng; sửa đáp án bài tập không chấm lại các lượt cũ; không xóa chủ đề còn từ vựng; từ người học tự nhập chỉ người đó nhìn thấy.
6. **Trò chơi:** tham số ván chơi (số câu, thời gian, điểm mỗi câu) là cố định trong hệ thống; kết quả trò chơi không ảnh hưởng lịch ôn.
7. **Nghe hiểu:** phụ đề tạm ẩn khi người học trả lời câu hỏi.
8. **Điểm kiểm tra:** điểm mỗi kỹ năng và tổng điểm theo thang 100; tổng điểm kiểm tra tổng hợp là trung bình bốn kỹ năng. **Trình độ không quy đổi từ điểm** (sửa ngày 13/10/2026, thay cho "mọi điểm quy về thang 10"): mỗi câu hỏi gắn một bậc CEFR; kỹ năng Nghe, Đọc đạt một bậc khi được từ 60% điểm các câu bậc đó và mọi bậc dưới nó; kỹ năng Nói, Viết lấy mức Dịch vụ AI chấm theo bốn tiêu chí (mỗi tiêu chí 0–6), điểm phát âm của câu đọc theo câu mẫu là tiêu chí thứ năm của kỹ năng Nói; trình độ đề xuất là trung bình trình độ bốn kỹ năng. Kỹ năng không có câu nào gắn bậc thì quy đổi theo điểm. Chi tiết ở `docs/api/tests.md`, mục "Đánh giá trình độ".
9. **Kế hoạch học:** nhắc nhở vào 8:00 thứ Hai đầu mỗi tuần; khi áp dụng lộ trình mới trong lúc đang có kế hoạch đang thực hiện, kế hoạch cũ chuyển sang tạm dừng.
10. **Bài tập viết** (kịch bản 10): Dịch vụ AI chấm theo thang điểm của từng câu, từ 0 đến điểm tối đa, bước 0,5. Mỗi câu viết chỉ được chấm một lần trong một lượt; muốn viết lại thì làm lại bài (lượt mới). Khi AI chưa chấm được một câu, người học vẫn chuyển sang câu tiếp theo được; lượt làm bài giữ trạng thái đang làm và chưa được tính vào tiến độ cho đến khi mọi câu có điểm. Sửa câu trả lời mẫu không chấm lại các lượt cũ.
