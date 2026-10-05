# API học flashcard và ôn tập (Phase 3: A1, A2) — contract

> Trạng thái: **bản 2 (02/10/2026), backend đã làm theo, frontend và dữ liệu giả chưa.** Bản 2 theo tài liệu phân tích
> thiết kế (`docs/English Learning System/`: Business model, kịch bản 5 và 6): đổi luật lên lịch ôn, thứ tự thẻ, bỏ giới
> hạn 20 thẻ, thêm nhật ký lượt ôn và `GET /api/learning/session-summary`. Xem "Thay đổi so với bản 1" cuối file. Backend:
> `LearningController` trong module `vocabulary`. Quy ước chung (xác thực, lỗi, enum chữ hoa, `PageResponse`,
> `VocabularyItem`) giống `docs/api/vocabulary.md`.

## Đánh giá thẻ: 3 mức (đã chốt 25/09/2026)

| Giá trị JSON | Nút trên giao diện | Cột `user_vocabulary.last_review_result` |
|---|---|---|
| `FORGOT` | Chưa nhớ | `forgot` |
| `VAGUE` | Nhớ mơ hồ | `vague` |
| `REMEMBERED` | Nhớ rõ | `remembered` |

Thiết kế LinguaStep vẽ 4 nút, nhưng nghiệp vụ A1 và schema chỉ có 3 mức, nên dùng 3.

## Quy tắc lên lịch ôn (Spaced Repetition)

Theo Business model ("Đánh giá ghi nhớ"). Gọi **k** là khoảng cách ôn hiện tại của từ, tính bằng ngày (cột
`user_vocabulary.interval_days`; từ chưa học có k = 0):

| Kết quả | Khoảng cách mới | Trạng thái mới |
|---|---|---|
| `FORGOT` | 1 ngày | `LEARNING` |
| `VAGUE` | max(1, k) (giữ nguyên) | `MASTERED` nếu khoảng cách mới ≥ 16 ngày, còn lại `LEARNING` |
| `REMEMBERED` | max(2, 2k) (gấp đôi) | như trên |

Khoảng cách tối đa 36 500 ngày. `nextReviewAt = hôm nay + khoảng cách mới`, tính từ **ngày ôn thật**, kể cả khi ôn trễ
(kịch bản 6, nhánh 3a: k = 4, ôn trễ 3 ngày, "Nhớ rõ" thì lịch mới là ngày ôn + 8). "Hôm nay" tính theo giờ
`Asia/Ho_Chi_Minh` (cột `DATE`). Lần đánh giá đầu tiên đặt `first_learned_at`; mỗi lần đánh giá tăng `review_count`,
đặt `last_reviewed_at` và ghi **một lượt ôn** (bảng `vocabulary_reviews`). Một từ **đến hạn** khi `nextReviewAt ≤ hôm nay`.

Từ mới chấm "Nhớ rõ" 4 lần liên tiếp: 2, 4, 8, 16 ngày, tức là thuộc ở lần thứ tư. Từ đã thuộc chấm "Chưa nhớ" thì về
`LEARNING`, khoảng cách 1 ngày.

## Đối tượng

### LearningCard

`VocabularyItem` cộng thêm trạng thái ôn của người dùng hiện tại:

```json
{
  "id": 101, "topicId": 1, "createdBy": null,
  "word": "revenue", "meaning": "doanh thu",
  "exampleSentence": "The company's revenue grew by 20% last year.",
  "phonetic": "/ˈrevənjuː/", "audioUrl": null, "imageUrl": null,
  "difficultyLevel": "B2",
  "learningStatus": "LEARNING",
  "lastReviewResult": "VAGUE",
  "reviewCount": 3,
  "nextReviewAt": "2026-09-25",
  "lastReviewedAt": "2026-09-22T08:15:00Z"
}
```

Từ chưa học: `learningStatus = NEW`, `lastReviewResult`, `nextReviewAt`, `lastReviewedAt` là `null`, `reviewCount = 0`.

## Endpoint

### `GET /api/learning/session` — lấy một phiên học

| Tham số | Ý nghĩa |
|---|---|
| `topicId` | Học theo chủ đề (A1) |
| `listId` | Học theo danh sách từ riêng (A3, xem `docs/api/custom-lists.md`) |
| (không có cả hai) | Ôn các từ đến hạn trên mọi chủ đề và danh sách (A2) |
| `size` | Không bắt buộc. Không gửi: **mọi** thẻ của phiên (kịch bản 5, 6 không giới hạn số thẻ). Gửi: số thẻ tối đa, `1` đến `500` |

Thứ tự thẻ (kịch bản 6, bước 2): **từ đến hạn trước**, theo kết quả đánh giá gần nhất **"Chưa nhớ" → "Nhớ mơ hồ" → "Nhớ
rõ"**, cùng kết quả thì `nextReviewAt` sớm nhất (quá hạn lâu nhất) trước; **sau đó đến từ mới**, từ dễ đến khó như danh
sách từ của chủ đề (theo `difficultyLevel` rồi `word`, xem `GET /api/vocabulary`). Từ đã học nhưng chưa đến hạn không vào
phiên. Chế độ ôn (A2) chỉ có từ đến hạn.

```json
{
  "source": { "type": "TOPIC", "id": 1, "name": "Du lịch" },
  "startedAt": "2026-10-06T13:00:00.120Z",
  "cards": [ { "...": "LearningCard" } ]
}
```

`startedAt`: thời điểm server tạo phiên. Frontend giữ lại để hỏi `session-summary` khi người học bấm "Kết thúc" hoặc học
hết thẻ.

`source.type` là `TOPIC`, `LIST` hoặc `DUE` (với `DUE` thì `id`, `name` là `null`). `cards` rỗng khi không còn từ để học.
`404` nếu chủ đề hoặc danh sách không tồn tại (danh sách của người khác cũng trả `404`); `400` nếu gửi cả `topicId` lẫn
`listId`, hoặc `size` sai.

### `POST /api/learning/reviews` — ghi kết quả một thẻ

```json
{ "vocabularyId": 101, "result": "VAGUE" }
```

Trả `200`:

```json
{
  "vocabularyId": 101,
  "learningStatus": "LEARNING",
  "lastReviewResult": "VAGUE",
  "reviewCount": 4,
  "intervalDays": 4,
  "nextReviewAt": "2026-10-10"
}
```

Mỗi thẻ được lưu **ngay khi đánh giá**, nên người học thoát giữa phiên vẫn giữ tiến độ các từ đã đánh giá (ngoại lệ
của A1). `400` nếu `result` sai; `404` nếu từ không tồn tại hoặc người dùng không được thấy. `409` khi hai lần đánh
giá **đầu tiên** của cùng một từ đến cùng lúc (ví dụ từ hai tab): ràng buộc `UNIQUE (user_id, vocabulary_id)` chặn lần
thứ hai, đánh giá lại thì thành công (frontend hiện "Vui lòng đánh giá lại" cho mọi lỗi khi lưu).

### `GET /api/learning/summary` — nhắc ôn và thống kê

```json
{
  "dueToday": 12,
  "learningCount": 20,
  "masteredCount": 15,
  "reviewedToday": 8,
  "upcoming": [ { "date": "2026-09-26", "count": 3 }, { "date": "2026-09-27", "count": 0 } ]
}
```

`dueToday`: số từ đến hạn (A2: khác 0 thì hiện nhắc "Bạn có N từ cần ôn hôm nay"). `upcoming`: đúng 7 phần tử cho 7 ngày
kế tiếp (bắt đầu từ ngày mai), số từ đến hạn đúng ngày đó. `reviewedToday`: số từ có `lastReviewedAt` trong hôm nay
(theo giờ Việt Nam, như mọi chỗ khác nói "hôm nay"; lần ôn lúc 6 giờ sáng là 23 giờ hôm trước theo UTC).

### `GET /api/learning/session-summary?since=…` — tổng kết phiên (kịch bản 5 bước 9, kịch bản 6 bước 6)

`since` (bắt buộc): thời điểm ISO 8601, thường là `startedAt` của phiên. Trả `200`:

```json
{
  "since": "2026-10-06T13:00:00.120Z",
  "reviewedCount": 4,
  "results": { "FORGOT": 1, "VAGUE": 1, "REMEMBERED": 2 },
  "dueTomorrow": { "date": "2026-10-07", "count": 1, "words": ["departure"] }
}
```

- `reviewedCount`, `results`: số **lượt ôn** của người dùng từ `since` đến nay, theo từng mức (đủ 3 khóa, mức không có
  lượt nào là `0`). Đánh giá lại cùng một từ trong phiên tính hai lượt.
- `dueTomorrow`: dòng "Cần ôn vào ngày mai": số từ có `nextReviewAt ≤ ngày mai` (gồm cả từ đến hạn hôm nay chưa ôn, vì
  ngày mai chúng vẫn đến hạn), `words` là tối đa 20 từ đầu tiên theo `nextReviewAt` rồi `word`.

`400` nếu thiếu `since` hoặc sai định dạng.

### `GET /api/learning/history` — lịch sử học

| Tham số | Ý nghĩa |
|---|---|
| `status` | `LEARNING` hoặc `MASTERED`: chỉ các từ đang ở trạng thái đó (thẻ "Đang học", "Đã thuộc") |
| `reviewedToday` | `true`: chỉ các từ có `lastReviewedAt` trong hôm nay (thẻ "Đã ôn hôm nay"). Không gửi hoặc `false`: không lọc |
| `page`, `size` | Như `GET /api/vocabulary` |

Trả `PageResponse<LearningCard>` gồm các từ người dùng đã đánh giá ít nhất một lần và khớp mọi bộ lọc đã gửi, sắp theo
`lastReviewedAt` mới nhất trước. `totalItems` khi lọc phải bằng số tương ứng của `summary` (`learningCount`,
`masteredCount`, `reviewedToday`), vì giao diện hiện hai con số này cạnh nhau. `400` nếu `status` hoặc `reviewedToday`
sai giá trị.

### Từ bị admin ẩn (kịch bản 21 bước 8)

Khi admin xóa một từ đã có người học, từ chỉ bị ẩn (`docs/api/admin.md`, `DELETE /api/vocabulary/{id}`). Từ ẩn **không
còn** vào phiên học (theo chủ đề, theo danh sách riêng), phiên ôn từ đến hạn, `dueToday`, `upcoming`, `dueTomorrow` của
`session-summary`, trò chơi, tìm kiếm và danh sách riêng. Trạng thái học và lượt ôn cũ **giữ nguyên**: từ vẫn tính
trong `learningCount`, `masteredCount` và vẫn hiện trong `history`.

## Frontend dùng như thế nào

| Màn hình | Gọi |
|---|---|
| Nhắc ôn trên trang chủ và màn Từ vựng | `GET /api/learning/summary` (ẩn khi `dueToday = 0`) |
| Nút "Học N từ" ở chi tiết chủ đề | Tính từ `Topic`: `dueCount + wordCount − learnedCount` (bản 1: tối đa 20, frontend chưa sửa) |
| Phiên flashcard | `GET /api/learning/session`, rồi `POST /api/learning/reviews` cho từng thẻ |
| Tổng kết phiên ("Kết thúc" hoặc hết thẻ) | `GET /api/learning/session-summary?since=<startedAt>` (frontend hiện tự đếm, chưa gọi) |
| Tab "Lịch sử học" | `GET /api/learning/summary` và `GET /api/learning/history` |
| Bấm thẻ "Đang học", "Đã thuộc", "Đã ôn hôm nay" | `GET /api/learning/history?status=LEARNING`, `?status=MASTERED`, `?reviewedToday=true` |

Sau mỗi lần đánh giá, frontend làm mới dữ liệu chủ đề, danh sách và thống kê (số từ đã học thay đổi).

## Cho module khác: sự kiện `WordReviewedEvent`

Mỗi lần `POST /api/learning/reviews` thành công, module `vocabulary` phát `common.event.WordReviewedEvent`
(`userId`, `vocabularyId`, `result`, `learningStatus`, `firstReview`, `studyDate`, `reviewedAt`). Module Tiến độ
(Nhân) chỉ cần phụ thuộc `common`, không gọi vào `vocabulary`:

```java
@Component
class WordReviewedListener {
    // AFTER_COMMIT: chỉ đếm lần đánh giá đã lưu thật; lưu thất bại thì không cộng.
    // Listener chạy sau khi transaction của vocabulary đã kết thúc, nên muốn ghi DB thì cần transaction mới.
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    void on(WordReviewedEvent event) {
        if (event.firstReview()) {
            // cộng 1 vào user_progress.words_learned_count của (event.userId(), event.studyDate())
        }
    }
}
```

`studyDate` là ngày theo giờ Việt Nam, đúng khóa `(user_id, date)` của `user_progress`. `firstReview` là `true` ở lần
đầu người học đánh giá từ đó, tức lúc từ bắt đầu được tính là "đã học".

## Cho module khác: nhật ký lượt ôn

Bảng `vocabulary_reviews` (`user_vocabulary_id`, `result` chữ thường, `reviewed_at TIMESTAMPTZ`; migration
`V202610021000`) ghi mọi lần đánh giá thẻ. Module Tiến độ không đọc thẳng bảng này (quy ước: không truy cập repository
của module khác); cần số liệu thì dùng `WordReviewedEvent` ở trên hoặc nhờ Hồng mở hàm service.

## Backend Phase 3 (đã làm)

1. Migration `V202609252000__add_interval_days_to_user_vocabulary.sql`: cột `interval_days` (bậc ôn tính bằng ngày,
   `NULL` khi chưa ôn), đã ghi vào `docs/starter/Database.md`.
2. Entity `UserVocabulary` đủ cột, converter chữ thường cho `status` và `last_review_result`.
3. `ReviewScheduler`: logic thuần. Bản 2: `ReviewSchedulerTests` kiểm tra đúng các từ và ngày của kịch bản 5, 6
   (`frontend/mock/scheduler.js` vẫn theo bản 1).
4. Bốn endpoint trên (`LearningController`, `LearningService`), người dùng lấy qua `CurrentUser`, "hôm nay" qua
   `StudyCalendar` (giờ Việt Nam). Thống kê của `summary` tính trong một truy vấn; `learningCount`, `masteredCount`,
   `reviewedToday` dùng đúng điều kiện của `history` nên các tổng luôn khớp.
5. `WordReviewedEvent` ở `common.event` (xem mục trên).
6. Bản 2 (02/10/2026): migration `V202610021000__add_vocabulary_reviews.sql` tạo `vocabulary_reviews` và chuyển các từ
   đang có `interval_days ≥ 16` sang `mastered` (với luật mới `interval_days` chính là k, nên mọi khoảng cách đã lưu
   vẫn dùng tiếp được). `LearningApiTests`, `LearningPostgresIntegrationTests` kiểm tra thứ tự thẻ, phiên không giới
   hạn, luật ôn đến lúc thuộc, nhật ký lượt ôn và `session-summary`.

## Thay đổi so với bản 1

| Chỗ | Bản 1 | Bản 2 (02/10/2026) |
|---|---|---|
| Luật ôn | Bậc 1/3/7/14/30 ngày, thuộc ở bậc 30 | k giữ, gấp đôi hoặc về 1; thuộc khi k ≥ 16 |
| `intervalDays` sau 2 lần "Nhớ rõ" | 3 | 4 |
| Thứ tự từ đến hạn | "Nhớ mơ hồ" trước | "Chưa nhớ" → "Nhớ mơ hồ" → "Nhớ rõ" |
| Số thẻ một phiên | Mặc định 20, tối đa 50 | Không gửi `size`: mọi thẻ; gửi thì tối đa 500 |
| Phiên | `source`, `cards` | thêm `startedAt` |
| Lượt ôn | Không lưu | Bảng `vocabulary_reviews` |
| Tổng kết phiên | Frontend tự đếm | `GET /api/learning/session-summary` |

**Giao diện chỉ sửa tối thiểu theo bản 2** (03/10/2026, người dùng chọn tập trung backend, giữ giao diện): nút "Học N từ"
không còn tối đa 20. Màn tổng kết phiên vẫn tự đếm các thẻ vừa đánh giá và lấy dòng "Cần ôn vào ngày mai" từ
`summary.upcoming[0]` (từ đến hạn đúng ngày mai), chưa gọi `session-summary` (từ đến hạn đến hết ngày mai, kèm tên).
Dữ liệu giả `frontend/mock/` đã theo bản 2 (luật ôn, thứ tự, không giới hạn thẻ, `startedAt`, `session-summary`).
