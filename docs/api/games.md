# API trò chơi từ vựng và bảng xếp hạng (Phase 5: A4) — contract

> Trạng thái: **đã chốt cho frontend, backend chưa làm.** Ngày 25/09/2026 người dùng quyết định A4 thuộc module của
> Hồng (`Database.md` bản sau họp vẫn ghi nhóm bảng trò chơi cho Nhân: **cần báo nhóm** để Nhân không làm trùng).
> Frontend (`frontend/src/features/games/`) viết theo tài liệu này; `npm run dev:mock` trong `frontend/` trả dữ liệu
> giả đúng định dạng. Quy ước chung (xác thực, lỗi, enum chữ hoa) giống `docs/api/vocabulary.md`.

Dùng các bảng có sẵn trong `V1__init.sql`: `games`, `game_questions`, `game_question_options`, `game_sessions`,
`game_session_answers`, `leaderboard`.

## Ba trò chơi (`games.game_type`)

| `gameType` | Tên hiển thị | Câu hỏi hiện | Người chơi chọn |
|---|---|---|---|
| `GUESS_MEANING` | Đoán nghĩa | từ tiếng Anh (kèm phiên âm) | 1 trong 4 nghĩa tiếng Việt |
| `QUICK_QUIZ` | Trắc nghiệm nhanh | nghĩa tiếng Việt | 1 trong 4 từ tiếng Anh, có tính giờ gắt |
| `WORD_MATCH` | Ghép từ | các ô từ tiếng Anh và các ô nghĩa, xáo trộn | ghép từng từ với nghĩa của nó |

## Nguyên tắc

- **Server tự tính điểm.** Dữ liệu một ván gửi xuống trình duyệt **không** chứa đáp án. Để hiện hiệu ứng đúng/sai ngay
  (nghiệp vụ A4), trình duyệt hỏi `POST .../check` cho từng lựa chọn; endpoint này **không lưu gì**.
- **Chỉ lưu khi ván kết thúc** (`POST .../sessions`). Thoát giữa ván thì không gửi gì, điểm không được lưu (ngoại lệ A4).
- Server tính lại mọi thứ từ các câu trả lời gửi lên; điểm trình duyệt hiện trong lúc chơi chỉ là tạm tính.

## Endpoint

### `GET /api/games`

```json
[ { "id": 1, "name": "Đoán nghĩa", "gameType": "GUESS_MEANING", "timeLimitSeconds": 90, "questionCount": 10, "myBestScore": 150 } ]
```

`timeLimitSeconds` có thể `null` (không giới hạn). `myBestScore`: điểm cao nhất của người dùng hiện tại, `null` nếu chưa
chơi.

### `GET /api/games/{id}/play` — bắt đầu một ván

```json
{
  "gameId": 1,
  "gameType": "GUESS_MEANING",
  "timeLimitSeconds": 90,
  "playToken": "eyJ…",
  "questions": [
    { "id": 11, "prompt": "revenue", "phonetic": "/ˈrevənjuː/", "points": 1,
      "options": [ { "id": 101, "content": "doanh thu" }, { "id": 102, "content": "lợi nhuận" } ] }
  ],
  "matchOptions": null
}
```

- `GUESS_MEANING`: `prompt` là từ tiếng Anh, `options` là 4 nghĩa.
- `QUICK_QUIZ`: `prompt` là nghĩa tiếng Việt, `phonetic` là `null`, `options` là 4 từ tiếng Anh.
- `WORD_MATCH`: mỗi câu hỏi là một từ (`options` rỗng); `matchOptions` là nghĩa đúng của mọi câu hỏi, **đã xáo trộn**
  và không cho biết nghĩa nào thuộc từ nào.
- Server chọn và xáo trộn câu hỏi, lựa chọn cho mỗi ván. `playToken` là chuỗi có chữ ký (HMAC) chứa `gameId`,
  `userId`, danh sách `questionId` và thời điểm bắt đầu, để khi nộp bài server biết đúng ván mình đã phát và tính giờ.

### `POST /api/games/{id}/check` — kiểm tra một lựa chọn (không lưu)

```json
{ "playToken": "eyJ…", "questionId": 11, "optionId": 101 }
```

Trả `200` `{ "correct": true, "correctOptionId": 101 }`. Với `WORD_MATCH`, `correctOptionId` luôn là `null` (nếu không
thì chọn sai một lần là lộ đáp án). `400` nếu token sai hoặc câu hỏi không thuộc ván.

### `POST /api/games/{id}/sessions` — nộp bài khi ván kết thúc

```json
{ "playToken": "eyJ…", "answers": [ { "questionId": 11, "optionId": 101, "responseTimeMs": 2300 } ] }
```

Mỗi câu hỏi một câu trả lời (lần chọn đầu tiên với trò chọn đáp án; cặp ghép đúng với `WORD_MATCH`). Câu chưa trả lời
gửi `optionId: null`. Trả `201`:

```json
{ "sessionId": 42, "score": 130, "correctCount": 8, "questionCount": 10, "timeBonus": 50, "bestScore": 150, "isPersonalBest": false }
```

Cách tính điểm: mỗi câu đúng được `points × 10`. Nếu trò có giới hạn thời gian và **mọi** câu đều được trả lời trước
khi hết giờ, cộng thêm `timeBonus = floor(số giây còn lại × số câu đúng / số câu)`: thưởng tỷ lệ với độ chính xác, để
trả lời bừa thật nhanh không được thưởng (sai hết thì thưởng 0). Câu trả lời đến sau giới hạn quá 3 giây bị tính sai. Lưu một dòng
`game_sessions` và các dòng `game_session_answers`. `400` nếu token sai, đã dùng, hoặc câu trả lời không thuộc ván.

### `GET /api/games/leaderboard`

| Tham số | Ý nghĩa |
|---|---|
| `period` | `WEEK` (mặc định, tuần bắt đầu thứ Hai) hoặc `MONTH`, theo giờ Việt Nam |
| `gameId` | Không gửi: tổng mọi trò chơi (`leaderboard.game_id` là `NULL`) |

```json
{
  "periodType": "WEEK",
  "periodStart": "2026-09-21",
  "updatedAt": "2026-09-25T08:00:00Z",
  "entries": [ { "rank": 1, "userId": 3, "displayName": "Minh", "totalScore": 420 } ],
  "me": { "rank": 24, "totalScore": 120 }
}
```

`entries`: tối đa 10 người đứng đầu. `displayName` chỉ là **tên gọi** (từ cuối của họ tên), không trả họ tên đầy đủ hay
email của người khác. `me`: hạng của người dùng hiện tại, `null` nếu chưa có điểm trong kỳ. Bảng là **bộ đệm** cập nhật
bằng batch `@Scheduled` (quyết định họp 23/09), `updatedAt` là lần cập nhật gần nhất, nên điểm vừa chơi có thể chưa hiện.

## Việc backend Phase 5 cần làm

1. Entity cho sáu bảng; seed ba trò chơi và câu hỏi lấy từ `vocabulary` (migration).
2. Phát ván ngẫu nhiên, ký và kiểm tra `playToken`; `check` và chấm điểm dùng chung một chỗ xác định đáp án đúng.
3. Batch `@Scheduled` ghi `leaderboard` theo tuần và tháng (GROUP BY `user_id` trên `game_sessions`).
4. Test: không lộ đáp án trong `play`; chấm điểm và thưởng thời gian (sai hết thì thưởng 0); nộp hai lần cùng token bị
   từ chối.
