# API danh sách từ riêng (Phase 4: A3) — contract

> Trạng thái: **đã chốt cho frontend, backend chưa làm.** Frontend (`frontend/src/features/vocabulary/`) viết theo
> tài liệu này; `npm run dev:mock` trong `frontend/` trả dữ liệu giả đúng định dạng. Quy ước chung (xác thực, lỗi,
> enum chữ hoa, `PageResponse`, `VocabularyItem`) giống `docs/api/vocabulary.md`.

Nghiệp vụ A3: người học tạo danh sách, đặt tên, thêm từ (chọn từ kho có sẵn **hoặc tự nhập**), và danh sách xuất hiện
như một "chủ đề" để học flashcard (`GET /api/learning/session?listId=`, xem `docs/api/learning.md`).

**Quyền:** mỗi người chỉ thấy và sửa danh sách của mình. Danh sách của người khác trả `404` (không phải `403`), để
không lộ việc nó tồn tại. Từ tự nhập (`vocabulary.created_by` là người học, `topic_id` là `NULL`) chỉ người tạo thấy.

## Đối tượng

### CustomList

```json
{ "id": 5, "name": "Phỏng vấn xin việc", "createdAt": "2026-09-25T08:00:00Z", "wordCount": 4, "learnedCount": 1, "dueCount": 0 }
```

`wordCount`, `learnedCount`, `dueCount` có cùng nghĩa như ở `Topic` (`docs/api/vocabulary.md`), tính trên các từ của
danh sách.

### NewWord (từ tự nhập)

```json
{ "word": "negotiate", "meaning": "thương lượng", "phonetic": null, "exampleSentence": null, "difficultyLevel": "B2" }
```

`word` (1–150 ký tự) và `meaning` bắt buộc, cắt khoảng trắng hai đầu. `phonetic`, `exampleSentence` có thể bỏ trống
(ngoại lệ của A3: từ tự nhập không có phát âm hay ví dụ tự động). `difficultyLevel` không bắt buộc: bỏ trống thì
backend dùng `current_level` của người học, chưa có thì `A1` (cột `vocabulary.difficulty_level` là `NOT NULL`).

## Endpoint

| Phương thức và đường dẫn | Thân yêu cầu | Trả về |
|---|---|---|
| `GET /api/custom-lists` | | `200` mảng `CustomList`, mới tạo trước |
| `POST /api/custom-lists` | `{ "name", "vocabularyIds": [101], "newWords": [NewWord] }` | `201` `CustomList` |
| `GET /api/custom-lists/{id}` | | `200` `CustomList` |
| `PUT /api/custom-lists/{id}` | `{ "name" }` | `200` `CustomList` |
| `DELETE /api/custom-lists/{id}` | | `204` |
| `GET /api/custom-lists/{id}/words` | `page`, `size` như `GET /api/vocabulary` | `200` `PageResponse<VocabularyItem>`, theo `word` |
| `POST /api/custom-lists/{id}/words` | `{ "vocabularyId": 101 }` | `201` `VocabularyItem` |
| `POST /api/custom-lists/{id}/words/new` | `NewWord` | `201` `VocabularyItem` (từ vừa tạo, đã nằm trong danh sách) |
| `DELETE /api/custom-lists/{id}/words/{vocabularyId}` | | `204` |

Quy tắc:

- `name`: bắt buộc, cắt khoảng trắng, tối đa 150 ký tự (`400` nếu sai). Không bắt buộc duy nhất.
- Tạo danh sách là **một giao dịch**: danh sách, các từ có sẵn trong `vocabularyIds` (trùng thì bỏ qua) và các từ
  tự nhập trong `newWords` cùng được lưu, hoặc không có gì được lưu. `vocabularyIds` chứa từ không tồn tại hoặc người
  dùng không được thấy thì trả `400`.
- Thêm một từ đã có trong danh sách trả `409`. Từ không tồn tại hoặc không được thấy trả `404`.
- Xóa danh sách xóa các mục (`custom_vocabulary_list_items`, đã có `ON DELETE CASCADE`), **không** xóa từ tự nhập:
  lịch sử học của người dùng vẫn cần chúng.
- Bỏ một từ khỏi danh sách không xóa tiến độ học của từ đó.

## Frontend dùng như thế nào

| Màn hình | Gọi |
|---|---|
| Tab "Danh sách của tôi (N)" | `GET /api/custom-lists` |
| Hộp thoại "Tạo danh sách riêng" (tên, từ gõ theo dạng "từ — nghĩa" hoặc chọn từ gợi ý trong kho) | gợi ý: `GET /api/vocabulary?q=...&size=5`; lưu: `POST /api/custom-lists` |
| Chi tiết danh sách (đổi tên, xóa, bỏ từ, thêm từ trong kho hoặc tự nhập) | các endpoint còn lại |
| "Học danh sách này →" | `GET /api/learning/session?listId=` |

## Việc backend Phase 4 cần làm

1. Entity `CustomVocabularyList`, `CustomVocabularyListItem` (khóa kép `list_id`, `vocabulary_id`) trong module
   `vocabulary`; kiểm tra chủ sở hữu qua `CurrentUser`.
2. `GET /api/vocabulary` và phiên học chỉ trả từ hệ thống (`created_by` là admin hoặc `NULL`) cùng từ do chính người
   dùng tạo.
3. Các endpoint trên; test cho quyền (danh sách người khác trả `404`) và cho giao dịch khi tạo.
