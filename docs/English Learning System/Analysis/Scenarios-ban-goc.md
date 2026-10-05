# Kịch bản (Scenarios)

Mỗi use case cụ thể trong biểu đồ use case tổng quát có một **kịch bản chuẩn** (standard scenario) với dữ liệu cụ thể và các **kịch bản ngoại lệ** (exceptional scenarios). Kịch bản ngoại lệ được đánh số theo bước xảy ra rẽ nhánh: ví dụ **4a** là nhánh thứ nhất tại bước 4 của kịch bản chuẩn.

## Phạm vi và quy ước

- Use case trừu tượng (Học từ vựng, Làm bài tập, Làm bài kiểm tra, Chọn chủ đề, Làm phần kỹ năng) không có kịch bản riêng. Chúng được thực hiện thông qua kịch bản của các use case con.
- Use case con có quan hệ include (tìm kiếm từ vựng, chọn chủ đề, học thẻ và đánh giá mức nhớ, chọn mục luyện phát âm, ghi âm và chấm phát âm, chọn đề kiểm tra, làm các phần kỹ năng, xem báo cáo kết quả, nhận gợi ý lộ trình) là các bước nằm trong kịch bản của use case chính.
- Use case con có quan hệ extend và có luồng riêng (thêm từ vựng, xóa từ vựng, quản lý chủ đề, lập kế hoạch mới, điều chỉnh kế hoạch) có kịch bản riêng.
- Với quản lý bài tập, quản lý đề kiểm tra và quản lý người dùng, kịch bản chuẩn đi theo chức năng con chính. Các chức năng sửa/xóa đi theo cùng mẫu với sửa/xóa từ vựng; điểm khác biệt được ghi ở kịch bản ngoại lệ.
- Trừ kịch bản 1 (Đăng ký) và 2 (Đăng nhập), mọi kịch bản bắt đầu khi actor đã đăng nhập thành công. Các bước đăng nhập chỉ được mô tả một lần ở kịch bản 2.

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
2. Giao diện đăng nhập hiện ra với: ô nhập email, ô nhập mật khẩu, nút đăng nhập và liên kết "Đăng ký tài khoản".
3. Khoa click liên kết "Đăng ký tài khoản".
4. Giao diện đăng ký hiện ra với: ô nhập họ tên, ô nhập email, ô nhập mật khẩu, ô nhập lại mật khẩu, nút đăng ký và liên kết quay lại đăng nhập.
5. Khoa nhập họ tên "Đỗ Minh Khoa", email "khoa.do@gmail.com", mật khẩu "Khoa@1234", nhập lại mật khẩu "Khoa@1234" rồi click nút đăng ký.
6. Hệ thống kiểm tra: không ô nào để trống, email đúng định dạng và chưa được dùng cho tài khoản nào, mật khẩu có ít nhất 8 ký tự, hai lần nhập mật khẩu trùng nhau. Dữ liệu hợp lệ nên hệ thống tạo tài khoản mới với vai trò người học, trạng thái hoạt động, trình độ hiện tại để trống, mật khẩu được lưu ở dạng đã băm.
7. Hệ thống thông báo "Đăng ký thành công, vui lòng đăng nhập" và chuyển về giao diện đăng nhập, ô email được điền sẵn "khoa.do@gmail.com".

**Kịch bản ngoại lệ**

- **6a.** Email "khoa.do@gmail.com" đã được dùng cho một tài khoản khác: hệ thống báo "Email đã được sử dụng" cạnh ô email, giữ nguyên họ tên và email, xóa hai ô mật khẩu. Khoa nhập email khác và quay lại bước 5.
- **6b.** Mật khẩu ít hơn 8 ký tự hoặc hai lần nhập mật khẩu không khớp: hệ thống báo lỗi cạnh ô tương ứng và xóa hai ô mật khẩu. Quay lại bước 5.
- **6c.** Để trống một ô hoặc email sai định dạng (ví dụ "khoa.do@gmail"): hệ thống báo lỗi tại ô đó. Quay lại bước 5.

### 2. Use case: Đăng nhập

**Kịch bản chuẩn**

1. Buổi sáng 06/10/2026, Trần Thị Lan mở trang web của hệ thống để học.
2. Giao diện đăng nhập hiện ra với: ô nhập email, ô nhập mật khẩu, nút đăng nhập và liên kết "Đăng ký tài khoản".
3. Lan nhập email "lan.tran@gmail.com", mật khẩu "********" rồi click nút đăng nhập.
4. Hệ thống kiểm tra email và mật khẩu khớp với một tài khoản đang ở trạng thái hoạt động. Tài khoản có vai trò người học.
5. Giao diện chính của người học hiện ra với:
   - Lời chào "Xin chào, Trần Thị Lan" và trình độ hiện tại A2,
   - Bốn lựa chọn: học từ vựng, làm bài tập, làm bài kiểm tra, tiến độ và kế hoạch,
   - Menu tài khoản gồm: đổi mật khẩu, đăng xuất,
   - Khu vực thông báo gồm: "Bạn có 2 từ cần ôn hôm nay" và "Kiểm tra tuần 41 – 2026 đang mở đến 11/10/2026".

Nếu tài khoản có vai trò admin (ví dụ admin01@englishapp.vn), ở bước 5 giao diện chính của admin hiện ra với năm lựa chọn: quản lý từ vựng, quản lý bài tập, quản lý đề kiểm tra, quản lý người dùng, xem thống kê.

**Kịch bản ngoại lệ**

- **3a.** Lan để trống email hoặc mật khẩu: hệ thống báo "Vui lòng nhập email và mật khẩu" và không kiểm tra đăng nhập.
- **4a.** Email hoặc mật khẩu không đúng: hệ thống báo "Email hoặc mật khẩu không đúng" (không nói rõ sai ở ô nào) và xóa ô mật khẩu. Quay lại bước 3.
- **4b.** Tài khoản đã bị admin khóa (xem kịch bản 25): hệ thống báo "Tài khoản của bạn đã bị khóa, vui lòng liên hệ quản trị viên" và không cho đăng nhập.

### 3. Use case: Đăng xuất

**Kịch bản chuẩn**

1. Lan đã học xong và đang ở giao diện chính của người học.
2. Lan click menu tài khoản (tên "Trần Thị Lan" ở góc trên màn hình).
3. Menu tài khoản hiện ra với hai lựa chọn: đổi mật khẩu, đăng xuất.
4. Lan click đăng xuất.
5. Hệ thống kết thúc phiên làm việc của Lan và chuyển về giao diện đăng nhập.

**Kịch bản ngoại lệ**

- **4a.** Lan đang làm dở một bài kiểm tra: hệ thống hỏi "Bài kiểm tra đang làm sẽ được lưu ở trạng thái đang làm. Bạn có muốn đăng xuất?". Nếu Lan chọn hủy, Lan ở lại trang làm bài; nếu xác nhận, hệ thống thực hiện bước 5.
- **1a.** Lan không thao tác trong thời gian quá quy định: hệ thống tự kết thúc phiên làm việc. Ở thao tác tiếp theo, Lan được chuyển về giao diện đăng nhập.

### 4. Use case: Đổi mật khẩu

**Kịch bản chuẩn**

1. Lan muốn đổi mật khẩu. Tại giao diện chính, Lan click menu tài khoản rồi chọn đổi mật khẩu.
2. Giao diện đổi mật khẩu hiện ra với: ô mật khẩu hiện tại, ô mật khẩu mới, ô nhập lại mật khẩu mới, nút lưu và nút hủy.
3. Lan nhập mật khẩu hiện tại "Lan@2026", mật khẩu mới "Lan#Hoc2026", nhập lại "Lan#Hoc2026" rồi click nút lưu.
4. Hệ thống kiểm tra: mật khẩu hiện tại đúng; mật khẩu mới có ít nhất 8 ký tự, khác mật khẩu hiện tại; hai lần nhập mật khẩu mới khớp nhau. Dữ liệu hợp lệ nên hệ thống lưu mật khẩu mới ở dạng đã băm.
5. Hệ thống thông báo "Đổi mật khẩu thành công" và quay về giao diện chính. Từ lần đăng nhập sau, Lan dùng mật khẩu mới.

**Kịch bản ngoại lệ**

- **3a.** Lan click nút hủy: hệ thống không thay đổi gì và quay về giao diện chính.
- **4a.** Mật khẩu hiện tại không đúng: hệ thống báo "Mật khẩu hiện tại không đúng" và xóa cả ba ô. Quay lại bước 3.
- **4b.** Mật khẩu mới ít hơn 8 ký tự, trùng mật khẩu hiện tại, hoặc hai lần nhập không khớp: hệ thống báo lỗi tại ô tương ứng. Quay lại bước 3.

## II. Module A — Học từ vựng

### 5. Use case: Học flashcard theo chủ đề

**Kịch bản chuẩn**

1. Lan đăng nhập thành công (kịch bản 2). Giao diện chính hiện thông báo "Bạn có 2 từ cần ôn hôm nay". Lan muốn học thêm từ vựng về du lịch.
2. Lan chọn học từ vựng.
3. Giao diện học từ vựng hiện ra với bốn lựa chọn: học theo chủ đề, ôn tập từ đến hạn (2 từ), danh sách từ của tôi, trò chơi từ vựng.
4. Lan chọn học theo chủ đề.
5. Giao diện chọn chủ đề hiện ra gồm hai phần. Phần chủ đề có sẵn:

| STT | Chủ đề | Mô tả | Đã học/Tổng số từ |
|---|---|---|---|
| 1 | Du lịch | Sân bay, khách sạn, tham quan | 12/40 |
| 2 | Công việc | Văn phòng, phỏng vấn, cuộc họp | 20/35 |
| 3 | Gia đình | Thành viên, quan hệ, sinh hoạt | 30/30 |
| 4 | Thức ăn | Món ăn, nấu nướng, nhà hàng | 25/45 |

   Phần danh sách từ riêng:

| STT | Tên danh sách | Đã học/Tổng số từ |
|---|---|---|
| 1 | Từ khó tuần này | 2/6 |

6. Lan click chủ đề "Du lịch".
7. Hệ thống lập phiên học gồm 2 từ đến hạn ôn (itinerary, passport) xếp trước và 28 từ chưa học xếp sau, tổng cộng 30 thẻ. 10 từ đã học nhưng chưa đến hạn ôn không được đưa vào phiên. Giao diện flashcard hiện ra với "Thẻ 1/30" và mặt trước của thẻ gồm: từ "itinerary", phiên âm /aɪˈtɪn.ər.ər.i/, nút nghe phát âm, nút lật thẻ, nút kết thúc. Hệ thống tự phát âm từ "itinerary" một lần.
8. Lan click nút nghe phát âm để nghe lại, rồi click nút lật thẻ.
9. Mặt sau của thẻ hiện ra với: nghĩa "lịch trình (chuyến đi)", câu ví dụ "Our itinerary includes three days in Da Nang.", hình minh họa và ba nút: "Chưa nhớ", "Nhớ mơ hồ", "Nhớ rõ".
10. Lan nhớ nghĩa nhưng chưa chắc chắn nên click "Nhớ mơ hồ".
11. Hệ thống ghi một lượt ôn (itinerary, nhớ mơ hồ, 06/10/2026) và cập nhật trạng thái học của từ: k = 4 nên khoảng cách mới là max(1, 4) = 4 ngày, ngày ôn tiếp theo là 10/10/2026, trạng thái "đang học". Giao diện chuyển sang "Thẻ 2/30" với mặt trước của từ "passport".
12. Lan lặp lại bước 8–11 với ba thẻ tiếp theo. Kết quả hệ thống ghi nhận cho bốn thẻ:

| Thẻ | Từ | Loại | k | Lan đánh giá | Khoảng cách mới | Ngày ôn tiếp theo | Trạng thái mới |
|---|---|---|---|---|---|---|---|
| 1 | itinerary | Đến hạn ôn | 4 | Nhớ mơ hồ | 4 | 10/10/2026 | Đang học |
| 2 | passport | Đến hạn ôn | 8 | Nhớ rõ | 16 | 22/10/2026 | Đã thuộc |
| 3 | luggage | Chưa học | 0 | Nhớ rõ | 2 | 08/10/2026 | Đang học |
| 4 | departure | Chưa học | 0 | Chưa nhớ | 1 | 07/10/2026 | Đang học |

13. Ở "Thẻ 5/30" (mặt trước của từ "souvenir"), Lan click nút kết thúc.
14. Giao diện tổng kết phiên học hiện ra với: chủ đề Du lịch; số thẻ đã học: 4; Chưa nhớ: 1; Nhớ mơ hồ: 1; Nhớ rõ: 2; số từ cần ôn vào ngày mai (07/10/2026): 5; nút quay lại. Thẻ "souvenir" chưa được đánh giá nên không được tính là đã học.
15. Lan click nút quay lại. Hệ thống trở về giao diện học từ vựng. Ở giao diện chọn chủ đề, chủ đề Du lịch hiển thị 14/40.

**Kịch bản ngoại lệ**

- **6a.** Lan chọn chủ đề "Gia đình" (đã học 30/30 và chưa có từ nào đến hạn ôn): hệ thống báo "Bạn đã học hết chủ đề này và chưa có từ nào đến hạn ôn" và giữ Lan ở giao diện chọn chủ đề.
- **6b.** Lan chọn một chủ đề chưa có từ nào (admin vừa tạo, xem kịch bản 22): hệ thống báo "Chủ đề chưa có từ vựng" và giữ Lan ở giao diện chọn chủ đề.
- **7a.** Từ không có file âm thanh: nút nghe phát âm bị vô hiệu và hệ thống không tự phát âm. Các bước còn lại giữ nguyên.
- **11a.** Lưu kết quả đánh giá thất bại (ví dụ mất kết nối): hệ thống báo "Chưa lưu được kết quả, vui lòng thử lại" và giữ nguyên mặt sau của thẻ hiện tại. Lan click lại nút đánh giá. Hệ thống không chuyển sang thẻ tiếp theo khi chưa lưu thành công.
- **13a.** Lan đóng trình duyệt thay vì click nút kết thúc: kết quả của các thẻ 1–4 đã được lưu ở bước 11; thẻ đang hiển thị không được tính. Không có giao diện tổng kết.

### 6. Use case: Ôn tập từ đến hạn

**Kịch bản chuẩn**

1. Ngày 07/10/2026, Lan đăng nhập thành công. Giao diện chính hiện thông báo "Bạn có 5 từ cần ôn hôm nay".
2. Lan click vào thông báo. (Lan cũng có thể chọn học từ vựng rồi chọn ôn tập từ đến hạn.)
3. Hệ thống lấy tất cả các từ của Lan, thuộc mọi chủ đề, có ngày ôn tiếp theo không muộn hơn 07/10/2026, và sắp xếp theo kết quả lần ôn gần nhất: "Chưa nhớ" trước, rồi "Nhớ mơ hồ", rồi "Nhớ rõ". Giao diện flashcard hiện ra ở chế độ ôn tập với "Thẻ 1/5" và mặt trước của từ "departure".
4. Lan lật thẻ và đánh giá lần lượt 5 thẻ như bước 8–11 của kịch bản 5. Kết quả hệ thống ghi nhận:

| Thẻ | Từ | Chủ đề | Kết quả lần trước | Ngày ôn gần nhất | k | Lan đánh giá | Khoảng cách mới | Ngày ôn tiếp theo | Trạng thái mới |
|---|---|---|---|---|---|---|---|---|---|
| 1 | departure | Du lịch | Chưa nhớ | 06/10/2026 | 1 | Nhớ rõ | 2 | 09/10/2026 | Đang học |
| 2 | colleague | Công việc | Nhớ mơ hồ | 05/10/2026 | 2 | Nhớ mơ hồ | 2 | 09/10/2026 | Đang học |
| 3 | deadline | Công việc | Nhớ mơ hồ | 03/10/2026 | 4 | Nhớ rõ | 8 | 15/10/2026 | Đang học |
| 4 | recipe | Thức ăn | Nhớ rõ | 29/09/2026 | 8 | Chưa nhớ | 1 | 08/10/2026 | Đang học |
| 5 | ingredient | Thức ăn | Nhớ rõ | 21/09/2026 | 16 | Nhớ rõ | 32 | 08/11/2026 | Đã thuộc |

5. Sau thẻ cuối, giao diện tổng kết hiện ra với: số thẻ đã ôn: 5; Chưa nhớ: 1; Nhớ mơ hồ: 1; Nhớ rõ: 3; số từ cần ôn vào ngày mai (08/10/2026): 2 (luggage, recipe); nút quay lại.
6. Lan click nút quay lại. Hệ thống trở về giao diện học từ vựng; lựa chọn ôn tập từ đến hạn hiển thị "0 từ".

**Kịch bản ngoại lệ**

- **1a.** Lan không có từ nào đến hạn: giao diện chính không hiện thông báo ôn từ. Nếu Lan vẫn chọn ôn tập từ đến hạn, hệ thống báo "Hôm nay bạn không có từ nào cần ôn" và gợi ý học theo chủ đề.
- **3a.** Có từ quá hạn (ví dụ Lan không đăng nhập ba ngày): các từ quá hạn vẫn được đưa vào phiên. Khoảng cách mới được tính theo k đã lên lịch trước đó, và ngày ôn tiếp theo được tính từ ngày Lan thực sự ôn.
- **4a.** Lan kết thúc phiên giữa chừng: các từ chưa được đánh giá giữ nguyên ngày ôn cũ và tiếp tục xuất hiện ở lần ôn sau.
- **4b.** Lưu kết quả đánh giá thất bại: xử lý như 11a của kịch bản 5.

### 7. Use case: Quản lý danh sách từ riêng

**Kịch bản chuẩn**

1. Lan chuẩn bị phỏng vấn xin việc và muốn gom các từ liên quan để học. Lan đăng nhập, chọn học từ vựng rồi chọn danh sách từ của tôi.
2. Giao diện danh sách từ của tôi hiện ra với nút "Tạo danh sách mới" và bảng:

| STT | Tên danh sách | Số từ | Ngày tạo | Thao tác |
|---|---|---|---|---|
| 1 | Từ khó tuần này | 6 | 28/09/2026 | Sửa, Xóa |

3. Lan click "Tạo danh sách mới".
4. Giao diện tạo danh sách hiện ra với:
   - Ô nhập tên danh sách,
   - Khu tìm từ trong kho: ô nhập từ khóa, nút tìm, bảng kết quả,
   - Khu thêm từ tự nhập: ô từ, ô nghĩa, ô phiên âm, ô câu ví dụ, nút thêm,
   - Bảng các từ đã chọn, nút lưu và nút hủy.
5. Lan nhập tên danh sách "Phỏng vấn xin việc", nhập từ khóa "interv" và click nút tìm.
6. Bảng kết quả hiện ra các từ trong kho có chứa từ khóa:

| STT | Từ | Nghĩa | Chủ đề | CEFR | |
|---|---|---|---|---|---|
| 1 | interview | buổi phỏng vấn | Công việc | A2 | Thêm |
| 2 | interviewer | người phỏng vấn | Công việc | B1 | Thêm |
| 3 | interviewee | người được phỏng vấn | Công việc | B2 | Thêm |

7. Lan click "Thêm" ở dòng 1 và dòng 3. Hai từ được đưa vào bảng các từ đã chọn.
8. Lan nhập từ tự nhập: từ "icebreaker", nghĩa "câu chuyện mở đầu để làm quen", để trống phiên âm và câu ví dụ, rồi click nút thêm.
9. Bảng các từ đã chọn hiện ra như sau:

| STT | Từ | Nghĩa | Nguồn | |
|---|---|---|---|---|
| 1 | interview | buổi phỏng vấn | Kho từ vựng | Bỏ |
| 2 | interviewee | người được phỏng vấn | Kho từ vựng | Bỏ |
| 3 | icebreaker | câu chuyện mở đầu để làm quen | Tự nhập | Bỏ |

10. Lan click nút lưu.
11. Hệ thống kiểm tra tên danh sách không trống và không trùng với danh sách khác của Lan. Hệ thống lưu từ "icebreaker" vào kho từ vựng với người tạo là Lan, không thuộc chủ đề nào, chỉ Lan nhìn thấy; sau đó lưu danh sách "Phỏng vấn xin việc" cùng ba mục trong danh sách.
12. Hệ thống thông báo "Tạo danh sách thành công" và quay về giao diện danh sách từ của tôi. Bảng có thêm dòng "Phỏng vấn xin việc | 3 | 06/10/2026". Danh sách mới cũng xuất hiện trong phần danh sách từ riêng của giao diện chọn chủ đề (bước 5 của kịch bản 5).

**Kịch bản ngoại lệ**

- **2a.** Sửa danh sách: Lan click "Sửa" ở một dòng. Giao diện giống bước 4 hiện ra với tên và các từ đã điền sẵn; Lan thêm/bỏ từ rồi click lưu. Trạng thái học của các từ bị bỏ khỏi danh sách vẫn được giữ.
- **2b.** Xóa danh sách: Lan click "Xóa" ở một dòng, hệ thống hỏi xác nhận, Lan xác nhận. Danh sách và các mục trong danh sách bị xóa; trạng thái học của các từ không bị ảnh hưởng.
- **6a.** Không có từ nào chứa từ khóa: hệ thống báo "Không tìm thấy từ phù hợp". Lan có thể tự nhập từ (bước 8).
- **7a.** Lan thêm một từ đã có trong bảng các từ đã chọn: hệ thống báo "Từ đã có trong danh sách" và không thêm lặp.
- **8a.** Lan để trống ô từ hoặc ô nghĩa của từ tự nhập: hệ thống báo lỗi tại ô đó và không thêm.
- **11a.** Tên danh sách để trống hoặc trùng với tên một danh sách khác của Lan: hệ thống báo lỗi và giữ nguyên dữ liệu đã nhập. Quay lại bước 10.

### 8. Use case: Chơi trò chơi từ vựng

**Kịch bản chuẩn**

1. Lan đăng nhập, chọn học từ vựng rồi chọn trò chơi từ vựng.
2. Giao diện trò chơi hiện ra với danh sách chọn chủ đề (gồm các chủ đề có sẵn và các danh sách từ riêng) và bảng các trò chơi:

| STT | Trò chơi | Cách chơi | Điểm cao nhất của bạn |
|---|---|---|---|
| 1 | Ghép từ | Ghép 8 cặp từ – nghĩa trong 60 giây | 70 |
| 2 | Trắc nghiệm nhanh | Chọn nghĩa đúng của 10 từ, mỗi từ 4 lựa chọn, trong 60 giây | 60 |
| 3 | Đoán nghĩa | Đọc câu ví dụ, gõ nghĩa của từ in đậm, 5 câu trong 90 giây | – |

3. Lan chọn chủ đề "Du lịch" và click trò chơi "Trắc nghiệm nhanh".
4. Hệ thống chọn ngẫu nhiên 10 từ của chủ đề Du lịch; mỗi câu gồm nghĩa đúng và 3 nghĩa sai lấy từ các từ khác cùng chủ đề. Giao diện chơi hiện ra với: đồng hồ đếm ngược 60 giây, điểm hiện tại 0, "Câu 1/10", từ "souvenir" và bốn lựa chọn: A. hộ chiếu, B. quà lưu niệm, C. hành lý, D. lịch trình.
5. Lan click B. Hệ thống hiện hiệu ứng trả lời đúng (màu xanh), cộng 10 điểm và chuyển sang câu 2.
6. Lan trả lời tiếp các câu 2–10. Ở câu 4 (từ "accommodation"), Lan chọn "sự khởi hành": hệ thống hiện hiệu ứng trả lời sai (màu đỏ), tô xanh đáp án đúng "chỗ ở" rồi chuyển câu.
7. Lan trả lời xong câu 10 khi đồng hồ còn 8 giây. Ván chơi kết thúc.
8. Hệ thống tính điểm và lưu lượt chơi: trò chơi trắc nghiệm nhanh, chủ đề Du lịch, đúng 8/10 câu, điểm 80, thời gian 52 giây, ngày 06/10/2026. Kết quả trò chơi không làm thay đổi trạng thái học và lịch ôn của các từ. Giao diện kết quả hiện ra với: điểm 80, số câu đúng 8/10, thời gian 52 giây, thông báo "Kỷ lục mới!" (điểm cao nhất cũ là 60), nút chơi lại, nút quay lại và bảng các câu sai:

| Câu | Từ | Lan chọn | Nghĩa đúng |
|---|---|---|---|
| 4 | accommodation | sự khởi hành | chỗ ở |
| 9 | boarding pass | hộ chiếu | thẻ lên máy bay |

9. Lan click nút quay lại để về giao diện trò chơi. Điểm cao nhất của trò chơi trắc nghiệm nhanh hiển thị 80.

**Kịch bản ngoại lệ**

- **3a.** Chủ đề được chọn có ít hơn 4 từ (không đủ để tạo 4 lựa chọn): hệ thống báo "Chủ đề chưa đủ từ để chơi trò chơi này".
- **6a.** Lan click thoát giữa ván: đồng hồ tạm dừng và hệ thống hỏi "Thoát bây giờ sẽ không lưu điểm ván này. Bạn có chắc?". Nếu Lan xác nhận, hệ thống về giao diện trò chơi và không lưu lượt chơi; nếu Lan hủy, ván chơi tiếp tục.
- **7a.** Hết giờ khi Lan mới trả lời đến câu 7: ván chơi kết thúc, các câu chưa trả lời được tính sai. Hệ thống vẫn tính điểm và lưu lượt chơi như bước 8.

## III. Module B — Làm bài tập

### 9. Use case: Làm bài đọc hiểu

**Kịch bản chuẩn**

1. Lan đăng nhập và chọn làm bài tập.
2. Giao diện làm bài tập hiện ra với bốn lựa chọn: đọc hiểu, viết, nghe hiểu, phát âm.
3. Lan chọn đọc hiểu.
4. Giao diện danh sách bài đọc hiểu hiện ra với danh sách chọn chủ đề, danh sách chọn mức CEFR (mặc định tất cả) và bảng các bài, sắp xếp từ cơ bản đến nâng cao:

| STT | Bài học | Chủ đề | CEFR | Số câu | Mức hoàn thành (điểm cao nhất) |
|---|---|---|---|---|---|
| 1 | Thì hiện tại đơn | Thì động từ | A1 | 10 | 100% |
| 2 | Thì quá khứ đơn | Thì động từ | A2 | 10 | 90% |
| 3 | A trip to Ha Long Bay | Du lịch | A2 | 8 | 75% |
| 4 | Thì hiện tại hoàn thành | Thì động từ | B1 | 10 | Chưa làm |
| 5 | Câu bị động | Cấu trúc câu | B1 | 12 | Chưa làm |

5. Lan click bài "Thì hiện tại hoàn thành". Bài gồm 7 câu ngữ pháp (trắc nghiệm ngữ pháp và điền chỗ trống) và 3 câu hỏi về bài đọc "Anna's life in Hanoi".
6. Hệ thống tạo một lượt làm bài ở trạng thái đang làm và hiện câu 1/10 (điền chỗ trống): "She ___ (live) in Hanoi since 2020." cùng ô nhập đáp án, nút gợi ý, nút kiểm tra và biểu tượng chatbot.
7. Lan nhập "has lived" và click nút kiểm tra.
8. Hệ thống so sánh đáp án với các đáp án được chấp nhận của câu ("has lived", "'s lived"), không phân biệt chữ hoa/thường và bỏ qua khoảng trắng thừa. Đáp án đúng nên hệ thống hiện "Chính xác" kèm giải thích "Dùng hiện tại hoàn thành với since + mốc thời gian để diễn tả hành động bắt đầu trong quá khứ và kéo dài đến hiện tại.", cộng 1 điểm và hiện nút câu tiếp theo.
9. Lan click nút câu tiếp theo. Câu 2/10 (trắc nghiệm ngữ pháp) hiện ra: "I ___ this film before." với bốn lựa chọn: A. see, B. saw, C. have seen, D. am seeing.
10. Lan chọn B và click nút kiểm tra.
11. Hệ thống hiện "Chưa đúng", tô đỏ lựa chọn B, tô xanh đáp án đúng C kèm giải thích "Câu nói về trải nghiệm và không có mốc thời gian cụ thể trong quá khứ nên dùng hiện tại hoàn thành." (Tại bước này Lan có thể hỏi chatbot, xem kịch bản 13.)
12. Lan làm tiếp câu 3–7 theo cách tương tự.
13. Lan click nút câu tiếp theo. Câu 8/10 (câu hỏi về bài đọc) hiện ra. Giao diện chia hai cột: cột trái là bài đọc "Anna's life in Hanoi" (4 đoạn, khoảng 200 từ), cột phải là câu hỏi. Đoạn 1 của bài đọc: "Anna is a teacher from Australia. She has lived in Hanoi since 2020. She has visited Ha Long Bay twice, but she hasn't been to Sa Pa yet because she has been busy with her new job." Câu 8: "Why hasn't Anna been to Sa Pa yet?" với bốn lựa chọn: A. She doesn't like cold weather, B. She has been busy with her new job, C. She has already been there twice, D. She lives too far away.
14. Lan chọn B và click nút kiểm tra. Hệ thống hiện "Chính xác" kèm giải thích "Câu cuối của đoạn 1 nêu lý do: because she has been busy with her new job.", cộng 1 điểm và hiện nút câu tiếp theo.
15. Lan làm tiếp câu 9 ("How many times has Anna visited Ha Long Bay?") và câu 10 ("Which sentence is TRUE about Anna?") theo cách tương tự; bài đọc vẫn hiển thị ở cột trái.
16. Sau câu 10, hệ thống chuyển lượt làm bài sang trạng thái đã nộp với tổng điểm 8/10 (80%) và hiện giao diện kết quả gồm nút làm lại, nút quay lại và bảng:

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

17. Hệ thống lưu kết quả vào lịch sử làm bài và cộng 1 bài tập hoàn thành vào tiến độ ngày 06/10/2026. Lan click nút quay lại; bài "Thì hiện tại hoàn thành" hiển thị mức hoàn thành 80%.

**Kịch bản ngoại lệ**

- **7a.** Lan chưa nhập hoặc chưa chọn đáp án: nút kiểm tra bị vô hiệu cho đến khi có đáp án.
- **7b.** Lan click nút gợi ý: hệ thống hiện gợi ý của câu ("Chú ý từ since") mà không hiện đáp án; điểm của câu không bị trừ.
- **12a.** Lan thoát giữa bài (ví dụ sau câu 5): hệ thống hỏi xác nhận. Lượt làm bài giữ trạng thái đang làm với các câu đã trả lời và chưa được tính vào tiến độ. Lần sau mở bài này, hệ thống hỏi Lan muốn "làm tiếp" (từ câu 6) hay "làm lại từ đầu".
- **16a.** Lan click nút làm lại: hệ thống tạo một lượt làm bài mới. Mức hoàn thành của bài hiển thị điểm cao nhất trong các lượt.

### 10. Use case: Làm bài viết

**Kịch bản chuẩn**

1. Lan đăng nhập, chọn làm bài tập rồi chọn viết.
2. Giao diện danh sách bài viết hiện ra với danh sách chọn chủ đề, danh sách chọn mức CEFR (mặc định tất cả) và bảng:

| STT | Bài học | Chủ đề | CEFR | Số câu | Mức hoàn thành (điểm cao nhất) |
|---|---|---|---|---|---|
| 1 | Viết câu về gia đình | Gia đình | A1 | 5 | 90% |
| 2 | Gọi món ở nhà hàng | Thức ăn | A2 | 6 | Chưa làm |
| 3 | Viết về chuyến đi | Du lịch | A2 | 6 | Chưa làm |
| 4 | Email công việc ngắn | Công việc | B1 | 5 | Chưa làm |

3. Lan click bài "Viết về chuyến đi". Bài gồm 6 câu, mỗi câu 2 điểm: 2 câu dịch câu, 2 câu viết lại câu, 2 câu viết câu theo từ khóa.
4. Hệ thống tạo một lượt làm bài ở trạng thái đang làm và hiện câu 1/6 (dịch câu): "Dịch sang tiếng Anh: Tôi đã đặt phòng khách sạn trước hai tuần." cùng ô soạn câu trả lời, nút gợi ý, nút kiểm tra và biểu tượng chatbot.
5. Lan nhập "I booked the hotel room before two weeks." và click nút kiểm tra.
6. Hệ thống lưu câu trả lời, hiện trạng thái "Đang chấm…" và gửi đến Dịch vụ AI: đề bài, dạng câu, điểm tối đa của câu (2), các câu trả lời mẫu ("I booked the hotel room two weeks in advance.", "I booked a hotel room two weeks ahead.") và câu trả lời của Lan.
7. Dịch vụ AI trả về điểm 1.0/2 và nhận xét: "Chia đúng thì quá khứ đơn và đủ ý. 'before two weeks' không phải cách nói tự nhiên; để nói làm việc gì trước bao lâu, dùng 'two weeks in advance' hoặc 'two weeks ahead'. Câu gợi ý: I booked the hotel room two weeks in advance."
8. Hệ thống lưu điểm và nhận xét vào câu trả lời, rồi hiển thị: điểm 1.0/2, nhận xét của AI, các câu trả lời mẫu, giải thích của câu ("in advance nghĩa là trước một thời điểm; before chỉ đứng sau khoảng thời gian khi có mốc đi kèm, ví dụ two weeks before the trip.") và nút câu tiếp theo. (Tại bước này Lan có thể hỏi chatbot, xem kịch bản 13.)
9. Lan click nút câu tiếp theo. Câu 2/6 (viết lại câu) hiện ra: câu gốc "It took us three hours to get to Da Lat." và phần mở đầu cho sẵn "We spent …".
10. Lan nhập "We spent three hours getting to Da Lat." và click nút kiểm tra. Hệ thống thực hiện như bước 6–8; Dịch vụ AI trả về điểm 2.0/2 và nhận xét "Chính xác, giữ nguyên nghĩa câu gốc và dùng đúng cấu trúc spend + thời gian + V-ing."
11. Lan click nút câu tiếp theo. Câu 3/6 (viết câu theo từ khóa) hiện ra với các từ khóa gợi ý: "luggage / heavy / carry".
12. Lan nhập "My luggage was too heavy to carry." và click nút kiểm tra. Dịch vụ AI trả về điểm 2.0/2 và nhận xét "Dùng đủ ba từ khóa, câu đúng ngữ pháp (too + tính từ + to V)."
13. Lan làm tiếp câu 4–6 theo cách tương tự.
14. Sau khi câu 6 được chấm, mọi câu đều đã có điểm nên hệ thống chuyển lượt làm bài sang trạng thái đã nộp với tổng điểm 10/12 (83%) và hiện giao diện kết quả gồm nút làm lại, nút quay lại và bảng dưới đây. Mỗi dòng có nút xem chi tiết để đọc lại nhận xét đầy đủ, các câu trả lời mẫu và giải thích.

| Câu | Dạng | Đề bài | Câu trả lời của Lan | Điểm | Nhận xét của AI (tóm tắt) |
|---|---|---|---|---|---|
| 1 | Dịch câu | Tôi đã đặt phòng khách sạn trước hai tuần. | I booked the hotel room before two weeks. | 1.0/2 | "before two weeks" chưa tự nhiên, nên dùng "two weeks in advance" |
| 2 | Viết lại câu | It took us three hours to get to Da Lat. → We spent … | We spent three hours getting to Da Lat. | 2.0/2 | Chính xác |
| 3 | Viết câu theo từ khóa | luggage / heavy / carry | My luggage was too heavy to carry. | 2.0/2 | Đủ từ khóa, đúng ngữ pháp |
| 4 | Dịch câu | Chuyến bay của chúng tôi bị hoãn vì thời tiết xấu. | Our flight was delay because of bad weather. | 1.5/2 | Câu bị động cần "was delayed" |
| 5 | Viết lại câu | This is the first time I have visited Hue. → I have never … | I have never visited Hue before. | 2.0/2 | Chính xác |
| 6 | Viết câu theo từ khóa | passport / check / airport | The officer check my passport at the airport. | 1.5/2 | Chia động từ: "checked" |

15. Hệ thống lưu kết quả vào lịch sử làm bài và cộng 1 bài tập hoàn thành vào tiến độ ngày 06/10/2026. Lan click nút quay lại; bài "Viết về chuyến đi" hiển thị mức hoàn thành 83%.

**Kịch bản ngoại lệ**

- **5a.** Ô trả lời trống: nút kiểm tra bị vô hiệu cho đến khi Lan nhập câu trả lời.
- **5b.** Lan click nút gợi ý: hệ thống hiện gợi ý của câu ("Chú ý cách nói 'trước bao lâu' trong tiếng Anh") mà không hiện câu trả lời mẫu; điểm của câu không bị trừ.
- **7a.** Câu trả lời lạc đề, không viết bằng tiếng Anh hoặc không dùng đủ từ khóa: Dịch vụ AI vẫn trả về điểm (có thể là 0) kèm nhận xét nêu rõ lỗi, ví dụ "Thiếu từ khóa carry". Hệ thống lưu và hiển thị như bước 8.
- **7b.** Dịch vụ AI lỗi hoặc quá thời gian chờ: hệ thống báo "Chưa chấm được câu này" kèm nút gửi chấm lại (dùng lại câu trả lời đã lưu). Câu trả lời chưa có điểm và hệ thống không tự đặt điểm. Lan có thể gửi chấm lại ngay hoặc chuyển sang câu tiếp theo; câu này được đánh dấu "Chưa chấm".
- **8a.** Lan muốn sửa câu trả lời đã được chấm: không sửa được trong lượt này. Muốn viết lại, Lan click nút làm lại ở cuối bài (nhánh 14b).
- **13a.** Lan thoát giữa bài (ví dụ sau câu 3): hệ thống hỏi xác nhận. Lượt làm bài giữ trạng thái đang làm cùng các câu đã chấm và chưa được tính vào tiến độ. Lần sau mở bài này, hệ thống hỏi Lan muốn "làm tiếp" (từ câu 4) hay "làm lại từ đầu".
- **14a.** Làm xong câu 6 nhưng còn câu chưa chấm (nhánh 7b): hệ thống chưa tính tổng điểm. Giao diện kết quả báo "Còn 1 câu chưa chấm" kèm nút gửi chấm lại các câu chưa chấm. Lượt làm bài giữ trạng thái đang làm và chưa được tính vào tiến độ; khi mọi câu đã có điểm, hệ thống thực hiện bước 14–15. Nếu Lan thoát, lần sau mở bài hệ thống cho gửi chấm lại các câu này.
- **14b.** Lan click nút làm lại: hệ thống tạo một lượt làm bài mới. Mức hoàn thành của bài hiển thị điểm cao nhất trong các lượt.

### 11. Use case: Làm bài nghe hiểu

**Kịch bản chuẩn**

1. Lan đăng nhập, chọn làm bài tập rồi chọn nghe hiểu.
2. Giao diện danh sách bài nghe hiện ra với danh sách chọn chủ đề, danh sách chọn mức CEFR và bảng:

| STT | Bài nghe | Chủ đề | CEFR | Thời lượng | Kết quả gần nhất |
|---|---|---|---|---|---|
| 1 | Booking a hotel room | Du lịch | A2 | 1:40 | 4/5 |
| 2 | At the airport check-in | Du lịch | A2 | 2:15 | Chưa làm |
| 3 | A job interview | Công việc | B1 | 3:05 | Chưa làm |

3. Lan click bài "At the airport check-in".
4. Giao diện nghe hiện ra với: trình phát âm thanh (phát/tạm dừng, thanh tua, nút lùi 5 giây), danh sách chọn tốc độ (0.75x, 1x, 1.25x; mặc định 1x), nút bật/tắt phụ đề và nút làm câu hỏi.
5. Lan chọn tốc độ 0.75x, bật phụ đề rồi click phát.
6. Hệ thống phát bài nghe; phụ đề hiện theo từng đoạn và tô sáng đoạn đang phát, ví dụ đoạn 2 (0:18–0:31): "Could I see your passport and boarding pass, please?".
7. Lan nghe hết bài, nghe lại đoạn 3 thêm một lần rồi click nút làm câu hỏi.
8. Giao diện câu hỏi hiện ra với 5 câu trắc nghiệm và nút nộp bài. Trình phát vẫn dùng được nhưng phụ đề tạm ẩn để bài làm khách quan. Ví dụ câu 1: "Where is the man flying to?" với bốn lựa chọn: A. Hanoi, B. Da Nang, C. Singapore, D. Bangkok.
9. Lan chọn đáp án cho cả 5 câu rồi click nút nộp bài.
10. Hệ thống chấm điểm, lưu lượt làm bài và hiện kết quả: đúng 4/5 câu, kèm bảng:

| Câu | Câu hỏi | Đáp án của Lan | Đáp án đúng | Kết quả |
|---|---|---|---|---|
| 1 | Where is the man flying to? | Singapore | Singapore | Đúng |
| 2 | How many bags does he check in? | Two | One | Sai |
| 3 | What seat does he ask for? | Window seat | Window seat | Đúng |
| 4 | What time does boarding start? | 9:15 | 9:15 | Đúng |
| 5 | Which gate should he go to? | Gate 12 | Gate 12 | Đúng |

   Bên dưới bảng là transcript đầy đủ kèm bản dịch tiếng Việt theo từng đoạn để Lan đối chiếu. Đoạn chứa đáp án của câu sai được tô vàng (đoạn 3: "Just one suitcase to check in, and this backpack as hand luggage."). Mỗi đoạn có nút nghe lại đoạn; cuối giao diện có nút làm lại và nút quay lại.

11. Lan click nghe lại đoạn 3 để đối chiếu, sau đó click nút quay lại. Bài nghe hiển thị kết quả gần nhất 4/5; tiến độ ngày được cộng 1 bài tập hoàn thành.

**Kịch bản ngoại lệ**

- **5a.** File âm thanh không tải được: hệ thống báo "Không tải được bài nghe, vui lòng thử lại" kèm nút tải lại. Nút làm câu hỏi bị vô hiệu cho đến khi tải được bài nghe.
- **7a.** Lan click nút làm câu hỏi khi chưa nghe hết bài: hệ thống vẫn cho phép.
- **9a.** Lan nộp bài khi còn câu chưa trả lời: hệ thống cảnh báo "Còn 1 câu chưa trả lời". Nếu Lan xác nhận nộp, câu chưa trả lời được tính sai.

### 12. Use case: Luyện phát âm

**Kịch bản chuẩn**

1. Lan đăng nhập, chọn làm bài tập rồi chọn phát âm.
2. Giao diện danh sách bài luyện phát âm hiện ra với danh sách chọn mức CEFR (mặc định tất cả) và bảng:

| STT | Bài luyện | Chủ đề | CEFR | Số mục | Đã luyện |
|---|---|---|---|---|---|
| 1 | Nguyên âm dài và ngắn /iː/ – /ɪ/ | Phát âm cơ bản | A1 | 6 | 6 |
| 2 | Âm /θ/ và /ð/ | Phát âm cơ bản | A2 | 5 | 0 |
| 3 | Câu giao tiếp ở sân bay | Du lịch | A2 | 5 | 2 |

3. Lan click bài "Âm /θ/ và /ð/".
4. Giao diện luyện phát âm hiện ra với danh sách 5 mục của bài ở cột trái. Mục 1 được chọn sẵn và hiển thị: văn bản mẫu "Thank you for the three tickets.", phiên âm IPA /θæŋk juː fɔː ðə θriː ˈtɪk.ɪts/, nút nghe mẫu và nút ghi âm.
5. Lan click nút nghe mẫu; hệ thống phát âm thanh mẫu.
6. Lan click nút ghi âm. Đây là lần đầu nên trình duyệt hỏi quyền dùng micro; Lan chọn cho phép. Nút ghi âm chuyển thành nút dừng kèm đồng hồ đếm thời gian ghi.
7. Lan đọc câu mẫu rồi click nút dừng (bản ghi dài 3 giây).
8. Hệ thống hiện trạng thái "Đang chấm…" và gửi bản ghi âm cùng văn bản mẫu đến Dịch vụ AI.
9. Dịch vụ AI trả về kết quả: điểm độ chính xác 68, điểm độ trôi chảy 80, điểm tổng 72; hai từ "the" và "three" phát âm chưa đúng, kèm nhận xét cho từng từ.
10. Hệ thống lưu lượt luyện (mục 1, lần thử 1, điểm tổng 72) và hiển thị kết quả gồm:
    - Điểm tổng 72/100, độ chính xác 68, độ trôi chảy 80,
    - Câu mẫu với hai từ "the" và "three" tô đỏ,
    - Gợi ý: "three: âm /θ/ bị đọc thành /t/. Đặt đầu lưỡi giữa hai hàm răng và đẩy hơi nhẹ ra, không bật lưỡi.",
    - Ba nút: ghi âm lại, mục tiếp theo, hỏi chatbot.
11. Lan click nút ghi âm lại và thực hiện lại bước 6–9. Lần này Dịch vụ AI trả về điểm tổng 86 (độ chính xác 85, độ trôi chảy 88). Hệ thống lưu lượt luyện mới (mục 1, lần thử 2) và vẫn giữ lượt thử 1.
12. Lan click nút mục tiếp theo và luyện các mục 2–5 theo cách tương tự.
13. Sau mục 5, hệ thống hiện bảng tổng kết bài kèm nút quay lại:

| Mục | Văn bản mẫu | Số lần thử | Điểm cao nhất |
|---|---|---|---|
| 1 | Thank you for the three tickets. | 2 | 86 |
| 2 | this – these – those | 1 | 90 |
| 3 | I think my brother is thirty. | 3 | 78 |
| 4 | Both of them went together. | 1 | 82 |
| 5 | The weather is better on Thursday. | 2 | 84 |

14. Lan click nút quay lại để về giao diện làm bài tập. Bài "Âm /θ/ và /ð/" hiển thị đã luyện 5/5 mục; tiến độ ngày được cộng 1 bài tập hoàn thành.

**Kịch bản ngoại lệ**

- **6a.** Lan từ chối quyền dùng micro: hệ thống hiện hướng dẫn cấp quyền micro cho trình duyệt; nút ghi âm bị vô hiệu cho đến khi có quyền. Không có lượt luyện nào được tạo.
- **7a.** Bản ghi rỗng hoặc ngắn hơn 1 giây: hệ thống báo "Không nghe thấy giọng nói, vui lòng ghi lại" và không gửi đến Dịch vụ AI.
- **9a.** Dịch vụ AI không nhận diện được giọng nói (quá ồn hoặc đọc sai câu): hệ thống báo "Không nhận diện được, hãy thử lại" và không lưu điểm.
- **9b.** Dịch vụ AI lỗi hoặc quá thời gian chờ: hệ thống báo "Chưa chấm được lúc này" kèm nút gửi lại (dùng lại bản ghi vừa rồi). Hệ thống không lưu lượt luyện và không hiển thị điểm giả.
- **10a.** Lan click nút hỏi chatbot: khung chat mở ra với ngữ cảnh là mục đang luyện và kết quả chấm (xem kịch bản 13).
- **12a.** Lan thoát giữa bài: các lượt luyện đã chấm thành công vẫn được lưu; cột "Đã luyện" của bài đếm các mục có ít nhất một lượt chấm thành công.

### 13. Use case: Hỏi chatbot

**Kịch bản chuẩn**

1. Lan đang làm bài đọc hiểu "Thì hiện tại hoàn thành" (kịch bản 9) và vừa nhận kết quả sai ở câu 2 (chọn "saw", đáp án đúng là "have seen").
2. Lan click biểu tượng chatbot ở góc màn hình.
3. Khung chat hiện ra bên cạnh bài tập với: dòng ngữ cảnh "Câu 2 – Thì hiện tại hoàn thành: I ___ this film before. Bạn chọn: saw (sai)", ô nhập câu hỏi và nút gửi. Hệ thống tạo một phiên chat gắn với bài học và câu hỏi này.
4. Lan nhập "Tại sao không dùng saw? Mình đã xem phim đó trong quá khứ mà." và click nút gửi.
5. Hệ thống hiện câu hỏi của Lan trong khung chat kèm trạng thái "Đang trả lời…". Hệ thống tìm các đoạn kiến thức liên quan ("Hiện tại hoàn thành – dấu hiệu nhận biết", "Phân biệt quá khứ đơn và hiện tại hoàn thành") rồi gửi câu hỏi, ngữ cảnh bài tập và các đoạn kiến thức đó đến Dịch vụ AI.
6. Dịch vụ AI trả lời: "Câu này không nói thời điểm xem phim. Khi chỉ muốn nói về trải nghiệm (đã từng làm gì) mà không có mốc thời gian, ta dùng hiện tại hoàn thành: I have seen this film before. Nếu có mốc thời gian cụ thể như last week, ta dùng quá khứ đơn: I saw this film last week."
7. Hệ thống lưu tin nhắn của Lan, câu trả lời của AI và các đoạn kiến thức được viện dẫn, rồi hiện câu trả lời trong khung chat kèm mục "Nguồn tham khảo: Phân biệt quá khứ đơn và hiện tại hoàn thành".
8. Lan hỏi tiếp: "Cho mình thêm 2 ví dụ với ever và never." Hệ thống thực hiện lại bước 5–7 trong cùng phiên chat, và AI trả lời bằng hai ví dụ.
9. Lan click đóng khung chat. Hệ thống ẩn khung chat; Lan tiếp tục bài tập ở đúng câu 2 như trước khi mở chat.

**Kịch bản ngoại lệ**

- **2a.** Lan mở lại chatbot trong cùng bài tập: hệ thống mở lại phiên chat đã gắn với bài học và hiển thị các tin nhắn cũ.
- **4a.** Ô nhập câu hỏi trống: nút gửi bị vô hiệu.
- **5a.** Lan hỏi về một câu chưa được kiểm tra (ví dụ câu 3 khi chưa click nút kiểm tra): chatbot chỉ gợi ý hướng suy nghĩ, không nêu đáp án.
- **6a.** Dịch vụ AI lỗi hoặc quá thời gian chờ: hệ thống hiện "Không thể trả lời lúc này, vui lòng thử lại sau" kèm nút gửi lại. Tin nhắn của Lan vẫn được lưu; hệ thống không lưu câu trả lời rỗng.
- **6b.** Câu hỏi không liên quan đến việc học tiếng Anh: chatbot lịch sự từ chối và gợi ý quay lại nội dung bài học.

## IV. Module C — Kiểm tra

### 14. Use case: Kiểm tra định kỳ

**Kịch bản chuẩn**

1. Tối 06/10/2026, Lan đăng nhập. Giao diện chính hiện thông báo "Kiểm tra tuần 41 – 2026 đang mở đến 11/10/2026". Lan chọn làm bài kiểm tra.
2. Giao diện kiểm tra hiện ra với ba lựa chọn: kiểm tra định kỳ, kiểm tra tổng hợp, lịch sử kiểm tra.
3. Lan chọn kiểm tra định kỳ.
4. Danh sách các đề kiểm tra định kỳ đang mở hiện ra:

| STT | Tên đề | Số câu | Ngày mở | Ngày đóng | Số lần đã làm |
|---|---|---|---|---|---|
| 1 | Kiểm tra tuần 41 – 2026 | 10 | 05/10/2026 | 11/10/2026 | 0 |
| 2 | Kiểm tra tháng 10/2026 | 30 | 01/10/2026 | 31/10/2026 | 0 |

5. Lan click đề "Kiểm tra tuần 41 – 2026".
6. Giao diện thông tin đề hiện ra với: tên đề; 10 câu gồm trắc nghiệm và điền từ, mỗi câu 1 điểm; nội dung "Từ vựng chủ đề Du lịch và thì hiện tại hoàn thành"; hướng dẫn làm bài; nút bắt đầu.
7. Lan click nút bắt đầu. Hệ thống tạo lượt làm bài ở trạng thái đang làm, thời gian bắt đầu 20:05 06/10/2026.
8. Giao diện làm bài hiện ra với: câu 1/10; bảng điều hướng các câu 1–10 (câu đã trả lời được tô màu); nút câu trước, nút câu sau, nút nộp bài. Câu 1 (trắc nghiệm, liên kết từ vựng "itinerary"): "The travel agent sent us the ___ for our trip." với bốn lựa chọn: A. luggage, B. itinerary, C. departure, D. souvenir.
9. Lan chọn B. Hệ thống lưu câu trả lời vào lượt làm bài. Lan làm tiếp các câu còn lại và bỏ qua câu 7 vì chưa chắc.
10. Lan click nút nộp bài.
11. Hệ thống hiện hộp xác nhận: "Bạn còn 1 câu chưa trả lời (câu 7). Câu chưa trả lời sẽ được tính 0 điểm. Bạn có chắc muốn nộp bài?".
12. Lan click xác nhận.
13. Hệ thống chấm tự động tất cả các câu, chuyển lượt làm bài sang trạng thái đã chấm với tổng điểm 8/10 và cộng 1 bài kiểm tra hoàn thành vào tiến độ ngày.
14. Giao diện kết quả hiện ra ngay với tổng điểm 8/10, nút về trang chủ và bảng:

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

15. Lan click nút về trang chủ.

**Kịch bản ngoại lệ**

- **4a.** Không có đề định kỳ nào đang mở: hệ thống báo "Hiện chưa có bài kiểm tra định kỳ nào đang mở".
- **7a.** Lan đã có một lượt làm dở của đề này: hệ thống mở lại lượt đó cùng các câu đã trả lời, không tạo lượt mới.
- **9a.** Mất kết nối khi đang làm: các câu đã lưu ở bước 9 được giữ. Khi vào lại, Lan tiếp tục lượt đang làm.
- **9b.** Đề đóng (hết ngày 11/10/2026) khi Lan vẫn đang làm: hệ thống tự nộp bài với các câu đã trả lời và chấm như bước 13.
- **12a.** Lan click hủy trong hộp xác nhận: hệ thống quay lại giao diện làm bài để Lan trả lời câu 7.

### 15. Use case: Kiểm tra tổng hợp

**Kịch bản chuẩn**

1. Lan đăng nhập (06/10/2026, trình độ hiện tại A2), chọn làm bài kiểm tra rồi chọn kiểm tra tổng hợp.
2. Danh sách các đề kiểm tra tổng hợp đang mở hiện ra:

| STT | Tên đề | Số câu | Ngày mở | Ngày đóng | Số lần đã làm |
|---|---|---|---|---|---|
| 1 | Kiểm tra tổng hợp tháng 10/2026 | 23 | 01/10/2026 | 31/10/2026 | 0 |

3. Lan click đề "Kiểm tra tổng hợp tháng 10/2026".
4. Giao diện thông tin đề hiện ra với: tên đề; phần nghe 10 câu trắc nghiệm; phần nói 2 đề bài (ghi âm, tối đa 1 phút mỗi đề); phần đọc 10 câu trắc nghiệm; phần viết 1 đề bài (120–150 từ); mỗi kỹ năng chấm theo thang 10; hướng dẫn làm bài; nút bắt đầu.
5. Lan click nút bắt đầu. Hệ thống tạo lượt làm bài ở trạng thái đang làm và hiện phần nghe gồm trình phát bài nghe "Planning a weekend trip", 10 câu trắc nghiệm và nút phần tiếp theo.
6. Lan nghe, chọn đáp án cho 10 câu rồi click nút phần tiếp theo.
7. Phần nói hiện ra với 2 đề bài, mỗi đề có một nút ghi âm. Đề 1: "Introduce yourself and your hobbies." Đề 2: "Describe a place you would like to visit and explain why."
8. Lan ghi âm câu trả lời cho hai đề (45 giây và 58 giây) rồi click nút phần tiếp theo.
9. Phần đọc hiện ra với đoạn văn "Eco-tourism in Vietnam" và 10 câu trắc nghiệm. Lan trả lời 10 câu rồi click nút phần tiếp theo.
10. Phần viết hiện ra với đề bài "Write an email to a friend about your last holiday (120–150 words)." và ô soạn thảo có bộ đếm số từ.
11. Lan viết bài 136 từ rồi click nút nộp bài.
12. Hệ thống hiện hộp xác nhận "Bạn đã trả lời 23/23 câu. Bạn có chắc muốn nộp bài?". Lan click xác nhận.
13. Hệ thống ghi thời gian nộp, chuyển lượt làm bài sang trạng thái đã nộp và chấm phần nghe (đúng 7/10 câu, được 7.0) và phần đọc (đúng 8/10 câu, được 8.0) theo đáp án. Hệ thống gửi hai bản ghi âm phần nói và bài viết đến Dịch vụ AI; giao diện hiện "Đang chấm phần nói và viết…".
14. Dịch vụ AI trả về điểm và nhận xét cho từng câu: đề nói 1 được 6.0, đề nói 2 được 7.0 (nhận xét chung: "Phát âm rõ, còn ngập ngừng, vốn từ về du lịch còn hạn chế"); bài viết được 6.5 (nhận xét: "Bố cục email đúng, còn lỗi chia thì quá khứ: 'we go' → 'we went'").
15. Hệ thống tính điểm phần nói bằng trung bình hai đề: (6.0 + 7.0) / 2 = 6.5; tính tổng điểm bằng trung bình bốn kỹ năng: (7.0 + 6.5 + 8.0 + 6.5) / 4 = 7.0. Sau đó hệ thống gửi điểm bốn kỹ năng cùng trình độ hiện tại A2 đến Dịch vụ AI.
16. Dịch vụ AI trả về trình độ đề xuất B1 và lộ trình đề xuất: "12 tuần hướng tới B2: ưu tiên nói và viết; mỗi tuần 40–50 từ mới, 1 bài đọc hiểu, 2 bài viết, 2 bài nghe, 2 bài phát âm."
17. Hệ thống chuyển lượt làm bài sang trạng thái đã chấm, lưu điểm từng kỹ năng, tổng điểm, trình độ đề xuất và lộ trình đề xuất. Hệ thống cập nhật trình độ hiện tại của Lan từ A2 lên B1, thêm một bản ghi lịch sử trình độ (B1, lượt kiểm tra này, 06/10/2026) và cộng 1 bài kiểm tra hoàn thành vào tiến độ ngày.
18. Giao diện báo cáo kết quả hiện ra với:
    - Người học: Trần Thị Lan; trình độ trước khi làm bài: A2,
    - Đề: Kiểm tra tổng hợp tháng 10/2026; ngày làm: 06/10/2026,
    - Tổng điểm: 7.0/10; trình độ đề xuất: B1,
    - Lộ trình đề xuất (như bước 16),
    - Hai nút: áp dụng lộ trình vào kế hoạch học, về trang chủ,
    - Bảng điểm theo kỹ năng:

| Kỹ năng | Điểm | Nhận xét |
|---|---|---|
| Nghe | 7.0 | Đúng 7/10 câu |
| Nói | 6.5 | Phát âm rõ, còn ngập ngừng, vốn từ về du lịch còn hạn chế |
| Đọc | 8.0 | Đúng 8/10 câu |
| Viết | 6.5 | Bố cục email đúng, còn lỗi chia thì quá khứ |

   Và bảng chi tiết từng câu (trích):

| Câu | Kỹ năng | Câu trả lời của Lan | Đáp án đúng | Điểm |
|---|---|---|---|---|
| 1 | Nghe | B | B | 1 |
| 4 | Nghe | A | C | 0 |
| 11 | Nói | Bản ghi 45 giây | – (AI chấm) | 6.0/10 |
| 12 | Nói | Bản ghi 58 giây | – (AI chấm) | 7.0/10 |
| 13 | Đọc | D | D | 1 |
| 23 | Viết | Bài viết 136 từ | – (AI chấm) | 6.5/10 |

19. Lan click nút về trang chủ. Giao diện chính hiển thị trình độ hiện tại B1.

**Kịch bản ngoại lệ**

- **2a.** Không có đề tổng hợp nào đang mở: hệ thống báo "Hiện chưa có bài kiểm tra tổng hợp nào đang mở".
- **5a.** Lan đóng trình duyệt giữa chừng: lượt làm bài giữ trạng thái đang làm cùng các câu đã trả lời. Lần sau chọn đề này, Lan làm tiếp từ phần đang dở.
- **7a.** Lan từ chối quyền micro ở phần nói: hệ thống hiện hướng dẫn cấp quyền. Nếu Lan vẫn bỏ qua phần nói, hai câu nói không có câu trả lời và được tính 0 điểm khi nộp.
- **12a.** Còn câu chưa trả lời: hộp xác nhận nêu số câu chưa trả lời; nếu Lan vẫn nộp, các câu đó được tính 0 điểm.
- **14a.** Dịch vụ AI lỗi hoặc quá thời gian khi chấm phần nói/viết: lượt làm bài giữ trạng thái đã nộp. Hệ thống báo "Bài của bạn đang được chấm, kết quả sẽ có trong lịch sử kiểm tra" và quay về giao diện kiểm tra. Hệ thống gửi chấm lại sau; khi có đủ điểm mới thực hiện bước 15–17. Trình độ hiện tại của Lan chưa thay đổi khi bài chưa chấm xong. Lan xem báo cáo sau qua lựa chọn lịch sử kiểm tra.
- **16a.** Trình độ đề xuất trùng trình độ hiện tại: lượt kiểm tra vẫn được lưu đầy đủ nhưng hệ thống không thêm bản ghi lịch sử trình độ.
- **18a.** Lan click nút áp dụng lộ trình vào kế hoạch học: hệ thống chuyển sang kịch bản 17 (nhánh 2a) với trình độ mục tiêu và lộ trình đề xuất được điền sẵn.

## V. Module D — Tiến độ và kế hoạch

### 16. Use case: Xem tiến độ

**Kịch bản chuẩn**

1. Tối 06/10/2026, sau khi học xong, Lan chọn tiến độ và kế hoạch ở giao diện chính.
2. Giao diện hiện ra với hai lựa chọn: tiến độ của tôi, kế hoạch học của tôi.
3. Lan chọn tiến độ của tôi.
4. Giao diện tiến độ hiện ra với:
   - Danh sách chọn kiểu xem (ngày/tuần/tháng; mặc định ngày), ô ngày bắt đầu, ô ngày kết thúc (mặc định 7 ngày gần nhất), nút xem,
   - Khu tổng quan: tổng số từ đã học 89, số từ đã thuộc 24, số bài tập hoàn thành 18, số bài kiểm tra đã làm 7, điểm trung bình kiểm tra 6.7, chuỗi ngày học liên tục 28 ngày,
   - Biểu đồ số từ đã học theo ngày của 7 ngày gần nhất,
   - Khu huy hiệu.
5. Lan chọn kiểu xem theo tuần, ngày bắt đầu 31/08/2026, ngày kết thúc 06/10/2026 rồi click nút xem.
6. Hệ thống tổng hợp các bản ghi tiến độ theo ngày của Lan trong khoảng thời gian đã chọn, gộp theo tuần, rồi hiển thị biểu đồ cột và bảng:

| Tuần | Số từ đã học | Bài tập hoàn thành | Bài kiểm tra | Điểm TB kiểm tra | Thời gian học |
|---|---|---|---|---|---|
| 36 (31/08–06/09) | 18 | 2 | 1 | 5.5 | 180 phút |
| 37 (07/09–13/09) | 20 | 3 | 1 | 6.0 | 210 phút |
| 38 (14/09–20/09) | 15 | 2 | 1 | 6.5 | 150 phút |
| 39 (21/09–27/09) | 17 | 4 | 1 | 7.0 | 200 phút |
| 40 (28/09–04/10) | 14 | 3 | 1 | 7.0 | 170 phút |
| 41 (05/10–06/10) | 5 | 4 | 2 | 7.5 | 95 phút |
| **Tổng** | **89** | **18** | **7** | **6.7** | **1 005 phút** |

7. Khu huy hiệu hiển thị hai bảng. Huy hiệu đã đạt:

| Huy hiệu | Điều kiện | Ngày đạt |
|---|---|---|
| Khởi đầu | Học ngày đầu tiên | 01/09/2026 |
| Chuỗi 7 ngày | Học 7 ngày liên tục | 15/09/2026 |
| 50 từ đầu tiên | Học được 50 từ | 20/09/2026 |

   Huy hiệu sắp đạt:

| Huy hiệu | Điều kiện | Tiến độ |
|---|---|---|
| 100 từ | Học được 100 từ | 89/100 |
| Chuỗi 30 ngày | Học 30 ngày liên tục | 28/30 |

8. Lan xem xong và click nút quay lại để về giao diện chính.

**Kịch bản ngoại lệ**

- **4a.** Người học mới chưa có dữ liệu: khu tổng quan hiển thị 0, biểu đồ trống, kèm gợi ý "Hãy bắt đầu học từ vựng hoặc làm bài kiểm tra tổng hợp để biết trình độ của bạn".
- **5a.** Ngày bắt đầu sau ngày kết thúc, hoặc ngày kết thúc sau hôm nay: hệ thống báo lỗi và không tổng hợp.
- **6a.** Trong khoảng thời gian đã chọn không có hoạt động: các tuần hiển thị 0 và điểm trung bình kiểm tra hiển thị "–".
- **7a.** Hoạt động học làm Lan đạt đủ điều kiện một huy hiệu (ví dụ học đủ 100 từ): hệ thống ghi nhận huy hiệu ngay khi đạt và hiện thông báo chúc mừng; ở giao diện tiến độ, huy hiệu đó chuyển sang bảng đã đạt. Mỗi huy hiệu chỉ được nhận một lần.

### 17. Use case: Quản lý kế hoạch học – Lập kế hoạch mới

**Kịch bản chuẩn**

1. Chiều 06/10/2026, sau khi làm kiểm tra tổng hợp (kịch bản 15, trình độ hiện tại B1), Lan chọn tiến độ và kế hoạch rồi chọn kế hoạch học của tôi.
2. Lan chưa có kế hoạch nào đang thực hiện nên giao diện lập kế hoạch hiện ra với: ô mô tả mục tiêu, trình độ hiện tại B1 (chỉ hiển thị), danh sách chọn trình độ mục tiêu (A1–C2), ô ngày bắt đầu, ô ngày kết thúc và nút gợi ý lộ trình.
3. Lan nhập mục tiêu "Đạt B2 để phỏng vấn học bổng vào tháng 1/2027", chọn trình độ mục tiêu B2, ngày bắt đầu 12/10/2026, ngày kết thúc 03/01/2027 rồi click nút gợi ý lộ trình.
4. Hệ thống kiểm tra dữ liệu hợp lệ: mục tiêu không trống, ngày bắt đầu không trước hôm nay, ngày kết thúc sau ngày bắt đầu. Sau đó hệ thống gửi mục tiêu, trình độ hiện tại B1, trình độ mục tiêu B2, thời gian 12 tuần và kết quả kiểm tra tổng hợp gần nhất (nghe 7.0, nói 6.5, đọc 8.0, viết 6.5) đến Dịch vụ AI; giao diện hiện "Đang tạo lộ trình…".
5. Dịch vụ AI trả về lộ trình 12 tuần.
6. Giao diện lộ trình đề xuất hiện ra với nút gợi ý lại, nút xác nhận và bảng (hai cột mục tiêu cho phép sửa):

| Tuần | Thời gian | Nội dung học | Mục tiêu số từ mới | Mục tiêu số bài tập |
|---|---|---|---|---|
| 1 | 12/10–18/10 | Từ vựng Công việc; câu bị động; nghe hội thoại công sở | 50 | 6 |
| 2 | 19/10–25/10 | Từ vựng Công việc; mệnh đề quan hệ; luyện nói giới thiệu bản thân | 50 | 6 |
| 3 | 26/10–01/11 | Từ vựng Giáo dục; câu điều kiện loại 1–2; viết email trang trọng | 50 | 7 |
| … | … | … | … | … |
| 11 | 21/12–27/12 | Ôn tập tổng hợp nói và viết | 30 | 8 |
| 12 | 28/12–03/01 | Ôn tập và làm kiểm tra tổng hợp | 20 | 5 |

7. Tuần 1 và tuần 2 Lan bận nên sửa mục tiêu số từ mới của hai tuần này từ 50 xuống 40, rồi click nút xác nhận.
8. Hệ thống kiểm tra các mục tiêu là số nguyên không âm. Hệ thống lưu kế hoạch (mục tiêu, trình độ mục tiêu B2, 12/10/2026–03/01/2027, trạng thái đang thực hiện) cùng 12 tuần lịch trình ở trạng thái chưa tới. Hệ thống tạo 12 nhắc nhở loại kế hoạch, mỗi nhắc nhở vào 8:00 thứ Hai đầu tuần với nội dung là mục tiêu của tuần đó.
9. Hệ thống thông báo "Lập kế hoạch thành công" và hiện giao diện chi tiết kế hoạch với: mục tiêu; trình độ B1 → B2; thời gian 12/10/2026–03/01/2027; tuần hiện tại "chưa bắt đầu"; bảng 12 tuần với mục tiêu và tiến độ (đều bằng 0); nút điều chỉnh kế hoạch.

**Kịch bản ngoại lệ**

- **2a.** Lan đến từ nút áp dụng lộ trình của báo cáo kiểm tra tổng hợp (bước 18a của kịch bản 15): giao diện lập kế hoạch hiện ra với trình độ mục tiêu B2 và lộ trình đề xuất của lượt kiểm tra được điền sẵn. Lan nhập mục tiêu và thời gian rồi tiếp tục từ bước 3; hệ thống gửi thêm lộ trình đề xuất này đến Dịch vụ AI để chia theo tuần.
- **2b.** Lan đã có một kế hoạch đang thực hiện: hệ thống mở giao diện chi tiết kế hoạch đó (xem kịch bản 18). Nếu Lan đến từ nhánh 2a, hệ thống hỏi "Kế hoạch hiện tại sẽ chuyển sang tạm dừng. Tiếp tục?". Chỉ khi Lan xác nhận, hệ thống mới cho lập kế hoạch mới, để đảm bảo mỗi người học chỉ có tối đa một kế hoạch đang thực hiện.
- **4a.** Mục tiêu để trống, ngày bắt đầu trước hôm nay, hoặc ngày kết thúc không sau ngày bắt đầu: hệ thống báo lỗi tại ô tương ứng và chưa gửi đến Dịch vụ AI.
- **4b.** Trình độ mục tiêu không cao hơn trình độ hiện tại: hệ thống cảnh báo nhưng vẫn cho tiếp tục (người học có thể muốn củng cố trình độ).
- **5a.** Dịch vụ AI lỗi hoặc quá thời gian chờ: hệ thống báo "Chưa tạo được lộ trình" và cho hai lựa chọn: thử lại, hoặc tự lập kế hoạch (hệ thống hiện bảng 12 tuần trống để Lan tự nhập). Kế hoạch chỉ được lưu khi Lan click nút xác nhận.
- **6a.** Lan click nút gợi ý lại: quay lại bước 4 để nhận lộ trình khác; lộ trình đang hiển thị không được lưu.
- **8a.** Một mục tiêu bị nhập âm hoặc không phải số: hệ thống báo lỗi tại ô đó và chưa lưu.

### 18. Use case: Quản lý kế hoạch học – Điều chỉnh kế hoạch

**Kịch bản chuẩn**

1. Ngày 27/10/2026 (tuần 3 của kế hoạch), Lan đăng nhập. Giao diện chính hiện nhắc nhở "Tuần 3: mục tiêu 50 từ mới, 7 bài tập" và cảnh báo "Tuần 2 chưa đạt mục tiêu (32/40 từ)".
2. Lan chọn tiến độ và kế hoạch rồi chọn kế hoạch học của tôi.
3. Giao diện chi tiết kế hoạch hiện ra với: mục tiêu; trình độ B1 → B2; thời gian 12/10/2026–03/01/2027; trạng thái đang thực hiện; tuần hiện tại 3/12; nút điều chỉnh kế hoạch; và bảng:

| Tuần | Thời gian | Mục tiêu số từ | Đã học | Mục tiêu bài tập | Đã làm | Trạng thái |
|---|---|---|---|---|---|---|
| 1 | 12/10–18/10 | 40 | 41 | 6 | 6 | Xong |
| 2 | 19/10–25/10 | 40 | 32 | 6 | 4 | Xong (chưa đạt) |
| 3 | 26/10–01/11 | 50 | 6 | 7 | 1 | Đang làm |
| 4 | 02/11–08/11 | 50 | – | 7 | – | Chưa tới |
| … | … | … | … | … | … | … |

4. Lan click nút điều chỉnh kế hoạch.
5. Giao diện điều chỉnh kế hoạch hiện ra với: các tuần đã qua (1–2) chỉ hiển thị; các ô mục tiêu của tuần 3–12 cho phép sửa; ô ngày kết thúc; nút tạm dừng kế hoạch, nút kết thúc kế hoạch, nút lưu và nút hủy.
6. Lan giảm mục tiêu số từ mới của tuần 3–6 từ 50 xuống 40 rồi click nút lưu.
7. Hệ thống kiểm tra các mục tiêu hợp lệ, lưu lịch trình của tuần 3–6 và cập nhật nội dung nhắc nhở của tuần 4–6 (nhắc nhở tuần 3 đã gửi ngày 26/10/2026 nên không thay đổi).
8. Hệ thống thông báo "Cập nhật kế hoạch thành công" và hiện lại giao diện chi tiết kế hoạch với các mục tiêu mới.

**Kịch bản ngoại lệ**

- **1a.** Lan không đạt mục tiêu tuần: hệ thống chỉ cảnh báo và gợi ý điều chỉnh; kết quả đã học không bị xóa hay trừ.
- **5a.** Lan click nút tạm dừng kế hoạch: hệ thống hỏi xác nhận, sau đó chuyển kế hoạch sang trạng thái tạm dừng và ngừng các nhắc nhở chưa gửi. Giao diện chi tiết hiện nút tiếp tục kế hoạch để Lan kích hoạt lại khi cần.
- **5b.** Lan click nút kết thúc kế hoạch: hệ thống hỏi xác nhận, sau đó chuyển kế hoạch sang trạng thái hoàn thành và hủy các nhắc nhở chưa gửi. Lan có thể lập kế hoạch mới (kịch bản 17).
- **6a.** Một mục tiêu bị nhập âm hoặc không phải số: hệ thống báo lỗi tại ô đó và chưa lưu.
- **6b.** Lan đổi ngày kết thúc: nếu rút ngắn, các tuần nằm sau ngày kết thúc mới bị xóa khỏi lịch trình; nếu kéo dài, hệ thống thêm các tuần mới với mục tiêu trống để Lan nhập trước khi lưu.
- **6c.** Lan click nút hủy: hệ thống không lưu thay đổi và quay về giao diện chi tiết kế hoạch.

## VI. Module E — Admin

### 19. Use case: Quản lý từ vựng – Sửa từ vựng

**Kịch bản chuẩn**

1. Admin Lê Văn Hùng nhận phản hồi rằng nghĩa của từ "luggage" chưa đầy đủ. Hùng mở hệ thống và đăng nhập bằng tài khoản admin01@englishapp.vn (kịch bản 2).
2. Giao diện chính của admin hiện ra với năm lựa chọn: quản lý từ vựng, quản lý bài tập, quản lý đề kiểm tra, quản lý người dùng, xem thống kê.
3. Hùng chọn quản lý từ vựng.
4. Giao diện quản lý từ vựng hiện ra với bốn lựa chọn: quản lý chủ đề, thêm từ, sửa từ, xóa từ.
5. Hùng chọn sửa từ.
6. Giao diện tìm kiếm từ vựng hiện ra với: ô nhập từ khóa, danh sách chọn chủ đề (mặc định tất cả chủ đề) và nút tìm kiếm.
7. Hùng nhập từ khóa "lugg", giữ lựa chọn tất cả chủ đề rồi click nút tìm kiếm.
8. Danh sách các từ có chứa "lugg" hiện ra:

| Mã | Từ | Phiên âm | Nghĩa | Chủ đề | CEFR |
|---|---|---|---|---|---|
| 105 | luggage | /ˈlʌɡ.ɪdʒ/ | hành lý | Du lịch | A2 |
| 131 | hand luggage | /ˈhænd ˌlʌɡ.ɪdʒ/ | hành lý xách tay | Du lịch | B1 |
| 342 | luggage rack | /ˈlʌɡ.ɪdʒ ræk/ | giá để hành lý | Du lịch | B2 |

9. Hùng click dòng có mã 105.
10. Giao diện sửa từ vựng hiện ra với các giá trị hiện tại của từ:
    - Mã: 105 (chỉ hiển thị, không sửa được),
    - Từ: luggage,
    - Phiên âm: /ˈlʌɡ.ɪdʒ/,
    - Nghĩa: hành lý,
    - Câu ví dụ: Please put your luggage here.,
    - Chủ đề: Du lịch,
    - Mức CEFR: A2,
    - File âm thanh: luggage.mp3 (nút nghe, nút thay file),
    - Hình minh họa: luggage.png (nút thay ảnh),
    - Nút lưu và nút hủy.
11. Hùng sửa nghĩa thành "hành lý (va li, túi xách mang theo khi đi xa)", sửa câu ví dụ thành "How many pieces of luggage are you checking in?" rồi click nút lưu.
12. Hệ thống kiểm tra từ và nghĩa không trống, trong chủ đề Du lịch không có từ "luggage" nào khác, rồi lưu thay đổi của từ 105.
13. Hệ thống thông báo "Sửa từ vựng thành công" và quay về giao diện chính của admin. Người học thấy nghĩa mới ngay từ lần xem thẻ tiếp theo; trạng thái học của người học với từ này không thay đổi.

**Kịch bản ngoại lệ**

- **8a.** Không có từ nào chứa từ khóa: hệ thống báo "Không tìm thấy từ vựng phù hợp". Hùng nhập từ khóa khác và quay lại bước 7.
- **11a.** Hùng click nút hủy: hệ thống không lưu và quay về giao diện tìm kiếm với kết quả cũ.
- **12a.** Hùng xóa trống ô từ hoặc ô nghĩa: hệ thống báo lỗi tại ô đó và giữ dữ liệu đang nhập. Quay lại bước 11.
- **12b.** Hùng đổi từ thành một từ đã có trong cùng chủ đề (ví dụ "hand luggage"): hệ thống báo "Từ đã tồn tại trong chủ đề Du lịch" và không lưu.
- **12c.** File thay thế không phải file âm thanh hoặc file ảnh hợp lệ: hệ thống báo lỗi và giữ file cũ.
- **12d.** Lưu thất bại: hệ thống thông báo lỗi và giữ nguyên form để Hùng thử lại.

### 20. Use case: Quản lý từ vựng – Thêm từ vựng

**Kịch bản chuẩn**

1. Hùng đăng nhập, chọn quản lý từ vựng rồi chọn thêm từ.
2. Giao diện thêm từ vựng hiện ra với các ô trống: từ, phiên âm, nghĩa, câu ví dụ, chủ đề (danh sách chọn), mức CEFR (danh sách chọn), file âm thanh, hình minh họa; cùng nút lưu, nút lưu và thêm tiếp, nút hủy.
3. Hùng nhập: từ "customs", phiên âm /ˈkʌs.təmz/, nghĩa "hải quan", câu ví dụ "We went through customs quickly.", chủ đề Du lịch, mức CEFR B1; tải lên file customs.mp3 và customs.png; rồi click nút lưu.
4. Hệ thống kiểm tra: từ, nghĩa, chủ đề và mức CEFR không trống; chủ đề Du lịch chưa có từ "customs". Dữ liệu hợp lệ nên hệ thống lưu từ mới với mã 356, người tạo là admin.
5. Hệ thống thông báo "Thêm từ vựng thành công" và quay về giao diện quản lý từ vựng. Chủ đề Du lịch có 41 từ; từ "customs" được đưa vào phiên học của người học như một từ chưa học.

**Kịch bản ngoại lệ**

- **3a.** Hùng click nút lưu và thêm tiếp: sau khi lưu thành công, form được làm trống nhưng giữ chủ đề và mức CEFR vừa chọn để Hùng nhập từ tiếp theo.
- **3b.** Hùng không tải file âm thanh: hệ thống vẫn cho lưu; ở flashcard, từ này không có nút nghe phát âm.
- **4a.** Thiếu từ, nghĩa, chủ đề hoặc mức CEFR: hệ thống báo lỗi tại ô tương ứng và không lưu.
- **4b.** Từ đã tồn tại trong chủ đề được chọn: hệ thống báo "Từ đã tồn tại trong chủ đề Du lịch" và không lưu.

### 21. Use case: Quản lý từ vựng – Xóa từ vựng

**Kịch bản chuẩn**

1. Hùng phát hiện có một từ bị nhập sai chính tả và trùng nghĩa với từ đã có. Hùng đăng nhập, chọn quản lý từ vựng rồi chọn xóa từ.
2. Giao diện tìm kiếm từ vựng hiện ra (như bước 6 của kịch bản 19).
3. Hùng nhập từ khóa "souv", chọn chủ đề Du lịch rồi click nút tìm kiếm.
4. Kết quả hiện ra:

| Mã | Từ | Nghĩa | Chủ đề | CEFR | Số người đã học | Số câu hỏi tham chiếu |
|---|---|---|---|---|---|---|
| 112 | souvenir | quà lưu niệm | Du lịch | A2 | 128 | 2 |
| 349 | souvenier | quà lưu niệm | Du lịch | A2 | 3 | 0 |

5. Hùng click dòng có mã 349 (từ gõ sai chính tả).
6. Hệ thống kiểm tra thấy từ 349 đã được 3 người học học, nên hiện hộp xác nhận: "Từ 'souvenier' đã được 3 người học học. Từ sẽ bị ẩn đối với các lượt học mới; lịch sử học cũ được giữ nguyên. Bạn có chắc muốn xóa?".
7. Hùng click xác nhận.
8. Hệ thống đánh dấu từ 349 là đã ẩn. Từ này không còn được đưa vào phiên học, phiên ôn tập, trò chơi hay kết quả tìm kiếm của người học; trạng thái học và các lượt ôn cũ của 3 người học vẫn được giữ.
9. Hệ thống thông báo "Xóa từ vựng thành công" và quay về giao diện quản lý từ vựng.

**Kịch bản ngoại lệ**

- **4a.** Không tìm thấy từ nào: xử lý như 8a của kịch bản 19.
- **6a.** Từ chưa được người học nào học và không có câu hỏi tham chiếu: hộp xác nhận chỉ hỏi "Bạn có chắc muốn xóa từ ...?". Khi Hùng xác nhận, từ bị xóa hẳn khỏi hệ thống.
- **6b.** Từ đang được câu hỏi của một đề kiểm tra đang mở tham chiếu: hộp xác nhận nêu thêm tên đề đó. Nếu Hùng xác nhận, từ bị ẩn còn câu hỏi của đề giữ nguyên nội dung.
- **7a.** Hùng click hủy: hệ thống không xóa và quay lại bảng kết quả tìm kiếm.

### 22. Use case: Quản lý từ vựng – Quản lý chủ đề

**Kịch bản chuẩn**

1. Hùng muốn mở thêm chủ đề "Mua sắm". Hùng đăng nhập, chọn quản lý từ vựng rồi chọn quản lý chủ đề.
2. Giao diện quản lý chủ đề hiện ra với nút thêm chủ đề và bảng:

| STT | Chủ đề | Mô tả | Số từ | Thao tác |
|---|---|---|---|---|
| 1 | Du lịch | Sân bay, khách sạn, tham quan | 41 | Sửa, Xóa |
| 2 | Công việc | Văn phòng, phỏng vấn, cuộc họp | 35 | Sửa, Xóa |
| 3 | Gia đình | Thành viên, quan hệ, sinh hoạt | 30 | Sửa, Xóa |
| 4 | Thức ăn | Món ăn, nấu nướng, nhà hàng | 45 | Sửa, Xóa |

3. Hùng click nút thêm chủ đề.
4. Form thêm chủ đề hiện ra với: ô tên chủ đề, ô mô tả, ô tải hình minh họa, nút lưu và nút hủy.
5. Hùng nhập tên "Mua sắm", mô tả "Cửa hàng, giá cả, thanh toán", tải lên hình mua_sam.png rồi click nút lưu.
6. Hệ thống kiểm tra tên chủ đề không trống và không trùng với chủ đề khác, rồi lưu chủ đề mới.
7. Hệ thống thông báo "Thêm chủ đề thành công". Bảng có thêm dòng "Mua sắm | Cửa hàng, giá cả, thanh toán | 0". Khi chủ đề chưa có từ, người học chọn chủ đề này sẽ nhận thông báo "Chủ đề chưa có từ vựng" (nhánh 6b của kịch bản 5).

**Kịch bản ngoại lệ**

- **2a.** Sửa chủ đề: Hùng click "Sửa" ở một dòng, form hiện ra với dữ liệu đã điền sẵn; Hùng sửa rồi click nút lưu. Các từ thuộc chủ đề không bị ảnh hưởng.
- **2b.** Xóa chủ đề còn từ vựng: hệ thống không cho xóa và báo "Chủ đề còn 41 từ, hãy chuyển các từ sang chủ đề khác hoặc xóa từ trước". Với chủ đề không còn từ nào, hệ thống hỏi xác nhận rồi xóa.
- **6a.** Tên chủ đề để trống hoặc trùng với chủ đề khác: hệ thống báo lỗi tại ô tên và không lưu.

### 23. Use case: Quản lý bài tập

Kịch bản chuẩn đi theo chức năng thêm một bài tập đọc hiểu có bài đọc.

**Kịch bản chuẩn**

1. Hùng đăng nhập và chọn quản lý bài tập.
2. Giao diện quản lý bài tập hiện ra với bốn thẻ kỹ năng: đọc hiểu, viết, nghe hiểu, phát âm. Mỗi thẻ có ô tìm kiếm, nút thêm bài và bảng bài học với thao tác sửa, xóa. Thẻ đọc hiểu đang được chọn:

| Mã | Tiêu đề | Chủ đề | CEFR | Số bài đọc | Số câu | Trạng thái |
|---|---|---|---|---|---|---|
| 20 | A trip to Ha Long Bay | Du lịch | A2 | 1 | 8 | Đã xuất bản |
| 21 | Thì hiện tại đơn | Thì động từ | A1 | 0 | 10 | Đã xuất bản |
| 22 | Thì quá khứ đơn | Thì động từ | A2 | 0 | 10 | Đã xuất bản |
| 23 | Thì hiện tại hoàn thành | Thì động từ | B1 | 1 | 10 | Đã xuất bản |
| 24 | Câu bị động | Cấu trúc câu | B1 | 0 | 12 | Đã xuất bản |

3. Hùng click nút thêm bài.
4. Giao diện thêm bài đọc hiểu hiện ra gồm:
   - Thông tin bài học: tiêu đề, mô tả, chủ đề, mức CEFR, thời lượng ước tính, trạng thái (nháp/xuất bản),
   - Danh sách bài đọc (đang trống) với nút thêm bài đọc,
   - Danh sách câu hỏi (đang trống) với nút thêm câu hỏi,
   - Nút lưu và nút hủy.
5. Hùng nhập tiêu đề "Câu điều kiện loại 1", mô tả "Diễn tả điều có thể xảy ra ở hiện tại hoặc tương lai", chủ đề "Cấu trúc câu", mức CEFR B1, thời lượng 15 phút, trạng thái nháp, rồi click nút thêm bài đọc.
6. Form bài đọc hiện ra với ô tiêu đề và ô nội dung đoạn văn. Hùng nhập tiêu đề "Plans for the weekend" và một đoạn văn khoảng 150 từ, bắt đầu bằng "If the weather is nice on Saturday, Minh will go camping with his friends. If it rains, they will watch a film at home instead…", rồi click thêm vào bài.
7. Hùng click nút thêm câu hỏi. Form câu hỏi hiện ra với: loại câu hỏi (trắc nghiệm/điền từ), bài đọc liên quan (danh sách chọn các bài đọc của bài học này, mặc định "Không gắn bài đọc"), nội dung, gợi ý, giải thích, điểm. Với câu trắc nghiệm, form có 4 ô lựa chọn và ô đánh dấu đáp án đúng; với câu điền từ, form có danh sách đáp án được chấp nhận và nút thêm đáp án.
8. Hùng thêm câu 1 (điền chỗ trống, không gắn bài đọc): nội dung "If it ___ (rain) tomorrow, we will stay at home."; đáp án được chấp nhận "rains"; gợi ý "Mệnh đề if dùng thì hiện tại đơn"; giải thích "Câu điều kiện loại 1: If + hiện tại đơn, will + động từ nguyên mẫu."; điểm 1. Hùng click thêm vào bài.
9. Hùng thêm câu 2 (trắc nghiệm ngữ pháp, không gắn bài đọc): nội dung "If she studies hard, she ___ the exam."; các lựa chọn A. passes, B. will pass, C. passed, D. would pass; đánh dấu B là đáp án đúng; điểm 1. Hùng click thêm vào bài.
10. Hùng thêm câu 3 (câu hỏi về bài đọc): loại trắc nghiệm; bài đọc liên quan "Plans for the weekend"; nội dung "What will Minh do if it rains on Saturday?"; các lựa chọn A. Go camping, B. Watch a film at home, C. Visit his grandparents, D. Go to school; đánh dấu B là đáp án đúng; giải thích "Câu thứ hai của bài đọc: If it rains, they will watch a film at home instead."; điểm 1. Hùng click thêm vào bài.
11. Hùng thêm tiếp câu 4–10 theo cách tương tự, đổi trạng thái sang xuất bản rồi click nút lưu.
12. Hệ thống kiểm tra: tiêu đề và mức CEFR không trống; bài xuất bản có ít nhất một câu hỏi; mỗi bài đọc có tiêu đề và nội dung; mỗi câu trắc nghiệm có ít nhất hai lựa chọn và ít nhất một đáp án đúng; mỗi câu điền từ có ít nhất một đáp án được chấp nhận; câu hỏi gắn bài đọc thì bài đọc đó thuộc chính bài học này. Dữ liệu hợp lệ nên hệ thống lưu bài học (mã 25) cùng 1 bài đọc và 10 câu hỏi.
13. Hệ thống thông báo "Thêm bài tập thành công". Thẻ đọc hiểu có thêm dòng "25 | Câu điều kiện loại 1 | Cấu trúc câu | B1 | 1 | 10 | Đã xuất bản". Bài xuất hiện ngay trong danh sách bài đọc hiểu của người học (bước 4 của kịch bản 9).

**Kịch bản ngoại lệ**

- **2a.** Sửa bài tập: Hùng tìm bài theo tiêu đề và click "Sửa". Giao diện giống bước 4 hiện ra với dữ liệu đã điền sẵn; Hùng sửa rồi click nút lưu. Sửa đáp án (hoặc câu trả lời mẫu) của một câu đã có người làm không làm thay đổi điểm của các lượt làm trước đó.
- **2b.** Xóa bài tập: Hùng click "Xóa" ở một dòng. Nếu bài đã có lượt làm của người học, hệ thống cảnh báo và chỉ ẩn bài (như kịch bản 21); nếu chưa có lượt làm nào, bài bị xóa hẳn sau khi Hùng xác nhận.
- **3a.** Thêm bài ở thẻ viết: giao diện không có phần bài đọc. Form câu hỏi có: loại câu hỏi (dịch câu/viết lại câu/viết câu theo từ khóa), nội dung (câu tiếng Việt cần dịch; câu gốc kèm phần mở đầu cho sẵn nếu có; hoặc các từ khóa gợi ý), danh sách câu trả lời mẫu với nút thêm câu mẫu, gợi ý, giải thích, điểm. Ví dụ câu 4 của bài "Viết về chuyến đi" (kịch bản 10): loại dịch câu; nội dung "Chuyến bay của chúng tôi bị hoãn vì thời tiết xấu."; hai câu trả lời mẫu "Our flight was delayed because of bad weather." và "Our flight was delayed due to bad weather."; điểm 2. Mỗi câu viết phải có ít nhất một câu trả lời mẫu vì Dịch vụ AI dựa vào đề bài và câu trả lời mẫu để chấm.
- **3b.** Thêm bài ở thẻ nghe hiểu: form có phần bài nghe thay cho phần bài đọc, gồm file âm thanh, transcript đầy đủ, bản dịch và danh sách đoạn (thứ tự, mốc thời gian bắt đầu/kết thúc, transcript và bản dịch của đoạn); file âm thanh và transcript là bắt buộc. Câu hỏi chỉ có loại trắc nghiệm và điền từ.
- **3c.** Thêm bài ở thẻ phát âm: danh sách câu hỏi được thay bằng danh sách mục luyện phát âm, mỗi mục gồm văn bản mẫu, phiên âm IPA và âm thanh mẫu (cả ba đều bắt buộc).
- **8a.** Câu trắc nghiệm chưa đánh dấu đáp án đúng hoặc có ít hơn hai lựa chọn; câu điền từ chưa có đáp án được chấp nhận; câu viết chưa có câu trả lời mẫu: hệ thống báo lỗi trong form câu hỏi và chưa thêm câu vào bài.
- **12a.** Hùng chọn xuất bản khi bài chưa có câu hỏi: hệ thống báo "Bài xuất bản phải có ít nhất một câu hỏi". Hùng có thể lưu bài ở trạng thái nháp; người học không nhìn thấy bài nháp.

### 24. Use case: Quản lý đề kiểm tra

Kịch bản chuẩn đi theo chức năng thêm một đề kiểm tra định kỳ.

**Kịch bản chuẩn**

1. Hùng chuẩn bị đề cho tuần 42. Hùng đăng nhập và chọn quản lý đề kiểm tra.
2. Giao diện quản lý đề kiểm tra hiện ra với ô tìm kiếm, danh sách chọn loại đề, nút thêm đề và bảng:

| Mã | Tiêu đề | Loại | Số câu | Ngày mở | Ngày đóng | Số lượt làm | Thao tác |
|---|---|---|---|---|---|---|---|
| 40 | Kiểm tra tuần 40 – 2026 | Định kỳ | 10 | 28/09/2026 | 04/10/2026 | 412 | Sửa, Xóa |
| 41 | Kiểm tra tuần 41 – 2026 | Định kỳ | 10 | 05/10/2026 | 11/10/2026 | 150 | Sửa, Xóa |
| 42 | Kiểm tra tháng 10/2026 | Định kỳ | 30 | 01/10/2026 | 31/10/2026 | 96 | Sửa, Xóa |
| 43 | Kiểm tra tổng hợp tháng 10/2026 | Tổng hợp | 23 | 01/10/2026 | 31/10/2026 | 64 | Sửa, Xóa |

3. Hùng click nút thêm đề.
4. Giao diện thêm đề kiểm tra hiện ra với: ô tiêu đề, danh sách chọn loại (định kỳ/tổng hợp), ô kỹ năng, ô ngày mở, ô ngày đóng; danh sách câu hỏi (đang trống) với hai nút: thêm câu hỏi, thêm câu hỏi từ kho từ vựng; nút lưu và nút hủy.
5. Hùng nhập tiêu đề "Kiểm tra tuần 42 – 2026", chọn loại định kỳ, kỹ năng "Từ vựng và ngữ pháp", ngày mở 12/10/2026, ngày đóng 18/10/2026.
6. Hùng click nút thêm câu hỏi từ kho từ vựng, tìm từ "customs" và chọn từ này. Hệ thống tạo sẵn một câu trắc nghiệm liên kết với từ "customs": nội dung "___ officers checked our bags at the airport.", đáp án đúng "Customs" và ba lựa chọn nhiễu lấy từ các từ khác cùng chủ đề (luggage, departure, itinerary). Hùng giữ nội dung, đặt điểm 1 và thêm câu vào đề.
7. Hùng thêm tiếp 9 câu trắc nghiệm và điền từ theo cách thêm câu hỏi ở kịch bản 23.
8. Hùng click nút lưu.
9. Hệ thống kiểm tra: tiêu đề không trống, ngày đóng sau ngày mở, đề có ít nhất một câu hỏi, mỗi câu có đáp án đúng. Dữ liệu hợp lệ nên hệ thống lưu đề (mã 44) cùng 10 câu hỏi.
10. Hệ thống thông báo "Thêm đề kiểm tra thành công". Bảng có thêm dòng mã 44. Đề hiện trong danh sách đề đang mở của người học từ 12/10/2026 đến hết 18/10/2026.

**Kịch bản ngoại lệ**

- **2a.** Sửa đề đã có lượt làm (ví dụ đề 41 đã có 150 lượt): hệ thống chỉ cho sửa tiêu đề và ngày đóng, không cho thêm, sửa hay xóa câu hỏi, để điểm của các lượt đã làm luôn thống nhất. Đề chưa có lượt làm nào được sửa đầy đủ như bước 4–9.
- **2b.** Xóa đề: nếu đề đã có lượt làm, hệ thống cảnh báo và chỉ ẩn đề, lịch sử kiểm tra của người học giữ nguyên; nếu chưa có lượt làm, đề bị xóa hẳn sau khi Hùng xác nhận.
- **5a.** Thêm đề loại tổng hợp: đề phải có câu hỏi của đủ bốn kỹ năng nghe, nói, đọc, viết. Câu nghe phải có file âm thanh; câu nói và câu viết không có đáp án đúng mà do Dịch vụ AI chấm.
- **9a.** Ngày đóng không sau ngày mở: hệ thống báo lỗi tại ô ngày đóng và không lưu.
- **9b.** Đề tổng hợp thiếu câu hỏi của một kỹ năng: hệ thống báo "Đề tổng hợp phải có đủ 4 phần nghe, nói, đọc, viết" và không lưu.

### 25. Use case: Quản lý người dùng

Kịch bản chuẩn đi theo chức năng khóa một tài khoản người học.

**Kịch bản chuẩn**

1. Hùng nhận báo cáo rằng tài khoản nam.pv@gmail.com dùng chatbot để gửi nội dung quảng cáo. Hùng đăng nhập và chọn quản lý người dùng.
2. Giao diện quản lý người dùng hiện ra với: ô từ khóa (họ tên hoặc email), danh sách chọn trạng thái (tất cả/hoạt động/bị khóa), nút tìm kiếm và bảng các tài khoản người học (có phân trang).
3. Hùng nhập từ khóa "nam.pv" rồi click nút tìm kiếm.
4. Kết quả hiện ra:

| Mã | Họ tên | Email | Trình độ | Ngày tạo | Trạng thái |
|---|---|---|---|---|---|
| 1087 | Phạm Văn Nam | nam.pv@gmail.com | A2 | 15/09/2026 | Hoạt động |

5. Hùng click dòng có mã 1087.
6. Giao diện chi tiết tài khoản hiện ra với: họ tên, email, trình độ, ngày tạo, trạng thái; số liệu học tập (đã học 12 từ, hoàn thành 1 bài tập, 0 bài kiểm tra, 37 phiên chat, ngày học gần nhất 05/10/2026); nút khóa tài khoản và nút quay lại.
7. Hùng click nút khóa tài khoản.
8. Hệ thống hiện hộp xác nhận: "Khóa tài khoản Phạm Văn Nam? Người dùng sẽ không đăng nhập được, dữ liệu học vẫn được giữ." Hùng click xác nhận.
9. Hệ thống đổi trạng thái tài khoản 1087 sang bị khóa và kết thúc các phiên đăng nhập đang mở của tài khoản này.
10. Hệ thống thông báo "Đã khóa tài khoản". Giao diện chi tiết hiển thị trạng thái bị khóa và nút mở khóa thay cho nút khóa. Lần đăng nhập tiếp theo của Nam bị từ chối (nhánh 4b của kịch bản 2).

**Kịch bản ngoại lệ**

- **2a.** Bảng chỉ liệt kê tài khoản người học; admin không khóa được tài khoản admin (kể cả tài khoản của chính mình) từ giao diện này.
- **4a.** Không tìm thấy tài khoản nào: hệ thống báo "Không tìm thấy người dùng phù hợp".
- **7a.** Mở khóa tài khoản: với tài khoản đang bị khóa, Hùng click nút mở khóa và xác nhận. Trạng thái tài khoản trở lại hoạt động và người học đăng nhập được bình thường.
- **8a.** Hùng click hủy trong hộp xác nhận: trạng thái tài khoản không thay đổi.

### 26. Use case: Xem thống kê

**Kịch bản chuẩn**

1. Đầu tháng 10, Hùng muốn xem tình hình sử dụng hệ thống trong tháng 9/2026. Hùng đăng nhập và chọn xem thống kê.
2. Giao diện thống kê hiện ra với: ô ngày bắt đầu, ô ngày kết thúc (mặc định 30 ngày gần nhất) và nút xem.
3. Hùng nhập ngày bắt đầu 01/09/2026, ngày kết thúc 30/09/2026 rồi click nút xem.
4. Hệ thống tính số liệu từ dữ liệu hiện có trong khoảng thời gian đã chọn. Người dùng hoạt động là người học có ít nhất một ngày học trong kỳ. Giao diện hiển thị bảng tổng quan:

| Chỉ số | Giá trị |
|---|---|
| Tổng số người dùng (đến 30/09/2026) | 1 250 |
| Người dùng mới trong kỳ | 180 |
| Người dùng hoạt động trong kỳ | 640 |
| Tổng lượt ôn từ vựng | 25 430 |
| Tổng lượt làm bài tập | 8 120 |
| Tổng lượt làm bài kiểm tra | 1 045 |

   Bên dưới là biểu đồ số người dùng hoạt động theo ngày và bảng nội dung được học nhiều nhất, sắp xếp theo số người học:

| STT | Nội dung | Loại | Số lượt học | Số người học |
|---|---|---|---|---|
| 1 | Du lịch | Chủ đề từ vựng | 6 820 | 410 |
| 2 | Kiểm tra tổng hợp tháng 9/2026 | Đề kiểm tra | 420 | 395 |
| 3 | Thì hiện tại hoàn thành | Bài đọc hiểu | 1 150 | 380 |
| 4 | Công việc | Chủ đề từ vựng | 5 240 | 350 |
| 5 | Booking a hotel room | Bài nghe hiểu | 610 | 300 |

5. Hùng xem xong và click nút quay lại để về giao diện chính của admin.

**Kịch bản ngoại lệ**

- **3a.** Ngày bắt đầu sau ngày kết thúc: hệ thống báo lỗi và không tính số liệu.
- **4a.** Trong kỳ không có hoạt động nào: các chỉ số bằng 0 và bảng nội dung được học nhiều nhất trống.

## Các điểm mới phát sinh cần nhóm chốt

Khi viết kịch bản chi tiết, một số quy tắc chưa có trong Business model đã được đề xuất. Nhóm cần xem lại trước khi sang bước trích lớp thực thể:

1. **Tài khoản:** mật khẩu tối thiểu 8 ký tự; khi đăng nhập sai, thông báo không nói rõ sai email hay sai mật khẩu; khóa tài khoản thì kết thúc ngay các phiên đang mở.
2. **Chấm câu điền từ:** không phân biệt chữ hoa/thường và bỏ qua khoảng trắng thừa khi so với đáp án được chấp nhận.
3. **Làm dở bài:** lượt làm bài tập và bài kiểm tra được lưu theo từng câu, giữ trạng thái đang làm và cho làm tiếp; đề đóng khi người học đang làm thì hệ thống tự nộp bài.
4. **Chatbot:** không nêu đáp án của câu chưa được kiểm tra/nộp; từ chối câu hỏi ngoài phạm vi học tiếng Anh.
5. **Nội dung đã có người dùng:** đề đã có lượt làm chỉ được sửa tiêu đề và ngày đóng; sửa đáp án bài tập không chấm lại các lượt cũ; không xóa chủ đề còn từ vựng; từ người học tự nhập chỉ người đó nhìn thấy.
6. **Trò chơi:** tham số ván chơi (số câu, thời gian, điểm mỗi câu) là cố định trong hệ thống; kết quả trò chơi không ảnh hưởng lịch ôn.
7. **Nghe hiểu:** phụ đề tạm ẩn khi người học trả lời câu hỏi.
8. **Điểm kiểm tra:** mọi điểm quy về thang 10; điểm phần nói là trung bình các đề nói; tổng điểm kiểm tra tổng hợp là trung bình bốn kỹ năng.
9. **Kế hoạch học:** nhắc nhở vào 8:00 thứ Hai đầu mỗi tuần; khi áp dụng lộ trình mới trong lúc đang có kế hoạch đang thực hiện, kế hoạch cũ chuyển sang tạm dừng.
10. **Bài tập viết** (kịch bản 10): Dịch vụ AI chấm theo thang điểm của từng câu, từ 0 đến điểm tối đa, bước 0,5. Mỗi câu viết chỉ được chấm một lần trong một lượt; muốn viết lại thì làm lại bài (lượt mới). Khi AI chưa chấm được một câu, người học vẫn chuyển sang câu tiếp theo được; lượt làm bài giữ trạng thái đang làm và chưa được tính vào tiến độ cho đến khi mọi câu có điểm. Sửa câu trả lời mẫu không chấm lại các lượt cũ.
