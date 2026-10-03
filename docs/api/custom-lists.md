# API danh sách từ riêng (Phase 4: A3) — contract

> Trạng thái: **frontend và backend đã làm theo tài liệu này** (backend: `CustomListController` trong module
> `vocabulary`). `npm run dev:mock` trong `frontend/` vẫn dùng được khi cần dữ liệu giả. Quy ước chung (xác thực, lỗi,
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
| `GET /api/custom-lists/{id}/words` | `page`, `size` như `GET /api/vocabulary` | `200` `PageResponse<VocabularyItem>`, từ dễ đến khó như `GET /api/vocabulary` |
| `POST /api/custom-lists/{id}/words` | `{ "vocabularyId": 101 }` | `201` `VocabularyItem` |
| `POST /api/custom-lists/{id}/words/new` | `NewWord` | `201` `VocabularyItem` (từ vừa tạo, đã nằm trong danh sách) |
| `DELETE /api/custom-lists/{id}/words/{vocabularyId}` | | `204` |

Quy tắc:

- `name`: bắt buộc, cắt khoảng trắng, tối đa 150 ký tự (`400` nếu sai). Không trùng với danh sách khác của cùng người học, không phân biệt hoa thường: tạo hoặc đổi tên trùng trả `409` (kịch bản 7, nhánh 11a; thêm ngày 01/10/2026). Người học khác dùng cùng tên thì được. Từ 03/10/2026 CSDL cũng chặn bằng chỉ mục duy nhất `uq_cvl_user_name` trên `(user_id, lower(name))` (migration `V202610031100`, như `UNIQUE (learner_id, name)` của thiết kế), nên hai yêu cầu đến cùng lúc (hai tab) cũng nhận `409`; các danh sách trùng tên có từ trước được thêm id vào sau tên.
- Một lần tạo nhận tối đa 100 `vocabularyIds` và 100 `newWords` (`400` nếu hơn), để một yêu cầu không ghi được số dòng
  tùy ý.
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

## Backend Phase 4 (đã làm)

1. Entity `CustomVocabularyList` và `CustomVocabularyListItem` (khóa kép `@EmbeddedId`) trong module `vocabulary`.
   Mọi thao tác đi qua `CustomListService.requireOwnList`: danh sách của người khác trả `404` như danh sách không có.
2. Luật hiển thị `created_by IS NULL OR created_by = :userId` áp cho mọi truy vấn đọc từ: `GET /api/vocabulary`,
   `GET /api/vocabulary/{id}` (`404` với từ riêng của người khác), số đếm của chủ đề và danh sách, phiên học, đánh giá
   thẻ. Từ hệ thống luôn có `created_by` là `NULL`, kể cả khi admin thêm qua API (chốt 25/09/2026), nên luật này không
   cần tra role trong bảng `users` của module khác.
3. Từ tự nhập không ghi trình độ lấy `CurrentUser.currentLevel()` (đọc `users.current_level`), chưa có thì `A1`.
4. Tạo danh sách: kiểm tra hết đầu vào rồi mới ghi, cả hàm trong một transaction. Xóa danh sách xóa các mục trước
   (không dựa vào `ON DELETE CASCADE`, để giống nhau trên mọi DB), giữ lại từ tự nhập và tiến độ học.
5. Test: `CustomListApiTests` (quyền, giao dịch, hiển thị từ riêng), `CustomListPostgresIntegrationTests`.
