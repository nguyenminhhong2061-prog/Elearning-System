# API trò chơi từ vựng và bảng xếp hạng (Phase 5: A4) — contract

> Trạng thái: **bản 2 (02/10/2026), backend đã làm theo, frontend và dữ liệu giả chưa.** Bản 2 theo tài liệu phân tích
> thiết kế (`docs/English Learning System/`: Business model, kịch bản 8): ván chơi lấy từ của một chủ đề hoặc danh sách
> riêng do người chơi chọn, số câu và cách tính điểm mới, kết quả có các câu sai. Xem "Thay đổi so với bản 1" cuối file.
> Backend: `GameController` trong module `vocabulary`. Ngày 25/09/2026 người dùng quyết định A4 thuộc module của Hồng và
> tự nhận phần bảng trò chơi mà `docs/starter/Database.md` bản sau họp còn ghi cho Nhân (**cần báo Nhân** để không làm
> trùng). Quy ước chung (xác thực, lỗi, enum chữ hoa) giống `docs/api/vocabulary.md`.

Bảng dùng: `games`, `game_sessions` (thêm cột ở bản 2), `leaderboard`. Các bảng ngân hàng câu hỏi `game_questions`,
`game_question_options`, `game_session_answers` của bản 1 **không còn được đọc hay ghi**; dữ liệu cũ giữ nguyên cho
đến khi nhóm đồng ý xóa.

## Ba trò chơi (`games.game_type`)

| `gameType` | Tên hiển thị | Một ván | Câu hỏi hiện | Người chơi chọn | Thời gian (seed) |
|---|---|---|---|---|---|
| `GUESS_MEANING` | Đoán nghĩa | 5 câu | câu ví dụ có từ cần đoán (`example`) và từ đó | 1 trong 4 nghĩa tiếng Việt | 90 giây |
| `QUICK_QUIZ` | Trắc nghiệm nhanh | 10 câu | từ tiếng Anh (kèm phiên âm) | 1 trong 4 nghĩa tiếng Việt | 60 giây |
| `WORD_MATCH` | Ghép từ | 8 cặp | các ô từ tiếng Anh và các ô nghĩa, xáo trộn | ghép từng từ với nghĩa của nó | 60 giây |

## Nguồn từ của một ván

Người chơi chọn **một chủ đề** (`topicId`) hoặc **một danh sách riêng của mình** (`listId`) (kịch bản 8, bước 1–2).
Server lấy mọi từ người chơi được thấy trong chủ đề hoặc danh sách đó, bỏ các từ trùng nghĩa (giữ từ có id nhỏ nhất,
so nghĩa không phân biệt hoa thường), rồi khi bắt đầu ván thì:

- chọn ngẫu nhiên các từ để hỏi: đủ số câu của trò, hoặc ít hơn nếu nguồn có ít từ hơn (`questionCount` cho biết);
  `GUESS_MEANING` chỉ hỏi các từ có câu ví dụ;
- mỗi câu chọn đáp án có nghĩa đúng và **3 nghĩa sai lấy ngẫu nhiên từ các từ khác cùng nguồn**.

Nguồn có **ít hơn 4 từ** (khác nghĩa) thì không chơi được (nhánh 3a, `NOT_ENOUGH_WORDS`); với `GUESS_MEANING`, nguồn
không có từ nào có câu ví dụ cũng không chơi được (`NO_EXAMPLES`).

Không gửi `topicId` lẫn `listId` (cách gọi của bản 1, giao diện hiện tại vẫn dùng): nguồn là mọi từ hệ thống có chủ đề.
Gửi cả hai: `400`. Chủ đề không tồn tại hoặc danh sách không phải của mình: `404`.

## Nguyên tắc

- **Server tự tính điểm.** Dữ liệu một ván gửi xuống trình duyệt **không** chứa đáp án. Để hiện hiệu ứng đúng/sai ngay,
  trình duyệt hỏi `POST .../check` cho từng lựa chọn; endpoint này **không lưu gì**.
- **Chỉ lưu khi ván kết thúc** (`POST .../sessions`). Thoát giữa ván thì không gửi gì, điểm không được lưu (nhánh 5a).
- Server tính lại mọi thứ từ các câu trả lời gửi lên; điểm trình duyệt hiện trong lúc chơi chỉ là tạm tính.
- Kết quả trò chơi **không** đổi trạng thái học và lịch ôn của từ (kịch bản 8, bước 8).

## Endpoint

### `GET /api/games?topicId=&listId=`

```json
[
  { "id": 1, "name": "Đoán nghĩa", "gameType": "GUESS_MEANING", "timeLimitSeconds": 90,
    "questionCount": 0, "myBestScore": null, "available": false, "unavailableReason": "NO_EXAMPLES" },
  { "id": 2, "name": "Trắc nghiệm nhanh", "gameType": "QUICK_QUIZ", "timeLimitSeconds": 60,
    "questionCount": 10, "myBestScore": 60, "available": true, "unavailableReason": null }
]
```

Sắp theo `id`.

`questionCount`: số câu (số cặp với `WORD_MATCH`) của một ván với nguồn đã chọn, `0` khi không chơi được.
`available`, `unavailableReason` (`NOT_ENOUGH_WORDS`, `NO_EXAMPLES` hoặc `null`): để giao diện khóa trò và hiện "Chủ đề
này chưa đủ từ để chơi". `timeLimitSeconds` có thể `null` (không giới hạn). `myBestScore`: điểm cao nhất của người dùng
hiện tại ở trò đó (mọi nguồn), `null` nếu chưa chơi.

### `GET /api/games/{id}/play?topicId=&listId=` — bắt đầu một ván

```json
{
  "gameId": 2,
  "gameType": "QUICK_QUIZ",
  "timeLimitSeconds": 60,
  "topicId": 1,
  "listId": null,
  "playToken": "q3V….Zm9…",
  "questions": [
    { "id": 1, "prompt": "souvenir", "phonetic": "/ˌsuːvəˈnɪr/", "example": null, "points": 1,
      "options": [ { "id": 1, "content": "hộ chiếu" }, { "id": 2, "content": "quà lưu niệm" },
                   { "id": 3, "content": "hành lý" }, { "id": 4, "content": "lịch trình" } ] }
  ],
  "matchOptions": null
}
```

- `GUESS_MEANING`: `prompt` là từ cần đoán, `example` là câu ví dụ chứa từ đó (giao diện in đậm từ trong câu),
  `options` là 4 nghĩa.
- `QUICK_QUIZ`: `prompt` là từ tiếng Anh, `example` là `null`, `options` là 4 nghĩa (bản 1 hỏi ngược lại).
- `WORD_MATCH`: mỗi câu hỏi là một từ (`options` rỗng); `matchOptions` là nghĩa đúng của mọi câu hỏi, **đã xáo trộn**
  và không cho biết nghĩa nào thuộc từ nào.
- `id` của câu hỏi và của lựa chọn là **số thứ tự trong ván** (từ 1), không phải id trong DB: câu 1 của ván này và câu 1
  của ván khác là hai câu khác nhau.
- `playToken` là **toàn bộ ván đã mã hóa** (AES-GCM): trò, người chơi, thời điểm bắt đầu, nguồn, từ của từng câu và thứ
  tự các lựa chọn. Trình duyệt không đọc được đáp án trong token, sửa token thì server từ chối. Token hết hạn sau 1 giờ.
  Khóa sinh ngẫu nhiên lúc server khởi động, nên khởi động lại server thì ván đang chơi dở không nộp được nữa (`400`).
- `400` khi nguồn không đủ từ (thông báo nêu lý do, như `unavailableReason`).

### `POST /api/games/{id}/check` — kiểm tra một lựa chọn (không lưu)

```json
{ "playToken": "q3V…", "questionId": 1, "optionId": 2 }
```

Trả `200` `{ "correct": true, "correctOptionId": 2 }`. Với `WORD_MATCH`, `optionId` là id trong `matchOptions` và
`correctOptionId` luôn là `null` (nếu không thì chọn sai một lần là lộ đáp án). `400` nếu token sai, câu hỏi không thuộc
ván hoặc lựa chọn không được đưa ra cho câu đó.

### `POST /api/games/{id}/sessions` — nộp bài khi ván kết thúc

```json
{ "playToken": "q3V…", "answers": [ { "questionId": 1, "optionId": 2, "responseTimeMs": 2300 } ] }
```

Mỗi câu hỏi nhiều nhất một câu trả lời (lần chọn đầu tiên với trò chọn đáp án; cặp người chơi ghép với `WORD_MATCH`).
Câu chưa trả lời gửi `optionId: null` hoặc không gửi, đều tính sai (nhánh 7a). `responseTimeMs` không bắt buộc và
không dùng để tính điểm. Trả `201`:

```json
{
  "sessionId": 42, "score": 80, "correctCount": 8, "questionCount": 10, "durationSeconds": 52,
  "timeBonus": 0, "bestScore": 80, "isPersonalBest": true,
  "wrongAnswers": [ { "questionId": 4, "word": "itinerary", "chosen": "hành lý", "correct": "lịch trình" } ]
}
```

- **Điểm = số câu đúng × 10** (kịch bản 8, bước 8: đúng 8/10 câu được 80 điểm), không cộng thưởng thời gian. `timeBonus`
  luôn `0`, chỉ giữ để giao diện bản 1 không lỗi.
- `durationSeconds`: thời gian chơi từ lúc bắt đầu ván đến lúc nộp, làm tròn giây, không quá thời gian của trò.
- Nộp quá thời gian của trò hơn 3 giây thì mọi câu bị tính sai.
- `wrongAnswers`: bảng "Các câu sai", theo thứ tự câu; `chosen` là nghĩa người chơi đã chọn, `null` nếu bỏ trống.
- `isPersonalBest`: điểm vượt điểm cao nhất trước đó của người chơi ở trò này (lần đầu: điểm > 0).
- Lưu một dòng `game_sessions`: trò, người chơi, `topic_id` hoặc `custom_list_id`, `correct_count`, `question_count`,
  `score`, `duration_seconds`, `played_at`.
- `400` nếu token sai, đã dùng, hoặc câu trả lời không thuộc ván (câu hỏi ngoài ván, một câu trả lời hai lần, lựa chọn
  không được đưa ra cho câu đó). Câu trả lời sai định dạng bị từ chối **trước** khi token bị tính là đã dùng, nên sửa
  lại rồi nộp tiếp vẫn được.

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

**Hạng không bao giờ trùng nhau** (chốt 25/09/2026): giao diện vẽ bục vinh danh mỗi hạng một chỗ, như dữ liệu giả vẫn làm.
Bằng điểm thì **ai đạt tổng điểm đó trước** (lượt chơi cuối trong kỳ sớm hơn) xếp trên, rồi đến `userId` nhỏ hơn.
Người 0 điểm không có trong bảng.

## Backend

1. Bản 1 (Phase 5): entity cho các bảng trò chơi (liên kết bằng id thường); migration `V202609252100__seed_games.sql`
   tạo ba trò chơi và ngân hàng câu hỏi (ngân hàng không còn dùng từ bản 2).
2. Bản 2: migration `V202610021010__game_rounds_from_topics.sql` thêm vào `game_sessions` các cột `topic_id`,
   `custom_list_id` (khóa ngoại `ON DELETE SET NULL`, nhiều nhất một trong hai, ràng buộc `chk_gs_one_source`),
   `correct_count`, `question_count` (ván cũ: đếm từ `game_session_answers`), `duration_seconds` (ván cũ: `NULL`).
   Xóa entity và repository của ba bảng ngân hàng câu hỏi.
3. `GameService` chia ván từ nguồn đã chọn; `PlayTokenService` mã hóa và giải mã ván, nhớ trong bộ nhớ các ván đã nộp
   (đủ cho một instance). Luật điểm ở `GameScoring` (hàm thuần).
4. `LeaderboardService.refresh` xóa rồi ghi lại cả kỳ trong một transaction: ràng buộc
   `UNIQUE (game_id, period_type, period_start, user_id)` không chặn được dòng trùng của bảng tổng, vì PostgreSQL coi
   các `game_id` `NULL` là khác nhau. `LeaderboardScheduler` chạy 5 phút một lần và một lần lúc khởi động. Tên gọi lấy
   qua `common.user.UserDirectory` (module `user` cài đặt).
5. Test: `GameRulesTests` (điểm, token, xếp hạng), `GameApiTests`, `GamePostgresIntegrationTests` (ván theo chủ đề và
   theo danh sách trên seed thật, cột mới của `game_sessions`, cột `"rank"`, làm mới hai lần không nhân đôi dòng).

## Thay đổi so với bản 1

| Chỗ | Bản 1 | Bản 2 (02/10/2026) |
|---|---|---|
| Nguồn câu hỏi | Ngân hàng câu hỏi seed sẵn, mọi chủ đề | Từ của chủ đề hoặc danh sách người chơi chọn, chia lúc bắt đầu ván |
| Số câu một ván | 10 / 12 / 6 | 5 / 10 / 8 (Đoán nghĩa / Trắc nghiệm nhanh / Ghép từ) |
| Trắc nghiệm nhanh | Hiện nghĩa, chọn từ | Hiện từ, chọn nghĩa |
| Đoán nghĩa | Hiện từ | Hiện câu ví dụ và từ (`example`) |
| Điểm | Đúng × 10 + thưởng thời gian | Đúng × 10, `timeBonus` luôn `0` |
| Kết quả | Điểm, số câu đúng | thêm `durationSeconds`, `wrongAnswers` |
| `GET /api/games` | | thêm `available`, `unavailableReason`; `questionCount` theo nguồn |
| Id câu hỏi, lựa chọn | Id trong DB | Số thứ tự trong ván |
| `playToken` | Có chữ ký (HMAC), đọc được nội dung | Mã hóa (AES-GCM) |
| Lưu ván | `game_sessions` + `game_session_answers` | Chỉ `game_sessions` (thêm nguồn, số câu, thời gian) |

**Frontend và dữ liệu giả chưa sửa theo bản 2** (người dùng chọn làm backend và contract trước). Giao diện hiện tại vẫn
chơi được với backend thật (gọi không có `topicId`/`listId`), nhưng: chưa có bước chọn chủ đề; hướng dẫn Trắc nghiệm
nhanh vẫn ghi "hiện một nghĩa tiếng Việt, chọn từ tiếng Anh" (`features/games/constants.js`) và câu hỏi vẫn gắn
`lang="vi"`; Đoán nghĩa chưa hiện câu ví dụ; màn kết quả chưa có thời gian và bảng câu sai (dòng "Thưởng thời gian"
tự ẩn vì luôn 0). `frontend/mock/` vẫn theo bản 1.
