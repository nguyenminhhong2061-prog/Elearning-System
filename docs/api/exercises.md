# API bài tập luyện tập (module B: đọc hiểu, viết, nghe hiểu, phát âm) — contract

> Trạng thái: **đề xuất, chờ Đạt duyệt.** Frontend (nhánh `feature/exercises-frontend`, `frontend/src/features/exercises/`)
> đã viết theo tài liệu này và chạy được với dữ liệu giả (`npm run dev:mock`). Backend chưa có. Module B do Lý Quang
> Đạt phụ trách; ngày 26/09/2026 Hồng nhận làm phần giao diện. Muốn đổi chỗ nào thì sửa tài liệu này trước, rồi sửa
> frontend (`api/exercisesApi.js`) và dữ liệu giả (`frontend/mock/routes/exercises.js`) cho khớp.
>
> **Cập nhật 27/09/2026 (Hồng chốt): làm tiếp bài dở.** Mở lại một bài ngữ pháp hoặc phát âm đang làm dở thì làm tiếp
> từ câu chưa trả lời, không bắt đầu lại (thẻ "Tiếp tục" trên trang chủ của thiết kế cần điều này). Các chỗ đổi: mục
> "Nguyên tắc", `progress.inProgress` của danh sách bài, `POST /api/exercises/{lessonId}/attempts` và endpoint mới
> `GET /api/exercise-attempts/current`.
>
> **Cập nhật 02/10/2026 (Hồng, theo Business model và kịch bản 9, 10 của `docs/English Learning System/`): bỏ kỹ năng
> Ngữ pháp, thay bằng Đọc hiểu (`READING`) và Viết (`WRITING`).** Bài đọc hiểu gồm câu trắc nghiệm ngữ pháp, câu điền chỗ
> trống (chính là bài ngữ pháp cũ) và câu hỏi về một bài đọc. Bài viết gồm ba dạng câu viết (dịch câu, viết lại câu,
> viết câu theo từ khóa), do **dịch vụ AI chấm điểm và nhận xét** từng câu. Các chỗ đổi được đánh dấu "(02/10)"; việc
> backend cần làm ở mục "Thay đổi ngày 02/10/2026" cuối tài liệu. Backend hiện tại (PR #16) vẫn là `GRAMMAR`: tới khi
> đổi theo tài liệu này, hai tab mới chỉ chạy với `npm run dev:mock`.

Mọi endpoint cần đăng nhập (`Authorization: Bearer <token>`). Lỗi dùng định dạng chung
`{ "timestamp": "...", "status": 404, "message": "..." }`. Giá trị enum trong JSON viết **chữ hoa** (DB lưu chữ thường,
xem bẫy "enum chữ thường" trong README). Dùng các bảng có sẵn trong `V1__init.sql`: `exercise_lessons`,
`exercise_questions`, `question_options`, `question_accepted_answers`, `listening_passages`, `listening_segments`,
`pronunciation_items`, `pronunciation_attempts`, `exercise_attempts`, `question_responses`.

## Nguyên tắc

- **Server chấm điểm.** Dữ liệu bài học gửi xuống trình duyệt **không** chứa đáp án (`is_correct`,
  `question_accepted_answers`, `explanation`). Đáp án và giải thích chỉ trả về sau khi người học đã trả lời câu đó.
- **Mỗi lần làm bài là một `exercise_attempts`, và bài đọc hiểu, viết, phát âm làm tiếp được.** Mỗi người có tối đa một lượt
  `in_progress` cho mỗi bài. Mở bài mà lượt đó còn **làm tiếp được** thì server trả lại chính lượt đó cùng những gì đã
  làm; nếu không thì tạo lượt mới (lượt `in_progress` cũ, nếu có, chuyển `abandoned`). "Làm lại từ đầu" luôn tạo lượt
  mới. Thoát giữa chừng thì các câu đã trả lời vẫn nằm trong `question_responses`; điểm chỉ được tính khi lượt kết thúc
  (`POST .../complete`).
- **Một lượt `in_progress` làm tiếp được** khi đủ bốn điều kiện:
  1. bài là `READING`, `WRITING` hoặc `PRONUNCIATION`. **Bài nghe không làm tiếp**: đáp án bài nghe chỉ gửi lên khi nộp cả bài, nên
     server không biết người học đã chọn gì; bài nghe lại ngắn và thường phải nghe lại từ đầu;
  2. người học đã trả lời ít nhất một câu (đọc hiểu, viết) hoặc ghi âm ít nhất một mục (phát âm). Mở bài rồi thoát ngay thì
     không có gì để làm tiếp, lần sau mở là lượt mới;
  3. hoạt động cuối cùng của lượt (lần trả lời, lần AI chấm câu viết hoặc lần chấm ghi âm gần nhất) cách đây **không
     quá 7 ngày**;
  4. bài không bị sửa sau khi lượt bắt đầu: `exercise_lessons.updated_at <= exercise_attempts.started_at`. Trigger chỉ
     cập nhật `updated_at` khi sửa chính dòng bài học, nên khi sửa câu hỏi, lựa chọn hay mục phát âm của bài thì service
     cũng phải cập nhật `updated_at` của bài.

  Lượt không còn làm tiếp được thì coi như đã bỏ: không hiện ở đâu, và lần mở bài tới chuyển nó sang `abandoned`.
- Đọc hiểu chấm **từng câu ngay khi trả lời**, theo đáp án ("chấm ngay, hiện đúng/sai kèm giải thích"). **(02/10)**
  Viết cũng gửi **từng câu** khi người học bấm "Kiểm tra", nhưng câu viết có nhiều cách diễn đạt đúng nên **không so
  khớp**: server gửi đề, dạng câu, điểm tối đa, các câu trả lời mẫu và câu trả lời cho dịch vụ AI, AI trả điểm và nhận
  xét. Server **không bao giờ tự đặt điểm** thay AI: AI lỗi thì câu đó chưa có điểm, người học gửi chấm lại; lượt chỉ có
  tổng điểm khi mọi câu đã chấm. Nghe hiểu **nộp cả bài một lần** ("trả lời, nộp, chấm điểm, hiện đáp án đúng và bản
  dịch"). Phát âm chấm **từng lần ghi âm**.
- Chỉ bài `publication_status = 'published'` và có ít nhất một câu hỏi (đọc hiểu, viết, nghe) hoặc một mục (phát âm)
  mới hiện với người học. Bài khác trả `404`.

## Enum

| Trường | Giá trị JSON | Cột DB |
|---|---|---|
| `skill` | `READING`, `WRITING`, `LISTENING`, `PRONUNCIATION` (02/10) | `exercise_lessons.skill` (`reading`, `writing`, `listening`, `pronunciation`; cần migration) |
| `difficulty` | `EASY`, `MEDIUM`, `HARD` (giao diện: Dễ, Trung bình, Khó) | `exercise_lessons.difficulty` |
| `type` của câu hỏi | `MULTIPLE_CHOICE`, `FILL_BLANK` (đọc hiểu, nghe); `TRANSLATION`, `REWRITE`, `KEYWORD_SENTENCE` (viết, 02/10) | `exercise_questions.question_type` |
| `errorType` của từ | `NONE`, `MISPRONUNCIATION`, `OMISSION`, `INSERTION` | trong `pronunciation_attempts.assessment_details` |

## Danh sách bài

### `GET /api/exercises?skill=READING`

`skill` bắt buộc (`400` nếu thiếu hoặc sai). Không phân trang (mỗi kỹ năng chỉ vài chục bài).

```json
[
  {
    "id": 1,
    "skill": "READING",
    "title": "Thì hiện tại hoàn thành",
    "description": "Hành động bắt đầu trong quá khứ và còn liên quan tới hiện tại.",
    "topic": "Thì của động từ",
    "cefrLevel": "B1",
    "difficulty": "MEDIUM",
    "estimatedMinutes": 8,
    "itemCount": 10,
    "progress": {
      "attemptCount": 2,
      "bestScorePercent": 80,
      "lastCompletedAt": "2026-09-25T09:12:00Z",
      "inProgress": { "attemptId": 57, "doneCount": 4, "lastActivityAt": "2026-09-26T14:10:00Z" },
      "practicedCount": null,
      "lastResult": { "correctCount": 8, "questionCount": 10 }
    }
  }
]
```

| Trường | Ý nghĩa |
|---|---|
| `description`, `topic`, `estimatedMinutes` | Có thể `null` |
| `itemCount` | Số câu hỏi (đọc hiểu, viết, nghe) hoặc số mục luyện (phát âm) |
| `progress` | Của **người dùng hiện tại**. `attemptCount`, `bestScorePercent`, `lastCompletedAt` chỉ tính lượt `completed`: `0`, `null`, `null` khi chưa hoàn thành lần nào |
| `progress.inProgress` | Lượt đang dở **làm tiếp được** của bài này (xem "Nguyên tắc"), `null` nếu không có. `doneCount`: số câu đã trả lời (đọc hiểu, viết; câu viết chưa chấm vẫn tính là đã trả lời) hoặc số mục đã ghi âm ít nhất một lần (phát âm); giao diện hiện nhãn "Đang làm dở · 4/10 câu". Bài nghe luôn `null` |
| `progress.practicedCount` | **Đề xuất thêm 01/10/2026, chờ Đạt** (kịch bản 12, bước 2 và 14). Chỉ bài phát âm: số mục khác nhau đã có ít nhất một lần ghi âm được chấm, tính mọi lượt; giao diện hiện "Đã luyện 3/5 mục". Kỹ năng khác: `null`. Thiếu trường này thì thẻ bài hiện điểm cao nhất như cũ |
| `progress.lastResult` | **Đề xuất thêm 01/10/2026, chờ Đạt** (kịch bản 11, bước 2 và 11). Kết quả lượt `completed` gần nhất: `{ correctCount, questionCount }`, `null` khi chưa hoàn thành lần nào; bài nghe hiện "Gần nhất 4/5". Bài phát âm: `null` |

Sắp xếp "cơ bản đến nâng cao" (B1): `cefr_level` A1 → C2, rồi `sort_order`, rồi `id`. Giao diện nhóm theo trình độ.

## Nội dung một bài

### `GET /api/exercises/{lessonId}`

```json
{
  "id": 1,
  "skill": "READING",
  "title": "Thì hiện tại hoàn thành",
  "description": "…",
  "topic": "Thì của động từ",
  "cefrLevel": "B1",
  "difficulty": "MEDIUM",
  "estimatedMinutes": 8,
  "questions": [
    {
      "id": 11,
      "type": "MULTIPLE_CHOICE",
      "prompt": "She ___ (live) in Hanoi for five years.",
      "hint": "Có \"for five years\": hành động kéo dài tới bây giờ.",
      "points": 1,
      "options": [ { "id": 101, "key": "A", "text": "lives" }, { "id": 102, "key": "B", "text": "has lived" } ],
      "passageId": null,
      "starter": null
    },
    { "id": 12, "type": "FILL_BLANK", "prompt": "I have never ___ (see) such a beautiful beach.", "hint": null, "points": 1, "options": [], "passageId": null, "starter": null },
    {
      "id": 18,
      "type": "MULTIPLE_CHOICE",
      "prompt": "Why hasn't Anna been to Sa Pa yet?",
      "hint": null,
      "points": 1,
      "options": [ { "id": 181, "key": "A", "text": "She doesn't like cold weather" }, { "id": 182, "key": "B", "text": "She has been busy with her new job" } ],
      "passageId": 71,
      "starter": null
    }
  ],
  "readingPassages": [
    { "id": 71, "title": "Anna's life in Hanoi", "content": "Anna is a teacher from Australia. She has lived in Hanoi since 2020. …\n\nOn weekends, she …" }
  ],
  "passage": null,
  "pronunciationItems": []
}
```

- `questions`: theo `sort_order`. Không có `is_correct`, đáp án chấp nhận, câu trả lời mẫu hay `explanation`. `hint`
  (`hint_text`) có thể `null`; giao diện chỉ hiện khi người học bấm "Xem gợi ý". `options` rỗng với `FILL_BLANK` và câu
  viết. `points` là số (DECIMAL).
- `passageId` **(02/10)**: id bài đọc mà câu hỏi hỏi về (`exercise_questions.reading_passage_id`), chỉ có ở `READING`;
  `null` với câu trắc nghiệm ngữ pháp, câu điền chỗ trống và các kỹ năng khác. Giao diện hiện bài đọc ở cột trái, câu
  hỏi ở cột phải (kịch bản 9, bước 13).
- `readingPassages` **(02/10)**: các bài đọc của bài học (chỉ `READING`, còn lại `[]`), theo `sort_order`. `content` là
  văn bản thuần, các đoạn cách nhau bằng một dòng trống (`\n\n`). Một bài đọc hiểu có thể không có bài đọc nào.
- Câu viết **(02/10)**, chỉ ở `WRITING`:

  ```json
  [
    { "id": 41, "type": "TRANSLATION", "prompt": "Tôi đã đặt phòng khách sạn trước hai tuần.", "hint": "Chú ý cách nói 'trước bao lâu' trong tiếng Anh", "points": 2, "options": [], "passageId": null, "starter": null },
    { "id": 42, "type": "REWRITE", "prompt": "It took us three hours to get to Da Lat.", "hint": null, "points": 2, "options": [], "passageId": null, "starter": "We spent" },
    { "id": 43, "type": "KEYWORD_SENTENCE", "prompt": "luggage / heavy / carry", "hint": null, "points": 2, "options": [], "passageId": null, "starter": null }
  ]
  ```

  `prompt` là câu tiếng Việt cần dịch (`TRANSLATION`), câu gốc cần viết lại (`REWRITE`) hoặc các từ khóa cách nhau bằng
  `" / "` (`KEYWORD_SENTENCE`). `starter` (cột mới `starter_text`): phần mở đầu cho sẵn của câu viết lại ("We spent
  …"), có thể `null`; các dạng khác luôn `null`. Giao diện tự thêm lời dẫn theo dạng câu ("Dịch sang tiếng Anh:", "Viết
  lại câu sao cho nghĩa không đổi:", "Viết một câu có dùng các từ gợi ý:").
- `passage` (chỉ `LISTENING`, còn lại `null`):

  ```json
  {
    "title": "Hội thoại tại sân bay",
    "audioUrl": "/media/r2/media/listening/airport.mp3",
    "durationMs": 110000,
    "segments": [
      { "id": 501, "order": 1, "startMs": 0, "endMs": 6200, "speaker": "Hành khách", "transcript": "Excuse me, could you tell me where the check-in counter for flight VN209 is?" }
    ]
  }
  ```

  `segments` là phụ đề (người học bật "Hiện phụ đề" mới thấy); **không** kèm bản dịch (`translation_vi` chỉ trả sau khi
  nộp bài, để đối chiếu). `speaker` có thể `null`. Khi bật R2 proxy, `audioUrl` trỏ tới `/media/r2/<object-key>`;
  endpoint GET/HEAD chỉ đọc audio trong `media/listening/`, hỗ trợ HTTP Range để thẻ `<audio>` tua được và không cần JWT.
  Khi tắt R2 proxy, backend giữ nguyên URI local hoặc URL công khai đã lưu.
- `pronunciationItems` (chỉ `PRONUNCIATION`, còn lại `[]`), theo `sort_order`:

  ```json
  [ { "id": 801, "text": "sustainability", "ipa": "/səˌsteɪnəˈbɪləti/", "audioUrl": null, "notes": "Trọng âm rơi vào \"bil\"." } ]
  ```

  `audioUrl` (`reference_audio_uri`) có thể `null`: khi đó giao diện đọc mẫu bằng giọng máy của trình duyệt.

## Lượt làm bài

### `POST /api/exercises/{lessonId}/attempts` — bắt đầu hoặc làm tiếp

Không có body. Giao diện gọi endpoint này ngay khi mở bài, và gọi kèm `?restart=true` khi người học bấm "Làm lại từ
đầu" hoặc "Làm lại" trên màn kết quả.

- Có lượt `in_progress` **làm tiếp được** (xem "Nguyên tắc") và không gửi `restart=true`: trả `200` với chính lượt đó,
  `resumed: true`.
- Ngược lại: lượt `in_progress` cũ (nếu có) chuyển `abandoned`, tạo lượt mới và trả `201`, `resumed: false`.

```json
{
  "attemptId": 57,
  "startedAt": "2026-09-25T02:00:00Z",
  "resumed": true,
  "responses": [
    { "questionId": 11, "correct": true, "optionId": 102, "answer": null, "correctOptionId": 102, "correctAnswer": "has lived", "explanation": "…" }
  ],
  "pronunciation": [ { "itemId": 801, "tryCount": 2, "bestScore": 86 } ]
}
```

| Trường | Ý nghĩa |
|---|---|
| `responses` | Các câu đã trả lời trong lượt (đọc hiểu, viết), theo thứ tự câu hỏi của bài, cùng dạng phần tử `review` của `.../complete`. Câu viết chưa chấm có `graded: false` (giao diện hiện lại nút "Gửi chấm lại"). Lượt mới: `[]` |
| `pronunciation` | Các mục đã ghi âm trong lượt (phát âm): số lần ghi (`tryCount`) và điểm tổng cao nhất (`bestScore`). Không trả lại bản ghi hay chi tiết từng từ. Lượt mới hoặc kỹ năng khác: `[]` |

Giao diện mở bài đọc hiểu, viết ở câu đầu tiên chưa trả lời, bài phát âm ở mục đầu tiên chưa ghi âm; các câu đã trả lời hiện
lại đáp án và giải thích như lúc vừa chấm. Đã làm hết mà chưa kết thúc thì mở ở câu, mục cuối để người học bấm "Xem kết
quả".

### `GET /api/exercise-attempts/current` — lượt đang dở gần nhất

Cho thẻ "Tiếp tục" trên trang chủ (`docs/api/progress.md`). Trả lượt `in_progress` **làm tiếp được** có hoạt động cuối
gần nhất của người dùng, ở mọi bài:

```json
{
  "current": {
    "attemptId": 57,
    "lesson": { "id": 3, "skill": "READING", "title": "Thì hiện tại hoàn thành", "cefrLevel": "B1", "itemCount": 10 },
    "doneCount": 4,
    "lastActivityAt": "2026-09-26T14:10:00Z"
  }
}
```

Không có lượt nào: `{ "current": null }` (không phải `404`); giao diện khi đó gợi ý bài kế tiếp. `doneCount` như trong
`progress.inProgress`. Đường dẫn `current` không đụng các endpoint `/api/exercise-attempts/{attemptId}/…` vì
`attemptId` luôn là số.

Các endpoint `/api/exercise-attempts/{attemptId}/…` bên dưới trả `404` nếu lượt không tồn tại hoặc thuộc người khác,
`409` nếu lượt không còn `in_progress` (đã nộp hoặc đã bị bỏ).

### `POST /api/exercise-attempts/{attemptId}/responses` — trả lời một câu (đọc hiểu, viết)

```json
{ "questionId": 11, "optionId": 102 }
```

hoặc với `FILL_BLANK`: `{ "questionId": 12, "answer": "seen" }` (1 đến 200 ký tự). Trả `200`:

```json
{ "questionId": 11, "correct": true, "correctOptionId": 102, "correctAnswer": "has lived", "explanation": "…", "awardedPoints": 1 }
```

- `correctOptionId`: `null` với `FILL_BLANK`. `correctAnswer`: nội dung lựa chọn đúng, hoặc đáp án chính
  (`is_primary`) của câu điền từ. `explanation` có thể `null`.
- **So khớp câu điền từ:** cắt khoảng trắng đầu cuối, gộp khoảng trắng liên tiếp, chữ thường, đổi dấu nháy cong `’` thành
  `'`, rồi so với `normalized_answer` của mọi đáp án chấp nhận. Lưu cả `entered_answer` (nguyên văn) và
  `normalized_answer`.
- Mỗi câu chỉ trả lời **một lần** trong một lượt: lần thứ hai trả `409`. `400` nếu câu hỏi không thuộc bài, gửi cả hai
  hoặc không gửi `optionId`/`answer`, hoặc `optionId` không thuộc câu hỏi.

**Câu viết (02/10, kịch bản 10 bước 5–8):** body `{ "questionId": 41, "answer": "I booked the hotel room before two
weeks." }` (`answer` 1 đến 1000 ký tự; câu viết không nhận `optionId`). Server **lưu câu trả lời trước**, rồi gửi dịch
vụ AI (cắt ở khoảng 20 giây). Trả `200`:

```json
{
  "questionId": 41,
  "graded": true,
  "correct": null,
  "awardedPoints": 1.0,
  "maxPoints": 2,
  "feedback": "Chia đúng thì quá khứ đơn và đủ ý. 'before two weeks' không phải cách nói tự nhiên; …",
  "sampleAnswers": [ "I booked the hotel room two weeks in advance.", "I booked a hotel room two weeks ahead." ],
  "explanation": "in advance nghĩa là trước một thời điểm; …",
  "correctOptionId": null,
  "correctAnswer": null
}
```

- `awardedPoints`: từ `0` đến `maxPoints` (`points` của câu), bước 0,5 (server làm tròn điểm AI trả về tới bội số 0,5
  gần nhất trong khoảng). `feedback`: nhận xét tiếng Việt của AI, nêu lỗi và câu gợi ý. Câu lạc đề, không viết bằng tiếng
  Anh hay thiếu từ khóa vẫn có điểm (có thể `0`) kèm nhận xét nêu lỗi (nhánh 7a). `sampleAnswers` và `explanation` chỉ gửi
  khi câu đã chấm.
- **AI lỗi hoặc quá thời gian (nhánh 7b):** vẫn trả `200`, vì câu trả lời đã được lưu, với `graded: false`,
  `awardedPoints`, `feedback`, `explanation` là `null` và `sampleAnswers` là `[]`. Server không tự đặt điểm. Giao diện
  hiện "Chưa chấm được câu này" và nút "Gửi chấm lại"; ô soạn câu đã khóa (nhánh 8a: câu đã gửi không sửa được trong
  lượt này).
- Câu đọc hiểu, câu nghe: kết quả như trên, không có `graded`, `maxPoints`, `feedback`, `sampleAnswers` (giao diện coi
  như đã chấm).

### `POST /api/exercise-attempts/{attemptId}/responses/{questionId}/grade` — gửi chấm lại một câu viết (02/10)

Không có body. Gửi lại **câu trả lời đã lưu** cho dịch vụ AI (kịch bản 10, nhánh 7b và 14a). Trả `200` cùng dạng kết quả
câu viết ở trên; AI vẫn lỗi thì vẫn `graded: false`. `409` nếu câu đã có điểm. `400` nếu câu không phải câu viết của
bài hoặc chưa được trả lời trong lượt.

### `POST /api/exercise-attempts/{attemptId}/complete` — kết thúc lượt

```json
{ "responses": [ { "questionId": 21, "optionId": 211 }, { "questionId": 22, "answer": "gate" } ], "playbackRate": 1.25 }
```

- `responses`: các câu **chưa** gửi qua `.../responses` (nghe hiểu gửi cả bài ở đây; đọc hiểu, viết gửi `[]`). Cùng luật kiểm
  tra như trên. Câu vẫn không có câu trả lời thì tính sai, 0 điểm.
- `playbackRate` (tùy chọn, 0.5 đến 2): tốc độ nghe cuối cùng, lưu vào `exercise_attempts.playback_rate`.
- **(02/10) Bài viết còn câu đã trả lời mà chưa chấm thì trả `409`** và lượt giữ `in_progress` (kịch bản 10, nhánh
  14a): giao diện không gọi `complete` khi biết còn câu chưa chấm, mà báo "Còn N câu chưa chấm" kèm nút "Gửi chấm lại các
  câu chưa chấm"; `409` chỉ là lớp bảo vệ.
- Tính `total_points`, `earned_points`, `score_percent` (làm tròn số nguyên), đặt `status = 'completed'` và
  `finished_at`. Trả `200`:

```json
{
  "attemptId": 55,
  "lessonId": 1,
  "correctCount": 8,
  "questionCount": 10,
  "earnedPoints": 8,
  "totalPoints": 10,
  "scorePercent": 80,
  "bestScorePercent": 90,
  "isPersonalBest": false,
  "review": [
    { "questionId": 11, "correct": true, "optionId": 102, "answer": null, "correctOptionId": 102, "correctAnswer": "has lived", "explanation": "…" }
  ],
  "translations": [ { "segmentId": 501, "translation": "Xin lỗi, bạn có thể cho tôi biết quầy làm thủ tục…" } ],
  "pronunciation": null
}
```

- `review`: mọi câu hỏi của bài, theo thứ tự; câu không trả lời có `optionId` và `answer` đều `null`.
- **(02/10) Bài viết:** `correctCount` là số câu đạt điểm tối đa; `earnedPoints`, `totalPoints` có thể lẻ 0,5 (giao
  diện vẽ vòng điểm theo `earnedPoints / totalPoints`, ví dụ "10/12"). Mỗi phần tử `review` có dạng kết quả câu viết
  (`graded: true`, `awardedPoints`, `maxPoints`, `feedback`, `sampleAnswers`, `explanation`) kèm `answer` (câu người học
  viết) và `optionId: null`; câu không trả lời có `answer: null`, `awardedPoints: 0`, `feedback: null`.
- `translations`: bản dịch từng đoạn của bài nghe (`listening_segments.translation_vi`), `[]` với kỹ năng khác.
- `bestScorePercent`: điểm cao nhất của người này với bài này, **tính cả lượt vừa xong**. `isPersonalBest`: lượt này cao
  hơn **mọi** lượt hoàn thành trước. Lần đầu hoàn thành là `false` (chưa có kỷ lục nào để phá, giao diện không hiện
  "Kỷ lục mới!").
- Với `PRONUNCIATION`: `review` là `[]`, `correctCount`/`questionCount` là số mục đã luyện/tổng số mục, và
  `scorePercent` là trung bình **điểm tổng cao nhất** của từng mục (mục bỏ qua tính 0), kèm:

  ```json
  "pronunciation": { "averageScore": 84, "practicedCount": 14, "itemCount": 15 }
  ```

  `averageScore` chỉ tính các mục đã luyện.

## Phát âm

### `POST /api/exercise-attempts/{attemptId}/pronunciation/{itemId}` — chấm một lần ghi âm

Body là **file âm thanh thô** (không phải multipart), `Content-Type: audio/wav`: WAV PCM 16 bit, **16 kHz, một kênh**,
tối đa 10 giây (giao diện tự dừng ở 10 giây). Trình duyệt tự chuyển bản ghi sang định dạng này trước khi gửi.

> Vì sao WAV 16 kHz mono: đây là định dạng giao diện tạo ổn định trước khi gửi. OpenPronounce nhận file qua multipart ở
> dịch vụ Python và tự nạp audio bằng `ffmpeg`/`espeak-ng` trong container. Bản ghi mặc định của trình duyệt thì khác nhau
> (Chrome: WebM/Opus, Safari: MP4/AAC). 10 giây PCM ≈ 320 KB.

Backend xác minh lượt/mục thuộc người học hiện tại, chuyển WAV cùng `reference_text` tới OpenPronounce ở
`OPENPRONOUNCE_BASE_URL` (mặc định `http://localhost:8001`), lưu một dòng `pronunciation_attempts` (`try_number` tăng dần
theo mục trong lượt; `overall_score`; `accuracy_score` là tỷ lệ khớp âm vị; `assessment_details` là JSON gốc), rồi trả `201`:

```json
{
  "itemId": 801,
  "tryNumber": 2,
  "overallScore": 86,
  "phonemeAccuracyScore": 90,
  "wordAccuracyScore": 82,
  "recognizedText": "sustainability",
  "errors": [ {
    "word": "sustainability",
    "expectedIpa": "səsteɪnəbɪləti",
    "heardIpa": "səsteɪnəbɪləti",
    "confidence": 72,
    "errorType": "MISPRONUNCIATION",
    "phones": [ { "expected": "ɪ", "heard": "i", "confidence": 72 } ]
  } ],
  "tips": [ "Kiểm tra lại từ sustainability: mong đợi IPA, hệ thống nghe IPA." ]
}
```

- `overallScore`: điểm tổng OpenPronounce 0–100. `phonemeAccuracyScore` và `wordAccuracyScore` là tỷ lệ khớp được
  quy đổi từ phoneme/word error rate nên chỉ mang tính xấp xỉ; không phải điểm fluency của Azure.
- `errors`: các từ bị mô hình gắn cờ cùng IPA dự kiến/nhận dạng. `confidence` là độ tin cậy của cảnh báo, không phải
  điểm phát âm của từ. `phones` có thể rỗng nếu upstream tắt phone model. `tips` được backend tạo từ IPA để đối chiếu.
- `400`: WAV không hợp lệ hoặc lớn hơn 1 MB. Giao diện từ chối bản ghi ngắn hơn 0,3 giây trước khi gửi. `503`: service
  OpenPronounce lỗi hoặc timeout; khi đó không lưu dòng đánh giá. Giao diện chờ tối đa 10 phút để lần chấm đầu có thời
  gian tải model.
- OpenPronounce là mô hình ước lượng, không phải chấm chuẩn giáo viên; cảnh báo sai vẫn có thể xảy ra. Cách chạy local,
  cache model và hạn chế xem tại [`docs/api/pronunciation.md`](pronunciation.md).

## Việc backend cần làm (gợi ý cho Đạt)

1. Entity cho các bảng (liên kết bằng id thường, converter chữ thường cho enum như `LowercaseEnumConverter` trong
   `common.persistence`), module `modules/exercise`. Thay đổi ngày 02/10 ở mục cuối.
2. Seed nội dung mẫu bằng migration Flyway đặt tên theo thời gian (`V<yyyyMMddHHmm>__seed_exercises.sql`). Dữ liệu giả
   trong `frontend/mock/exerciseFixtures.js` dùng làm mẫu được.
3. File audio: có thể đặt trong `src/main/resources/static/media/…` hoặc bucket R2 `learning-audio`. Với R2, backend
   dùng token S3 chỉ-đọc để stream qua `/media/r2/**`; giới hạn khóa object vào prefix `media/listening/`, và mở GET/HEAD
   `permitAll` vì thẻ `<audio>` không gửi được header `Authorization`.
4. Chấm điểm là hàm thuần (so khớp đáp án, tính phần trăm), dễ viết unit test. Luật "làm tiếp được" (kỹ năng, 7 ngày,
   `updated_at` của bài) cũng nên là một hàm thuần nhận thời điểm hiện tại, để test không phụ thuộc đồng hồ.
   "Hoạt động cuối" là giá trị lớn nhất của `question_responses.answered_at`, `pronunciation_attempts.assessed_at` và
   `exercise_attempts.started_at` của lượt; không cần thêm cột.
5. `userId` lấy qua `common.security.CurrentUser`. Nếu module Tiến độ (D) cần kết quả bài tập, phát một sự kiện ở
   `common.event` (như `WordReviewedEvent` của module A), đừng để module khác đọc thẳng bảng.

## Thay đổi ngày 02/10/2026: Ngữ pháp → Đọc hiểu và Viết (việc backend, Đạt)

Theo `docs/English Learning System/Requirements/Business_model.md` ("Chia bài tập ngữ pháp thành bài tập đọc hiểu và bài
tập viết", "Dịch vụ AI chấm câu viết của bài tập viết") và thiết kế `Design/schema.sql` (`tbl_reading_passage`,
`tbl_sample_answer`, `tbl_exercise_answer.ai_feedback`).

| # | Việc | Gợi ý |
|---|---|---|
| 1 | Kỹ năng | Enum `ExerciseSkill`: `READING`, `WRITING`, `LISTENING`, `PRONUNCIATION`. Migration: ràng buộc `exercise_lessons.skill` thêm `reading`, `writing`; `UPDATE exercise_lessons SET skill = 'reading' WHERE skill = 'grammar'` (bài ngữ pháp có sẵn thành bài đọc hiểu không có bài đọc, không mất lượt làm cũ); rồi bỏ `grammar` khỏi ràng buộc |
| 2 | Bài đọc | Bảng mới `reading_passages (id, lesson_id → exercise_lessons ON DELETE CASCADE, title VARCHAR(255) NOT NULL, content TEXT NOT NULL, sort_order INT NOT NULL DEFAULT 0)`; cột mới `exercise_questions.reading_passage_id BIGINT NULL → reading_passages(id) ON DELETE SET NULL`. Câu hỏi về bài đọc chỉ trỏ tới bài đọc của chính bài học đó |
| 3 | Câu viết | `exercise_questions.question_type` thêm `translation`, `rewrite`, `keyword_sentence`; cột mới `starter_text TEXT NULL`. Câu đọc hiểu, nghe chỉ là `multiple_choice`, `fill_blank`; bài viết chỉ gồm câu viết |
| 4 | Câu trả lời mẫu | Bảng mới `question_sample_answers (id, question_id → exercise_questions ON DELETE CASCADE, content TEXT NOT NULL, sort_order INT NOT NULL DEFAULT 0)`; mỗi câu viết có ít nhất một câu mẫu |
| 5 | Câu trả lời | `question_responses`: `is_correct` cho phép `NULL` (câu viết), `awarded_points` cho phép `NULL` (= chưa chấm), cột mới `ai_feedback TEXT NULL` và `graded_at TIMESTAMPTZ NULL`; `entered_answer` đủ cho 1000 ký tự |
| 6 | AI chấm câu viết | Gửi đề, dạng câu, điểm tối đa, các câu mẫu và câu trả lời; yêu cầu JSON `{ "score": số, "feedback": "…" }`, nhận xét tiếng Việt, nêu lỗi và một câu gợi ý. Không parse được, điểm ngoài khoảng hay quá 20 giây thì coi là AI lỗi (`graded: false`), không đoán điểm. Có thể dùng chung Groq với chatbot |
| 7 | Hoạt động cuối, làm tiếp | "Hoạt động cuối" (luật làm tiếp 7 ngày) tính thêm `graded_at`; `READING`, `WRITING` làm tiếp được như ngữ pháp cũ |
| 8 | Nộp bài viết | `complete` trả `409` khi còn câu viết chưa chấm; điểm lẻ 0,5 nên `earned_points`, `total_points` giữ kiểu `NUMERIC` |
| 9 | Seed | Mẫu trong `frontend/mock/exerciseFixtures.js`: bài đọc hiểu "Thì hiện tại hoàn thành" có bài đọc "Anna's life in Hanoi", bài "A trip to Ha Long Bay", và 4 bài viết (có câu mẫu, giải thích) |
| 10 | Chatbot | Ngữ cảnh của câu viết: đề, dạng câu, câu mẫu, câu trả lời và nhận xét AI (nếu đã chấm); chưa trả lời thì chỉ gợi ý, không đưa câu mẫu (`chatbot.md`) |
