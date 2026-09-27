# API kiểm tra (module C: C1 kiểm tra định kỳ, C2 kiểm tra tổng hợp) — contract

> Trạng thái: **chốt cho module C.** Backend và frontend cùng làm theo tài liệu này. Quy ước chung (xác thực, lỗi,
> enum) giống `docs/api/vocabulary.md` và `docs/api/exercises.md`. Các luật nghiệp vụ về CEFR và kỹ năng đã chốt với
> chủ module D, xem `docs/api/progress.md` (mục "Gợi ý giải pháp"): quy đổi CEFR theo ngưỡng EF SET, tổng = trung bình
> 4 kỹ năng, chỉ bài tổng hợp đổi trình độ, cho phép giảm trình độ.

Mọi endpoint cần đăng nhập (`Authorization: Bearer <token>`) và chỉ trả dữ liệu của **người đang gọi** (`userId` lấy
qua `common.security.CurrentUser`). Lỗi dùng định dạng chung `{ "timestamp": "...", "status": 400, "message": "..." }`.
Dùng các bảng có sẵn trong `V1__init.sql`: `tests`, `test_questions`, `test_question_options`, `test_attempts`,
`test_attempt_answers`, cùng bảng mới `test_question_accepted_answers` (xem migration `V...__extend_tests.sql`).

## Khác biệt enum so với phần còn lại của hệ thống

Các cột `CHECK` của bảng `tests*` trong `V1__init.sql` lưu giá trị **chữ HOA** (khác các module khác lưu chữ thường).
Vì vậy entity của module này dùng `@Enumerated(EnumType.STRING)`, JSON trả về cũng viết hoa:

| Trường | Giá trị JSON (= cột DB) |
|---|---|
| `tests.type` | `PERIODIC`, `COMPREHENSIVE` |
| `test_questions.question_type` | `MULTIPLE_CHOICE`, `FILL_BLANK`, `LISTENING`, `SPEAKING`, `READING`, `WRITING` |
| `test_attempts.status` | `IN_PROGRESS`, `SUBMITTED`, `GRADED` |
| `skill` của câu hỏi | `LISTENING`, `SPEAKING`, `READING`, `WRITING` (cột `test_questions.skill` lưu chữ thường: `listening`...) |

`tests.skill` là kỹ năng của cả bài (chữ thường, chỉ để tham khảo), `null` với bài tổng hợp.

## Nguyên tắc

- **Server chấm điểm.** Dữ liệu đề gửi xuống trình duyệt **không** chứa đáp án (`is_correct` của lựa chọn,
  `test_question_accepted_answers`, giải thích). Đáp án chỉ trả về trong `review` sau khi nộp bài.
- **Trả lời lưu từng câu, nộp cả bài một lần.** Mỗi câu trả lời được lưu ngay (`PUT .../answers/{questionId}`) để người
  học làm tiếp được sau khi rời trang; điểm chỉ được tính khi nộp (`POST .../submit`). Câu không trả lời tính 0 điểm.
- **Một người có tối đa một lượt `IN_PROGRESS` cho mỗi bài.** Bắt đầu bài trả về chính lượt đó nếu còn đang dở
  (`resumed: true`), ngược lại tạo lượt mới. `?restart=true` xóa lượt đang dở và tạo lượt mới (làm lại từ đầu).
- **Chấm tự động ngay các loại khách quan** (`MULTIPLE_CHOICE`, `FILL_BLANK`, `LISTENING`, `READING`) khi nộp bài.
  **`SPEAKING`, `WRITING` do AI chấm**, có thể xong ngay (khi backend có provider/fallback chấm được) hoặc để "đang
  chấm" (ngoại lệ C2: kết quả sẽ có sau). Khi còn kỹ năng chưa chấm, `status = 'SUBMITTED'`; chấm xong hết thì
  `'GRADED'`.
- **Chỉ bài `COMPREHENSIVE` đổi trình độ** người học (ghi `users.current_level` + `user_level_history`). Bài
  `PERIODIC` chỉ đo tiến bộ, `suggested_level` chỉ để hiển thị.
- **Đề đang mở** (`start_date IS NULL OR start_date <= now`) và (`end_date IS NULL OR now <= end_date`) mới hiện với
  người học. Đề khác trả `404`.

## Ánh xạ loại câu hỏi sang kỹ năng

`test_questions.skill` ghi rõ kỹ năng (1 trong 4) mà điểm câu đó cộng vào; nếu `null` thì suy ra từ `question_type`:

| `question_type` | `skill` mặc định | Cách trả lời / chấm |
|---|---|---|
| `MULTIPLE_CHOICE` | `READING` | chọn 1 lựa chọn (`selected_option_id`), chấm tự động |
| `FILL_BLANK` | `WRITING` | gõ đáp án ngắn, so khớp `test_question_accepted_answers` |
| `LISTENING` | `LISTENING` | nghe `audioUrl` rồi chọn 1 lựa chọn, chấm tự động |
| `READING` | `READING` | đọc đoạn trong `content`, chọn lựa chọn (hoặc gõ) |
| `SPEAKING` | `SPEAKING` | đọc câu mẫu `content`, thu âm (hoặc gõ văn bản dự kiến), AI chấm |
| `WRITING` | `WRITING` | viết đoạn, chấm bằng đáp án chấp nhận (nếu có) hoặc AI |

So khớp câu điền từ / viết ngắn: cắt khoảng trắng đầu cuối, gộp khoảng trắng liên tiếp, chữ thường, đổi dấu nháy cong
`’` thành `'`, rồi so với `normalized_answer` của mọi đáp án chấp nhận (giống `docs/api/exercises.md`).

## Danh sách đề

### `GET /api/tests`

Không phân trang (chỉ vài chục đề). Trả các đề đang mở, sắp theo `start_date` (rỗng trước) rồi `id`.

```json
[
  {
    "id": 1,
    "title": "Kiểm tra tổng hợp tháng 9",
    "type": "COMPREHENSIVE",
    "skill": null,
    "startDate": null,
    "endDate": null,
    "questionCount": 20,
    "progress": {
      "attemptCount": 1,
      "bestScorePercent": 62,
      "lastCompletedAt": "2026-09-20T08:30:00Z",
      "inProgress": { "attemptId": 9, "answeredCount": 5, "lastActivityAt": "2026-09-27T14:10:00Z" }
    }
  }
]
```

| Trường | Ý nghĩa |
|---|---|
| `questionCount` | Số câu hỏi của đề |
| `progress` | Của **người dùng hiện tại**. `attemptCount`, `bestScorePercent`, `lastCompletedAt` chỉ tính lượt `GRADED` (hoặc `SUBMITTED`); `0`, `null`, `null` khi chưa làm lần nào |
| `progress.inProgress` | Lượt đang dở (`IN_PROGRESS`) của bài này, `null` nếu không có. `answeredCount`: số câu đã trả lời |

## Nội dung một đề

### `GET /api/tests/{testId}`

```json
{
  "id": 1,
  "title": "Kiểm tra tổng hợp tháng 9",
  "type": "COMPREHENSIVE",
  "skill": null,
  "startDate": null,
  "endDate": null,
  "questions": [
    {
      "id": 11,
      "type": "MULTIPLE_CHOICE",
      "skill": "READING",
      "content": "Choose the word that best fits: She ___ (live) in Hanoi for five years.",
      "points": 1,
      "audioUrl": null,
      "options": [ { "id": 101, "content": "lives" }, { "id": 102, "content": "has lived" } ]
    },
    { "id": 12, "type": "FILL_BLANK", "skill": "WRITING", "content": "I have never ___ (see) such a beach.", "points": 1, "audioUrl": null, "options": [] },
    { "id": 13, "type": "SPEAKING", "skill": "SPEAKING", "content": "Sustainability is a shared responsibility.", "points": 5, "audioUrl": null, "options": [] }
  ],
  "hasInProgress": true
}
```

- `questions` theo `id`. **Không** có `is_correct`, đáp án chấp nhận hay lời giải. `points` là số nguyên.
- `audioUrl` (`test_questions.audio_url`): chỉ `LISTENING` dùng; `null` với loại khác. Phát được bằng thẻ `<audio>`.
- `content` của `READING` chứa cả đoạn đọc và câu hỏi; của `SPEAKING` là câu mẫu cần đọc; của `WRITING` là đề viết.
- `options` rỗng với `FILL_BLANK`, `SPEAKING`, `WRITING`.
- `hasInProgress`: có lượt đang dở để giao diện biết bấm "Bắt đầu" là làm tiếp hay làm mới.

## Lượt làm bài

### `POST /api/tests/{testId}/attempts` — bắt đầu hoặc làm tiếp

Không có body. `?restart=true` xóa lượt đang dở (nếu có) và tạo lượt mới.

- Có lượt `IN_PROGRESS` và không `restart`: trả `200` với chính lượt đó, `resumed: true`.
- Ngược lại: tạo lượt mới, trả `201`, `resumed: false`.

```json
{
  "attemptId": 9,
  "resumed": true,
  "status": "IN_PROGRESS",
  "answers": [
    { "questionId": 11, "optionId": 102, "text": null },
    { "questionId": 12, "optionId": null, "text": "seen" }
  ]
}
```

`answers`: các câu đã trả lời trong lượt (để làm tiếp). Lượt mới: `[]`.

### `PUT /api/test-attempts/{attemptId}/answers/{questionId}` — lưu một câu trả lời

Body là **một trong hai** dạng (gửi đúng theo loại câu):

```json
{ "optionId": 102 }
```

hoặc với `FILL_BLANK`, `WRITING`, `SPEAKING`:

```json
{ "text": "has lived" }
```

`text`: 1 đến 5000 ký tự (bài viết dài), đã cắt khoảng trắng. Ghi đè nếu đã trả lời. Trả `204`.

- `400` nếu câu hỏi không thuộc bài, gửi cả hai/không gửi `optionId`/`text`, hoặc `optionId` không thuộc câu hỏi.
- `404` nếu lượt không tồn tại hoặc thuộc người khác. `409` nếu lượt không còn `IN_PROGRESS` (đã nộp).

### `POST /api/test-attempts/{attemptId}/submit` — nộp bài

Không có body (mọi câu đã lưu bằng `PUT`). Chấm các câu đã trả lời, câu chưa trả lời tính 0 điểm; đặt
`submitted_at = now()`; nếu không còn kỹ năng chờ AI thì `status = 'GRADED'`, ngược lại `'SUBMITTED'`. Trả `200` cùng
dạng `GET /api/test-attempts/{attemptId}` (kết quả). Nộp lại lượt đã nộp trả `409`.

### `GET /api/test-attempts/{attemptId}` — kết quả

```json
{
  "attemptId": 9,
  "testId": 1,
  "title": "Kiểm tra tổng hợp tháng 9",
  "type": "COMPREHENSIVE",
  "status": "GRADED",
  "submittedAt": "2026-09-27T15:00:00Z",
  "correctCount": 15,
  "questionCount": 20,
  "totalPoints": 24,
  "earnedPoints": 20,
  "scorePercent": 83,
  "bestScorePercent": 90,
  "isPersonalBest": false,
  "suggestedLevel": "B2",
  "suggestedRoadmap": "Tập trung luyện Nghe 15 phút/ngày…",
  "skills": {
    "listening": { "score": 56, "level": "B2" },
    "speaking": { "score": null, "level": null },
    "reading": { "score": 48, "level": "B1" },
    "writing": { "score": 42, "level": "B1" }
  },
  "review": [
    { "questionId": 11, "type": "MULTIPLE_CHOICE", "correct": true, "selectedOptionId": 102, "answerText": null,
      "correctOptionId": 102, "correctAnswer": "has lived", "points": 1, "scoreEarned": 1 }
  ]
}
```

| Trường | Ý nghĩa |
|---|---|
| `status` | `SUBMITTED` khi còn kỹ năng đang chờ AI; `GRADED` khi chấm xong hết. Kỹ năng chưa chấm có `score`/`level` là `null` |
| `scorePercent` | Điểm tổng 0–100 = **trung bình các điểm kỹ năng** (trọng số bằng nhau), làm tròn; `null` khi còn kỹ năng đang chờ AI |
| `totalPoints`, `earnedPoints` | Tổng điểm thô của đề và điểm thô đạt được (để hiển thị), `correctCount` là số câu trắc nghiệm/điền từ đúng |
| `bestScorePercent`, `isPersonalBest` | Điểm cao nhất các lượt đã hoàn thành của người này với bài này, tính cả lượt vừa xong; lần đầu là `false` |
| `suggestedLevel` | Quy đổi từ `scorePercent` theo bảng EF SET; `null` khi chưa chấm xong. Với bài `COMPREHENSIVE` đã chấm xong, trình độ này đồng thời được ghi vào `users.current_level` + `user_level_history` |
| `suggestedRoadmap` | Lộ trình đề xuất (tiếng Việt) do backend sinh; `null` khi chưa chấm xong |
| `skills` | Điểm 0–100 (số nguyên) và trình độ theo từng kỹ năng. `reading`/`writing` cũng nhận điểm của các câu ngữ pháp ánh xạ sang (xem `progress.md`) |
| `review` | Mọi câu của đề theo thứ tự; câu không trả lời có `selectedOptionId` và `answerText` đều `null`, `correct: false`, `scoreEarned: 0`. `correctAnswer` là nội dung lựa chọn đúng (trắc nghiệm) hoặc đáp án chính (điền từ). `explanation` không có trong schema test, luôn bỏ qua |

`404` nếu lượt không tồn tại hoặc thuộc người khác.

## Quy đổi điểm sang trình độ (EF SET, cố định)

| Điểm 0–100 | 0–30 | 31–40 | 41–50 | 51–60 | 61–70 | 71–100 |
|---|---|---|---|---|---|---|
| Trình độ | A1 | A2 | B1 | B2 | C1 | C2 |

- Điểm tổng = **trung bình 4 kỹ năng** (trọng số bằng nhau), làm tròn; trình độ tổng tra theo bảng trên, không yêu cầu
  điểm tối thiểu từng kỹ năng.
- `suggested_level` = trình độ tổng. Với bài `PERIODIC` chỉ hiển thị, không ghi vào `users.current_level`.

## Dữ liệu mẫu

Seed bằng migration Flyway (xem `V...__seed_tests.sql`): ít nhất một đề `PERIODIC` (trắc nghiệm + điền từ, chấm xong
ngay) và một đề `COMPREHENSIVE` (đủ 4 kỹ năng, phần Nói/Viết có thể để "đang chấm").

## Việc backend cần làm

1. Entity cho sáu bảng (liên kết bằng id thường), module `modules/test`. Enum `type`, `question_type`, `status` dùng
   `@Enumerated(EnumType.STRING)` (chữ hoa trong DB); `skill` dùng converter chữ thường (`LowercaseEnumConverter`).
2. Chấm điểm là hàm thuần (so khớp đáp án, quy đổi CEFR), dễ viết unit test.
3. `userId` lấy qua `common.security.CurrentUser`. Phát `common.event.TestCompletedEvent` khi nộp bài để module D cập
   nhật `user_progress` (đừng để module khác đọc thẳng bảng).
4. Ghi trình độ qua contract `common.user.LevelRecorder` (do module user cài đặt) — không ghi thẳng bảng `users`.
5. AI chấm Nói/Viết và sinh lộ trình qua interface provider trong module `test`, kèm fallback nội bộ chạy được khi
   chưa cấu hình dịch vụ ngoài. Khóa API đặt bằng biến môi trường, không commit.
