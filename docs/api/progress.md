# API tiến độ học tập (module D: D1 Theo dõi tiến độ) — contract

> Trạng thái: **đề xuất, chờ Nhân duyệt.** Module D do Khuất Huy Nhân phụ trách backend; Hồng làm giao diện (trang chủ
> "Tiến độ") theo tài liệu này, chạy trước với dữ liệu giả (`npm run dev:mock`). Nhân có quyền quyết định các luật
> nghiệp vụ (mục "Câu hỏi mở") và được đổi hình dạng API nếu backend khó làm. Muốn đổi chỗ nào thì sửa tài liệu này
> trước, rồi mới sửa code hai phía.

Mọi endpoint cần đăng nhập (`Authorization: Bearer <token>`) và chỉ trả dữ liệu của **người đang gọi** (`userId` lấy qua
`common.security.CurrentUser`). Lỗi dùng định dạng chung `{ "timestamp": "...", "status": 400, "message": "..." }`.
Enum trong JSON viết **chữ hoa**. Dùng các bảng có sẵn trong `V1__init.sql`: `user_progress`, `badges`, `user_badges`;
điểm kỹ năng đọc từ `test_attempts` (module C, cũng của Nhân) qua service, không qua repository của module khác.

## Nguyên tắc

- **Mỗi khối trên màn hình lấy từ đúng một nguồn, không có API "dashboard" gộp tất cả.**
  1. Mỗi khối tải và báo lỗi riêng: điểm kỹ năng lỗi thì streak và biểu đồ vẫn hiện.
  2. Backend giao được từng phần: `summary` và `daily` chỉ cần bảng `user_progress` nên làm trước; `skills` cần module C.
  3. Một con số chỉ có một nguồn: "Từ đã học" và "Từ cần ôn" lấy từ module A (`GET /api/learning/summary`, đã có), không
     tính lại từ `user_progress`, để trang chủ và màn Từ vựng không bao giờ lệch nhau.
- **Server quyết định "hôm nay"** theo giờ Việt Nam (`Asia/Ho_Chi_Minh`), giống module A (`StudyCalendar`). Trình duyệt
  không gửi ngày: đồng hồ máy người dùng có thể sai.
- **Chuỗi ngày trả đủ mọi ngày**, kể cả ngày không học (mọi số bằng `0`). Frontend không tự lấp ngày trống.
- **Điểm luôn là số nguyên 0–100** để biểu đồ radar có cùng thang. Cách quy đổi từ điểm thô là việc của backend.
- **Người mới không bao giờ nhận `404`**: mọi endpoint trả dữ liệu rỗng hợp lệ (số `0`, `null`, danh sách chưa đạt) để
  giao diện hiện "biểu đồ trống + gợi ý bắt đầu học" (ngoại lệ của D1).

## Màn hình lấy dữ liệu ở đâu

| Khối trên trang chủ "Tiến độ" | Nguồn | Backend |
|---|---|---|
| Lời chào, ảnh đại diện | `GET /api/users/me` | Hồng, đã có |
| Thẻ "Từ đã học" | `GET /api/learning/summary`: `learningCount + masteredCount` | Hồng, đã có |
| Thẻ "Từ cần ôn hôm nay" | `GET /api/learning/summary`: `dueToday` | Hồng, đã có |
| Thẻ "Streak" | `GET /api/progress/summary` | **Nhân** |
| Biểu đồ hoạt động (thời gian học, từ mới, bài tập), chọn 7/30/90 ngày | `GET /api/progress/daily?days=` | **Nhân** |
| Biểu đồ điểm theo kỹ năng (radar) và "76/100 · B1" | `GET /api/progress/skills` | **Nhân** |
| Huy hiệu theo trình độ (A1 → C2) | Frontend tính từ `currentLevel` của `/api/users/me`, không cần API | — |
| Thành tích (huy hiệu đã đạt, sắp đạt) | `GET /api/progress/badges` | **Nhân** |
| Thẻ "Học tiếp" | `GET /api/exercises?skill=GRAMMAR` (contract `exercises.md`) | Đạt |
| Ghi thời gian học (không hiện, chạy nền) | `POST /api/progress/study-time` | **Nhân** |

Thứ tự đề xuất cho backend: `summary` → `daily` → `study-time` → `badges` → `skills` (cần module C có kết quả).

## Endpoint

### `GET /api/progress/summary` — streak và tổng cộng

```json
{
  "streak": { "current": 14, "activeToday": true },
  "totals": { "exercisesCompleted": 37, "testsCompleted": 4, "studyMinutes": 1260 }
}
```

| Trường | Ý nghĩa |
|---|---|
| `streak.current` | Số ngày học liên tiếp **tính đến hôm nay**. Nếu hôm nay chưa học thì đếm đến hôm qua: chuỗi chưa mất cho đến hết ngày. Không có ngày học nào: `0` |
| `streak.activeToday` | Hôm nay đã có ngày học chưa. Giao diện dùng để nhắc "Học hôm nay để giữ chuỗi 14 ngày" |
| `totals` | Tổng từ trước tới nay, cộng từ `user_progress`. Không có số từ đã học: xem nguyên tắc "một con số chỉ có một nguồn" |

"Ngày học" là ngày có dòng `user_progress` với ít nhất một số đếm lớn hơn `0` (xem câu hỏi mở 1).

### `GET /api/progress/daily?days=7` — chuỗi ngày cho biểu đồ

`days` là `7`, `30` hoặc `90`; không gửi thì `7`; giá trị khác trả `400`.

```json
{
  "from": "2026-09-21",
  "to": "2026-09-27",
  "items": [
    { "date": "2026-09-21", "wordsLearned": 5, "exercisesCompleted": 1, "testsCompleted": 0, "studyMinutes": 18 },
    { "date": "2026-09-22", "wordsLearned": 0, "exercisesCompleted": 0, "testsCompleted": 0, "studyMinutes": 0 }
  ],
  "averageTestScore": 72
}
```

| Trường | Ý nghĩa |
|---|---|
| `to` | Hôm nay (giờ Việt Nam). `from = to − (days − 1)` |
| `items` | **Đúng `days` phần tử**, ngày tăng dần, ngày không có dòng `user_progress` thì mọi số bằng `0` |
| `wordsLearned` … `studyMinutes` | Các cột cùng tên của `user_progress` |
| `averageTestScore` | Điểm trung bình (0–100, làm tròn) các bài kiểm tra **đã nộp** trong khoảng này (nghiệp vụ D1: "điểm trung bình kiểm tra"). Không có bài nào: `null` |

Giao diện tự tính "trung bình 28 phút/ngày · cao nhất Chủ nhật (52 phút)" và gộp theo tuần khi xem 90 ngày; server
không cần trả các số đã suy ra được từ `items`.

### `GET /api/progress/skills` — điểm theo kỹ năng (kết quả kiểm tra tổng hợp gần nhất)

```json
{
  "latest": {
    "attemptId": 42,
    "testTitle": "Kiểm tra tổng hợp tháng 9",
    "takenAt": "2026-09-20T08:30:00Z",
    "status": "GRADED",
    "overallScore": 76,
    "level": "B1",
    "skills": { "listening": 80, "speaking": 68, "reading": 82, "writing": 74 }
  }
}
```

- `latest` là lượt **kiểm tra tổng hợp** (`tests.type = 'COMPREHENSIVE'`) gần nhất của người dùng ở trạng thái `SUBMITTED`
  hoặc `GRADED` (bỏ qua `IN_PROGRESS`). Chưa làm bài nào: `{ "latest": null }`, giao diện hiện radar trống và nút "Làm
  bài kiểm tra tổng hợp".
- `skills` ứng với `test_attempts.skill_scores` (`nghe`, `nói`, `đọc`, `viết`), đã quy về thang 0–100.
- `status = "SUBMITTED"`: phần nói, viết đang chờ AI chấm (ngoại lệ của C2). Kỹ năng chưa chấm là `null`, và
  `overallScore`, `level` cũng là `null` cho đến khi chấm xong. Giao diện hiện "Đang chấm phần Nói, Viết".
- `level` là `test_attempts.suggested_level`. `takenAt` là thời điểm nộp bài (xem câu hỏi mở 4).

### `GET /api/progress/badges` — thành tích

```json
[
  {
    "id": 2,
    "name": "Chăm chỉ 7 ngày",
    "description": "Học 7 ngày liên tiếp",
    "iconUrl": null,
    "condition": { "type": "STREAK_DAYS", "value": 7 },
    "progress": 7,
    "earnedAt": "2026-09-24T14:05:00Z"
  },
  {
    "id": 4,
    "name": "200 từ đầu tiên",
    "description": null,
    "iconUrl": null,
    "condition": { "type": "WORDS_LEARNED", "value": 200 },
    "progress": 150,
    "earnedAt": null
  }
]
```

| Trường | Ý nghĩa |
|---|---|
| (danh sách) | **Mọi** huy hiệu trong bảng `badges` (vài chục dòng, không phân trang). Thứ tự: đã đạt (mới nhất trước), rồi chưa đạt theo tỷ lệ `progress / value` giảm dần, tức "sắp đạt" đứng đầu |
| `condition.type` | `STREAK_DAYS`, `WORDS_LEARNED`, `PERFECT_SCORE` (`badges.condition_type`) |
| `progress` | Giá trị hiện tại của người dùng cho điều kiện đó, tối đa bằng `condition.value` |
| `earnedAt` | `user_badges.earned_at`; `null` nếu chưa đạt |
| `iconUrl`, `description` | Có thể `null`; giao diện dùng biểu tượng mặc định theo `condition.type` |

### `POST /api/progress/study-time` — ghi thời gian học

```json
{ "minutes": 1 }
```

Trả `204`. Cộng `minutes` (số nguyên 1–5, sai thì `400`) vào `study_time_minutes` của dòng hôm nay (giờ Việt Nam), tạo
dòng nếu chưa có. Tổng một ngày không vượt quá 1440 phút.

Frontend gửi mỗi phút học thật: chỉ trên màn học (flashcard, bài tập, kiểm tra, trò chơi), chỉ khi tab đang hiển thị
và người dùng có thao tác trong phút đó. Người dùng chỉ tự làm tăng số liệu của chính mình, nên không cần chống gian
lận thêm. Nếu Nhân chọn cách khác để đo thời gian học (câu hỏi mở 2) thì bỏ endpoint này.

## Dữ liệu vào `user_progress` (cho backend)

`user_progress` là bảng cộng dồn theo ngày (`UNIQUE(user_id, date)`), mỗi cột do một nguồn tăng:

| Cột | Tăng khi | Nguồn |
|---|---|---|
| `words_learned_count` | `WordReviewedEvent` có `firstReview = true` | Module A, **đã có** (mẫu listener trong `learning.md`) |
| `exercises_completed_count` | Một lượt bài tập chuyển sang `completed` | Module B: **cần Đạt phát** `common.event.ExerciseCompletedEvent` |
| `tests_completed_count` | Nộp một bài kiểm tra | Module C (Nhân) |
| `study_time_minutes` | `POST /api/progress/study-time` | Frontend |

Mọi sự kiện đặt ở `common.event`, mang sẵn ngày học theo giờ Việt Nam; listener dùng
`@TransactionalEventListener(phase = AFTER_COMMIT)` cùng `@Transactional(propagation = REQUIRES_NEW)`. Kiểm tra điều kiện
huy hiệu ở cùng chỗ cập nhật `user_progress` rồi ghi `user_badges`.

Lưu ý khi demo: `user_progress` chỉ có dữ liệu từ lúc listener chạy. Lịch sử học trước đó (module A đã chạy từ 25/09)
không tự có; tài khoản demo nên học sau khi module D lên, hoặc dùng seed.

## Frontend dùng như thế nào

| Việc | Gọi |
|---|---|
| Mở trang chủ | Song song: `users/me` (đã có sẵn), `learning/summary`, `progress/summary`, `progress/daily?days=7`, `progress/skills`, `progress/badges`, `exercises?skill=GRAMMAR` |
| Đổi khoảng thời gian của biểu đồ | `GET /api/progress/daily?days=30` hoặc `90` |
| Học xong một thẻ, một bài, một bài kiểm tra | Làm mới dữ liệu `progress` cùng dữ liệu của module đó |
| Huy hiệu theo trình độ | Không gọi API: các trình độ dưới `currentLevel` là "Đạt", bằng là "Hiện tại", trên là "Chưa đạt"; `currentLevel = null` thì mọi ô "Chưa đạt" và gợi ý làm bài kiểm tra xếp trình độ |
| Thẻ "Học tiếp" | Bài ngữ pháp đầu tiên ở trình độ hiện tại chưa hoàn thành lần nào (`progress.attemptCount = 0`); sau này có thể lấy từ kế hoạch học (D2) |

## Khác với thiết kế LinguaStep

| Thiết kế | Contract | Lý do |
|---|---|---|
| Radar 4 trục: Từ vựng, Ngữ pháp, Nói, Nghe | Nghe, Nói, Đọc, Viết | Nghiệp vụ C2 và cột `test_attempts.skill_scores` đều là 4 kỹ năng này. "Điểm từ vựng", "điểm ngữ pháp" không có nguồn dữ liệu nào |
| Huy hiệu theo trình độ | Giữ nguyên, tính từ `currentLevel` | Bảng `badges` không có điều kiện theo trình độ; trình độ đã có sẵn ở `users.current_level` |
| Không có khối thành tích | Thêm khối "Thành tích" | Nghiệp vụ D1 yêu cầu "huy hiệu đã đạt và sắp đạt"; bảng `badges`, `user_badges` dành cho việc này |
| Chỉ biểu đồ thời gian học 7 ngày | Chọn 7/30/90 ngày và chọn chỉ số (thời gian, từ mới, bài tập) | Nghiệp vụ D1: "biểu đồ theo ngày/tuần/tháng: số từ đã học, số bài tập hoàn thành", "chọn khoảng thời gian khác" |
| "Tiếp tục: … Bài 4/10 · còn 6 câu" | "Học tiếp": gợi ý bài kế tiếp | Module B không cho làm tiếp lượt dở (mở bài là bắt đầu lượt mới, xem `exercises.md`) |

## Câu hỏi mở (Nhân chốt)

1. **Thế nào là "ngày học" cho streak?** Đề xuất: có ít nhất một số đếm lớn hơn 0 trong `user_progress` hôm đó. Chặt hơn
   (ví dụ phải học tối thiểu 5 phút) thì streak khó giữ hơn.
2. **Đo thời gian học thế nào?** Đề xuất: frontend gửi từng phút học thật (`POST /api/progress/study-time`), vì chính xác
   và không bắt module nào phải sửa. Cách khác là server ước lượng từ thời gian các lượt làm bài, nhưng flashcard không
   có thời lượng và cần dữ liệu của nhiều module.
3. **Quy đổi điểm về 0–100:** `skill_scores` và `total_score` đang lưu theo thang nào? Contract chỉ cần kết quả cuối là
   số nguyên 0–100.
4. **`test_attempts` chưa có thời điểm nộp bài**, chỉ có `start_time`. Đề xuất thêm cột `submitted_at` (migration mới) để
   sắp "gần nhất" và lọc theo khoảng ngày đúng hơn; nếu không thì dùng `start_time`.
5. **`PERFECT_SCORE` tính trên gì?** Chỉ bài kiểm tra, hay cả bài tập đạt 100%? Nếu cả bài tập thì cần `score_percent`
   trong `ExerciseCompletedEvent`.
6. **`averageTestScore`** tính cả kiểm tra định kỳ lẫn tổng hợp? Đề xuất: cả hai.
7. **Danh sách huy hiệu (seed `badges`)** do Nhân soạn. Gợi ý: học 3, 7, 30 ngày liên tiếp; 50, 200, 1000 từ; 1 và 5 bài
   điểm tuyệt đối.
