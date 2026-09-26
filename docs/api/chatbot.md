# API trợ lý AI giải thích bài tập (module B: B4) — contract

> Trạng thái: **đề xuất, chờ Đạt duyệt.** Frontend (`frontend/src/features/exercises/chat/`) đã viết theo tài liệu này và
> chạy được với dữ liệu giả (`npm run dev:mock`, câu trả lời soạn sẵn). Backend chưa có. Quy ước chung (xác thực, lỗi,
> enum chữ hoa) giống `docs/api/exercises.md`.

Dùng các bảng `chat_sessions`, `chat_messages`, `knowledge_chunks`, `chat_message_sources`.

## Giao diện dùng thế nào

Nút "Hỏi trợ lý AI" nổi ở góc phải dưới mọi màn bài tập (theo thiết kế). Mở khung chat, gõ câu hỏi đầu tiên thì
giao diện tạo phiên chat, rồi gửi từng tin nhắn kèm **id** của thứ người học đang làm (bài, câu hỏi, lượt làm bài).
Lịch sử chat chỉ giữ trong trang đang mở; rời trang là bắt đầu phiên mới (chưa có màn xem lại lịch sử).

## Endpoint

### `POST /api/chat/sessions`

```json
{ "lessonId": 1, "questionId": 11 }
```

Cả hai tùy chọn (`null` khi hỏi từ màn danh sách bài). Trả `201` `{ "id": 9, "title": "Thì hiện tại hoàn thành", "createdAt": "…" }`.
`title` do server đặt (tên bài, hoặc "Hỏi đáp chung"). `404` nếu bài hay câu hỏi không tồn tại.

### `POST /api/chat/sessions/{sessionId}/messages`

```json
{ "content": "Vì sao câu này dùng \"has lived\" mà không phải \"lived\"?", "questionId": 11, "attemptId": 55, "pronunciationItemId": null }
```

- `content`: 1 đến 1000 ký tự (sau khi cắt khoảng trắng).
- `questionId`, `attemptId`, `pronunciationItemId`: ngữ cảnh **lúc gửi**, đều tùy chọn (người học chuyển câu thì tin sau
  mang câu mới).

Trả `201` tin trả lời của AI:

```json
{
  "id": 31,
  "role": "ASSISTANT",
  "content": "Thì hiện tại hoàn thành (**has/have + V3**) dùng khi…\n\n- Dấu hiệu: *for*, *since*…",
  "createdAt": "2026-09-26T02:03:00Z",
  "sources": [ { "title": "Ngữ pháp: thì hiện tại hoàn thành" } ]
}
```

- Server lưu cả tin của người học (`role = 'user'`) và tin trả lời (`'assistant'`, kèm `provider`, `model_name`, số token).
  `sources`: các `knowledge_chunks` đã dùng (bảng `chat_message_sources`), có thể `[]`.
- `content` là **Markdown đơn giản**: đoạn văn, danh sách `-` hoặc `1.`, `**đậm**`, `*nghiêng*`, `` `mã` ``. Giao diện tự
  hiển thị các dạng này và **không bao giờ chèn HTML** từ câu trả lời (chống XSS, vì token nằm trong `localStorage`).
  Thẻ HTML trong câu trả lời hiện nguyên văn.
- `404`: phiên không tồn tại hoặc của người khác. `400`: nội dung rỗng hoặc quá dài. `429`: gửi quá nhanh (nếu backend có
  giới hạn). `503`: dịch vụ AI lỗi hoặc quá thời gian (ngoại lệ B4, giao diện báo "không thể trả lời lúc này, thử lại
  sau" và cho gửi lại). Giao diện chờ tối đa 60 giây; backend nên tự cắt ở khoảng 30 giây.

## Ngữ cảnh cho AI (việc của backend)

Nghiệp vụ B4: chat "mang ngữ cảnh bài tập đang làm (câu hỏi, đáp án của người học)". Giao diện chỉ gửi **id**, server tự
tra nội dung:

- `questionId`: đề, các lựa chọn, đáp án đúng, giải thích (`exercise_questions`, `question_options`, …).
- `attemptId` + `questionId`: câu trả lời của người học trong lượt đó (`question_responses`), nếu đã trả lời.
- `pronunciationItemId` + `attemptId`: câu mẫu, IPA và kết quả chấm gần nhất (`pronunciation_attempts`).
- `sessionId`: các tin trước trong phiên (giới hạn vài tin gần nhất để tiết kiệm token).

Vì sao chỉ gửi id: nội dung lấy từ DB nên đúng và không bị người dùng sửa, request nhỏ, và server quyết định được **khi
nào được lộ đáp án**. Gợi ý cho system prompt: nếu người học **chưa** trả lời câu đó thì chỉ gợi ý hướng suy nghĩ, không
nói đáp án; đã trả lời rồi thì giải thích đầy đủ. Trả lời bằng tiếng Việt, ví dụ bằng tiếng Anh. Kiểm tra quyền: lượt
làm bài phải thuộc người đang hỏi.
