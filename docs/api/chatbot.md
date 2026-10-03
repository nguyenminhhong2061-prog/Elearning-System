# API trợ lý AI giải thích bài tập (module B: B4) — contract

> Trạng thái: **backend Groq đã triển khai bản đầu.** Frontend (`frontend/src/features/exercises/chat/`) đã viết theo tài liệu này và
> có chế độ dữ liệu giả (`npm run dev:mock`, câu trả lời soạn sẵn). Quy ước chung (xác thực, lỗi,
> enum chữ hoa) giống `docs/api/exercises.md`.

Dùng các bảng `chat_sessions`, `chat_messages`, `knowledge_chunks`, `chat_message_sources`.

## Cấu hình backend Groq

Backend sử dụng Groq Chat Completions và cung cấp các endpoint bên dưới. Điền vào `.env` ở gốc repo:

```dotenv
GROQ_API_KEY=
GROQ_BACKUP_API_KEY=
GROQ_MODEL=openai/gpt-oss-120b
```

Khởi động lại backend sau khi đổi biến môi trường. Khóa dự phòng là tùy chọn; provider thử khóa đó khi khóa chính
gặp 401, 403, 429, lỗi 5xx hoặc lỗi kết nối. Hai khóa giống nhau chỉ được thử một lần. Các khóa cùng organization
chia sẻ rate limit, nên khóa dự phòng không làm tăng quota của organization. Không ghi khóa vào frontend hoặc Git.

Phiên bản hiện tại lấy kiến thức theo lesson/question trong `knowledge_chunks`; chưa dùng embedding hoặc tìm kiếm vector.
Tin người học và câu trả lời AI được lưu cùng transaction: khi provider lỗi, request có thể gửi lại mà không lưu tin trùng.
Câu trả lời AI là HTML fragment ngắn với tập thẻ giới hạn (`p`, `strong`, `em`, `ul`, `ol`, `li`, `br`, `code`).
Frontend dựng lại các thẻ được phép và bỏ thuộc tính/thẻ nguy hiểm; câu trả lời Markdown cũ vẫn hiển thị được.

## Giao diện dùng thế nào

Nút "Hỏi trợ lý AI" nổi ở góc phải dưới mọi màn bài tập. Mở khung chat, gõ câu hỏi đầu tiên thì
giao diện tạo phiên chat, rồi gửi từng tin nhắn kèm **id** của thứ người học đang làm (bài, câu hỏi, lượt làm bài).
Nút "Lịch sử" liệt kê các phiên của tài khoản hiện tại; chọn một phiên để đọc lại và tiếp tục, hoặc mở cuộc trò chuyện mới.
Danh sách và tin nhắn phân trang. Khi tiếp tục phiên thuộc bài khác, giao diện không gửi ngữ cảnh bài đang mở.

## Endpoint

### `GET /api/chat/sessions?page=0`

Trả trang 20 phiên của tài khoản hiện tại, mới hoạt động gần đây nhất trước. Mỗi phiên có `id`, `title`, `lessonId`,
`createdAt`, `updatedAt`; kết quả trang có `content`, `last`, `totalElements`.

### `GET /api/chat/sessions/{sessionId}/messages?page=0`

Trả trang 50 tin của phiên, mới nhất trước; giao diện đảo thứ tự để đọc từ cũ tới mới. Tin trả về có cùng cấu trúc
`ChatMessageResponse` như khi gửi, gồm nguồn nếu có. Phiên của tài khoản khác trả `404`.

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
  "content": "<p>Thì hiện tại hoàn thành dùng <strong>has/have + V3</strong>.</p><ul><li>Dấu hiệu: <em>for</em>, <em>since</em>.</li></ul>",
  "createdAt": "2026-09-26T02:03:00Z",
  "sources": [ { "title": "Ngữ pháp: thì hiện tại hoàn thành" } ]
}
```

- Server lưu cả tin của người học (`role = 'user'`) và tin trả lời (`'assistant'`, kèm `provider`, `model_name`, số token).
  `sources`: các `knowledge_chunks` đã dùng (bảng `chat_message_sources`), có thể `[]`.
- `content` là HTML fragment giới hạn; giao diện chỉ dựng các thẻ được phép, không đưa trực tiếp HTML vào DOM.
  Các câu trả lời Markdown đã lưu trước đây vẫn đọc được.
- `404`: phiên không tồn tại hoặc của người khác. `400`: nội dung rỗng hoặc quá dài. `429`: gửi quá nhanh (nếu backend có
  giới hạn). `503`: dịch vụ AI lỗi hoặc quá thời gian (ngoại lệ B4, giao diện báo "không thể trả lời lúc này, thử lại
  sau" và cho gửi lại). Giao diện chờ tối đa 60 giây; backend nên tự cắt ở khoảng 30 giây.

## Ngữ cảnh cho AI (việc của backend)

Nghiệp vụ B4: chat "mang ngữ cảnh bài tập đang làm (câu hỏi, đáp án của người học)". Giao diện chỉ gửi **id**, server tự
tra nội dung:

- `questionId`: đề, các lựa chọn, đáp án đúng, giải thích (`exercise_questions`, `question_options`, …). Câu hỏi về bài
  đọc (02/10): kèm bài đọc (`reading_passages`). Câu viết (02/10): dạng câu, phần mở đầu cho sẵn, các câu trả lời mẫu
  (`question_sample_answers`).
- `attemptId` + `questionId`: câu trả lời của người học trong lượt đó (`question_responses`), nếu đã trả lời; với câu
  viết đã chấm thì kèm điểm và nhận xét của AI (`ai_feedback`). Câu viết chưa trả lời thì chỉ gợi ý, không đưa câu mẫu.
- `pronunciationItemId` + `attemptId`: câu mẫu, IPA và kết quả chấm gần nhất (`pronunciation_attempts`).
- `sessionId`: các tin trước trong phiên (giới hạn vài tin gần nhất để tiết kiệm token).

Vì sao chỉ gửi id: nội dung lấy từ DB nên đúng và không bị người dùng sửa, request nhỏ, và server quyết định được **khi
nào được lộ đáp án**. Gợi ý cho system prompt: nếu người học **chưa** trả lời câu đó thì chỉ gợi ý hướng suy nghĩ, không
nói đáp án; đã trả lời rồi thì giải thích đầy đủ. Trả lời bằng tiếng Việt, ví dụ bằng tiếng Anh. Kiểm tra quyền: lượt
làm bài phải thuộc người đang hỏi.
