# API khu quản trị (module E: Admin) — contract

> Trạng thái: **đề xuất.** Giao diện khu quản trị (`/admin/*`) do Hồng làm theo tài liệu này và theo bản thiết kế
> https://claude.ai/artifact/5j4yHRcqMEqqMHGJdnCTRm, chạy trước với dữ liệu giả (`npm run dev:mock`). Kịch bản nghiệp vụ
> là mục VI (kịch bản 18–25) của `Scenarios-he-thong.md`. Nhóm đã chốt demo không cần Admin, nên backend làm sau demo.
>
> Backend chia theo module sở hữu dữ liệu:
>
> | Phần | Backend | Tình trạng |
> |---|---|---|
> | Chủ đề, từ vựng, trò chơi | Hồng (module A `vocabulary`) | Thêm/sửa/xóa chủ đề và từ **đã có**; các endpoint `/api/admin/topics`, `/api/admin/vocabulary`, `/api/admin/media`, `/api/admin/games` và luật mới là đề xuất |
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
| 25 Xem thống kê | `/admin` Tổng quan | `GET /api/admin/stats` |
| 18 Sửa từ, 19 Thêm từ | `/admin/vocabulary`, `/admin/vocabulary/topics/{id}` (ngăn kéo sửa/thêm) | `GET /api/admin/topics`, `GET /api/admin/vocabulary`, `POST`/`PUT /api/vocabulary`, `POST /api/admin/media` |
| 20 Xóa từ | Hộp thoại xóa trong bảng từ | `DELETE /api/vocabulary/{id}` |
| 21 Quản lý chủ đề | Hộp thoại chủ đề, chặn xóa chủ đề còn từ | `POST`/`PUT`/`DELETE /api/topics` |
| 19 bước 2 Đồng bộ trò chơi | `/admin/games` | `GET /api/admin/games`, `PUT /api/admin/games/{id}`, `POST /api/admin/games/sync` |
| 22 Quản lý bài tập | `/admin/lessons`, `/admin/lessons/{id}`, `/admin/lessons/new` | `/api/admin/lessons` |
| 23 Quản lý đề kiểm tra | `/admin/tests`, `/admin/tests/{id}` | `/api/admin/tests` |
| 24 Quản lý người dùng | `/admin/users`, `/admin/users/{id}` | `/api/admin/users` |

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
  "activeToday": 37,
  "reviews": 4812,
  "exercisesCompleted": 356,
  "testsSubmitted": 96,
  "dailyActive": [{ "date": "2026-08-31", "count": 18 }],
  "levels": { "A1": 22, "A2": 31, "B1": 38, "B2": 19, "C1": 6, "C2": 2, "NONE": 10 },
  "topTopics": [{ "topicId": 2, "name": "Du lịch", "reviews": 1126 }],
  "topLessons": [{ "lessonId": 1, "title": "Thì hiện tại đơn", "skill": "GRAMMAR", "cefrLevel": "A1", "attempts": 168, "averageScore": 84 }],
  "attention": {
    "wordsMissingAudio": 180,
    "wordsMissingExample": 48,
    "lessonsWithIssues": [{ "lessonId": 2, "title": "Hội thoại tại sân bay", "issue": "MISSING_AUDIO" }],
    "periodicTestGap": { "weekStart": "2026-10-04", "weekEnd": "2026-10-10" },
    "lockedUsers": 3
  }
}
```

| Trường | Ý nghĩa, nguồn |
|---|---|
| `learners.total` | Số tài khoản người học đến ngày `to`; `newInPeriod` là số đăng ký trong kỳ (`users.created_at`) |
| `activeToday` | Số người học có ít nhất một ngày học hôm nay (`user_progress`, module D) |
| `reviews` | Số lượt đánh giá thẻ trong kỳ (`vocabulary_reviews`, module A) |
| `exercisesCompleted`, `testsSubmitted` | Lượt bài tập hoàn thành, bài kiểm tra đã nộp trong kỳ (module B, C) |
| `dailyActive` | Mỗi ngày trong kỳ một phần tử, kể cả ngày 0 người |
| `levels` | Đếm theo `users.current_level` của người học hiện có; `NONE` là chưa có trình độ |
| `topTopics`, `topLessons` | Tối đa 5 dòng, giảm dần theo lượt ôn / lượt làm trong kỳ; `averageScore` 0–100 |
| `attention` | Việc cần xử lý, không phụ thuộc kỳ. `periodicTestGap` là **tuần tới**: 7 ngày ngay sau ngày đóng của đề định kỳ đã mở gần nhất (đề đang mở hôm nay, không có thì đề vừa đóng), khi chưa có đề định kỳ nào (không tính bản nháp) mở trong tuần đó; `null` nếu đã có |

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

`wordCount` và các số "thiếu" chỉ tính từ hệ thống chưa lưu trữ. `learnerCount` là số người học có ít nhất một từ của chủ
đề trong `user_vocabulary`. `minLevel`, `maxLevel` là `null` khi chủ đề chưa có từ. `updatedAt` cần cột mới
`topics.updated_at` (có thể `null`).

### `POST /api/topics`, `PUT /api/topics/{id}` (đã có) — luật mới

Thân `{ "name": "Mua sắm", "description": "Cửa hàng, giá cả, thanh toán", "imageUrl": null }`. **Mới:** tên trùng
một chủ đề khác (không phân biệt hoa thường, sau khi cắt khoảng trắng) → `409`.

### `DELETE /api/topics/{id}` (đã có) — luật mới

**Mới:** chủ đề còn từ (kể cả từ đã lưu trữ) → `409` với `message` "Topic still has N words"; giao diện đọc `wordCount`
để hiện hộp thoại chặn trước khi gọi. Hiện backend vẫn xóa và đặt `topic_id = NULL` cho các từ: phải sửa.

### `GET /api/admin/vocabulary?topicId=2&q=&level=&missing=&page=0&size=10`

Như `GET /api/vocabulary` (tìm chuỗi con trong từ hoặc nghĩa, sắp A1 → C2 rồi theo chữ cái) nhưng chỉ từ hệ thống
(`created_by IS NULL`) chưa lưu trữ, và thêm bộ lọc `missing` = `AUDIO`, `EXAMPLE` hoặc `IMAGE`. `size` mặc định 10,
tối đa 50.

```json
{
  "items": [{
    "id": 105, "topicId": 2, "word": "luggage", "phonetic": "/ˈlʌɡɪdʒ/", "meaning": "hành lý",
    "exampleSentence": null, "audioUrl": null, "imageUrl": null, "difficultyLevel": "A2",
    "learnerCount": 14, "listCount": 3, "updatedAt": "2026-09-25T03:00:00Z"
  }],
  "page": 0, "size": 10, "totalItems": 22, "totalPages": 3
}
```

`learnerCount`: số người học có từ này trong `user_vocabulary`. `listCount`: số danh sách riêng chứa từ.

### `POST /api/vocabulary`, `PUT /api/vocabulary/{id}` (đã có) — luật mới

Thân như hiện tại: `topicId`, `word`, `phonetic`, `meaning`, `exampleSentence`, `audioUrl`, `imageUrl`,
`difficultyLevel`. **Mới:** cùng chủ đề đã có từ này (không phân biệt hoa thường) → `409`. Thêm từ mới trả `201`.

### `DELETE /api/vocabulary/{id}` (đã có) — đổi cách trả lời

Từ đã có người học hoặc nằm trong danh sách riêng thì **lưu trữ** (cột mới `vocabulary.archived_at`): không còn xuất hiện
trong phiên học, trò chơi, tìm kiếm và danh sách admin, tiến độ cũ giữ nguyên. Từ chưa ai dùng thì xóa hẳn.

`200` `{ "result": "ARCHIVED" }` hoặc `{ "result": "DELETED" }`. Hiện backend luôn xóa hẳn và xóa dây chuyền tiến độ học
(`ON DELETE CASCADE`): phải sửa trước khi mở chức năng này.

### `POST /api/admin/media?kind=AUDIO|IMAGE`

Tải file audio hoặc ảnh cho từ, chủ đề, bài nghe. Thân là **nguyên file** (không multipart), `Content-Type` là loại file
(`audio/mpeg`, `audio/wav`, `image/png`, `image/jpeg`, `image/webp`). Audio tối đa 10 MB, ảnh tối đa 2 MB; sai loại hoặc
quá lớn → `400`. Trả `201` `{ "url": "/media/uploads/5f1c….mp3" }`; đường dẫn này `permitAll` như `/media/**` hiện có.

## Trò chơi (module A, Hồng)

### `GET /api/admin/games`

```json
{
  "bank": { "systemWordCount": 180, "coveredWordCount": 180, "lastSyncedAt": "2026-09-25T03:00:00Z" },
  "games": [{
    "id": 1, "name": "Đoán nghĩa", "gameType": "GUESS_MEANING", "questionsPerRound": 10,
    "timeLimitSeconds": 90, "enabled": true, "bankSize": 180, "sessionsLast30Days": 412
  }]
}
```

`coveredWordCount` là số từ hệ thống đã có câu hỏi trong ngân hàng của **mọi** trò chơi.

### `PUT /api/admin/games/{id}`

Thân `{ "enabled": true, "timeLimitSeconds": 90 }`; thời gian 30–600 giây. Cần cột mới `games.enabled`. Trả game như
trên.

### `POST /api/admin/games/sync`

Tạo câu hỏi cho các từ hệ thống chưa có trong ngân hàng (cùng cách sinh như migration seed: 3 đáp án nhiễu cùng chủ
đề). Trả `{ "addedWords": 1, "bank": { … } }`.

## Bài tập (module B, Đạt)

### `GET /api/admin/lessons`

Mọi bài (không phân trang, số bài nhỏ), giao diện tự lọc theo kỹ năng, trạng thái, trình độ, tên.

```json
[{
  "id": 2, "title": "Hội thoại tại sân bay", "skill": "LISTENING", "cefrLevel": "A2", "difficulty": "MEDIUM",
  "status": "PUBLISHED", "questionCount": 2, "segmentCount": 2, "itemCount": 0, "attempts": 112,
  "updatedAt": "2026-09-27T12:00:00Z", "issues": ["MISSING_AUDIO"]
}]
```

`status`: `DRAFT`, `PUBLISHED`, `ARCHIVED` (`exercise_lessons.publication_status`). `issues`: `MISSING_AUDIO` (bài nghe
không có file âm thanh), `NO_QUESTIONS` (không có câu hỏi hoặc mục phát âm).

### `GET /api/admin/lessons/{id}`

```json
{
  "id": 1, "title": "Thì hiện tại đơn", "description": "…", "topic": "Thì của động từ",
  "skill": "GRAMMAR", "cefrLevel": "A1", "difficulty": "EASY", "estimatedMinutes": 5, "status": "PUBLISHED",
  "attempts": 168, "updatedAt": "…", "issues": [],
  "questions": [{
    "id": 101, "type": "MULTIPLE_CHOICE", "prompt": "She ___ to school every day.",
    "hint": "Chủ ngữ ngôi thứ ba số ít.", "explanation": "…", "points": 1,
    "options": [{ "id": 1011, "text": "go", "correct": false }, { "id": 1012, "text": "goes", "correct": true }],
    "acceptedAnswers": []
  }],
  "passage": null,
  "pronunciationItems": []
}
```

Bài nghe có `passage`: `{ "audioUrl": "/media/listening/airport.mp3", "audioMissing": true, "durationMs": 18000,
"transcript": "…", "translation": "…", "segments": [{ "id": 11, "startMs": 0, "endMs": 8500, "speaker": "Nhân viên",
"text": "…", "translation": "…" }] }`. Bài phát âm có `pronunciationItems`: `[{ "id": 1, "text": "worked", "ipa": "/wɜːkt/",
"audioUrl": null, "notes": "…" }]`.

### `POST /api/admin/lessons`, `PUT /api/admin/lessons/{id}`

Thân như `GET` ở trên, bỏ các trường chỉ đọc (`id` của bài, `attempts`, `updatedAt`, `issues`, `audioMissing`); câu hỏi,
lựa chọn, đoạn, mục mới không có `id`. `POST` trả `201`. Kiểm tra (sai → `400`):

- Tiêu đề 1–150 ký tự, trình độ bắt buộc; bài mới luôn là `DRAFT`.
- `PUBLISHED` cần ít nhất một câu hỏi (bài phát âm: một mục); bài nghe xuất bản cần file âm thanh và transcript.
- Trắc nghiệm: 2–6 lựa chọn, đúng một lựa chọn `correct`. Điền từ: ít nhất một đáp án chấp nhận.
- Sửa bài đang có lượt làm: lượt đã nộp giữ nguyên điểm; chỉ lượt làm mới dùng nội dung mới.

### `DELETE /api/admin/lessons/{id}`

Bài đã có lượt làm → chuyển `ARCHIVED`; chưa có → xóa hẳn. Trả `{ "result": "ARCHIVED" | "DELETED" }`.

## Đề kiểm tra (module C, Nhân)

### `GET /api/admin/tests`

```json
[{
  "id": 100, "title": "Kiểm tra định kỳ — tuần 40", "type": "PERIODIC",
  "startDate": "2026-09-26", "endDate": "2026-10-03", "status": "OPEN",
  "questionCount": 5, "skills": ["READING", "WRITING"], "submissions": 28, "averageScore": 72
}]
```

`status`: `DRAFT` (chưa mở cho người học, cần cột mới `tests.draft`), `UPCOMING`, `OPEN`, `CLOSED` (tính theo ngày mở,
ngày đóng, giờ Việt Nam). Đề tổng hợp không giới hạn thời gian có `startDate`, `endDate` là `null` và `status` `OPEN`.
`averageScore` 0–100, `null` khi chưa có bài nộp.

### `GET /api/admin/tests/{id}`

```json
{
  "id": 101, "title": "Kiểm tra định kỳ — tuần 41", "type": "PERIODIC", "startDate": "2026-10-04", "endDate": "2026-10-10",
  "status": "DRAFT", "submissions": 0, "duplicatedFrom": { "id": 100, "title": "Kiểm tra định kỳ — tuần 40" },
  "questions": [{
    "id": 1001, "skill": "READING", "type": "MULTIPLE_CHOICE", "points": 1, "audioUrl": null,
    "content": "Choose the correct form: She ___ (live) in Hanoi for five years.",
    "options": [{ "id": 1, "text": "has lived", "correct": true }], "acceptedAnswers": []
  }]
}
```

`type` của câu: `MULTIPLE_CHOICE`, `FILL_BLANK`, `LISTENING`, `READING`, `SPEAKING`, `WRITING`
(`test_questions.question_type`). Câu Nói, Viết không có đáp án (AI chấm) trừ khi có `acceptedAnswers`.

### `POST /api/admin/tests/{id}/duplicate`

Thân `{ "title": "Kiểm tra định kỳ — tuần 41", "startDate": "2026-10-04", "endDate": "2026-10-10" }`. Tạo đề mới trạng
thái nháp, chép toàn bộ câu hỏi. Trả `201` đề mới (dạng `GET` ở trên).

### `POST /api/admin/tests`, `PUT /api/admin/tests/{id}`

Thân như `GET` (bỏ `id`, `status`, `submissions`, `duplicatedFrom`) cộng `"draft": true|false`. Kiểm tra (sai → `400`):
tiêu đề bắt buộc; đề định kỳ cần ngày mở và ngày đóng, ngày đóng sau ngày mở; ít nhất một câu hỏi; trắc nghiệm,
nghe, đọc cần đúng một lựa chọn đúng; điền từ cần đáp án chấp nhận; đề tổng hợp cần đủ bốn kỹ năng.
**Đề đã có bài nộp** chỉ được đổi tiêu đề, ngày đóng và lời văn câu hỏi; đổi đáp án, điểm, thêm hoặc xóa câu → `409`.

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
    "exercisesCompleted": 1, "exerciseAverageScore": 50, "testsSubmitted": 1, "lastTestDate": "2026-09-16"
  },
  "recentActivity": [{ "at": "2026-09-28T16:40:00Z", "type": "CHAT", "title": "Trò chuyện với trợ lý AI", "detail": "14 tin nhắn" }],
  "levelHistory": [
    { "level": "A2", "changedAt": "2026-09-16T13:05:00Z", "source": "Kiểm tra tổng hợp tháng 9 · 38 điểm" },
    { "level": null, "changedAt": "2026-09-15T02:00:00Z", "source": "Đăng ký tài khoản" }
  ],
  "plan": null
}
```

`recentActivity`: tối đa 5 hoạt động gần nhất, `type` là `REVIEW`, `EXERCISE`, `TEST`, `GAME`, `CHAT`. Trò chuyện chỉ có số
tin nhắn, **không** có nội dung. `plan`: `{ "title": "Đạt B2 trong 3 tháng", "currentWeek": 3, "weekCount": 13,
"status": "ACTIVE" }` hoặc `null`. Không id nào tồn tại, hoặc id là admin → `404`.

### `PATCH /api/admin/users/{id}`

Thân `{ "status": "LOCKED" }` hoặc `{ "status": "ACTIVE" }`. Trả người dùng như `GET /api/admin/users/{id}`. Tài khoản
admin → `403`. **Khóa có hiệu lực ngay:** mọi request của phiên cũ nhận `401` (kiểm tra `users.status` ở mỗi request
hoặc lưu thời điểm khóa và từ chối token cấp trước đó); đăng nhập lại nhận `403` như hiện nay.

## Thay đổi database cần có

| Bảng | Thay đổi | Dùng cho |
|---|---|---|
| `vocabulary` | `archived_at TIMESTAMPTZ NULL` | Lưu trữ thay cho xóa (kịch bản 20) |
| `topics` | `updated_at TIMESTAMPTZ NULL` | Cột "Cập nhật" |
| `games` | `enabled BOOLEAN NOT NULL DEFAULT TRUE` | Bật/tắt trò chơi |
| `tests` | `draft BOOLEAN NOT NULL DEFAULT FALSE` | Đề nháp (kịch bản 23) |
| `users` | `last_active_at TIMESTAMPTZ NULL` | "Hoạt động gần nhất" |

## Câu hỏi mở

1. Ai làm backend thống kê (`/api/admin/stats`) khi số liệu nằm ở cả bốn module? Đề xuất: mỗi module mở một hàm service
   trả số liệu của mình theo khoảng ngày, một service ở `common` hoặc module `user` gộp lại.
2. Nhóm có muốn giữ `DELETE` trả `200` kèm `result`, hay tách thành `POST .../archive` và `DELETE`?
3. File tải lên lưu ở đâu khi deploy (ổ đĩa của container sẽ mất khi khởi động lại)? Đề xuất: bảng `media_files` lưu
   nội dung trong Postgres cho demo, hoặc dịch vụ lưu trữ ngoài.
