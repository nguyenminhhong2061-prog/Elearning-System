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

**Bản 2 (01/10/2026, theo kịch bản 17 và 18 của `docs/English Learning System/Analysis/Scenarios.md`):** mục tiêu nhập
bằng ngày bắt đầu, ngày kết thúc và mô tả bắt buộc (thay số tháng và ghi chú không bắt buộc); chọn được mọi trình độ;
tuần chạy thứ Hai đến Chủ nhật; người học sửa được mục tiêu từng tuần trước khi áp dụng và sau đó ("Điều chỉnh kế
hoạch"); AI lỗi thì người học tự lập kế hoạch; kế hoạch cũ chuyển **tạm dừng** khi áp dụng kế hoạch mới; nhắc nhở là
8:00 thứ Hai đầu mỗi tuần (bỏ "Nhắc học hằng ngày"). Mục "Thay đổi so với bản 1" ở cuối liệt kê đủ.

| Bước | Màn hình | API |
|---|---|---|
| Xem trình độ, điểm 4 kỹ năng | Khối "Trình độ hiện tại" | `GET /api/progress/skills` (contract `progress.md`) |
| Gợi ý việc nên làm ngay | Khối "Việc nên làm" | `GET /api/study-plan/suggestions` |
| Chưa có kế hoạch → hỏi mục tiêu (KB 17 bước 2) | Khối "Đặt mục tiêu học tập": thẻ mục tiêu gợi ý (điền nhanh trình độ và ngày), "Mục tiêu khác" (A1–C2), "Mô tả mục tiêu", "Ngày bắt đầu", "Ngày kết thúc" | `GET /api/study-plan` (`plan: null`, `goalOptions`) |
| AI gợi ý lộ trình (bước 4–6) | Bấm "Gợi ý lộ trình": bảng các tuần để xem trước, sửa được hai ô mục tiêu | `POST /api/study-plan/preview` (không lưu) |
| AI lỗi (nhánh 5a) | Báo lỗi, nút "Tự lập kế hoạch": các tuần trống để tự nhập | Không gọi API cho tới khi áp dụng |
| Xác nhận (bước 7–9) | "Áp dụng kế hoạch" | `POST /api/study-plan` |
| Đến từ báo cáo kiểm tra tổng hợp (nhánh 2a, 2b) | Form điền sẵn trình độ mục tiêu và lộ trình đề xuất; đang có kế hoạch thì hỏi trước | `POST .../preview` kèm `fromAttemptId` |
| Theo dõi (KB 18 bước 3) | Khối "Kế hoạch của bạn": mục tiêu, trình độ, thời gian, trạng thái, tuần này hoặc "chưa bắt đầu", lịch trình, dòng nhắc nhở | `GET /api/study-plan` |
| Điều chỉnh (KB 18 bước 4–8) | "Điều chỉnh kế hoạch": sửa mục tiêu các tuần chưa qua, đổi ngày kết thúc | `PUT /api/study-plan/schedule` |
| Tạm dừng, tiếp tục, kết thúc (KB 18 nhánh 5a, 5b) | Hộp thoại xác nhận | `PATCH /api/study-plan` |
| Không đạt mục tiêu tuần (KB 18 nhánh 1a) | Cảnh báo nhẹ trong khối kế hoạch và trên trang Tiến độ | trường `weeks[].achieved` |
| Nhắc nhở (KB 17 bước 8) | Dòng "Nhắc nhở: 8:00 thứ Hai đầu mỗi tuần"; trang Tiến độ nhắc mục tiêu tuần này | Không có API riêng: server tạo dòng `reminders` |

Mỗi khối tải và báo lỗi riêng (cùng nguyên tắc với `progress.md`): gợi ý lỗi thì kế hoạch vẫn hiện.

## Enum

| Trường | Giá trị | Cột |
|---|---|---|
| `plan.status` | `ACTIVE`, `PAUSED`, `COMPLETED` | `study_plans.status` (`active`, `paused`, `completed`) |
| `weeks[].status` | `PENDING` (chưa tới), `IN_PROGRESS` (tuần hiện tại), `DONE` (đã qua) | `study_plan_schedule.status` |
| `suggestion.type` | `PRACTICE_SKILL`, `LEARN_TOPIC`, `REVIEW_WORDS`, `TAKE_TEST` | không lưu, server tính mỗi lần gọi |
| `skill` (trong gợi ý) | `LISTENING`, `SPEAKING`, `READING`, `WRITING` | giống `tests.md` |

## Kế hoạch

**Tuần của kế hoạch** chạy **thứ Hai đến Chủ nhật** (giờ Việt Nam), tuần đầu và tuần cuối cắt theo ngày bắt đầu và ngày
kết thúc. Ví dụ 12/10/2026 (thứ Hai) đến 03/01/2027 (Chủ nhật) là 12 tuần đủ; bắt đầu 08/10 (thứ Năm) thì tuần 1 là
08/10–11/10. Server và giao diện tính giống nhau (giao diện hiện số tuần ngay khi chọn ngày).

### `GET /api/study-plan`

```json
{
  "plan": {
    "id": 5,
    "goal": { "targetLevel": "B2", "description": "Đạt B2 để phỏng vấn học bổng vào tháng 1/2027" },
    "startLevel": "B1",
    "startDate": "2026-10-12",
    "endDate": "2027-01-03",
    "status": "ACTIVE",
    "dailyMinutes": { "min": 20, "max": 30 },
    "summary": "Lộ trình 12 tuần từ B1 lên B2, ưu tiên Nói (điểm thấp nhất)…",
    "currentWeek": 3,
    "weeks": [
      {
        "weekNumber": 1,
        "startDate": "2026-10-12",
        "endDate": "2026-10-18",
        "description": "Từ vựng Công việc; câu bị động; nghe hội thoại công sở",
        "targetWords": 40,
        "targetExercises": 6,
        "wordsDone": 41,
        "exercisesDone": 6,
        "status": "DONE",
        "achieved": true
      }
    ]
  },
  "goalOptions": [
    { "targetLevel": "B2", "months": 3, "dailyMinutes": { "min": 20, "max": 30 }, "recommended": true },
    { "targetLevel": "C1", "months": 6, "dailyMinutes": { "min": 30, "max": 45 }, "recommended": false }
  ]
}
```

| Trường | Ý nghĩa |
|---|---|
| `plan` | Kế hoạch người học đang theo: kế hoạch `ACTIVE`; không có thì kế hoạch `PAUSED` mới nhất; không có nữa thì `null` (không phải `404`): giao diện hỏi mục tiêu. Kế hoạch `COMPLETED` không trả |
| `goal.description` | `study_plans.goal_description`, bắt buộc, tối đa 255 ký tự |
| `startLevel` | `users.current_level` lúc tạo kế hoạch, `null` nếu khi đó chưa có trình độ |
| `startDate`, `endDate` | Người học chọn (KB 17 bước 3); `endDate` đổi được khi điều chỉnh |
| `dailyMinutes` | Server ước lượng theo số bậc cần lên và độ dài kế hoạch (xem "Gợi ý giải pháp" 2) |
| `summary` | Lời khuyên AI viết lúc tạo lộ trình (lưu cùng kế hoạch, xem câu hỏi mở 2); `null` với kế hoạch tự lập |
| `currentWeek` | Số thứ tự tuần chứa hôm nay; `null` khi kế hoạch **chưa bắt đầu** (giao diện hiện "Tuần hiện tại: chưa bắt đầu") hoặc đã qua `endDate` |
| `weeks` | Mọi tuần theo `weekNumber` (`study_plan_schedule`) |
| `weeks[].description` | Nội dung học của tuần; có thể rỗng với kế hoạch tự lập |
| `weeks[].wordsDone`, `exercisesDone` | Tổng `user_progress.words_learned_count`, `exercises_completed_count` trong các ngày của tuần; `0` với tuần `PENDING` |
| `weeks[].achieved` | Chỉ có ở tuần `DONE`: `true` khi đạt cả hai mục tiêu; `null` với tuần chưa xong. Tuần `DONE` gần nhất có `false` → giao diện cảnh báo nhẹ "Tuần 2 chưa đạt mục tiêu (32/40 từ, 4/6 bài)" (KB 18 nhánh 1a) |
| `goalOptions` | 2 đến 3 mục tiêu gợi ý theo trình độ hiện tại (xem "Gợi ý giải pháp" 1), luôn trả. Chọn một thẻ thì giao diện điền trình độ, ngày bắt đầu hôm nay và ngày kết thúc sau `months` tháng |

### `POST /api/study-plan/preview` — AI gợi ý lộ trình (không lưu)

```json
{
  "targetLevel": "B2",
  "startDate": "2026-10-12",
  "endDate": "2027-01-03",
  "description": "Đạt B2 để phỏng vấn học bổng vào tháng 1/2027",
  "fromAttemptId": 57
}
```

Luật (KB 17 bước 4, nhánh 4a, 4b; giao diện kiểm tra trước và báo lỗi dưới từng ô, server kiểm tra lại, sai trả `400`):

- `targetLevel`: **mọi trình độ A1–C2**. Không cao hơn trình độ hiện tại vẫn hợp lệ (người học củng cố trình độ); giao
  diện chỉ cảnh báo.
- `description`: bắt buộc, 1–255 ký tự sau khi cắt khoảng trắng.
- `startDate` **không trước hôm nay**; `endDate` **sau** `startDate`; dài tối đa 366 ngày.
- `fromAttemptId` (không bắt buộc, KB 17 nhánh 2a): lượt kiểm tra tổng hợp của chính người học đã chấm xong. Server đọc
  lộ trình đề xuất (`suggestedRoadmap`) của lượt đó và đưa cho AI để chia theo tuần. Lượt không phải của người gọi hoặc
  chưa chấm: `400`.

Trả `200` một bản nháp cùng dạng `plan` nhưng **không có** `id`, `status`, `currentWeek`, và các tuần không có
`wordsDone`, `exercisesDone`, `status`, `achieved`:

```json
{
  "goal": { "targetLevel": "B2", "description": "Đạt B2 để phỏng vấn học bổng vào tháng 1/2027" },
  "startLevel": "B1",
  "startDate": "2026-10-12",
  "endDate": "2027-01-03",
  "dailyMinutes": { "min": 20, "max": 30 },
  "summary": "Lộ trình 12 tuần…",
  "weeks": [
    { "weekNumber": 1, "startDate": "2026-10-12", "endDate": "2026-10-18", "description": "…", "targetWords": 50, "targetExercises": 6 }
  ]
}
```

- AI viết `summary` và `description` từng tuần; số mục tiêu tuần do server tính theo luật (xem "Gợi ý giải pháp" 2) để
  AI không đưa ra con số vô lý.
- **AI lỗi hoặc quá 20 giây: trả `503`** (KB 17 nhánh 5a). Giao diện báo "Trợ lý AI chưa gợi ý được lộ trình lúc này.
  Vui lòng thử lại sau." và cho chọn: bấm lại "Gợi ý lộ trình", hoặc "Tự lập kế hoạch" (giao diện tự dựng các tuần trống
  theo luật tuần ở trên, không gọi API). Bản 1 dùng lộ trình dựng sẵn khi AI lỗi; bản 2 bỏ, theo kịch bản.

### `POST /api/study-plan` — áp dụng kế hoạch

Body là bản nháp người học đã xem, **kèm các mục tiêu tuần người học đã sửa** (KB 17 bước 7), để lưu đúng thứ đã hiện:

```json
{
  "targetLevel": "B2",
  "startDate": "2026-10-12",
  "endDate": "2027-01-03",
  "description": "Đạt B2 để phỏng vấn học bổng vào tháng 1/2027",
  "summary": "Lộ trình 12 tuần…",
  "weeks": [ { "weekNumber": 1, "description": "…", "targetWords": 40, "targetExercises": 6 } ]
}
```

- Server kiểm tra lại như `preview`, và: số tuần khớp ngày (luật tuần ở trên), `weekNumber` liên tục từ 1,
  `targetWords` số nguyên 0–500, `targetExercises` số nguyên 0–50, `description` 0–255 ký tự (rỗng được, cho kế hoạch tự
  lập), `summary` có thể `null`. Sai trả `400` (KB 17 nhánh 8a; giao diện báo lỗi tại ô trước khi gửi). Server tự tính
  ngày của từng tuần, `startLevel`, `dailyMinutes`.
- **Kế hoạch `ACTIVE` cũ (nếu có) chuyển `PAUSED`**, không xóa (KB 17 nhánh 2b: mỗi người tối đa một kế hoạch đang
  thực hiện). Nhắc nhở chưa gửi của kế hoạch cũ bị hủy.
- Tạo **một nhắc nhở mỗi tuần** (`reminders`, `type = 'study_plan'`): 8:00 thứ Hai của tuần (tuần đầu bắt đầu giữa tuần
  thì 8:00 ngày bắt đầu), nội dung là mục tiêu tuần đó, ví dụ "Tuần 3: mục tiêu 50 từ mới, 7 bài tập".
- Trả `201` cùng dạng `plan` của `GET`.

### `PUT /api/study-plan/schedule` — điều chỉnh kế hoạch (KB 18)

```json
{
  "endDate": "2027-01-03",
  "weeks": [
    { "weekNumber": 3, "description": "Từ vựng Giáo dục; câu điều kiện", "targetWords": 40, "targetExercises": 7 },
    { "weekNumber": 4, "description": "…", "targetWords": 40, "targetExercises": 7 }
  ]
}
```

- Áp dụng cho kế hoạch đang theo (`ACTIVE` hoặc `PAUSED`); không có thì `404`.
- `endDate`: không trước hôm nay, sau `startDate`, dài tối đa 366 ngày. Đổi `endDate` thì tính lại các tuần theo luật
  tuần: **rút ngắn** thì các tuần sau ngày mới bị xóa; **kéo dài** thì thêm tuần mới (KB 18 nhánh 6b).
- `weeks`: **đúng các tuần chưa qua** của lịch mới (tuần có `endDate` từ hôm nay trở đi, kể cả tuần hiện tại), theo thứ
  tự, cùng luật kiểm tra như `POST`. Tuần đã qua giữ nguyên, không gửi; gửi thừa, thiếu hay sai số thứ tự thì `400`.
- Cập nhật nội dung các nhắc nhở **chưa gửi** theo mục tiêu mới, thêm hoặc xóa nhắc nhở của tuần được thêm hoặc bị xóa
  (KB 18 bước 7: nhắc nhở tuần hiện tại đã gửi thì giữ nguyên).
- Trả `200` cùng dạng `plan`.

### `PATCH /api/study-plan` — tạm dừng, tiếp tục hoặc kết thúc

```json
{ "status": "PAUSED" }
```

- `status` là `PAUSED`, `ACTIVE` hoặc `COMPLETED`. Trả `200` cùng dạng `plan`. `404` khi chưa có kế hoạch đang theo.
- `PAUSED` (KB 18 nhánh 5a): ngừng các nhắc nhở chưa gửi; ngày các tuần không đổi; tuần trôi qua khi tạm dừng vẫn tính
  `achieved` nhưng giao diện không cảnh báo khi kế hoạch đang tạm dừng. `ACTIVE`: nhắc nhở của các tuần chưa tới chạy
  lại.
- `COMPLETED` (KB 18 nhánh 5b): hủy nhắc nhở chưa gửi; kế hoạch không còn được `GET` trả về, người học lập kế hoạch mới.
- Giao diện hỏi xác nhận trước khi tạm dừng và kết thúc; tiếp tục thì không hỏi.

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
  "Bắt đầu" theo `type`: `PRACTICE_SKILL` → màn Bài tập (`LISTENING` → tab Nghe hiểu, `SPEAKING` → tab Phát âm, `READING`
  → tab Đọc hiểu, `WRITING` → tab Viết; 02/10, trước đây cả hai vào tab Ngữ pháp); `LEARN_TOPIC` → chủ đề `topicId`;
  `REVIEW_WORDS` → phiên ôn tập; `TAKE_TEST` → bài `testId`.
- Người mới: vẫn trả danh sách (ví dụ chỉ `TAKE_TEST` và `LEARN_TOPIC`), không trả `404`.

## Nhắc học

Bản 1 có `GET`/`PUT /api/study-plan/reminder` (nhắc học hằng ngày, chọn giờ). **Bản 2 bỏ hai endpoint này**: kịch bản 17
bước 8 thay thẻ "Nhắc học hằng ngày" bằng dòng "Nhắc nhở: 8:00 thứ Hai đầu mỗi tuần", và nhắc nhở do server tạo theo
từng tuần của kế hoạch (xem `POST /api/study-plan`). Trang Tiến độ đọc `GET /api/study-plan` để nhắc mục tiêu tuần này
và tuần vừa chưa đạt (KB 18 bước 1), không cần API riêng.

## Thay đổi ở contract `progress.md`

`GET /api/progress/skills` thêm `latest.previousOverallScore`: điểm tổng của lượt kiểm tra tổng hợp **đã chấm xong**
ngay trước lượt `latest`, `null` nếu không có. Màn Kế hoạch dùng để hiện "Tăng 8 điểm so với lần kiểm tra trước" như
thiết kế.

## Gợi ý giải pháp

1. **Mục tiêu gợi ý** (`goalOptions`), theo trình độ hiện tại `L` (`users.current_level`; chưa có thì coi là A1):
   lên 1 bậc trong 3 tháng (20–30 phút/ngày, `recommended`), lên 2 bậc trong 6 tháng (30–45 phút/ngày). Ở C1 chỉ còn
   "C2 trong 6 tháng"; ở C2 là "giữ vững C2 trong 3 tháng". Người học vẫn tự chọn được mọi trình độ và ngày bất kỳ
   trong một năm.
2. **Mục tiêu mỗi tuần** tính theo thời gian học mỗi ngày, không để AI tự đặt số: khoảng 1,5 từ và 0,2 bài tập cho mỗi
   phút/ngày (20–30 phút ≈ 40 từ, 5 bài/tuần; 30–45 phút ≈ 55 từ, 7 bài/tuần), tuần ngắn (tuần đầu, tuần cuối bị cắt)
   tính theo số ngày, tuần cuối có thể ít hơn để ôn tập. `dailyMinutes` ước lượng từ số bậc cần lên chia cho số tháng
   (`endDate − startDate`).
3. **Gợi ý việc nên làm**: kỹ năng có điểm thấp nhất trong lần tổng hợp gần nhất; chủ đề còn nhiều từ chưa học nhất ở
   trình độ hiện tại (số liệu từ module A qua service, không đọc bảng `user_vocabulary`); từ đến hạn ôn hôm nay
   (`GET /api/learning/summary` hoặc service của module A); chưa làm bài tổng hợp hoặc lần gần nhất quá 30 ngày thì gợi
   ý làm bài.
4. **Nhắc nhở theo tuần**: tạo sẵn các dòng `reminders` (`type = 'study_plan'`, `scheduled_at` = 8:00 thứ Hai của
   tuần, `reference_id` = id kế hoạch, `is_sent = false`) khi áp dụng kế hoạch; một tác vụ `@Scheduled` mỗi sáng đánh
   dấu các dòng đến giờ là đã gửi (giao diện đọc như thông báo trong ứng dụng). Tạm dừng, kết thúc thì xóa các dòng
   chưa gửi (tiếp tục thì tạo lại cho các tuần chưa tới); điều chỉnh thì sửa `message` của các dòng chưa gửi.
   `@EnableScheduling` đã bật (xem README, lưu ý từ module A).

## Câu hỏi mở (Nhân chốt)

1. ~~Đổi kế hoạch cũ sang `COMPLETED` hay `PAUSED` khi đặt mục tiêu mới?~~ Kịch bản 17 nhánh 2b chốt `PAUSED`.
2. `summary` lưu ở đâu: `study_plans` chưa có cột; đề xuất thêm `summary TEXT NULL` (migration mới).
3. Nhắc nhở gửi bằng cách nào cho buổi demo: thông báo trong ứng dụng (đọc bảng `reminders`) là đơn giản nhất.
4. Có dùng lại provider Groq của module B (Đạt) cho AI viết lộ trình không, hay mỗi module một provider?
5. Nhắc nhở bị hủy (tạm dừng, kết thúc kế hoạch): xóa dòng `reminders` chưa gửi (`is_sent = false`) như gợi ý 4, hay
   thêm trạng thái "đã hủy" để giữ lịch sử?

## Thay đổi so với bản 1 (01/10/2026)

| Bản 1 | Bản 2 | Theo |
|---|---|---|
| Mục tiêu: `months` (1–12), `note` không bắt buộc | `startDate`, `endDate`, `description` bắt buộc | KB 17 bước 2–4 |
| Chỉ chọn trình độ từ hiện tại trở lên | Mọi trình độ, giao diện cảnh báo | KB 17 nhánh 4b |
| Tuần 7 ngày tính từ ngày tạo, kế hoạch bắt đầu hôm nay | Tuần thứ Hai–Chủ nhật, bắt đầu từ `startDate` (có thể trong tương lai, `currentWeek = null`) | KB 17 bước 6, 9 |
| AI lỗi: lộ trình dựng sẵn | `503`, người học "Tự lập kế hoạch" | KB 17 nhánh 5a |
| Không sửa được mục tiêu tuần | Sửa ở bản xem trước (`POST` nhận số đã sửa) và sau này (`PUT .../schedule`) | KB 17 bước 7, KB 18 |
| Kế hoạch cũ `COMPLETED` | Kế hoạch cũ `PAUSED` | KB 17 nhánh 2b |
| `PATCH` chỉ `PAUSED`/`ACTIVE` | Thêm `COMPLETED` (kết thúc kế hoạch) | KB 18 nhánh 5b |
| Nhắc học hằng ngày, `GET`/`PUT .../reminder` | Bỏ; nhắc 8:00 thứ Hai mỗi tuần do server tạo | KB 17 bước 8 |
| Không có | `fromAttemptId`: dùng lộ trình của bài kiểm tra tổng hợp | KB 17 nhánh 2a |
