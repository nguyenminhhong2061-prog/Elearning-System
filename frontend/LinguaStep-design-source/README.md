# LinguaStep – Mã nguồn thiết kế giao diện

## Cấu trúc
- `index.html`: toàn bộ giao diện (markup + CSS inline) và logic màn hình (trong thẻ `<script type="text/x-dc">`).
  Markup dùng cú pháp template: `{{ bien }}` để gắn dữ liệu, `<sc-if value="{{ ... }}">` để hiện/ẩn có điều kiện, `sc-camel-on-click` để bắt sự kiện click.
- `logic.reference.js`: bản sao phần logic (state, dữ liệu mẫu, các hàm chuyển màn hình) để đọc cho dễ. Chỉ dùng để tham khảo.
- `runtime/dc-runtime.js`: runtime render template bằng React. Chỉ cần khi chạy bản xem trước, không cần đưa vào dự án thật.
- `vendor/`: React 18.3.1 và ReactDOM (UMD).
- `fonts/`: Be Vietnam Pro (400/500/600/700) và IBM Plex Mono (400/500), định dạng woff2.
- `LinguaStep-standalone.html`: bản gốc gói gọn trong 1 file, mở trực tiếp bằng trình duyệt là xem được.

## Cách xem
- Cách nhanh nhất: mở `LinguaStep-standalone.html` bằng trình duyệt.
- Hoặc chạy server tĩnh trong thư mục này (ví dụ `python3 -m http.server`) rồi mở `http://localhost:8000/index.html`.
  Không mở `index.html` bằng file:// vì trình duyệt sẽ chặn tải font và script.

## Design tokens chính
- Font: Be Vietnam Pro (chữ chính), IBM Plex Mono (chữ số, mã)
- Màu chủ đạo: #12A594 (teal), #0B7B70 (teal đậm, link)
- Nền: #EDF0EF; nền sidebar/tối: #16211F, #22302D
- Viền: #D4DAD8; chữ phụ: #77857F, #9BAAA5; chữ chính: #16211F
- Bo góc: 8px (nút, ô nhập), 10–12px (card)

## Gợi ý khi code lại
Coi `index.html` là bản đặc tả. Mỗi khối `<sc-if>` tương ứng một màn hình (Đăng nhập, Tiến độ, Từ vựng, Bài tập, Kiểm tra, Kế hoạch...).
Phần `state` trong logic mô tả dữ liệu và tương tác của từng màn hình.
