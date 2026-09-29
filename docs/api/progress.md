# API tiến độ học tập (module D: D1 Theo dõi tiến độ) — contract

> Trạng thái: **đề xuất, chờ Nhân duyệt.** Module D do Khuất Huy Nhân phụ trách backend; Hồng làm giao diện (trang chủ
> "Tiến độ") theo tài liệu này, chạy trước với dữ liệu giả (`npm run dev:mock`). Nhân có quyền quyết định các luật
> nghiệp vụ (mục "Gợi ý giải pháp" và "Câu hỏi mở") và được đổi hình dạng API nếu backend khó làm. Muốn đổi chỗ nào thì
> sửa tài liệu này trước, rồi mới sửa code hai phía.
>
> Thứ tự ưu tiên khi các nguồn mâu thuẫn: **nghiệp vụ** (`docs/starter/Mô tả hệ thống bằng ngôn ngữ tự nhiên.md`) và
> **database** (`docs/starter/Database.md`) trước, thiết kế LinguaStep đổi theo (Hồng chốt ngày 27/09/2026).

Mọi endpoint cần đăng nhập (`Authorization: Bearer <token>`) và chỉ trả dữ liệu của **người đang gọi** (`userId` lấy qua
`common.security.CurrentUser`). Lỗi dùng định dạng chung `{ "timestamp": "...", "status": 400, "message": "..." }`.
Enum trong JSON viết **chữ hoa**. Dùng các bảng có sẵn trong `V1__init.sql`: `user_progress`, `badges`, `user_badges`;
điểm kỹ năng đọc từ `test_attempts` (module C, cũng của Nhân) qua service, không qua repository của module khác.

## Nguyên tắc

- **Mỗi khối trên màn hình lấy từ đúng một nguồn, không có API "dashboard" gộp tất cả.**
  1. Mỗi khối tải và báo lỗi riêng: điểm kỹ năng lỗi thì streak và biểu đồ vẫn hiện.
  2. Backend giao được từng phần: `summary` và `activity` chỉ cần bảng `user_progress` nên làm trước; `skills` cần
     module C có kết quả.
  3. Một con số chỉ có một nguồn: "Từ đã học" và "Từ cần ôn" lấy từ module A (`GET /api/learning/summary`, đã có), không
     tính lại từ `user_progress`, để trang chủ và màn Từ vựng không bao giờ lệch nhau.
- **Server quyết định "hôm nay"** theo giờ Việt Nam (`Asia/Ho_Chi_Minh`), giống module A (`StudyCalendar`). Trình duyệt
  không gửi ngày: đồng hồ máy người dùng có thể sai.
- **Server gộp số liệu theo kỳ và trả đủ mọi kỳ**, kể cả kỳ không học (các số đếm bằng `0`). Frontend không tự gộp hay
  lấp chỗ trống, vì điểm trung bình theo tuần, tháng không tính được từ điểm trung bình từng ngày.
- **Điểm luôn là số nguyên 0–100** để biểu đồ radar có cùng thang. Cách quy đổi từ điểm thô là việc của backend.
- **Quy đổi điểm sang trình độ CEFR chỉ làm ở backend** (bảng quy đổi ở mục "Gợi ý giải pháp"). API trả sẵn `level`,
  frontend không giữ bản sao của bảng này.
- **Người mới không bao giờ nhận `404`**: mọi endpoint trả dữ liệu rỗng hợp lệ (số `0`, `null`, danh sách chưa đạt) để
  giao diện hiện "biểu đồ trống + gợi ý bắt đầu học" (ngoại lệ của D1).

## Màn hình lấy dữ liệu ở đâu

| Khối trên trang chủ "Tiến độ" | Nguồn | Backend |
|---|---|---|
| Lời chào, ảnh đại diện | `GET /api/users/me` | Hồng, đã có |
| Thẻ "Từ đã học" | `GET /api/learning/summary`: `learningCount + masteredCount` | Hồng, đã có |
| Thẻ "Từ cần ôn hôm nay" | `GET /api/learning/summary`: `dueToday` | Hồng, đã có |
| Thẻ "Bài tập đã hoàn thành" | `GET /api/progress/summary`: `totals.exercisesCompleted` | **Nhân** |
| Thẻ "Streak" | `GET /api/progress/summary`: `streak` | **Nhân** |
| Biểu đồ "Hoạt động học tập": 4 chỉ số, theo Ngày / Tuần / Tháng | `GET /api/progress/activity?period=` | **Nhân** |
| Biểu đồ "Điểm theo kỹ năng" (radar Nghe, Nói, Đọc, Viết) | `GET /api/progress/skills` | **Nhân** |
| "Hành trình trình độ" (A1 → C2) | Frontend tính từ `currentLevel` của `/api/users/me`, không cần API | — |
| "Thành tích" (huy hiệu đã đạt, sắp đạt) | `GET /api/progress/badges` | **Nhân** |
| Thẻ "Tiếp tục" (bài đang làm dở), không có thì "Học tiếp" (bài kế tiếp) | `GET /api/exercise-attempts/current`; không có lượt dở thì `GET /api/exercises?skill=GRAMMAR` (contract `exercises.md`) | Đạt |
| Ghi thời gian học (không hiện, chạy nền) | `POST /api/progress/study-time` | **Nhân** |

Thứ tự đề xuất cho backend: `summary` → `activity` → `study-time` → `badges` → `skills` (cần module C có kết quả).

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

### `GET /api/progress/activity?period=DAY` — số liệu theo kỳ cho biểu đồ

Nghiệp vụ D1: "biểu đồ theo ngày/tuần/tháng: số từ đã học, số bài tập hoàn thành, điểm trung bình kiểm tra … có thể
chọn khoảng thời gian khác".

| `period` | Số cột | Mỗi cột | Cột cuối |
|---|---|---|---|
| `DAY` (mặc định) | 7 | một ngày | hôm nay |
| `WEEK` | 12 | một tuần, **thứ Hai đến Chủ nhật** | tuần hiện tại (chưa hết tuần) |
| `MONTH` | 6 | một tháng dương lịch | tháng hiện tại (chưa hết tháng) |

Giá trị khác trả `400`.

```json
{
  "period": "WEEK",
  "from": "2026-07-06",
  "to": "2026-09-27",
  "items": [
    {
      "start": "2026-07-06",
      "end": "2026-07-12",
      "wordsLearned": 30,
      "exercisesCompleted": 4,
      "testsCompleted": 1,
      "studyMinutes": 140,
      "averageTestScore": 62
    }
  ],
  "totals": {
    "wordsLearned": 212,
    "exercisesCompleted": 41,
    "testsCompleted": 5,
    "studyMinutes": 1980,
    "averageTestScore": 58
  }
}
```

| Trường | Ý nghĩa |
|---|---|
| `from`, `to` | Ngày đầu của cột đầu tiên; `to` là **hôm nay** (giờ Việt Nam) |
| `items` | **Đúng 7, 12 hoặc 6 phần tử**, cũ trước mới sau. Kỳ không có dòng `user_progress` thì các số đếm bằng `0` |
| `start`, `end` | Ngày đầu, ngày cuối của kỳ (với `DAY` thì bằng nhau). `end` của cột cuối có thể sau hôm nay |
| `wordsLearned` … `studyMinutes` | Tổng các cột cùng tên của `user_progress` trong kỳ |
| `averageTestScore` | Điểm trung bình (0–100, làm tròn) các bài kiểm tra **đã nộp** trong kỳ. **Không có bài nào: `null`**, không phải `0`: giao diện để trống cột, vì "không làm bài" khác "được 0 điểm" |
| `totals` | Cộng dồn cả khoảng `from`–`to`; `averageTestScore` tính trên mọi bài trong khoảng, không phải trung bình của các cột |

Giao diện tự tính dòng tóm tắt ("Tổng: 42 từ · 5 bài tập · trung bình 28 phút/ngày") từ `totals` và số ngày từ `from`
đến `to`.

### `GET /api/progress/skills` — điểm theo kỹ năng (kết quả kiểm tra tổng hợp gần nhất)

```json
{
  "latest": {
    "attemptId": 42,
    "testTitle": "Kiểm tra tổng hợp tháng 9",
    "takenAt": "2026-09-20T08:30:00Z",
    "status": "GRADED",
    "overallScore": 46,
    "previousOverallScore": 38,
    "level": "B1",
    "skills": {
      "listening": { "score": 56, "level": "B2" },
      "speaking": { "score": 38, "level": "A2" },
      "reading": { "score": 48, "level": "B1" },
      "writing": { "score": 42, "level": "B1" }
    }
  }
}
```

- `latest` là lượt **kiểm tra tổng hợp** (`tests.type = 'COMPREHENSIVE'`) gần nhất của người dùng ở trạng thái `SUBMITTED`
  hoặc `GRADED` (bỏ qua `IN_PROGRESS`). Chưa làm bài nào: `{ "latest": null }`; giao diện hiện radar trống và nút "Làm
  bài kiểm tra tổng hợp".
- `skills.*.score` ứng với `test_attempts.skill_scores` (`nghe`, `nói`, `đọc`, `viết`), đã quy về thang 0–100.
  `skills.*.level` và `level` quy đổi theo bảng ở mục "Gợi ý giải pháp"; `overallScore` là trung bình 4 kỹ năng.
- `status = "SUBMITTED"`: phần nói, viết đang chờ AI chấm (ngoại lệ của C2). Kỹ năng chưa chấm có `score` và `level`
  là `null`, và `overallScore`, `level` cũng là `null` cho đến khi chấm xong. Giao diện hiện "Đang chấm phần Nói, Viết".
- `level` bằng `test_attempts.suggested_level`. `takenAt` là thời điểm nộp bài (xem câu hỏi mở 4).
- `previousOverallScore`: điểm tổng của lượt tổng hợp **đã chấm xong** ngay trước `latest`, `null` nếu không có. Màn Kế
  hoạch dùng để hiện "Tăng 8 điểm so với lần kiểm tra trước" (thêm ngày 29/09, xem `plans.md`).
- Màn Kế hoạch (D2) cũng vẽ radar này, dùng lại endpoint này.

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

`averageTestScore` không có trong `user_progress`: tính từ `test_attempts` đã nộp, theo ngày nộp (giờ Việt Nam).

Lưu ý khi demo: `user_progress` chỉ có dữ liệu từ lúc listener chạy. Lịch sử học trước đó (module A đã chạy từ 25/09)
không tự có; tài khoản demo nên học sau khi module D lên, hoặc dùng seed.

## Frontend dùng như thế nào

| Việc | Gọi |
|---|---|
| Mở trang chủ | Song song: `users/me` (đã có sẵn), `learning/summary`, `progress/summary`, `progress/activity?period=DAY`, `progress/skills`, `progress/badges`, `exercise-attempts/current` (và `exercises?skill=GRAMMAR` khi không có lượt dở) |
| Đổi Ngày / Tuần / Tháng trên biểu đồ | `GET /api/progress/activity?period=WEEK` hoặc `MONTH` |
| Đổi chỉ số (Từ mới, Bài tập, Điểm kiểm tra, Thời gian học) | Không gọi lại: cùng một phản hồi `activity` |
| Học xong một thẻ, một bài, một bài kiểm tra | Làm mới dữ liệu `progress` cùng dữ liệu của module đó |
| Hành trình trình độ | Không gọi API: trình độ dưới `currentLevel` là "Đạt", bằng là "Hiện tại", trên là "Chưa đạt"; `currentLevel = null` thì mọi ô "Chưa đạt" và gợi ý làm bài kiểm tra tổng hợp |
| Thẻ "Tiếp tục" | Lượt dở gần nhất: "Tiếp tục: Thì hiện tại hoàn thành · Đã làm 4/10 câu · còn 6 câu", bấm vào thì mở bài và làm tiếp đúng câu |
| Thẻ "Học tiếp" (không có lượt dở) | Bài ngữ pháp đầu tiên ở trình độ hiện tại chưa hoàn thành lần nào (`progress.attemptCount = 0`) |

## Khác với thiết kế LinguaStep

Vị trí trong thiết kế: `frontend/LinguaStep-design-source/index.html`, màn Tiến độ (`isDashboard`) dòng 260–312, màn Kế
hoạch (`isPlan`) từ dòng 693.

| Thiết kế | Contract và giao diện mới | Lý do |
|---|---|---|
| Radar 4 trục: Từ vựng, Ngữ pháp, Nói, Nghe (dòng 274–277 và 706–709) | Nghe, Nói, Đọc, Viết, mỗi trục kèm trình độ | Nghiệp vụ C2 và cột `test_attempts.skill_scores` đều là 4 kỹ năng này. Không bảng nào lưu điểm từ vựng hay ngữ pháp |
| Số mẫu "76/100 · B1" (dòng 269, 699) | Số mẫu "46/100 · B1" | Theo bảng quy đổi đề xuất, 76 điểm là C2 |
| 3 thẻ số liệu | 4 thẻ, thêm "Bài tập đã hoàn thành" | Nghiệp vụ D1: "tổng số từ/bài tập đã hoàn thành" |
| "Thời gian học", cố định 7 ngày (dòng 282–292) | "Hoạt động học tập": 4 chỉ số, chọn Ngày / Tuần / Tháng | Nghiệp vụ D1: "biểu đồ theo ngày/tuần/tháng: số từ đã học, số bài tập hoàn thành, điểm trung bình kiểm tra", "chọn khoảng thời gian khác" |
| "Huy hiệu theo trình độ" (dòng 295–302) | "Hành trình trình độ", tính từ `currentLevel` | Bảng `badges` chỉ có điều kiện streak, số từ, điểm tuyệt đối (`CHECK` trong `V1__init.sql`); trình độ đã có ở `users.current_level` và `user_level_history` |
| Không có khối thành tích | Thêm khối "Thành tích": đã đạt, sắp đạt | Nghiệp vụ D1: "hiện huy hiệu đã đạt và sắp đạt"; bảng `badges`, `user_badges` dành cho việc này |
| Không vẽ trạng thái người mới | Biểu đồ trống cùng lời mời bắt đầu học | Ngoại lệ của D1 |
| "Tiếp tục: … Bài 4/10 · còn 6 câu" (dòng 307) | Giữ, ghi "Đã làm 4/10 câu · còn 6 câu"; không có lượt dở thì "Học tiếp" gợi ý bài kế tiếp | Hồng chốt ngày 27/09: contract module B đổi để làm tiếp được bài ngữ pháp, phát âm đang dở (`exercises.md`). "Bài 4/10" dễ hiểu nhầm thành bài thứ 4 trong 10 bài |

## Gợi ý giải pháp

Các đề xuất dưới đây xử lý những chỗ thiết kế, nghiệp vụ và database không khớp nhau. Phần 1 và 2 là luật nghiệp vụ của
module C (Nhân chốt); khi có contract `tests.md` thì chuyển sang đó.

### 1. Điểm ngữ pháp nằm trong điểm Đọc và Viết

CEFR không coi ngữ pháp là một kỹ năng riêng: "độ chính xác ngữ pháp" thuộc năng lực ngôn ngữ và được đánh giá qua các
hoạt động nghe, nói, đọc, viết. IELTS cũng chấm ngữ pháp là một trong bốn tiêu chí của bài Viết và bài Nói. (Cambridge
B2 First thì tách "Use of English" thành điểm thứ năm; hệ thống này theo 4 kỹ năng vì database đã chốt như vậy.)

- **Xếp câu hỏi theo việc người học làm:** chọn đáp án đúng trong câu hoặc đoạn văn → `READING`; tự gõ từ, viết lại câu
  theo nghĩa cho sẵn → `WRITING`; trong phần Nói, AI chấm ngữ pháp như một tiêu chí. Ghi vào cột `test_questions.skill`
  có sẵn, không cần sửa database.
- **Câu ngữ pháp tối đa khoảng 30% mỗi phần**, để điểm Đọc vẫn đo được khả năng đọc hiểu và điểm Viết vẫn đo được khả
  năng viết.
- **Câu viết ngắn chấm bằng danh sách đáp án chấp nhận** (như `question_accepted_answers` của module B); câu dài để AI
  chấm như phần Viết của C2. So khớp chính xác từng chữ sẽ chấm oan người học.
- **Radar chỉ lấy từ bài kiểm tra tổng hợp**, không lấy từ bài tập luyện tập (module B): bài tập cho làm lại nhiều lần và
  có trợ lý AI gợi ý, trộn vào thì điểm cao hơn thực lực. Kết quả bài tập hiện ở biểu đồ "Hoạt động học tập".

### 2. Đánh giá trình độ theo 6 mức CEFR

Cách các kỳ thi uy tín làm: EF SET quy đổi điểm 0–100 sang CEFR bằng các ngưỡng cố định; Cambridge lấy điểm tổng là
**trung bình cộng các kỹ năng** (trọng số bằng nhau), trình độ tính theo điểm tổng và **không yêu cầu điểm tối thiểu từng
phần**; IELTS cũng lấy trung bình 4 kỹ năng; CEFR Companion Volume nhấn mạnh người học hiếm khi đều nhau ở mọi kỹ năng,
nên báo cáo nên theo hồ sơ từng kỹ năng.

Đề xuất (bảng ngưỡng lấy theo EF SET):

| Điểm (0–100) | 0–30 | 31–40 | 41–50 | 51–60 | 61–70 | 71–100 |
|---|---|---|---|---|---|---|
| Trình độ | A1 | A2 | B1 | B2 | C1 | C2 |

1. Mỗi kỹ năng có điểm 0–100 và **trình độ riêng** theo bảng trên (báo cáo C2 hiện được "Nghe B2, Nói A2").
2. **Điểm tổng = trung bình 4 kỹ năng**, làm tròn; **trình độ tổng** tra theo cùng bảng, không yêu cầu điểm tối thiểu từng
   kỹ năng. Trình độ tổng ghi vào `test_attempts.suggested_level`, `users.current_level` và `user_level_history`.
3. **Chỉ bài kiểm tra tổng hợp mới đổi trình độ**; kiểm tra định kỳ chỉ đo tiến bộ. Trình độ được phép giảm, vì kế hoạch
   học (D2) cần trình độ đúng thực tế.
4. **Quy đổi trình độ bằng luật cố định; AI chấm phần Nói, Viết và viết lộ trình đề xuất.** Nghiệp vụ C2 ghi "qua AI
   phân loại CEFR", nhưng luật cố định cho kết quả giải thích được, kiểm thử được và không đổi giữa hai lần chấm.

Hạn chế: EF SET là bài thi thích ứng đã được hiệu chuẩn, đề của hệ thống này thì chưa, nên bảng ngưỡng chỉ là điểm xuất
phát và cần chỉnh sau khi chạy thử với người học thật.

### 3. "Hành trình trình độ" thay cho "Huy hiệu theo trình độ"

- Giữ 6 vòng tròn A1 → C2 như thiết kế, đổi tên khối. Dưới `currentLevel`: "Đạt"; bằng: "Hiện tại"; trên: "Chưa đạt".
  Người mới: mọi ô "Chưa đạt" và nút "Làm bài kiểm tra để xác định trình độ".
- **Không thêm loại huy hiệu theo trình độ vào bảng `badges`**: ngày đạt trình độ đã nằm ở `user_level_history`, thêm vào
  `badges` là lưu hai nơi, phải sửa `CHECK` của bảng, và trình độ là kết quả đánh giá chứ không phải thành tích.
- Sau này muốn hiện ngày đạt ("Đạt B1 · 20/09") thì thêm API đọc `user_level_history`. Bảng này thuộc module `user`
  (Hồng), không cần module D.

### 4. Thiết kế mới của trang chủ Tiến độ

```
Chào Hồng 👋
[Từ đã học] [Bài tập đã hoàn thành] [Streak] [Từ cần ôn hôm nay]
[Hoạt động học tập                           ] [Điểm theo kỹ năng        ]
[ Từ mới | Bài tập | Điểm kiểm tra | Thời gian] [ radar Nghe/Nói/Đọc/Viết  ]
[ Ngày | Tuần | Tháng                        ] [ 46/100 · B1 · 20/09      ]
[ biểu đồ cột + dòng tổng                    ] [ Xem kế hoạch →           ]
[Hành trình trình độ  A1 A2 (B1) B2 C1 C2    ] [Thành tích 3/12           ]
[                                            ] [ đã đạt gần đây, sắp đạt  ]
[Tiếp tục: … · Đã làm 4/10 câu · còn 6 câu   (hoặc Học tiếp: … )           ]
```

- Chỉ số "Điểm kiểm tra": kỳ không làm bài để trống, không vẽ cột 0.
- "Thành tích": số đã đạt trên tổng, vài huy hiệu đạt gần nhất, 3 huy hiệu sắp đạt kèm thanh tiến độ ("Chăm chỉ 30 ngày ·
  14/30"), nút "Xem tất cả".
- Người mới: các biểu đồ trống, cùng lời mời "Bắt đầu với 20 từ đầu tiên →".
- Thẻ "Tiếp tục" giữ đúng thiết kế: Hồng chốt ngày 27/09 sửa contract module B cho phép làm tiếp bài ngữ pháp, phát âm
  đang dở (xem `exercises.md`: luật "làm tiếp được", `GET /api/exercise-attempts/current`). Không có lượt dở thì thẻ
  thành "Học tiếp", gợi ý bài kế tiếp, nên trang chủ luôn có một việc để làm tiếp.

### Nguồn tham khảo

- [CEFR Companion Volume (Council of Europe, 2020)](https://rm.coe.int/common-european-framework-of-reference-for-languages-learning-teaching/16809ea0d4)
- [CEFR, chương 5: năng lực ngôn ngữ giao tiếp (grammatical accuracy)](https://rm.coe.int/chapter-5-communicative-language-competences/1680a084c3)
- [Cambridge English Scale](https://en.wikipedia.org/wiki/Cambridge_English_Scale)
- [Cambridge: Understanding the Statement of Results, B2 First](https://www.cambridgeenglish.org/Images/664445-b2-statement-of-results-factsheet.pdf)
- [IELTS scoring in detail](https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail)
- [IELTS Writing band descriptors](https://ielts.org/cdn/Guides/ielts-writing-band-descriptors.pdf)
- [The CEFR and EF SET](https://www.efset.org/cefr/)

## Câu hỏi mở (Nhân chốt)

1. **Thế nào là "ngày học" cho streak?** Đề xuất: có ít nhất một số đếm lớn hơn 0 trong `user_progress` hôm đó. Chặt hơn
   (ví dụ phải học tối thiểu 5 phút) thì streak khó giữ hơn.
2. **Đo thời gian học thế nào?** Đề xuất: frontend gửi từng phút học thật (`POST /api/progress/study-time`), vì chính xác
   và không bắt module nào phải sửa. Cách khác là server ước lượng từ thời gian các lượt làm bài, nhưng flashcard không
   có thời lượng và cần dữ liệu của nhiều module.
3. **Quy đổi điểm về 0–100:** `skill_scores` và `total_score` đang lưu theo thang nào? Contract chỉ cần kết quả cuối là
   số nguyên 0–100.
4. **`test_attempts` chưa có thời điểm nộp bài**, chỉ có `start_time`. Đề xuất thêm cột `submitted_at` (migration mới) để
   sắp "gần nhất" và gộp theo kỳ đúng hơn; nếu không thì dùng `start_time`.
5. **`PERFECT_SCORE` tính trên gì?** Chỉ bài kiểm tra, hay cả bài tập đạt 100%? Nếu cả bài tập thì cần `score_percent`
   trong `ExerciseCompletedEvent`.
6. **`averageTestScore`** tính cả kiểm tra định kỳ lẫn tổng hợp? Đề xuất: cả hai.
7. **Danh sách huy hiệu (seed `badges`)** do Nhân soạn. Gợi ý: học 3, 7, 30 ngày liên tiếp; 50, 200, 1000 từ; 1 và 5 bài
   điểm tuyệt đối.
8. **Bảng quy đổi trình độ** (mục "Gợi ý giải pháp" 2): đồng ý dùng ngưỡng EF SET, trung bình 4 kỹ năng, không điểm tối
   thiểu từng kỹ năng, cho phép giảm trình độ?
9. **Câu ngữ pháp trong đề** (mục "Gợi ý giải pháp" 1): đồng ý xếp vào Đọc, Viết theo việc người học làm, tối đa khoảng
   30% mỗi phần?
