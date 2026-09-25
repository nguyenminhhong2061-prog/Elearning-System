# API học flashcard và ôn tập (Phase 3: A1, A2) — contract

> Trạng thái: **đã chốt cho frontend, backend chưa làm.** Frontend (`frontend/src/features/vocabulary/`) viết theo
> tài liệu này; `npm run dev:mock` trong `frontend/` trả dữ liệu giả đúng định dạng. Quy ước chung (xác thực, lỗi,
> enum chữ hoa, `PageResponse`, `VocabularyItem`) giống `docs/api/vocabulary.md`.

## Đánh giá thẻ: 3 mức (đã chốt 25/09/2026)

| Giá trị JSON | Nút trên giao diện | Cột `user_vocabulary.last_review_result` |
|---|---|---|
| `FORGOT` | Chưa nhớ | `forgot` |
| `VAGUE` | Nhớ mơ hồ | `vague` |
| `REMEMBERED` | Nhớ rõ | `remembered` |

Thiết kế LinguaStep vẽ 4 nút, nhưng nghiệp vụ A1 và schema chỉ có 3 mức, nên dùng 3.

## Quy tắc lên lịch ôn (Spaced Repetition)

Mỗi từ của một người học có một **bậc** (0 đến 4) tương ứng khoảng cách **1, 3, 7, 14, 30 ngày**. Cần thêm cột
`interval_days` (hoặc lưu bậc) vào `user_vocabulary` vì không suy ra được bậc từ các cột hiện có.

| Kết quả | Bậc mới | Trạng thái mới |
|---|---|---|
| `FORGOT` | 0 | `LEARNING` |
| `VAGUE` | giữ bậc hiện tại (từ mới: 0) | `LEARNING` |
| `REMEMBERED` | bậc hiện tại + 1 (từ mới: 1), tối đa 4 | `MASTERED` nếu đạt bậc 4, còn lại `LEARNING` |

`nextReviewAt = hôm nay + khoảng cách của bậc mới`, với "hôm nay" tính theo giờ `Asia/Ho_Chi_Minh` (cột `DATE`).
Lần đánh giá đầu tiên đặt `first_learned_at`; mỗi lần đánh giá tăng `review_count` và đặt `last_reviewed_at`.
Một từ **đến hạn** khi `nextReviewAt ≤ hôm nay`.

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
| `size` | Số thẻ tối đa, mặc định `20`, tối đa `50` |

Thứ tự thẻ: **từ đến hạn trước** (từ có `lastReviewResult = VAGUE` trước, rồi theo `nextReviewAt` sớm nhất), **sau đó
đến từ mới**, từ dễ đến khó như danh sách từ của chủ đề (theo `difficultyLevel` rồi `word`, xem `GET /api/vocabulary`). Từ đã học nhưng chưa đến hạn không vào phiên. Chế độ ôn (A2) chỉ có từ đến hạn.

```json
{
  "source": { "type": "TOPIC", "id": 1, "name": "Kinh doanh" },
  "cards": [ { "...": "LearningCard" } ]
}
```

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
  "intervalDays": 3,
  "nextReviewAt": "2026-09-28"
}
```

Mỗi thẻ được lưu **ngay khi đánh giá**, nên người học thoát giữa phiên vẫn giữ tiến độ các từ đã đánh giá (ngoại lệ
của A1). `400` nếu `result` sai; `404` nếu từ không tồn tại hoặc người dùng không được thấy.

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
kế tiếp (bắt đầu từ ngày mai), số từ đến hạn đúng ngày đó. `reviewedToday`: số từ có `lastReviewedAt` trong hôm nay.

### `GET /api/learning/history` — lịch sử học

`page`, `size` như `GET /api/vocabulary`. Trả `PageResponse<LearningCard>` gồm các từ người dùng đã đánh giá ít nhất
một lần, sắp theo `lastReviewedAt` mới nhất trước.

## Frontend dùng như thế nào

| Màn hình | Gọi |
|---|---|
| Nhắc ôn trên trang chủ và màn Từ vựng | `GET /api/learning/summary` (ẩn khi `dueToday = 0`) |
| Nút "Học N từ" ở chi tiết chủ đề | Tính từ `Topic`: `min(20, dueCount + wordCount − learnedCount)` |
| Phiên flashcard | `GET /api/learning/session`, rồi `POST /api/learning/reviews` cho từng thẻ |
| Tab "Lịch sử học" | `GET /api/learning/summary` và `GET /api/learning/history` |

Sau mỗi lần đánh giá, frontend làm mới dữ liệu chủ đề, danh sách và thống kê (số từ đã học thay đổi).

## Việc backend Phase 3 cần làm

1. Migration thêm cột bậc ôn (ví dụ `interval_days`) vào `user_vocabulary`.
2. Entity `UserVocabulary` với converter chữ thường cho `status` và `last_review_result` (dùng `LowercaseEnumConverter`).
3. Scheduler thuần logic theo bảng trên, có unit test (bậc, trạng thái, ngày theo giờ Việt Nam).
4. Bốn endpoint trên, lấy người dùng qua `CurrentUser`.
5. Phát sự kiện `WordReviewedEvent` sau mỗi lần đánh giá để module Tiến độ (Nhân) tự cập nhật `user_progress`.
