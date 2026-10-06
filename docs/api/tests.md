# API kiểm tra (module C: C1 kiểm tra định kỳ, C2 kiểm tra tổng hợp) — contract

> Trạng thái: **chốt cho module C.** Backend và frontend cùng làm theo tài liệu này. Quy ước chung (xác thực, lỗi,
> enum) giống `docs/api/vocabulary.md` và `docs/api/exercises.md`. Các luật nghiệp vụ về CEFR và kỹ năng đã chốt với
> chủ module D, xem `docs/api/progress.md` (mục "Gợi ý giải pháp"): tổng = trung bình 4 kỹ năng, chỉ bài tổng hợp đổi
> trình độ, cho phép giảm trình độ.
>
> **Đổi ngày 03/10/2026:** trình độ không còn quy đổi từ điểm phần trăm theo ngưỡng EF SET mà tính theo **bậc CEFR của
> từng câu hỏi** và theo bậc AI chấm cho phần Nói, Viết (mục "Đánh giá trình độ"); AI chấm thật qua Groq, không còn
> bản chấm tạm. JSON chỉ **thêm** trường (`review[].level`, `aiCriteria`, `aiComment`), không đổi trường cũ.
>
> **Đổi lần 2 ngày 03/10/2026 (backend và frontend đã làm, frontend xong ngày 04/10):** một bài nghe hoặc đoạn đọc có **nhiều câu hỏi**
> (`passages`, `passageId`); mỗi bài nghe **nghe tối đa 2 lần** mỗi lượt; đề **tổng hợp chỉ làm một lần**, đề định kỳ làm
> lại được (`retakeAllowed`); kết quả của lượt đang làm trả `409`. Việc giao diện cần sửa: mục "Việc frontend cần làm".
>
> **Đổi ngày 05/10/2026 (backend và frontend đã làm):** câu Nói **đọc theo câu mẫu** được trả lời bằng **ghi âm** và
> chấm phát âm bằng OpenPronounce (`referenceText`, `PUT .../answers/{questionId}/recording`, `review[].pronunciation`).
> Câu Nói mở vẫn gõ văn bản và do AI chấm như trước.

Mọi endpoint cần đăng nhập (`Authorization: Bearer <token>`) và chỉ trả dữ liệu của **người đang gọi** (`userId` lấy
qua `common.security.CurrentUser`). Lỗi dùng định dạng chung `{ "timestamp": "...", "status": 400, "message": "..." }`.
Dùng các bảng có sẵn trong `V1__init.sql`: `tests`, `test_questions`, `test_question_options`, `test_attempts`,
`test_attempt_answers`, cùng bảng mới `test_question_accepted_answers` (xem migration `V...__extend_tests.sql`). Migration
`V202610031815__level_based_test_grading.sql` thêm `test_questions.level`, `test_attempts.skill_levels`,
`test_attempt_answers.ai_criteria` và `ai_comment`. Migration `V202610032151__test_passages.sql` thêm bảng
`test_passages`, `test_passage_plays` và cột `test_questions.passage_id`. Migration `V202610052251__test_read_aloud.sql`
thêm `test_questions.reference_text`, `test_attempt_answers.pronunciation_score` và `pronunciation_details`.

## Khác biệt enum so với phần còn lại của hệ thống

Các cột `CHECK` của bảng `tests*` trong `V1__init.sql` lưu giá trị **chữ HOA** (khác các module khác lưu chữ thường).
Vì vậy entity của module này dùng `@Enumerated(EnumType.STRING)`, JSON trả về cũng viết hoa:

| Trường | Giá trị JSON (= cột DB) |
|---|---|
| `tests.type` | `PERIODIC`, `COMPREHENSIVE` |
| `test_questions.question_type` | `MULTIPLE_CHOICE`, `FILL_BLANK`, `LISTENING`, `SPEAKING`, `READING`, `WRITING` |
| `test_attempts.status` | `IN_PROGRESS`, `SUBMITTED`, `GRADED` |
| `skill` của câu hỏi | `LISTENING`, `SPEAKING`, `READING`, `WRITING` (cột `test_questions.skill` lưu chữ thường: `listening`...) |

`tests.skill` là kỹ năng của cả bài (chữ thường, chỉ để tham khảo), `null` với bài tổng hợp.

## Nguyên tắc

- **Server chấm điểm.** Dữ liệu đề gửi xuống trình duyệt **không** chứa đáp án (`is_correct` của lựa chọn,
  `test_question_accepted_answers`, giải thích, lời thoại bài nghe). Đáp án chỉ trả về trong `review` sau khi nộp bài:
  đọc kết quả của lượt còn `IN_PROGRESS` trả `409`.
- **Trả lời lưu từng câu, nộp cả bài một lần.** Mỗi câu trả lời được lưu ngay (`PUT .../answers/{questionId}`) để người
  học làm tiếp được sau khi rời trang; điểm chỉ được tính khi nộp (`POST .../submit`). Câu không trả lời tính 0 điểm.
- **Một người có tối đa một lượt `IN_PROGRESS` cho mỗi bài.** Bắt đầu bài trả về chính lượt đó nếu còn đang dở
  (`resumed: true`), ngược lại tạo lượt mới. `?restart=true` xóa lượt đang dở và tạo lượt mới (làm lại từ đầu).
- **Đề `COMPREHENSIVE` chỉ làm một lần, đề `PERIODIC` làm lại được** (`retakeAllowed`). Bài tổng hợp xác định trình
  độ, nên mỗi người có đúng một lượt cho mỗi đề tổng hợp: lượt đang dở thì làm tiếp được nhưng **không làm lại từ đầu**
  được, lượt đã nộp là kết quả cuối. Muốn đánh giá lại trình độ thì làm đề tổng hợp khác (đề của kỳ sau). Bài định kỳ
  đo tiến bộ nên làm lại bao nhiêu lần cũng được, mỗi lần là một lượt mới.
- **Một bài nghe, một đoạn đọc có nhiều câu hỏi** (`passages`): câu hỏi trỏ tới ngữ liệu bằng `passageId`; mỗi câu vẫn
  có điểm và bậc CEFR riêng, cách chấm không đổi.
- **Mỗi bài nghe nghe tối đa 2 lần trong một lượt.** Server đếm (`POST .../passages/{passageId}/plays`), nên tải lại
  trang hay làm tiếp lượt cũ không được thêm lần nghe. Lượt mới của đề định kỳ có lại 2 lần.
- **Câu Nói đọc theo câu mẫu được trả lời bằng ghi âm.** Bản ghi được chấm phát âm **ngay khi gửi lên** (dịch vụ
  OpenPronounce, xem `docs/api/pronunciation.md`); server chỉ lưu kết quả chấm, **không lưu file ghi âm**. Người học
  ghi lại được, bản ghi cuối cùng được tính. Kết quả chấm (điểm, văn bản nghe được, từ đọc sai) **ẩn tới khi nộp bài**.
  Dịch vụ không chạy thì bản ghi không được lưu (`503`) và người học gửi lại sau; không có cách trả lời khác cho câu
  này.
- **Chấm tự động ngay các loại khách quan** (`MULTIPLE_CHOICE`, `FILL_BLANK`, `LISTENING`, `READING`) khi nộp bài.
  **`SPEAKING`, `WRITING` do AI chấm** ngay trong lúc nộp bài. AI không chấm được (chưa đặt `GROQ_API_KEY`, quá thời
  gian, trả lời sai định dạng) thì câu đó để "đang chấm" (ngoại lệ C2: kết quả sẽ có sau) và server tự chấm lại mỗi 2
  phút; **không bao giờ dùng điểm giả**. Khi còn kỹ năng chưa chấm, `status = 'SUBMITTED'`; chấm xong hết thì
  `'GRADED'`. Kỹ năng không cần AI có điểm và trình độ ngay cả khi lượt còn `SUBMITTED`.
- **Chỉ bài `COMPREHENSIVE` đổi trình độ** người học (ghi `users.current_level` + `user_level_history`). Bài
  `PERIODIC` chỉ đo tiến bộ, `suggested_level` chỉ để hiển thị.
- **Đề đang mở** (`start_date IS NULL OR start_date <= now`) và (`end_date IS NULL OR now <= end_date`) mới hiện với
  người học. Đề khác trả `404`.

## Ánh xạ loại câu hỏi sang kỹ năng

`test_questions.skill` ghi rõ kỹ năng (1 trong 4) mà điểm câu đó cộng vào; nếu `null` thì suy ra từ `question_type`:

| `question_type` | `skill` mặc định | Cách trả lời / chấm |
|---|---|---|
| `MULTIPLE_CHOICE` | `READING` | chọn 1 lựa chọn (`selected_option_id`), chấm tự động |
| `FILL_BLANK` | `WRITING` | gõ đáp án ngắn, so khớp `test_question_accepted_answers` |
| `LISTENING` | `LISTENING` | nghe bài nghe của `passageId` (hoặc `audioUrl` riêng của câu) rồi chọn 1 lựa chọn, chấm tự động |
| `READING` | `READING` | đọc đoạn của `passageId` (hoặc đoạn nằm ngay trong `content`), chọn lựa chọn (hoặc gõ) |
| `SPEAKING` có `reference_text` | `SPEAKING` | **đọc theo câu mẫu**: ghi âm câu trong `referenceText`, OpenPronounce chấm phát âm |
| `SPEAKING` không có `reference_text` | `SPEAKING` | câu hỏi mở: trả lời bằng cách gõ văn bản (chưa thu âm), AI chấm |
| `WRITING` | `WRITING` | viết đoạn, chấm bằng đáp án chấp nhận (nếu có) hoặc AI |

Câu đọc theo mẫu đặt câu cần đọc ở cột `test_questions.reference_text`, còn `content` chỉ là lời dẫn ("Read the
sentence aloud."). Câu Nói mở ("Describe your hometown.") chưa thu âm: AI chỉ thấy văn bản người học gõ.

So khớp câu điền từ / viết ngắn: cắt khoảng trắng đầu cuối, gộp khoảng trắng liên tiếp, chữ thường, đổi dấu nháy cong
`’` thành `'`, rồi so với `normalized_answer` của mọi đáp án chấp nhận (giống `docs/api/exercises.md`).

## Danh sách đề

### `GET /api/tests`

Không phân trang (chỉ vài chục đề). Trả các đề đang mở, sắp theo `start_date` (rỗng trước) rồi `id`.

```json
[
  {
    "id": 1,
    "title": "Kiểm tra tổng hợp tháng 9",
    "type": "COMPREHENSIVE",
    "skill": null,
    "startDate": null,
    "endDate": null,
    "retakeAllowed": false,
    "questionCount": 20,
    "progress": {
      "attemptCount": 1,
      "bestScorePercent": 62,
      "lastCompletedAt": "2026-09-20T08:30:00Z",
      "lastAttemptId": 7,
      "inProgress": null
    }
  }
]
```

| Trường | Ý nghĩa |
|---|---|
| `questionCount` | Số câu hỏi của đề |
| `retakeAllowed` | `false` với đề `COMPREHENSIVE` (chỉ làm một lần), `true` với đề `PERIODIC`. Khi `false` và `progress.attemptCount > 0`: không còn nút bắt đầu, chỉ còn "Xem kết quả" (`progress.lastAttemptId`). Khi `false` và có `inProgress`: chỉ "Làm tiếp", không có "Làm lại từ đầu" |
| `progress.lastAttemptId` | Lượt đã nộp gần nhất của người dùng với bài này (để mở trang kết quả), `null` khi chưa nộp lần nào |
| `progress` | Của **người dùng hiện tại**. `attemptCount`, `bestScorePercent`, `lastCompletedAt` chỉ tính lượt `GRADED` (hoặc `SUBMITTED`); `0`, `null`, `null` khi chưa làm lần nào |
| `progress.inProgress` | Lượt đang dở (`IN_PROGRESS`) của bài này, `null` nếu không có. `answeredCount`: số câu đã trả lời |

### `GET /api/tests/{testId}/attempts` — lịch sử làm bài (thêm ngày 06/10/2026)

Các lượt **đã nộp** (`SUBMITTED`, `GRADED`) của người đang gọi với đề này, **mới nhất trước**; lượt đang làm dở không
có trong danh sách. Chưa nộp lần nào: `[]`. Đề đã đóng vẫn xem được lịch sử; `404` chỉ khi đề không tồn tại.

```json
[
  { "attemptId": 9, "status": "SUBMITTED", "submittedAt": "2026-10-06T14:26:00Z", "scorePercent": null, "suggestedLevel": null },
  { "attemptId": 7, "status": "GRADED", "submittedAt": "2026-09-29T14:19:00Z", "scorePercent": 80, "suggestedLevel": "B1" }
]
```

`scorePercent`, `suggestedLevel` là `null` khi lượt còn chờ AI chấm. Giao diện: thẻ của đề làm lại được và đã có lượt
nộp có nút "Lịch sử làm bài" cạnh nút "Làm lại"; bấm vào mở hộp thoại liệt kê các lượt ("Lần 2 · 21:26, 06/10/2026 ·
80/100 · B1"), mỗi dòng dẫn tới trang kết quả `/tests/{testId}/result/{attemptId}`.

## Nội dung một đề

### `GET /api/tests/{testId}`

```json
{
  "id": 1,
  "title": "Kiểm tra tổng hợp tháng 9",
  "type": "COMPREHENSIVE",
  "skill": null,
  "startDate": null,
  "endDate": null,
  "retakeAllowed": false,
  "passages": [
    { "id": 3, "title": "At the airport", "content": null, "audioUrl": "/media/listening/airport.mp3", "maxPlays": 2 },
    { "id": 4, "title": "The museum", "content": "The museum opens at 9 a.m. …", "audioUrl": null, "maxPlays": null }
  ],
  "questions": [
    { "id": 9, "passageId": 3, "type": "LISTENING", "skill": "LISTENING", "content": "Which gate should passengers go to?", "points": 1, "audioUrl": null, "options": [ { "id": 91, "content": "Gate 5" }, { "id": 92, "content": "Gate 9" } ] },
    { "id": 10, "passageId": 3, "type": "LISTENING", "skill": "LISTENING", "content": "Which flight is boarding?", "points": 1, "audioUrl": null, "options": [ { "id": 95, "content": "VN209" }, { "id": 96, "content": "VN290" } ] },
    {
      "id": 11,
      "passageId": null,
      "type": "MULTIPLE_CHOICE",
      "skill": "READING",
      "content": "Choose the word that best fits: She ___ (live) in Hanoi for five years.",
      "points": 1,
      "audioUrl": null,
      "options": [ { "id": 101, "content": "lives" }, { "id": 102, "content": "has lived" } ]
    },
    { "id": 12, "passageId": null, "type": "FILL_BLANK", "skill": "WRITING", "content": "I have never ___ (see) such a beach.", "points": 1, "audioUrl": null, "options": [] },
    { "id": 13, "passageId": null, "type": "SPEAKING", "skill": "SPEAKING", "content": "Sustainability is a shared responsibility.", "points": 5, "audioUrl": null, "options": [] }
  ],
  "hasInProgress": true,
  "lastAttemptId": null
}
```

- `passages` (`test_passages`) theo `id`: ngữ liệu dùng chung cho nhiều câu hỏi. Bài nghe có `audioUrl` và `maxPlays`
  (số lần được nghe trong một lượt, hiện là 2), `content` là `null`; đoạn đọc có `content`, `audioUrl` và `maxPlays` là
  `null`. `title` có thể `null`. **Không** có lời thoại bài nghe (chỉ có trong kết quả). Đề không có ngữ liệu: `[]`.
- `questions[].passageId`: ngữ liệu của câu hỏi, `null` với câu đứng riêng. Các câu cùng `passageId` nên hiện cùng
  nhau, ngữ liệu hiện một lần. Người soạn đề xếp các câu của một ngữ liệu liền nhau (theo `id`).
- `questions` theo `id`. **Không** có `is_correct`, đáp án chấp nhận hay lời giải. `points` là số nguyên.
- `audioUrl` của câu hỏi (`test_questions.audio_url`): file nghe riêng của một câu `LISTENING` đứng riêng (đề cũ);
  `null` với loại khác. Phát được bằng thẻ `<audio>`. **Không bị giới hạn số lần nghe**: bài nghe cần giới hạn thì đặt
  trong `passages`.
- `content` của câu `READING` đứng riêng chứa cả đoạn đọc và câu hỏi (câu thuộc ngữ liệu thì chỉ chứa câu hỏi); của
  `SPEAKING` là câu hỏi mở; của `WRITING` là đề viết.
- `options` rỗng với `FILL_BLANK`, `SPEAKING`, `WRITING`.
- `referenceText`, `maxRecordingSeconds`: chỉ có ở câu đọc theo câu mẫu: câu người học phải đọc, và độ dài tối đa của
  bản ghi âm (hiện là 15 giây). Cả hai `null` với mọi câu khác. `referenceText` khác `null` nghĩa là câu này được trả
  lời bằng ghi âm (`PUT .../recording`), không phải bằng `PUT .../answers/{questionId}`.
- `hasInProgress`: có lượt đang dở để giao diện biết bấm "Bắt đầu" là làm tiếp hay làm mới.
- `retakeAllowed`, `lastAttemptId`: như ở danh sách đề. Mở màn làm bài của một đề `retakeAllowed: false` đã có
  `lastAttemptId` thì chuyển sang trang kết quả của lượt đó.

## Lượt làm bài

### `POST /api/tests/{testId}/attempts` — bắt đầu hoặc làm tiếp

Không có body. `?restart=true` xóa lượt đang dở (nếu có) và tạo lượt mới.

- Có lượt `IN_PROGRESS` và không `restart`: trả `200` với chính lượt đó, `resumed: true`.
- Ngược lại: tạo lượt mới, trả `201`, `resumed: false`.
- Đề chỉ làm một lần (`retakeAllowed: false`): trả **`409`** khi người học đã nộp đề này, hoặc khi gửi `restart=true`
  mà đang có lượt dở (không được bỏ lượt dở để làm lại; cũng vì làm lại sẽ trả lại số lần nghe).

```json
{
  "attemptId": 9,
  "resumed": true,
  "status": "IN_PROGRESS",
  "answers": [
    { "questionId": 11, "optionId": 102, "text": null, "recorded": false },
    { "questionId": 12, "optionId": null, "text": "seen", "recorded": false },
    { "questionId": 13, "optionId": null, "text": null, "recorded": true }
  ],
  "passagePlays": [ { "passageId": 3, "playCount": 1, "maxPlays": 2 } ]
}
```

`answers`: các câu đã trả lời trong lượt (để làm tiếp). Lượt mới: `[]`. Câu đã ghi âm có `recorded: true` và `text`
là `null`: văn bản dịch vụ nghe được không trả về trước khi nộp bài.

`passagePlays`: các bài nghe đã nghe ít nhất một lần trong lượt này; bài nghe không có trong danh sách thì chưa nghe
lần nào. Lượt mới: `[]`.

### `POST /api/test-attempts/{attemptId}/passages/{passageId}/plays` — ghi một lần nghe

Không có body. Giao diện gọi **trước mỗi lần phát** bài nghe và chỉ phát khi nhận `200`:

```json
{ "passageId": 3, "playCount": 2, "maxPlays": 2 }
```

- `409` khi bài nghe đã được nghe đủ `maxPlays` lần trong lượt này, hoặc lượt không còn `IN_PROGRESS`.
- `404` khi lượt không tồn tại hoặc thuộc người khác, hoặc `passageId` không phải một bài nghe của đề này (ngữ liệu của
  đề khác, hoặc đoạn đọc).
- Một lần nghe là một lần phát từ đầu; giao diện không cho tua lại và không hiện thanh điều khiển của trình duyệt,
  hết lượt thì khóa nút phát. Server chỉ đếm: file âm thanh vẫn là file tĩnh, nên giới hạn này chặn người dùng bình
  thường chứ không chặn được người tự mở đường dẫn file.

### `PUT /api/test-attempts/{attemptId}/answers/{questionId}` — lưu một câu trả lời

Body là **một trong hai** dạng (gửi đúng theo loại câu):

```json
{ "optionId": 102 }
```

hoặc với `FILL_BLANK`, `WRITING`, `SPEAKING`:

```json
{ "text": "has lived" }
```

`text`: 1 đến 5000 ký tự (bài viết dài), đã cắt khoảng trắng. Ghi đè nếu đã trả lời. Trả `204`.

- `400` nếu câu hỏi không thuộc bài, gửi cả hai/không gửi `optionId`/`text`, `optionId` không thuộc câu hỏi, hoặc
  câu hỏi là câu đọc theo câu mẫu (phải gửi bản ghi âm).
- `404` nếu lượt không tồn tại hoặc thuộc người khác. `409` nếu lượt không còn `IN_PROGRESS` (đã nộp).

### `PUT /api/test-attempts/{attemptId}/answers/{questionId}/recording` — lưu bản ghi âm của câu đọc theo mẫu

Body là file WAV (`Content-Type: audio/wav`), tối đa 1 MB; giao diện ghi 16 kHz mono và tự dừng sau
`maxRecordingSeconds`. Server gửi bản ghi cùng `referenceText` cho OpenPronounce, lưu kết quả làm câu trả lời (ghi đè
bản ghi trước) rồi trả `204`, **không có body**: kết quả chấm chỉ có trong `review` sau khi nộp.

- **Có thể chậm:** server chấm xong mới trả lời. Lần chấm đầu tiên sau khi dịch vụ khởi động có thể mất vài phút (tải mô
  hình); giao diện chờ tới 10 phút và hiện "Đang xử lý bản ghi âm…". Mỗi câu chỉ gửi một bản ghi tại một thời điểm.
- `400` khi câu hỏi không thuộc bài, không phải câu đọc theo câu mẫu, body không phải WAV hoặc quá 1 MB.
- `404` khi lượt không tồn tại hoặc thuộc người khác. `409` khi lượt không còn `IN_PROGRESS`.
- **`503` khi OpenPronounce không chấm được** (chưa chạy, quá thời gian, trả kết quả không hợp lệ). Không có gì được
  lưu; giao diện giữ bản ghi và cho "Gửi lại".

### `POST /api/test-attempts/{attemptId}/submit` — nộp bài

Không có body (mọi câu đã lưu bằng `PUT`). Chấm các câu đã trả lời, câu chưa trả lời tính 0 điểm; đặt
`submitted_at = now()`; nếu không còn kỹ năng chờ AI thì `status = 'GRADED'`, ngược lại `'SUBMITTED'`. Trả `200` cùng
dạng `GET /api/test-attempts/{attemptId}` (kết quả). Nộp lại lượt đã nộp trả `409`.

### `GET /api/test-attempts/{attemptId}` — kết quả

Chỉ có khi lượt đã nộp: lượt còn `IN_PROGRESS` trả **`409`** (kết quả chứa đáp án đúng và lời thoại).

```json
{
  "attemptId": 9,
  "testId": 1,
  "title": "Kiểm tra tổng hợp tháng 9",
  "type": "COMPREHENSIVE",
  "status": "GRADED",
  "submittedAt": "2026-09-27T15:00:00Z",
  "correctCount": 15,
  "questionCount": 20,
  "totalPoints": 24,
  "earnedPoints": 20,
  "scorePercent": 83,
  "bestScorePercent": 90,
  "isPersonalBest": false,
  "suggestedLevel": "B2",
  "suggestedRoadmap": "Tập trung luyện Nghe 15 phút/ngày…",
  "skills": {
    "listening": { "score": 56, "level": "B2" },
    "speaking": { "score": null, "level": null },
    "reading": { "score": 48, "level": "B1" },
    "writing": { "score": 42, "level": "B1" }
  },
  "passages": [
    { "id": 3, "title": "At the airport", "content": null, "audioUrl": "/media/listening/airport.mp3",
      "transcript": "Flight VN209 is now boarding at Gate 5." }
  ],
  "review": [
    { "questionId": 11, "passageId": null, "type": "MULTIPLE_CHOICE", "level": "B1", "correct": true,
      "selectedOptionId": 102,
      "answerText": null, "correctOptionId": 102, "correctAnswer": "has lived", "points": 1, "scoreEarned": 1,
      "aiCriteria": null, "aiComment": null },
    { "questionId": 14, "passageId": null, "type": "WRITING", "level": "B1", "correct": null,
      "selectedOptionId": null,
      "answerText": "Last summer I go to Da Nang…", "correctOptionId": null, "correctAnswer": null, "points": 6,
      "scoreEarned": 3,
      "aiCriteria": { "task": 4, "coherence": 3, "vocabulary": 3, "grammar": 2 },
      "aiComment": "Ý rõ ràng; cần ôn lại thì quá khứ đơn." }
  ]
}
```

| Trường | Ý nghĩa |
|---|---|
| `status` | `SUBMITTED` khi còn kỹ năng đang chờ AI; `GRADED` khi chấm xong hết. Kỹ năng chưa chấm có `score`/`level` là `null` |
| `scorePercent` | Điểm tổng 0–100 = **trung bình các điểm kỹ năng** (trọng số bằng nhau), làm tròn; `null` khi còn kỹ năng đang chờ AI |
| `totalPoints`, `earnedPoints` | Tổng điểm thô của đề và điểm thô đạt được (để hiển thị), `correctCount` là số câu trắc nghiệm/điền từ đúng |
| `bestScorePercent`, `isPersonalBest` | Điểm cao nhất các lượt đã hoàn thành của người này với bài này, tính cả lượt vừa xong; lần đầu là `false` |
| `suggestedLevel` | Trình độ tổng: trung bình trình độ các kỹ năng (mục "Đánh giá trình độ"), **không** quy đổi từ `scorePercent`; `null` khi chưa chấm xong. Với bài `COMPREHENSIVE` đã chấm xong, trình độ này đồng thời được ghi vào `users.current_level` + `user_level_history` |
| `suggestedRoadmap` | Lộ trình đề xuất (tiếng Việt) do AI viết; AI lỗi thì là một câu dựng sẵn nêu kỹ năng yếu nhất; `null` khi chưa chấm xong |
| `skills` | Điểm 0–100 (số nguyên) và trình độ theo từng kỹ năng (mục "Đánh giá trình độ"). `reading`/`writing` cũng nhận điểm của các câu ngữ pháp ánh xạ sang (xem `progress.md`) |
| `passages` | Ngữ liệu của đề như ở `GET /api/tests/{testId}` (không có `maxPlays`), thêm `transcript`: lời thoại bài nghe (`test_passages.transcript`), có thể `null`. Trong kết quả bài nghe nghe lại được không giới hạn |
| `review[].passageId` | Ngữ liệu của câu hỏi, `null` với câu đứng riêng |
| `review[].level` | Bậc CEFR của câu hỏi (`test_questions.level`), `null` với câu chưa gắn bậc |
| `review[].aiCriteria`, `aiComment` | Chỉ có ở câu AI đã chấm: bậc 0–6 theo 4 tiêu chí `task` (đáp ứng đề bài), `coherence` (mạch lạc; với Nói là độ trôi chảy), `vocabulary`, `grammar`, và nhận xét ngắn bằng tiếng Việt (có thể `null`). Cả hai `null` với câu chấm tự động và câu đang chờ AI |
| `review[].pronunciation` | Chỉ có ở câu đọc theo câu mẫu đã ghi âm: `{ "score": 75.0, "phonemeAccuracy": 90.0, "wordAccuracy": 80.0, "errors": [ { "word": "shared", "expectedIpa": "ʃɛrd", "heardIpa": "ʃɛr" } ] }`. `score` là điểm phát âm 0–100; `phonemeAccuracy`, `wordAccuracy` là tỷ lệ khớp âm và khớp từ (0–100, có thể `null`); `errors` là các từ đọc sai hoặc bỏ sót (tối đa 20), `heardIpa` rỗng khi từ bị bỏ sót. Ở câu này `answerText` là văn bản dịch vụ nghe được, `correctAnswer` là câu mẫu, `correct` là `null`, `scoreEarned = points × score / 100`. `null` với mọi câu khác và câu chưa ghi âm |
| `review` | Mọi câu của đề theo thứ tự; câu không trả lời có `selectedOptionId` và `answerText` đều `null`, `correct: false`, `scoreEarned: 0`. `correctAnswer` là nội dung lựa chọn đúng (trắc nghiệm) hoặc đáp án chính (điền từ). `explanation` không có trong schema test, luôn bỏ qua |

`404` nếu lượt không tồn tại hoặc thuộc người khác. `409` nếu lượt chưa nộp.

## Đánh giá trình độ

Điểm phần trăm không nói lên trình độ nếu không biết câu hỏi khó đến đâu (làm đúng hết một đề toàn câu A1 không phải là
C2). Vì vậy **điểm** và **trình độ** được tính riêng (`SkillAssessor`, hàm thuần, có unit test):

- **Điểm kỹ năng** (0–100) = điểm đạt được / tổng điểm các câu của kỹ năng, làm tròn. Chỉ để hiển thị và vẽ radar.
- **Trình độ kỹ năng**, theo thứ tự ưu tiên:
  1. Kỹ năng có câu **AI chấm** (Nói, Viết): AI cho mỗi câu trả lời một bậc 0–6 theo từng tiêu chí (1 = A1 … 6 = C2;
     0 = không có tiếng Anh chấm được, lạc đề, chép lại đề). Bậc của câu = trung bình 4 tiêu chí (server tính, không
     hỏi AI con số tổng); trình độ = trung bình bậc các câu, làm tròn, thấp nhất là A1. Câu AI chấm bỏ trống tính bậc
     0. Điểm của câu = `points × bậc / 6`. Câu điền từ cùng kỹ năng chỉ cộng vào điểm.
  2. Kỹ năng có câu **gắn bậc** (`test_questions.level`): đi từ bậc dễ nhất có trong đề lên, **đạt một bậc khi được từ
     60% điểm của các câu bậc đó**; trình độ là bậc cao nhất đạt được mà mọi bậc dưới nó cũng đạt (đúng câu khó nhưng
     trượt bậc dễ hơn thì không tính). Trượt ngay bậc dễ nhất của đề thì xếp dưới bậc đó một bậc (thấp nhất A1).
  3. Không câu nào gắn bậc (đề cũ, đề định kỳ ngắn): quy đổi từ điểm theo bảng EF SET như trước.

     | Điểm 0–100 | 0–30 | 31–40 | 41–50 | 51–60 | 61–70 | 71–100 |
     |---|---|---|---|---|---|---|
     | Trình độ | A1 | A2 | B1 | B2 | C1 | C2 |

- **Câu đọc theo câu mẫu** là câu chấm tự động có điểm lẻ: điểm đạt được = `points × điểm phát âm / 100`, nên với
  luật 2 một bậc "đạt" khi điểm phát âm trung bình các câu bậc đó từ 60 trở lên. Khi kỹ năng Nói có cả câu mở (AI chấm)
  lẫn câu đọc theo mẫu, trình độ của các câu đọc theo mẫu (tính theo luật 2 hoặc 3) được coi là **tiêu chí thứ năm,
  "phát âm"**, bên cạnh 4 tiêu chí của AI: bậc kỹ năng = (4 × bậc AI + bậc phát âm) / 5. Điểm của OpenPronounce là ước
  lượng của mô hình (xem `pronunciation.md`), ngưỡng 60 cần chỉnh lại sau khi chạy thử với người học thật.
- **Điểm tổng** = trung bình điểm các kỹ năng, làm tròn. **Trình độ tổng** = trung bình trình độ các kỹ năng (A1 = 1 …
  C2 = 6), làm tròn, không yêu cầu trình độ tối thiểu từng kỹ năng.
- `suggested_level` = trình độ tổng. Với bài `PERIODIC` chỉ hiển thị, không ghi vào `users.current_level`.

**Soạn đề tổng hợp:** mỗi kỹ năng Nghe, Đọc nên có ít nhất 3 câu cho mỗi bậc muốn đo (đủ A1 đến C2 là 18 câu mỗi kỹ
năng); một bậc chỉ có 1 câu thì đúng hay sai một câu quyết định cả bậc. Phần Nói, Viết mỗi kỹ năng 1 đến 2 câu hỏi mở.
Câu đọc theo câu mẫu nên có vài câu ở các bậc khác nhau (câu càng dài, từ càng khó thì bậc càng cao), mỗi câu đọc được
trong 15 giây.

## Dữ liệu mẫu

Seed bằng migration Flyway (xem `V...__seed_tests.sql`): ít nhất một đề `PERIODIC` (trắc nghiệm + điền từ, chấm xong
ngay) và một đề `COMPREHENSIVE` (đủ 4 kỹ năng, phần Nói/Viết có thể để "đang chấm"). Hai đề mẫu hiện có **chưa gắn bậc**
(chấm theo luật 3), trừ câu Nói của đề tổng hợp: từ migration `V202610052251` nó là câu đọc theo câu mẫu bậc B2
("Sustainability is a shared responsibility."), **cần OpenPronounce đang chạy mới trả lời được**. Đề tổng hợp có gắn
bậc đầy đủ sẽ thêm bằng migration mới.

Migration `V202610062104__seed_tests_october.sql` thêm hai đề dùng đủ các dạng câu hỏi, mọi câu đều gắn bậc: đề định kỳ
**101** (11 câu, mở 30 ngày) và đề tổng hợp **201** (23 câu: 2 Nghe, 12 Đọc A2–C1, 4 Viết, 5 Nói). Cả hai có ngữ liệu dùng
chung, câu Nói đọc theo câu mẫu (cần OpenPronounce) và câu Nói, Viết mở (cần `GROQ_API_KEY`). Bài nghe của đề 201 dùng
file mẫu duy nhất hiện có (`/media/r2/media/listening/airport.mp3`), nên phần Nghe mới đo được tới bậc A2.

## Việc frontend cần làm (theo thay đổi lần 2 ngày 03/10/2026)

**Đã làm ngày 04/10/2026** (`frontend/src/features/tests/`); danh sách dưới đây ghi lại giao diện đã đổi những gì:

1. **Màn làm bài:** nhóm các câu cùng `passageId`, hiện bài nghe hoặc đoạn đọc một lần phía trên nhóm câu. Hiện nay
   câu thuộc ngữ liệu sẽ hiện mà không có bài nghe, đoạn đọc của nó.
2. **Trình phát bài nghe:** nút phát riêng (không dùng `controls` của trình duyệt), gọi `POST .../plays` trước khi
   phát, hiện "Còn N lần nghe" từ `maxPlays` và `passagePlays`, khóa nút khi hết lượt hoặc khi nhận `409`.
3. **Đề chỉ làm một lần** (`retakeAllowed: false`): danh sách đề hiện "Xem kết quả" thay nút bắt đầu khi đã nộp; màn
   làm bài không có "Làm lại từ đầu" (gửi `restart=true` sẽ nhận `409`); nên hỏi xác nhận trước khi bắt đầu ("Bài này
   chỉ làm được một lần").
4. **Trang kết quả:** hiện ngữ liệu kèm lời thoại (`passages[].transcript`), bậc của câu hỏi và nhận xét của AI
   (`review[].level`, `aiCriteria`, `aiComment`); tự tải lại khi `status = 'SUBMITTED'` (AI đang chấm).
5. `frontend/src/features/tests/types.js`, `frontend/src/test/fakeBackend.js`: thêm các trường mới.
6. **Câu đọc theo câu mẫu (05/10/2026, đã làm):** màn làm bài hiện câu mẫu và nút ghi âm (`ReadAloudAnswer`), gửi bản
   ghi ngay khi dừng, cho nghe lại và ghi lại, không cho nộp bài khi bản ghi còn đang xử lý; trang kết quả hiện điểm
   phát âm và các từ đọc sai. Bộ ghi âm dùng lại của màn bài tập phát âm
   (`features/exercises/pronunciation/useRecorder`).

## Việc backend cần làm

0. Trạng thái 05/10/2026: các mục dưới đã làm, trừ thu âm cho câu Nói mở (người học gõ văn bản) và đề mẫu có gắn bậc.
1. Entity cho sáu bảng (liên kết bằng id thường), module `modules/test`. Enum `type`, `question_type`, `status` dùng
   `@Enumerated(EnumType.STRING)` (chữ hoa trong DB); `skill` dùng converter chữ thường (`LowercaseEnumConverter`).
2. Chấm điểm là hàm thuần (so khớp đáp án, quy đổi CEFR), dễ viết unit test.
3. `userId` lấy qua `common.security.CurrentUser`. Phát `common.event.TestCompletedEvent` khi nộp bài để module D cập
   nhật `user_progress` (đừng để module khác đọc thẳng bảng).
4. Ghi trình độ qua contract `common.user.LevelRecorder` (do module user cài đặt) — không ghi thẳng bảng `users`.
5. AI chấm Nói/Viết và sinh lộ trình qua interface `TestAiGateway` trong module `test`; bản cài đặt
   `GroqTestAiGateway` dùng chung cấu hình `app.ai.groq.*` (`GROQ_API_KEY`) với chatbot của module B nhưng không gọi
   vào module B. Chưa đặt khóa thì câu Nói/Viết để "đang chấm" (không có fallback chấm giả), riêng lộ trình dùng câu
   dựng sẵn. Khóa API đặt bằng biến môi trường, không commit.
6. `PendingTestGradingScheduler` chấm lại các lượt `SUBMITTED` mỗi 2 phút. Lượt tổng hợp chấm xong ở đây luôn ghi
   `user_level_history` (lúc nộp bài thì chỉ ghi khi trình độ thay đổi), vì tác vụ nền không biết trình độ trước đó.
7. Luật "làm một lần" nằm ở `TestType.retakeAllowed()`; số lần nghe mỗi bài ở `TestPassage.MAX_PLAYS`.
8. Chấm phát âm qua interface `PronunciationAssessor`; bản cài đặt `OpenPronounceAssessor` đọc cùng cấu hình
   `app.pronunciation.openpronounce.*` (`OPENPRONOUNCE_BASE_URL`) với bài tập phát âm của module B nhưng không gọi vào
   module B. `TestRecordingService` không mở transaction trong lúc chờ dịch vụ chấm.
