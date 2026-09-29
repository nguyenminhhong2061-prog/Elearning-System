# API kế hoạch học cá nhân (module D: D2 Kế hoạch học cá nhân) — contract

> Trạng thái: **đề xuất, chờ Nhân duyệt.** Module D do Khuất Huy Nhân phụ trách backend; Hồng làm giao diện (màn "Kế
> hoạch", `/plan`) theo tài liệu này, chạy trước với dữ liệu giả (`npm run dev:mock`). Nhân quyết định các luật nghiệp vụ
> (mục "Gợi ý giải pháp" và "Câu hỏi mở") và được đổi hình dạng API nếu backend khó làm; muốn đổi thì sửa tài liệu này
> trước, rồi mới sửa code hai phía.
>
> Thứ tự ưu tiên khi các nguồn mâu thuẫn: **nghiệp vụ** (`docs/starter/Mô tả hệ thống bằng ngôn ngữ tự nhiên.md`, D2) và
> **database** (`docs/starter/Database.md`) trước, thiết kế LinguaStep (màn `isPlan`) đổi theo.

Mọi endpoint cần đăng nhập (`Authorization: Bearer <token>`) và chỉ đọc, ghi dữ liệu của **người đang gọi** (`userId`
lấy qua `common.security.CurrentUser`). Lỗi dùng định dạng chung `{ "timestamp": "...", "status": 400, "message": "..." }`.
Enum trong JSON viết **chữ hoa**, ngày dạng `YYYY-MM-DD` theo giờ Việt Nam. Bảng dùng: `study_plans`,
`study_plan_schedule`, `reminders` (có sẵn trong `V1__init.sql`), `user_progress` (D1, để đếm việc đã làm trong tuần).

## Nghiệp vụ D2 và cách màn hình đáp ứng

> Người học chọn "Kế hoạch học của tôi" → nếu chưa có kế hoạch, hệ thống hỏi mục tiêu → nhập mục tiêu → hệ thống (qua AI)
> gợi ý lộ trình → xác nhận hoặc chỉnh sửa → hệ thống lưu kế hoạch, gửi nhắc nhở theo lịch → có thể vào lại để điều chỉnh
> khi cần. *Ngoại lệ:* không hoàn thành mục tiêu tuần → không phạt, chỉ cảnh báo tiến độ chậm và gợi ý điều chỉnh.

| Bước | Màn hình | API |
|---|---|---|
| Xem trình độ, điểm 4 kỹ năng (thiết kế: vòng trình độ, "Điểm tổng", radar) | Khối "Trình độ hiện tại" | `GET /api/progress/skills` (contract `progress.md`, dùng chung với trang chủ) |
| Gợi ý việc nên làm ngay (thiết kế: "Lộ trình đề xuất", nút "Bắt đầu") | Khối "Việc nên làm" | `GET /api/study-plan/suggestions` |
| Chưa có kế hoạch → hỏi mục tiêu | Khối "Đặt mục tiêu học tập": các lựa chọn gợi ý (thiết kế: "Đạt B1 trong 3 tháng") hoặc tự chọn trình độ, số tháng, ghi chú | `GET /api/study-plan` (`plan: null`, `goalOptions`) |
| AI gợi ý lộ trình | Bấm "Gợi ý lộ trình": hiện lộ trình theo tuần để xem trước | `POST /api/study-plan/preview` (không lưu) |
| Xác nhận hoặc chỉnh sửa | "Áp dụng kế hoạch" hoặc đổi mục tiêu rồi gợi ý lại | `POST /api/study-plan` |
| Vào lại để điều chỉnh | Khối "Kế hoạch của bạn": mục tiêu, tuần hiện tại, lịch các tuần; "Đặt lại mục tiêu", "Tạm dừng" | `GET /api/study-plan`, `PATCH /api/study-plan` |
| Không đạt mục tiêu tuần | Cảnh báo nhẹ trong khối kế hoạch, kèm gợi ý điều chỉnh (không phạt, không trừ điểm) | trường `weeks[].achieved` |
| Nhắc nhở theo lịch (thiết kế: "Nhắc học hằng ngày 20:00") | Công tắc và giờ nhắc | `GET`/`PUT /api/study-plan/reminder` |

Mỗi khối tải và báo lỗi riêng (cùng nguyên tắc với `progress.md`): gợi ý lỗi thì kế hoạch vẫn hiện.

## Enum

| Trường | Giá trị | Cột |
|---|---|---|
| `plan.status` | `ACTIVE`, `PAUSED`, `COMPLETED` | `study_plans.status` (`active`, `paused`, `completed`) |
| `weeks[].status` | `PENDING` (chưa tới), `IN_PROGRESS` (tuần hiện tại), `DONE` (đã qua) | `study_plan_schedule.status` |
| `suggestion.type` | `PRACTICE_SKILL`, `LEARN_TOPIC`, `REVIEW_WORDS`, `TAKE_TEST` | không lưu, server tính mỗi lần gọi |
| `skill` (trong gợi ý) | `LISTENING`, `SPEAKING`, `READING`, `WRITING` | giống `tests.md` |

## Kế hoạch

### `GET /api/study-plan`

```json
{
  "plan": {
    "id": 5,
    "goal": { "targetLevel": "B1", "months": 3, "note": "Giao tiếp khi đi du lịch" },
    "startLevel": "A2",
    "startDate": "2026-09-13",
    "endDate": "2026-12-12",
    "status": "ACTIVE",
    "dailyMinutes": { "min": 20, "max": 30 },
    "summary": "Lộ trình 13 tuần từ A2 lên B1, ưu tiên Nói (điểm thấp nhất)…",
    "currentWeek": 3,
    "weeks": [
      {
        "weekNumber": 1,
        "startDate": "2026-09-13",
        "endDate": "2026-09-19",
        "description": "Làm quen: 40 từ chủ đề Du lịch, 5 bài ngữ pháp A2",
        "targetWords": 40,
        "targetExercises": 5,
        "wordsDone": 31,
        "exercisesDone": 3,
        "status": "DONE",
        "achieved": false
      }
    ]
  },
  "goalOptions": [
    { "targetLevel": "B1", "months": 3, "dailyMinutes": { "min": 20, "max": 30 }, "recommended": true },
    { "targetLevel": "B2", "months": 6, "dailyMinutes": { "min": 30, "max": 45 }, "recommended": false }
  ]
}
```

| Trường | Ý nghĩa |
|---|---|
| `plan` | Kế hoạch **đang dùng** (`ACTIVE` hoặc `PAUSED`, mới nhất) của người dùng; `null` khi chưa có (không phải `404`): giao diện hỏi mục tiêu |
| `goal.note` | `study_plans.goal_description`, người học tự ghi (tối đa 255 ký tự), có thể `null` |
| `startLevel` | `users.current_level` lúc tạo kế hoạch, `null` nếu khi đó chưa có trình độ |
| `endDate` | `startDate + months` tháng − 1 ngày. `startDate` là ngày tạo |
| `summary` | Lời khuyên AI viết lúc tạo lộ trình (lưu cùng kế hoạch, xem câu hỏi mở 2), có thể `null` |
| `currentWeek` | Số thứ tự tuần chứa hôm nay, `null` khi kế hoạch chưa bắt đầu hoặc đã qua `endDate` |
| `weeks` | Mọi tuần theo `weekNumber` (`study_plan_schedule`). Tuần 7 ngày tính từ `startDate` (không theo thứ Hai), tuần cuối có thể ngắn hơn |
| `weeks[].wordsDone`, `exercisesDone` | Tổng `user_progress.words_learned_count`, `exercises_completed_count` trong các ngày của tuần; `0` với tuần `PENDING` |
| `weeks[].achieved` | Chỉ có ở tuần `DONE`: `true` khi đạt cả hai mục tiêu; `null` với tuần chưa xong. Tuần `DONE` gần nhất có `false` → giao diện cảnh báo nhẹ (ngoại lệ D2) |
| `goalOptions` | 2 đến 3 mục tiêu gợi ý theo trình độ hiện tại (xem "Gợi ý giải pháp" 1), luôn trả, kể cả khi đã có kế hoạch (để "Đặt lại mục tiêu") |

### `POST /api/study-plan/preview` — AI gợi ý lộ trình (không lưu)

```json
{ "targetLevel": "B1", "months": 3, "note": "Giao tiếp khi đi du lịch" }
```

Trả `200` một bản nháp cùng dạng `plan` nhưng **không có** `id`, `status`, `currentWeek`, và các tuần không có
`wordsDone`, `exercisesDone`, `status`, `achieved`:

```json
{
  "goal": { "targetLevel": "B1", "months": 3, "note": "Giao tiếp khi đi du lịch" },
  "startLevel": "A2",
  "startDate": "2026-09-29",
  "endDate": "2026-12-28",
  "dailyMinutes": { "min": 20, "max": 30 },
  "summary": "Lộ trình 13 tuần…",
  "weeks": [
    { "weekNumber": 1, "startDate": "2026-09-29", "endDate": "2026-10-05", "description": "…", "targetWords": 40, "targetExercises": 5 }
  ]
}
```

- `targetLevel` phải **cao hơn hoặc bằng** trình độ hiện tại (bằng: "giữ vững trình độ"); `months` từ 1 đến 12; `note`
  tối đa 255 ký tự. Sai trả `400`.
- AI viết `summary` và `description` từng tuần; số mục tiêu tuần do server tính theo luật (xem "Gợi ý giải pháp" 2) để
  AI không đưa ra con số vô lý. AI lỗi hoặc quá 20 giây: dùng lộ trình dựng sẵn theo luật (không báo lỗi), `summary`
  khi đó có thể `null`. Chỉ trả `503` khi cả phần dựng sẵn cũng không chạy được.

### `POST /api/study-plan` — áp dụng kế hoạch

Body là bản nháp người học đã xem (để lưu đúng thứ đã hiện, vì gọi AI lần nữa sẽ ra câu chữ khác):

```json
{
  "targetLevel": "B1", "months": 3, "note": "Giao tiếp khi đi du lịch",
  "summary": "Lộ trình 13 tuần…",
  "weeks": [ { "weekNumber": 1, "description": "…", "targetWords": 40, "targetExercises": 5 } ]
}
```

- Server kiểm tra lại như `preview`, và: số tuần khớp `months`, `weekNumber` liên tục từ 1, `targetWords` 0–500,
  `targetExercises` 0–50, `description` 1–255 ký tự. Sai trả `400`. Server tự tính `startDate` (hôm nay), `endDate`, ngày
  của từng tuần và `startLevel`.
- Kế hoạch `ACTIVE`/`PAUSED` cũ (nếu có) chuyển `COMPLETED` (giữ lại, không xóa). Một người chỉ có một kế hoạch đang dùng.
- Trả `201` cùng dạng `plan` của `GET`.

### `PATCH /api/study-plan` — tạm dừng hoặc tiếp tục

```json
{ "status": "PAUSED" }
```

`status` là `PAUSED` hoặc `ACTIVE`. Trả `200` cùng dạng `plan`. `404` khi chưa có kế hoạch đang dùng. Tạm dừng không đổi
ngày các tuần; tuần trôi qua khi tạm dừng vẫn tính `achieved` nhưng giao diện không cảnh báo khi kế hoạch đang tạm dừng.

## Gợi ý việc nên làm

### `GET /api/study-plan/suggestions`

```json
{
  "items": [
    { "type": "PRACTICE_SKILL", "title": "Tập trung luyện Nói 15 phút/ngày", "reason": "Điểm yếu nhất trong 4 kỹ năng (38/100)", "skill": "SPEAKING" },
    { "type": "LEARN_TOPIC", "title": "Ôn tập chủ đề Kinh doanh", "reason": "Còn 18 từ chưa học", "topicId": 4 },
    { "type": "REVIEW_WORDS", "title": "Ôn 7 từ đến hạn hôm nay", "reason": "Ôn đúng hạn giúp nhớ lâu", "count": 7 },
    { "type": "TAKE_TEST", "title": "Làm bài kiểm tra tổng hợp", "reason": "Để biết trình độ và điểm từng kỹ năng", "testId": 200 }
  ]
}
```

- Tối đa 4 mục, việc quan trọng trước. Server viết sẵn `title`, `reason` bằng tiếng Việt; giao diện chỉ dựng nút
  "Bắt đầu" theo `type`: `PRACTICE_SKILL` → màn Bài tập (`LISTENING` → tab Nghe, `SPEAKING` → tab Phát âm, `READING` và
  `WRITING` → tab Ngữ pháp); `LEARN_TOPIC` → chủ đề `topicId`; `REVIEW_WORDS` → phiên ôn tập; `TAKE_TEST` → bài `testId`.
- Người mới: vẫn trả danh sách (ví dụ chỉ `TAKE_TEST` và `LEARN_TOPIC`), không trả `404`.

## Nhắc học

### `GET /api/study-plan/reminder` và `PUT /api/study-plan/reminder`

```json
{ "enabled": true, "time": "20:00" }
```

- Chưa đặt lần nào: `{ "enabled": false, "time": "20:00" }`. `PUT` nhận cùng dạng, `time` là `HH:mm` giờ Việt Nam, phút
  là `00` hoặc `30`; trả `200` giá trị đã lưu. Không cần có kế hoạch mới bật được nhắc.
- Cách gửi nhắc (thông báo trong ứng dụng, email…) chưa chốt (câu hỏi mở 3); giao diện đợt này chỉ lưu cài đặt.

## Thay đổi ở contract `progress.md`

`GET /api/progress/skills` thêm `latest.previousOverallScore`: điểm tổng của lượt kiểm tra tổng hợp **đã chấm xong**
ngay trước lượt `latest`, `null` nếu không có. Màn Kế hoạch dùng để hiện "Tăng 8 điểm so với lần kiểm tra trước" như
thiết kế.

## Gợi ý giải pháp

1. **Mục tiêu gợi ý** (`goalOptions`), theo trình độ hiện tại `L` (`users.current_level`; chưa có thì coi là A1):
   lên 1 bậc trong 3 tháng (20–30 phút/ngày, `recommended`), lên 2 bậc trong 6 tháng (30–45 phút/ngày). Ở C1 chỉ còn
   "C2 trong 6 tháng"; ở C2 là "giữ vững C2 trong 3 tháng". Người học vẫn tự chọn được trình độ khác và 1–12 tháng.
2. **Mục tiêu mỗi tuần** tính theo thời gian học mỗi ngày, không để AI tự đặt số: khoảng 1,5 từ và 0,2 bài tập cho mỗi
   phút/ngày (20–30 phút ≈ 40 từ, 5 bài/tuần; 30–45 phút ≈ 55 từ, 7 bài/tuần), tuần cuối có thể ít hơn để ôn tập.
3. **Gợi ý việc nên làm**: kỹ năng có điểm thấp nhất trong lần tổng hợp gần nhất; chủ đề còn nhiều từ chưa học nhất ở
   trình độ hiện tại (số liệu từ module A qua service, không đọc bảng `user_vocabulary`); từ đến hạn ôn hôm nay
   (`GET /api/learning/summary` hoặc service của module A); chưa làm bài tổng hợp hoặc lần gần nhất quá 30 ngày thì gợi
   ý làm bài.
4. **Nhắc học**: lưu cài đặt ở cột mới của `users` hoặc một bảng nhỏ `reminder_settings(user_id, enabled, time)`; mỗi
   ngày một tác vụ `@Scheduled` tạo dòng `reminders` (`type = 'study_plan'`, `scheduled_at` = hôm nay lúc `time`) cho
   người chưa học gì trong ngày. `@EnableScheduling` đã bật (xem README, lưu ý từ module A).

## Câu hỏi mở (Nhân chốt)

1. Đổi kế hoạch cũ sang `COMPLETED` khi đặt mục tiêu mới, hay giữ `PAUSED` để quay lại được?
2. `summary` lưu ở đâu: `study_plans` chưa có cột; đề xuất thêm `summary TEXT NULL` (migration mới).
3. Nhắc nhở gửi bằng cách nào cho buổi demo: thông báo trong ứng dụng (đọc bảng `reminders`) là đơn giản nhất.
4. Có dùng lại provider Groq của module B (Đạt) cho AI viết lộ trình không, hay mỗi module một provider?
