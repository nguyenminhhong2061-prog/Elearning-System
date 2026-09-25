# API kho từ vựng (Phase 2) — contract

> Trạng thái: **đã chốt cho frontend, backend chưa làm.** Frontend (`frontend/src/features/vocabulary/`) viết theo
> tài liệu này. Backend Phase 2 phải trả đúng định dạng dưới đây; khác chỗ nào thì sửa tài liệu và frontend cùng lúc.
> Chạy thử giao diện khi backend chưa xong: `npm run dev:mock` trong `frontend/` (dữ liệu giả theo đúng contract).

Mọi endpoint cần đăng nhập (`Authorization: Bearer <token>`). Lỗi dùng định dạng chung
`{ "timestamp": "...", "status": 404, "message": "..." }`. Giá trị enum trong JSON viết **chữ hoa**.

## Đối tượng

### Topic

```json
{
  "id": 1,
  "name": "Kinh doanh",
  "description": "Từ vựng dùng trong công việc và kinh doanh",
  "imageUrl": null,
  "wordCount": 26,
  "learnedCount": 12,
  "dueCount": 3
}
```

| Trường | Ý nghĩa |
|---|---|
| `description`, `imageUrl` | Có thể `null` |
| `wordCount` | Số từ thuộc chủ đề mà người dùng hiện tại được thấy |
| `learnedCount` | Số từ trong đó mà **người dùng hiện tại** đã học, tức có dòng `user_vocabulary` với `status` là `learning` hoặc `mastered`. Trước Phase 3 luôn là `0` |
| `dueCount` | Số từ trong đó đã đến hạn ôn của người dùng hiện tại (`next_review_at` ≤ hôm nay, giờ Việt Nam). Dùng cho nút "Học N từ" (xem `docs/api/learning.md`) |

### VocabularyItem

Giữ nguyên các trường của `VocabularyResponse` hiện có, thêm `learningStatus`:

```json
{
  "id": 101,
  "topicId": 1,
  "createdBy": null,
  "word": "revenue",
  "meaning": "doanh thu",
  "exampleSentence": "The company's revenue grew by 20% last year.",
  "phonetic": "/ˈrevənjuː/",
  "audioUrl": null,
  "imageUrl": null,
  "difficultyLevel": "B2",
  "learningStatus": "LEARNING"
}
```

`learningStatus` là trạng thái học **của người dùng hiện tại**: `NEW` (chưa có dòng `user_vocabulary` hoặc
`status = 'new'`), `LEARNING` hoặc `MASTERED`.

### PageResponse

```json
{ "items": [ ... ], "page": 0, "size": 20, "totalItems": 26, "totalPages": 2 }
```

`page` đánh số từ 0. Đặt ở `common` để module khác dùng chung.

## Endpoint

### `GET /api/topics`

Danh sách **tất cả** chủ đề (không phân trang, số chủ đề ít), sắp xếp theo `id` tăng dần.
Trả `200` với mảng `Topic`.

### `GET /api/topics/{id}`

Trả `200` với một `Topic`; `404` nếu không có.

### `GET /api/vocabulary`

| Tham số | Mặc định | Ý nghĩa |
|---|---|---|
| `topicId` | không lọc | Chỉ lấy từ của chủ đề này |
| `q` | không lọc | Tìm trong `word` và `meaning`, không phân biệt hoa thường, khớp một phần. Cắt khoảng trắng hai đầu; chuỗi rỗng coi như không lọc |
| `level` | không lọc | `A1` … `C2` |
| `page` | `0` | Trang, từ 0 |
| `size` | `20` | Số từ mỗi trang, tối đa `100` |

**Sắp xếp từ dễ đến khó:** theo `difficultyLevel` (A1, A2, B1, B2, C1, C2), cùng trình độ thì theo `word` tăng dần
(không phân biệt hoa thường), rồi theo `id`. Thứ tự này phải do server làm vì danh sách được phân trang: trình duyệt
chỉ có trang đã tải, nên nếu tự sắp xếp thì từ A1 ở trang sau sẽ nhảy lên đầu khi bấm "Xem thêm từ". Sáu giá trị
`A1`…`C2` xếp theo chữ cái cũng đúng thứ tự trình độ, nên `ORDER BY difficulty_level, lower(word), id` là đủ.
Trả `200` với `PageResponse<VocabularyItem>`; `400` nếu `level`, `page` hoặc `size` không hợp lệ.

> **Thay đổi không tương thích:** hiện endpoint này trả mảng. Từ Phase 2 trả `PageResponse`. Chỉ `VocabularyApiTests`
> của module `vocabulary` đang dùng nên cần sửa cùng lúc.

### Ghi dữ liệu (`POST`, `PUT`, `DELETE` trên `/api/topics` và `/api/vocabulary`)

Thân yêu cầu giữ nguyên như hiện tại. **Chỉ `ADMIN`**; learner nhận `403`. Frontend Phase 2 không có màn quản trị
(demo dùng Swagger/Postman; module Admin chưa phân công).

## Frontend dùng như thế nào

| Màn hình | Gọi |
|---|---|
| Từ vựng (danh sách chủ đề) | `GET /api/topics`; tổng "đã học / tổng số từ" cộng từ `wordCount`, `learnedCount`. Lọc tên chủ đề ngay trên trình duyệt |
| Tìm từ trên màn Từ vựng (từ 2 ký tự) | `GET /api/vocabulary?q=...&size=10` |
| Chi tiết chủ đề | `GET /api/topics/{id}` và `GET /api/vocabulary?topicId={id}&size=20&page=...` (nút "Xem thêm từ") |

## Việc backend Phase 2 cần làm để khớp contract

1. Thêm `wordCount`, `learnedCount`, `dueCount` vào `TopicResponse` (một truy vấn đếm theo nhóm, không N+1).
2. `learningStatus` cho từng từ theo người dùng hiện tại (`CurrentUser`), join `user_vocabulary`.
3. `q`, `level`, phân trang và thứ tự từ dễ đến khó cho `GET /api/vocabulary`; `PageResponse` trong `common`.
4. `@PreAuthorize("hasRole('ADMIN')")` cho các endpoint ghi.
5. Migration seed 8–10 chủ đề, mỗi chủ đề 20–30 từ (có thể lấy từ `frontend/mock/vocabularyFixtures.js`).
