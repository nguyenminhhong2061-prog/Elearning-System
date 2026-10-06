# API khu quản trị (module E: Admin) — contract

> Trạng thái: **đề xuất.** Giao diện khu quản trị (`/admin/*`) do Hồng làm theo tài liệu này và theo bản thiết kế
> https://claude.ai/artifact/5j4yHRcqMEqqMHGJdnCTRm, chạy trước với dữ liệu giả (`npm run dev:mock`). Kịch bản nghiệp vụ
> là mục VI (kịch bản 19–26) của `docs/English Learning System/Analysis/Scenarios.md`. Nhóm đã chốt demo không cần Admin,
> nên backend làm sau demo.
>
> **Đã bỏ (03/10/2026):** trang và API quản lý trò chơi (`/api/admin/games`). Business model ghi admin không cần quản lý
> trò chơi, quy tắc 6 của kịch bản cố định tham số ván chơi, và từ bản 2 của `games.md` ván chơi lấy thẳng từ vựng của chủ
> đề, không còn ngân hàng câu hỏi để đồng bộ.
>
> Backend chia theo module sở hữu dữ liệu:
>
> | Phần | Backend | Tình trạng |
> |---|---|---|
> | Chủ đề, từ vựng | Hồng (module A `vocabulary`) | **Đã làm** (05/10/2026): `/api/admin/topics`, `/api/admin/vocabulary`, `/api/admin/vocabulary/{id}/test-question` và các luật mới (ẩn từ đang được dùng, chặn trùng, chặn xóa chủ đề còn từ). Chưa làm: `/api/admin/media`. `questionCount`, `openTests` luôn `0`, `[]` cho đến khi module C cài `common.test.WordQuestionLookup` |
> | Người dùng | Hồng (module `user`) | Đề xuất |
> | Bài tập | Đạt (module B `exercise`) | Đề xuất |
> | Đề kiểm tra | Nhân (module C `test`) | Đề xuất |
> | Thống kê | Chưa có người (cần số liệu của mọi module) | Đề xuất |

Mọi endpoint dưới đây cần đăng nhập bằng tài khoản **admin** (`@PreAuthorize("hasRole('ADMIN')")`); người học nhận
`403`. Lỗi dùng định dạng chung `{ "timestamp": "...", "status": 400, "message": "..." }`; giao diện không hiện
`message` tiếng Anh cho người dùng mà dựa vào mã lỗi. Enum trong JSON viết **chữ hoa**, ngày dạng `YYYY-MM-DD` theo giờ
Việt Nam, thời điểm dạng ISO-8601 UTC. Danh sách phân trang dùng `PageResponse` chung
(`items`, `page`, `size`, `totalItems`, `totalPages`; `page` từ 0).

## Kịch bản và màn hình

| Kịch bản | Màn hình (`/admin/...`) | API |
|---|---|---|
| 26 Xem thống kê | `/admin` Tổng quan | `GET /api/admin/stats` |
| 19 Sửa từ, 20 Thêm từ | `/admin/vocabulary`, `/admin/vocabulary/topics/{id}` (ngăn kéo sửa/thêm) | `GET /api/admin/topics`, `GET /api/admin/vocabulary`, `POST`/`PUT /api/vocabulary`, `POST /api/admin/media` |
| 21 Xóa từ | Hộp thoại xóa trong bảng từ | `DELETE /api/vocabulary/{id}` |
| 22 Quản lý chủ đề | Hộp thoại chủ đề, chặn xóa chủ đề còn từ | `POST`/`PUT`/`DELETE /api/topics` |
| 23 Quản lý bài tập | `/admin/lessons`, `/admin/lessons/{id}`, `/admin/lessons/new` | `/api/admin/lessons` |
| 24 Quản lý đề kiểm tra | `/admin/tests`, `/admin/tests/{id}` | `/api/admin/tests` |
| 25 Quản lý người dùng | `/admin/users`, `/admin/users/{id}` | `/api/admin/users` |

## Tổng quan

### `GET /api/admin/stats?from=2026-08-31&to=2026-09-29`

Cả hai tham số bắt buộc; giao diện tính sẵn cho "7 ngày", "30 ngày" (mặc định), "90 ngày" và cho khoảng tự chọn.
`from` sau `to`, hoặc khoảng dài hơn 366 ngày → `400`.

```json
{
  "from": "2026-08-31",
  "to": "2026-09-29",
  "generatedAt": "2026-09-29T03:30:00Z",
  "learners": { "total": 128, "newInPeriod": 12 },
  "activeLearners": 115,
  "reviews": 4812,
  "exerciseAttempts": 469,
  "testsSubmitted": 96,
  "dailyActive": [{ "date": "2026-08-31", "count": 18 }],
  "levels": { "A1": 22, "A2": 31, "B1": 38, "B2": 19, "C1": 6, "C2": 2, "NONE": 10 },
  "topContent": [
    { "type": "TOPIC", "id": 2, "name": "Du lịch", "skill": null, "attemptCount": 1606, "learnerCount": 61 },
    { "type": "EXERCISE", "id": 23, "name": "Thì hiện tại hoàn thành", "skill": "READING", "attemptCount": 118, "learnerCount": 52 },
    { "type": "TEST", "id": 200, "name": "Kiểm tra tổng hợp tháng 9", "skill": null, "attemptCount": 15, "learnerCount": 14 }
  ],
  "attention": {
    "wordsMissingAudio": 180,
    "wordsMissingExample": 48,
    "lessonsWithIssues": [{ "lessonId": 2, "title": "Hội thoại tại sân bay", "skill": "LISTENING", "issue": "MISSING_AUDIO" }],
    "periodicTestGap": { "weekStart": "2026-10-04", "weekEnd": "2026-10-10" },
    "lockedUsers": 3
  }
}
```

| Trường | Ý nghĩa, nguồn |
|---|---|
| `learners.total` | Số tài khoản người học đến ngày `to`; `newInPeriod` là số đăng ký trong kỳ (`users.created_at`) |
| `activeLearners` | Số người học có **ít nhất một ngày học trong kỳ** (`user_progress`, module D), thẻ "Hoạt động trong kỳ" (KB 26 bước 4; `SystemStat.activeUsers` của thiết kế) |
| `reviews` | Số lượt đánh giá thẻ trong kỳ (`vocabulary_reviews`, module A) |
| `exerciseAttempts` | Số lượt làm bài tập bắt đầu trong kỳ, mọi trạng thái, cả bốn kỹ năng (module B), thẻ "Lượt làm bài tập" (`SystemStat.exerciseAttemptCount`) |
| `testsSubmitted` | Số bài kiểm tra đã nộp trong kỳ (module C) |
| `dailyActive` | Mỗi ngày trong kỳ một phần tử, kể cả ngày 0 người |
| `levels` | Đếm theo `users.current_level` của người học hiện có; `NONE` là chưa có trình độ |
| `topContent` | Bảng "Nội dung được học nhiều nhất" (`ContentStat` của thiết kế): tối đa 5 dòng gộp chủ đề, bài tập, đề kiểm tra, giảm dần theo `learnerCount` rồi `attemptCount`. `type`: `TOPIC` (lượt = lượt ôn từ của chủ đề, người = người ôn ít nhất một từ của chủ đề), `EXERCISE` (lượt làm bắt đầu trong kỳ; `skill` để giao diện ghi "Bài đọc hiểu", "Bài nghe hiểu"…), `TEST` (bài nộp trong kỳ). `skill` là `null` trừ `EXERCISE`. Kỳ không có hoạt động → `[]` |
| `attention` | Việc cần xử lý, không phụ thuộc kỳ. `periodicTestGap` là **tuần tới**: 7 ngày ngay sau ngày đóng của đề định kỳ đã mở gần nhất (đề đang mở hôm nay, không có thì đề vừa đóng), khi chưa có đề định kỳ `VISIBLE` nào mở trong tuần đó; `null` nếu đã có. `lessonsWithIssues[].skill` cho biết bài nghe hay bài phát âm |

## Chủ đề và từ vựng (module A, Hồng)

### `GET /api/admin/topics`

Mọi chủ đề kèm số liệu cho admin (khác `GET /api/topics` của người học: không có số từ người đang gọi đã học).

```json
[{
  "id": 2, "name": "Du lịch", "description": "Sân bay, khách sạn và những chuyến đi.", "imageUrl": null,
  "wordCount": 22, "minLevel": "A1", "maxLevel": "B2",
  "missingAudioCount": 22, "missingExampleCount": 12, "learnerCount": 97,
  "updatedAt": "2026-09-25T03:00:00Z"
}]
```

`wordCount` và các số "thiếu" chỉ tính từ hệ thống chưa ẩn. `learnerCount` là số người học có ít nhất một từ của chủ
đề trong `user_vocabulary`. `minLevel`, `maxLevel` là `null` khi chủ đề chưa có từ. `updatedAt` cần cột mới
`topics.updated_at` (có thể `null`).

### `POST /api/topics`, `PUT /api/topics/{id}` (đã có) — luật mới

Thân `{ "name": "Mua sắm", "description": "Cửa hàng, giá cả, thanh toán", "imageUrl": null }`. **Mới:** tên trùng
một chủ đề khác (không phân biệt hoa thường, sau khi cắt khoảng trắng) → `409`.

### `DELETE /api/topics/{id}` (đã có) — luật mới

**Mới:** chủ đề còn từ (kể cả từ đã ẩn) → `409` với `message` "Topic still has N words"; giao diện đọc `wordCount`
để hiện hộp thoại chặn trước khi gọi.

### `GET /api/admin/vocabulary?topicId=2&q=&level=&missing=&page=0&size=10`

Như `GET /api/vocabulary` (tìm chuỗi con trong từ hoặc nghĩa, sắp A1 → C2 rồi theo chữ cái) nhưng chỉ từ hệ thống
(`created_by IS NULL`) chưa ẩn, và thêm bộ lọc `missing` = `AUDIO`, `EXAMPLE` hoặc `IMAGE`. `size` mặc định 10,
tối đa 50.

```json
{
  "items": [{
    "id": 105, "topicId": 2, "word": "luggage", "phonetic": "/ˈlʌɡɪdʒ/", "meaning": "hành lý",
    "exampleSentence": null, "audioUrl": null, "imageUrl": null, "difficultyLevel": "A2",
    "learnerCount": 14, "listCount": 3, "questionCount": 0, "openTests": [], "updatedAt": "2026-09-25T03:00:00Z"
  }],
  "page": 0, "size": 10, "totalItems": 22, "totalPages": 3
}
```

`learnerCount`: số người học có từ này trong `user_vocabulary`. `listCount`: số danh sách riêng chứa từ.
`questionCount`: số câu hỏi đề kiểm tra tạo từ từ này (`test_questions.vocabulary_id`), cột "Câu hỏi tham chiếu" (KB 21
bước 4). `openTests`: các đề **đang mở** trong số đó, `[{ "id": 100, "title": "Kiểm tra định kỳ — tuần 40" }]`, để hộp
thoại xóa nêu tên đề (KB 21 nhánh 6b).

### `POST /api/vocabulary`, `PUT /api/vocabulary/{id}` (đã có) — luật mới

Thân như hiện tại: `topicId`, `word`, `phonetic`, `meaning`, `exampleSentence`, `audioUrl`, `imageUrl`,
`difficultyLevel`. **Mới:** cùng chủ đề đã có từ này (không phân biệt hoa thường) → `409`. Thêm từ mới trả `201`.

### `DELETE /api/vocabulary/{id}` (đã có) — đổi cách trả lời

Từ đã có người học, nằm trong danh sách riêng hoặc có câu hỏi kiểm tra tham chiếu thì **ẩn** (`status` = `HIDDEN`, như
`tbl_vocabulary.status` của thiết kế; giao diện admin gọi là "Lưu trữ"): không còn xuất hiện trong phiên học, phiên ôn
(kể cả khi đến hạn), trò chơi, tìm kiếm, danh sách riêng của người học và danh sách admin (chi tiết ở mục "Từ bị admin ẩn"
của `learning.md`); trạng thái học, lượt ôn cũ và nội dung câu hỏi kiểm tra giữ nguyên. Từ chưa ai dùng thì xóa hẳn.

`200` `{ "result": "HIDDEN" }` hoặc `{ "result": "DELETED" }`. Từ đã ẩn: sửa hoặc xóa lại → `404`.

### `POST /api/admin/media?kind=AUDIO|IMAGE`

Tải file audio hoặc ảnh cho từ, chủ đề, bài nghe. Thân là **nguyên file** (không multipart), `Content-Type` là loại file
(`audio/mpeg`, `audio/wav`, `image/png`, `image/jpeg`, `image/webp`). Audio tối đa 10 MB, ảnh tối đa 2 MB; sai loại hoặc
quá lớn → `400`. Trả `201` `{ "url": "/media/uploads/5f1c….mp3" }`; đường dẫn này `permitAll` như `/media/**` hiện có.

## Bài tập (module B, Đạt)

Bốn kỹ năng như `docs/api/exercises.md` (02/10/2026): `READING` (Đọc hiểu), `WRITING` (Viết), `LISTENING` (Nghe hiểu),
`PRONUNCIATION` (Phát âm). Không còn `GRAMMAR`.

### `GET /api/admin/lessons`

Mọi bài (không phân trang, số bài nhỏ), giao diện tự lọc theo kỹ năng, trạng thái, trình độ, tên.

```json
[{
  "id": 20, "title": "A trip to Ha Long Bay", "skill": "READING", "cefrLevel": "A2", "difficulty": "MEDIUM",
  "status": "PUBLISHED", "questionCount": 8, "passageCount": 1, "segmentCount": 0, "itemCount": 0, "attempts": 40,
  "updatedAt": "2026-09-27T12:00:00Z", "issues": []
}]
```

`status`: `DRAFT`, `PUBLISHED`, `HIDDEN` (`exercise_lessons.publication_status`, như `tbl_exercise_lesson.status`; giao
diện ghi `HIDDEN` là "Lưu trữ"). `passageCount`: số bài đọc (cột "Nội dung" của KB 23 bước 2). `issues`: `MISSING_AUDIO`
(bài nghe không có file âm thanh), `INCOMPLETE_ITEMS` (bài phát âm có câu mẫu thiếu phiên âm hoặc âm thanh mẫu),
`NO_QUESTIONS` (không có câu hỏi hoặc câu mẫu).

### `GET /api/admin/lessons/{id}`

```json
{
  "id": 20, "title": "A trip to Ha Long Bay", "description": "…", "topic": "Du lịch",
  "skill": "READING", "cefrLevel": "A2", "difficulty": "MEDIUM", "estimatedMinutes": 10, "status": "PUBLISHED",
  "attempts": 40, "updatedAt": "…", "issues": [],
  "readingPassages": [{ "id": 71, "title": "A trip to Ha Long Bay", "content": "Last summer, …\n\nOn the second day, …" }],
  "questions": [{
    "id": 201, "type": "MULTIPLE_CHOICE", "prompt": "How did they travel to Ha Long?",
    "hint": null, "explanation": "…", "points": 1,
    "options": [{ "id": 2011, "text": "By bus", "correct": true }, { "id": 2012, "text": "By train", "correct": false }],
    "acceptedAnswers": [], "passageId": 71, "starter": null, "sampleAnswers": []
  }],
  "passage": null,
  "pronunciationItems": []
}
```

| Kỹ năng | Phần riêng | Loại câu hỏi |
|---|---|---|
| `READING` | `readingPassages`: nhiều bài đọc (tiêu đề, nội dung; các đoạn cách nhau bằng dòng trống). Câu hỏi về bài đọc có `passageId`, câu ngữ pháp thì `null` | `MULTIPLE_CHOICE`, `FILL_BLANK` |
| `WRITING` | Không | `TRANSLATION`, `REWRITE` (có `starter`: phần mở đầu cho sẵn, có thể `null`), `KEYWORD_SENTENCE`; mỗi câu có `sampleAnswers` (AI chấm dựa vào đề và các câu mẫu) |
| `LISTENING` | `passage`: **đúng một** bài nghe (`UNIQUE(lesson_id)` như `tbl_listening_passage`) | `MULTIPLE_CHOICE`, `FILL_BLANK` |
| `PRONUNCIATION` | `pronunciationItems` thay cho câu hỏi | Không |

Bài nghe có `passage`: `{ "audioUrl": "/media/listening/airport.mp3", "audioMissing": true, "durationMs": 18000,
"transcript": "…", "translation": "…", "segments": [{ "id": 11, "startMs": 0, "endMs": 8500, "speaker": "Nhân viên",
"text": "…", "translation": "…" }] }`. Bài phát âm có `pronunciationItems`: `[{ "id": 1, "text": "worked", "ipa": "/wɜːkt/",
"audioUrl": "/media/pronunciation/worked.mp3", "notes": "Sau âm vô thanh /k/, -ed đọc là /t/." }]`.

### `POST /api/admin/lessons`, `PUT /api/admin/lessons/{id}`

Thân như `GET` ở trên, bỏ các trường chỉ đọc (`id` của bài, `attempts`, `updatedAt`, `issues`, `audioMissing`); bài
đọc, câu hỏi, lựa chọn, đoạn, câu mẫu mới không có `id`. **Câu hỏi trỏ tới bài đọc bằng `passageIndex`** (vị trí trong
`readingPassages` của chính thân yêu cầu, từ 0) thay cho `passageId`, vì bài đọc mới chưa có id; nhờ vậy câu hỏi chỉ trỏ
được tới bài đọc của chính bài học (KB 23 bước 12). `POST` trả `201`. Kiểm tra (sai → `400`):

- Tiêu đề 1–150 ký tự, trình độ bắt buộc, kỹ năng là một trong bốn giá trị trên và không đổi khi `PUT`.
- **Bài mới được tạo ở `DRAFT` hoặc `PUBLISHED`** (KB 23 bước 11); `HIDDEN` chỉ có khi sửa hoặc khi xóa bài đã có
  lượt làm.
- `PUBLISHED` cần ít nhất một câu hỏi (bài phát âm: một câu mẫu); bài nghe xuất bản cần file âm thanh và transcript.
- Mỗi bài đọc có tiêu đề và nội dung; `passageIndex` (nếu có) trỏ tới một bài đọc có trong thân, chỉ ở `READING`.
- Loại câu hỏi đúng với kỹ năng (bảng trên). Trắc nghiệm: 2–6 lựa chọn, đúng một lựa chọn `correct`. Điền từ: ít
  nhất một đáp án chấp nhận. Câu viết: ít nhất một câu trả lời mẫu.
- Câu mẫu phát âm: `text`, `ipa`, `audioUrl` đều bắt buộc (KB 23 nhánh 3c); `notes` không bắt buộc.
- Sửa bài đang có lượt làm: lượt đã nộp giữ nguyên điểm; chỉ lượt làm mới dùng nội dung mới.

### `DELETE /api/admin/lessons/{id}`

Gọi từ nút "Xóa" ở mỗi dòng của bảng hoặc trong trang bài. Bài đã có lượt làm → chuyển `HIDDEN`; chưa có → xóa hẳn.
Trả `{ "result": "HIDDEN" | "DELETED" }`.

## Đề kiểm tra (module C, Nhân)

Theo `tbl_test`, `tbl_test_material`, `tbl_question` của thiết kế (KB 24).

### `GET /api/admin/tests`

```json
[{
  "id": 100, "title": "Kiểm tra định kỳ — tuần 40", "type": "PERIODIC", "skillText": "Từ vựng và ngữ pháp",
  "startDate": "2026-09-26", "endDate": "2026-10-03", "status": "VISIBLE", "phase": "OPEN",
  "questionCount": 6, "skills": ["READING", "WRITING"], "submissions": 28, "averageScore": 72
}]
```

- `status` (lưu trong DB, `TestStatus` của thiết kế): `DRAFT` (nháp, người học chưa thấy), `VISIBLE` (mở theo lịch),
  `HIDDEN` (đã ẩn, xem `DELETE`). Thay cho cột `tests.draft` mà bản trước đề xuất.
- `phase` (tính theo ngày mở, ngày đóng, giờ Việt Nam, cho mọi đề): `UPCOMING`, `OPEN`, `CLOSED`. Giao diện hiện
  "Nháp", "Đã ẩn", hoặc với đề `VISIBLE` thì "Sắp mở", "Đang mở", "Đã đóng".
- **Đề định kỳ và đề tổng hợp đều có `startDate`, `endDate`** (KB 24 nhánh 5a; `tbl_test.open_date`, `close_date`
  `NOT NULL`). Không còn đề tổng hợp "luôn mở".
- `skillText`: nội dung của đề ("Từ vựng và ngữ pháp"), cột `tbl_test.skill` của thiết kế, có thể `null`. `skills` là
  các kỹ năng có câu hỏi trong đề. `averageScore` 0–100, `null` khi chưa có bài nộp.

### `GET /api/admin/tests/{id}`

```json
{
  "id": 200, "title": "Kiểm tra tổng hợp tháng 10/2026", "type": "COMPREHENSIVE", "skillText": "Nghe, nói, đọc, viết",
  "instruction": "Làm lần lượt bốn phần. …", "startDate": "2026-10-01", "endDate": "2026-10-31",
  "status": "VISIBLE", "phase": "OPEN", "submissions": 15, "averageScore": 58, "duplicatedFrom": null,
  "materials": [
    { "id": 801, "type": "LISTENING", "title": "Thông báo ở sân bay", "audioUrl": "/media/tests/801.mp3", "text": null },
    { "id": 802, "type": "READING", "title": "Hanoi", "audioUrl": null, "text": "Hanoi is the capital of Vietnam. …" }
  ],
  "questions": [{
    "id": 2002, "skill": "READING", "type": "MULTIPLE_CHOICE", "points": 2, "audioUrl": null,
    "content": "What is Hanoi known for?", "materialId": 802, "vocabularyId": null,
    "options": [{ "id": 20021, "text": "Its Old Quarter and lake", "correct": true }], "acceptedAnswers": []
  }]
}
```

- `instruction`: hướng dẫn làm bài (`tbl_test.instruction`), có thể `null`.
- `materials`: tài liệu dùng chung cho một phần (`tbl_test_material`): `LISTENING` có `audioUrl` (bắt buộc), `READING`
  có `text` (bắt buộc). Câu hỏi dùng tài liệu có `materialId`; câu nghe không dùng tài liệu chung vẫn có thể có
  `audioUrl` riêng.
- `type` của câu (theo `tbl_question` của thiết kế): `MULTIPLE_CHOICE`, `FILL_BLANK` (thiết kế gọi là `FILL_IN`),
  `SPEAKING`, `ESSAY`; kỹ năng nằm ở `skill`. Bản trước trộn kỹ năng vào `type` (`LISTENING`, `READING`, `WRITING`).
  Kỹ năng và loại đi được với nhau: Nghe, Đọc: trắc nghiệm hoặc điền từ; Viết: trắc nghiệm, điền từ hoặc `ESSAY`; Nói:
  chỉ `SPEAKING`. `SPEAKING`, `ESSAY` do AI chấm theo thang 10 rồi quy ra `points` của câu, không có đáp án.
- `vocabularyId`: từ mà câu hỏi được tạo từ đó (`tbl_question.vocabulary_id`), xem `GET /api/admin/vocabulary/{id}/test-question`.

### `POST /api/admin/tests`, `PUT /api/admin/tests/{id}`

Thân như `GET` (bỏ `id`, `phase`, `skills`, `questionCount`, `submissions`, `averageScore`, `duplicatedFrom`); tài
liệu, câu hỏi, lựa chọn mới không có `id`. `POST` có thêm `type`. **Câu hỏi trỏ tới tài liệu bằng `materialIndex`** (vị
trí trong `materials` của chính thân yêu cầu, từ 0) thay cho `materialId`, vì tài liệu mới chưa có id. `status` khi tạo:
`DRAFT` hoặc `VISIBLE`; khi sửa thêm `HIDDEN`. Kiểm tra (sai → `400`): tiêu đề 1–200 ký tự; ngày mở, ngày đóng bắt buộc,
ngày đóng sau ngày mở; ít nhất một câu hỏi; loại câu đúng với kỹ năng (ở trên); trắc nghiệm đúng một lựa chọn đúng;
điền từ có đáp án chấp nhận; tài liệu nghe có file, tài liệu đọc có nội dung; `materialIndex` trỏ tới tài liệu cùng loại
với kỹ năng của câu; đề tổng hợp cần đủ bốn kỹ năng.

**Đề đã có bài nộp** (KB 24 nhánh 2a) chỉ được đổi tiêu đề, ngày đóng và chuyển giữa `VISIBLE` và `HIDDEN`. Đổi bất kỳ
thứ gì khác, **kể cả lời văn câu hỏi**, `skillText`, `instruction`, tài liệu, hoặc đưa về `DRAFT` → `409`. Bản trước cho
sửa lời văn; nay khóa để điểm của các bài đã nộp luôn khớp với đề.

### `DELETE /api/admin/tests/{id}`

KB 24 nhánh 2b, cùng mẫu với xóa bài tập: đề đã có bài nộp → chuyển `HIDDEN` (người học không thấy đề, lịch sử kiểm tra
giữ nguyên); chưa có → xóa hẳn. Trả `200` `{ "result": "HIDDEN" | "DELETED" }`.

### `POST /api/admin/tests/{id}/duplicate`

Thân `{ "title": "Kiểm tra định kỳ — tuần 41", "startDate": "2026-10-04", "endDate": "2026-10-10" }` (đề tổng hợp cũng
gửi ngày). Tạo đề mới `DRAFT`, chép `skillText`, `instruction`, tài liệu và toàn bộ câu hỏi (không chép bài nộp). Trả
`201` đề mới (dạng `GET` ở trên).

### `GET /api/admin/vocabulary/{id}/test-question`

KB 24 bước 6, nút "Thêm câu hỏi từ kho từ vựng": trả một câu trắc nghiệm **chưa lưu** tạo từ từ đó, giao diện thêm vào
đề rồi lưu cùng đề:

```json
{
  "skill": "READING", "type": "MULTIPLE_CHOICE", "points": 1, "audioUrl": null, "vocabularyId": 356, "materialIndex": null,
  "content": "___ officers checked our bags at the airport.",
  "options": [{ "text": "Customs", "correct": true }, { "text": "Luggage", "correct": false }, { "text": "Departure", "correct": false }, { "text": "Itinerary", "correct": false }],
  "acceptedAnswers": []
}
```

Đề bài là câu ví dụ của từ với từ đó thay bằng `___` (viết hoa lựa chọn nếu chỗ trống đứng đầu câu); từ không có câu
ví dụ thì hỏi "Which word means “nghĩa”?". Ba lựa chọn nhiễu là ba từ khác (khác chữ, khác nghĩa) cùng chủ đề, chưa ẩn.
Từ không tồn tại hoặc đã ẩn → `404`; chủ đề không đủ ba từ khác → `422`.

## Người dùng (module `user`, Hồng)

### `GET /api/admin/users?q=&status=&level=&sort=NEWEST&page=0&size=10`

Chỉ tài khoản người học. `q` tìm chuỗi con trong họ tên hoặc email (không phân biệt hoa thường). `status`: `ACTIVE`,
`LOCKED`. `level`: `A1`–`C2` hoặc `NONE`. `sort`: `NEWEST` (mặc định, ngày đăng ký mới nhất trước), `RECENT_ACTIVITY`,
`NAME`.

```json
{
  "items": [{
    "id": 1087, "fullName": "Phạm Văn Nam", "email": "nam.pv@gmail.com", "currentLevel": "A2",
    "status": "ACTIVE", "createdAt": "2026-09-15T02:00:00Z", "lastActiveAt": "2026-09-28T16:40:00Z"
  }],
  "page": 0, "size": 10, "totalItems": 1, "totalPages": 1
}
```

`lastActiveAt`: lần cuối có request hoặc đăng nhập (cột mới `users.last_active_at`, cập nhật tối đa mỗi 5 phút), `null` nếu
chưa có.

### `GET /api/admin/users/summary`

`{ "total": 128, "active": 125, "locked": 3 }` cho nhãn bộ lọc trạng thái.

### `GET /api/admin/users/{id}`

```json
{
  "id": 1087, "fullName": "Phạm Văn Nam", "email": "nam.pv@gmail.com", "currentLevel": "A2", "status": "ACTIVE",
  "createdAt": "2026-09-15T02:00:00Z", "lastActiveAt": "2026-09-28T16:40:00Z",
  "stats": {
    "wordsLearned": 12, "wordsMastered": 0, "streakDays": 0, "lastStudyDate": "2026-09-20",
    "exercisesCompleted": 1, "exerciseAverageScore": 50, "testsSubmitted": 1, "lastTestDate": "2026-09-16",
    "chatSessions": 37, "lastChatDate": "2026-09-28"
  },
  "recentActivity": [{ "at": "2026-09-28T16:40:00Z", "type": "CHAT", "title": "Trò chuyện với trợ lý AI", "detail": "14 tin nhắn" }],
  "levelHistory": [
    { "level": "A2", "changedAt": "2026-09-16T13:05:00Z", "source": "Kiểm tra tổng hợp tháng 9 · 38 điểm" },
    { "level": null, "changedAt": "2026-09-15T02:00:00Z", "source": "Đăng ký tài khoản" }
  ],
  "plan": null
}
```

`stats.chatSessions`: số phiên chat với trợ lý AI (thẻ "Phiên chat", KB 25 bước 6), `lastChatDate` là ngày của phiên gần
nhất hoặc `null`. `recentActivity`: tối đa 5 hoạt động gần nhất, `type` là `REVIEW`, `EXERCISE`, `TEST`, `GAME`, `CHAT`. Trò chuyện chỉ có số
tin nhắn, **không** có nội dung. `plan`: `{ "title": "Đạt B2 trong 3 tháng", "currentWeek": 3, "weekCount": 13,
"status": "ACTIVE" }` hoặc `null`. Không id nào tồn tại, hoặc id là admin → `404`.

### `PATCH /api/admin/users/{id}`

Thân `{ "status": "LOCKED" }` hoặc `{ "status": "ACTIVE" }`. Trả người dùng như `GET /api/admin/users/{id}`. Tài khoản
admin → `403`. **Khóa có hiệu lực ngay:** mọi request của phiên cũ nhận `401` (kiểm tra `users.status` ở mỗi request
hoặc lưu thời điểm khóa và từ chối token cấp trước đó); đăng nhập lại nhận `403` như hiện nay.

## Thay đổi database cần có

| Bảng | Thay đổi | Dùng cho |
|---|---|---|
| `vocabulary` | `status VARCHAR(20) NOT NULL DEFAULT 'visible'` (`visible`/`hidden`, chữ thường như các enum khác của DB hiện tại), `updated_at TIMESTAMPTZ NULL`, chỉ mục unique `(topic_id, lower(btrim(word)))` cho từ hệ thống chưa ẩn — **đã có** (`V202610041000`) | Ẩn thay cho xóa (kịch bản 21), cột "Cập nhật", chặn từ trùng (kịch bản 19, 20); `tbl_vocabulary.status` của thiết kế |
| `exercise_lessons` | giá trị `archived` của `publication_status` đổi thành `hidden` | Cùng tên với thiết kế (`tbl_exercise_lesson.status`) |
| `topics` | `updated_at TIMESTAMPTZ NULL`, chỉ mục unique `lower(btrim(name))` — **đã có** (`V202610041000`) | Cột "Cập nhật", chặn tên trùng (kịch bản 22) |
| `tests` | Mới: `status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'` (`DRAFT`/`VISIBLE`/`HIDDEN`, chữ hoa như `tests.type`), `instruction TEXT NULL`. Đã có `skill VARCHAR(100)` (dùng cho `skillText`; thiết kế để 200). `start_date`, `end_date` thành `NOT NULL` cho cả đề tổng hợp | Trạng thái, ẩn đề, hướng dẫn (KB 24); như `tbl_test` |
| `test_materials` (mới) | `id`, `test_id → tests ON DELETE CASCADE`, `type` (`LISTENING`/`READING`), `title`, `audio_url`, `text`; CHECK nghe có audio, đọc có text | Tài liệu dùng chung (KB 24 nhánh 5a); như `tbl_test_material` |
| `test_questions` | `material_id BIGINT NULL → test_materials`; `question_type` còn `MULTIPLE_CHOICE`, `FILL_BLANK`, `SPEAKING`, `ESSAY`: chuyển `LISTENING`, `READING` → `MULTIPLE_CHOICE` (hoặc `FILL_BLANK` nếu không có lựa chọn), `WRITING` → `FILL_BLANK` nếu có đáp án chấp nhận, không thì `ESSAY`; kỹ năng đã nằm ở cột `skill` | Loại câu theo thiết kế |
| `users` | `last_active_at TIMESTAMPTZ NULL` | "Hoạt động gần nhất" |

## Câu hỏi mở

1. Ai làm backend thống kê (`/api/admin/stats`) khi số liệu nằm ở cả bốn module? Đề xuất: mỗi module mở một hàm service
   trả số liệu của mình theo khoảng ngày, một service ở `common` hoặc module `user` gộp lại.
2. Nhóm có muốn giữ `DELETE` trả `200` kèm `result`, hay tách thành `POST .../archive` và `DELETE`?
3. File tải lên lưu ở đâu khi deploy (ổ đĩa của container sẽ mất khi khởi động lại)? Đề xuất: bảng `media_files` lưu
   nội dung trong Postgres cho demo, hoặc dịch vụ lưu trữ ngoài.

## Thay đổi theo tài liệu thiết kế (04/10/2026)

Đối chiếu với `Analysis/Scenarios.md` (KB 19–26) và `Design/schema.sql`:

- **Ẩn thay cho lưu trữ:** từ vựng và bài tập dùng giá trị `HIDDEN` như thiết kế (trước là `ARCHIVED` và cột
  `vocabulary.archived_at`); `DELETE` trả `{ "result": "HIDDEN" | "DELETED" }`. Giao diện vẫn ghi "Lưu trữ".
- **Tổng quan (KB 26):** `activeToday` → `activeLearners` (người học có ít nhất một ngày học trong kỳ),
  `exercisesCompleted` → `exerciseAttempts` (lượt làm bài tập), `topTopics` + `topLessons` → `topContent` (gộp cả đề
  kiểm tra, sắp theo số người học).
- **Người dùng (KB 25):** `stats` thêm `chatSessions`, `lastChatDate` cho thẻ "Phiên chat".
- **Từ vựng (KB 21):** `questionCount`, `openTests` cho mỗi từ; từ có câu hỏi tham chiếu cũng chỉ bị ẩn; từ ẩn ra khỏi
  cả phiên ôn từ đến hạn.
- **Đề kiểm tra (KB 24):** `status` `DRAFT`/`VISIBLE`/`HIDDEN` + `phase` thay `draft` và trạng thái tính sẵn; `DELETE`
  (ẩn hoặc xóa); `skillText`, `instruction`; đề tổng hợp có ngày; `materials` + `materialIndex`/`materialId`; loại câu
  `MULTIPLE_CHOICE`/`FILL_BLANK`/`SPEAKING`/`ESSAY` tách khỏi kỹ năng; khóa cả lời văn khi đã có bài nộp;
  `GET /api/admin/vocabulary/{id}/test-question`; AI chấm theo thang 10.
- **Bài tập (KB 23):** kỹ năng `READING`, `WRITING` thay `GRAMMAR`; `readingPassages` và `passageIndex`/`passageId`; câu
  viết `TRANSLATION`/`REWRITE`/`KEYWORD_SENTENCE` với `starter`, `sampleAnswers`; bài mới được tạo ở `PUBLISHED`; câu mẫu
  phát âm bắt buộc IPA và âm thanh mẫu (`issues` thêm `INCOMPLETE_ITEMS`); `passageCount` trong danh sách; xóa ngay ở
  từng dòng. Bảng và cột mới cho đọc hiểu, viết đã ghi ở mục cuối `exercises.md`.
