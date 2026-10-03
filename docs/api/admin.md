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
> | Chủ đề, từ vựng | Hồng (module A `vocabulary`) | Thêm/sửa/xóa chủ đề và từ **đã có**; các endpoint `/api/admin/topics`, `/api/admin/vocabulary`, `/api/admin/media` và luật mới là đề xuất |
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
    "lessonsWithIssues": [{ "lessonId": 2, "title": "Hội thoại tại sân bay", "issue": "MISSING_AUDIO" }],
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

`wordCount` và các số "thiếu" chỉ tính từ hệ thống chưa ẩn. `learnerCount` là số người học có ít nhất một từ của chủ
đề trong `user_vocabulary`. `minLevel`, `maxLevel` là `null` khi chủ đề chưa có từ. `updatedAt` cần cột mới
`topics.updated_at` (có thể `null`).

### `POST /api/topics`, `PUT /api/topics/{id}` (đã có) — luật mới

Thân `{ "name": "Mua sắm", "description": "Cửa hàng, giá cả, thanh toán", "imageUrl": null }`. **Mới:** tên trùng
một chủ đề khác (không phân biệt hoa thường, sau khi cắt khoảng trắng) → `409`.

### `DELETE /api/topics/{id}` (đã có) — luật mới

**Mới:** chủ đề còn từ (kể cả từ đã ẩn) → `409` với `message` "Topic still has N words"; giao diện đọc `wordCount`
để hiện hộp thoại chặn trước khi gọi. Hiện backend vẫn xóa và đặt `topic_id = NULL` cho các từ: phải sửa.

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

`200` `{ "result": "HIDDEN" }` hoặc `{ "result": "DELETED" }`. Hiện backend luôn xóa hẳn và xóa dây chuyền tiến độ học
(`ON DELETE CASCADE`): phải sửa trước khi mở chức năng này.

### `POST /api/admin/media?kind=AUDIO|IMAGE`

Tải file audio hoặc ảnh cho từ, chủ đề, bài nghe. Thân là **nguyên file** (không multipart), `Content-Type` là loại file
(`audio/mpeg`, `audio/wav`, `image/png`, `image/jpeg`, `image/webp`). Audio tối đa 10 MB, ảnh tối đa 2 MB; sai loại hoặc
quá lớn → `400`. Trả `201` `{ "url": "/media/uploads/5f1c….mp3" }`; đường dẫn này `permitAll` như `/media/**` hiện có.

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

`status`: `DRAFT`, `PUBLISHED`, `HIDDEN` (`exercise_lessons.publication_status`, như `tbl_exercise_lesson.status`; giao
diện ghi `HIDDEN` là "Lưu trữ"). `issues`: `MISSING_AUDIO` (bài nghe
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

Bài đã có lượt làm → chuyển `HIDDEN`; chưa có → xóa hẳn. Trả `{ "result": "HIDDEN" | "DELETED" }`.

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
| `vocabulary` | `status VARCHAR(20) NOT NULL DEFAULT 'visible'` (`visible`/`hidden`, chữ thường như các enum khác của DB hiện tại) | Ẩn thay cho xóa (kịch bản 21); `tbl_vocabulary.status` của thiết kế |
| `exercise_lessons` | giá trị `archived` của `publication_status` đổi thành `hidden` | Cùng tên với thiết kế (`tbl_exercise_lesson.status`) |
| `topics` | `updated_at TIMESTAMPTZ NULL` | Cột "Cập nhật" |
| `tests` | `draft BOOLEAN NOT NULL DEFAULT FALSE` | Đề nháp (kịch bản 24) |
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
