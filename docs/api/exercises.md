# API bài tập luyện tập (module B: B1 ngữ pháp, B2 nghe hiểu, B3 phát âm) — contract

> Trạng thái: **đề xuất, chờ Đạt duyệt.** Frontend (nhánh `feature/exercises-frontend`, `frontend/src/features/exercises/`)
> đã viết theo tài liệu này và chạy được với dữ liệu giả (`npm run dev:mock`). Backend chưa có. Module B do Lý Quang
> Đạt phụ trách; ngày 26/09/2026 Hồng nhận làm phần giao diện. Muốn đổi chỗ nào thì sửa tài liệu này trước, rồi sửa
> frontend (`api/exercisesApi.js`) và dữ liệu giả (`frontend/mock/routes/exercises.js`) cho khớp.
>
> **Cập nhật 27/09/2026 (Hồng chốt): làm tiếp bài dở.** Mở lại một bài ngữ pháp hoặc phát âm đang làm dở thì làm tiếp
> từ câu chưa trả lời, không bắt đầu lại (thẻ "Tiếp tục" trên trang chủ của thiết kế cần điều này). Các chỗ đổi: mục
> "Nguyên tắc", `progress.inProgress` của danh sách bài, `POST /api/exercises/{lessonId}/attempts` và endpoint mới
> `GET /api/exercise-attempts/current`.

Mọi endpoint cần đăng nhập (`Authorization: Bearer <token>`). Lỗi dùng định dạng chung
`{ "timestamp": "...", "status": 404, "message": "..." }`. Giá trị enum trong JSON viết **chữ hoa** (DB lưu chữ thường,
xem bẫy "enum chữ thường" trong README). Dùng các bảng có sẵn trong `V1__init.sql`: `exercise_lessons`,
`exercise_questions`, `question_options`, `question_accepted_answers`, `listening_passages`, `listening_segments`,
`pronunciation_items`, `pronunciation_attempts`, `exercise_attempts`, `question_responses`.

## Nguyên tắc

- **Server chấm điểm.** Dữ liệu bài học gửi xuống trình duyệt **không** chứa đáp án (`is_correct`,
  `question_accepted_answers`, `explanation`). Đáp án và giải thích chỉ trả về sau khi người học đã trả lời câu đó.
- **Mỗi lần làm bài là một `exercise_attempts`, và bài ngữ pháp, phát âm làm tiếp được.** Mỗi người có tối đa một lượt
  `in_progress` cho mỗi bài. Mở bài mà lượt đó còn **làm tiếp được** thì server trả lại chính lượt đó cùng những gì đã
  làm; nếu không thì tạo lượt mới (lượt `in_progress` cũ, nếu có, chuyển `abandoned`). "Làm lại từ đầu" luôn tạo lượt
  mới. Thoát giữa chừng thì các câu đã trả lời vẫn nằm trong `question_responses`; điểm chỉ được tính khi lượt kết thúc
  (`POST .../complete`).
- **Một lượt `in_progress` làm tiếp được** khi đủ bốn điều kiện:
  1. bài là `GRAMMAR` hoặc `PRONUNCIATION`. **Bài nghe không làm tiếp**: đáp án bài nghe chỉ gửi lên khi nộp cả bài, nên
     server không biết người học đã chọn gì; bài nghe lại ngắn và thường phải nghe lại từ đầu;
  2. người học đã trả lời ít nhất một câu (ngữ pháp) hoặc ghi âm ít nhất một mục (phát âm). Mở bài rồi thoát ngay thì
     không có gì để làm tiếp, lần sau mở là lượt mới;
  3. hoạt động cuối cùng của lượt (lần trả lời hoặc lần chấm ghi âm gần nhất) cách đây **không quá 7 ngày**;
  4. bài không bị sửa sau khi lượt bắt đầu: `exercise_lessons.updated_at <= exercise_attempts.started_at`. Trigger chỉ
     cập nhật `updated_at` khi sửa chính dòng bài học, nên khi sửa câu hỏi, lựa chọn hay mục phát âm của bài thì service
     cũng phải cập nhật `updated_at` của bài.

  Lượt không còn làm tiếp được thì coi như đã bỏ: không hiện ở đâu, và lần mở bài tới chuyển nó sang `abandoned`.
- Ngữ pháp chấm **từng câu ngay khi trả lời** (nghiệp vụ B1: "chấm ngay, hiện đúng/sai kèm giải thích"). Nghe hiểu
  **nộp cả bài một lần** (B2: "trả lời, nộp, chấm điểm, hiện đáp án đúng và bản dịch"). Phát âm chấm **từng lần ghi âm**.
- Chỉ bài `publication_status = 'published'` và có ít nhất một câu hỏi (ngữ pháp, nghe) hoặc một mục (phát âm) mới
  hiện với người học. Bài khác trả `404`.

## Enum

| Trường | Giá trị JSON | Cột DB |
|---|---|---|
| `skill` | `GRAMMAR`, `LISTENING`, `PRONUNCIATION` | `exercise_lessons.skill` (`grammar`, `listening`, `pronunciation`) |
| `difficulty` | `EASY`, `MEDIUM`, `HARD` (giao diện: Dễ, Trung bình, Khó) | `exercise_lessons.difficulty` |
| `type` của câu hỏi | `MULTIPLE_CHOICE`, `FILL_BLANK` | `exercise_questions.question_type` |
| `errorType` của từ | `NONE`, `MISPRONUNCIATION`, `OMISSION`, `INSERTION` | trong `pronunciation_attempts.assessment_details` |

## Danh sách bài

### `GET /api/exercises?skill=GRAMMAR`

`skill` bắt buộc (`400` nếu thiếu hoặc sai). Không phân trang (mỗi kỹ năng chỉ vài chục bài).

```json
[
  {
    "id": 1,
    "skill": "GRAMMAR",
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
| `itemCount` | Số câu hỏi (ngữ pháp, nghe) hoặc số mục luyện (phát âm) |
| `progress` | Của **người dùng hiện tại**. `attemptCount`, `bestScorePercent`, `lastCompletedAt` chỉ tính lượt `completed`: `0`, `null`, `null` khi chưa hoàn thành lần nào |
| `progress.inProgress` | Lượt đang dở **làm tiếp được** của bài này (xem "Nguyên tắc"), `null` nếu không có. `doneCount`: số câu đã trả lời (ngữ pháp) hoặc số mục đã ghi âm ít nhất một lần (phát âm); giao diện hiện nhãn "Đang làm dở · 4/10 câu". Bài nghe luôn `null` |
| `progress.practicedCount` | **Đề xuất thêm 01/10/2026, chờ Đạt** (kịch bản 12, bước 2 và 14). Chỉ bài phát âm: số mục khác nhau đã có ít nhất một lần ghi âm được chấm, tính mọi lượt; giao diện hiện "Đã luyện 3/5 mục". Kỹ năng khác: `null`. Thiếu trường này thì thẻ bài hiện điểm cao nhất như cũ |
| `progress.lastResult` | **Đề xuất thêm 01/10/2026, chờ Đạt** (kịch bản 11, bước 2 và 11). Kết quả lượt `completed` gần nhất: `{ correctCount, questionCount }`, `null` khi chưa hoàn thành lần nào; bài nghe hiện "Gần nhất 4/5". Bài phát âm: `null` |

Sắp xếp "cơ bản đến nâng cao" (B1): `cefr_level` A1 → C2, rồi `sort_order`, rồi `id`. Giao diện nhóm theo trình độ.

## Nội dung một bài

### `GET /api/exercises/{lessonId}`

```json
{
  "id": 1,
  "skill": "GRAMMAR",
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
      "options": [ { "id": 101, "key": "A", "text": "lives" }, { "id": 102, "key": "B", "text": "has lived" } ]
    },
    { "id": 12, "type": "FILL_BLANK", "prompt": "I have never ___ (see) such a beautiful beach.", "hint": null, "points": 1, "options": [] }
  ],
  "passage": null,
  "pronunciationItems": []
}
```

- `questions`: theo `sort_order`. Không có `is_correct`, đáp án chấp nhận hay `explanation`. `hint` (`hint_text`) có thể
  `null`; giao diện chỉ hiện khi người học bấm "Xem gợi ý". `options` rỗng với `FILL_BLANK`. `points` là số (DECIMAL).
- `passage` (chỉ `LISTENING`, còn lại `null`):

  ```json
  {
    "title": "Hội thoại tại sân bay",
    "audioUrl": "/media/listening/airport.mp3",
    "durationMs": 110000,
    "segments": [
      { "id": 501, "order": 1, "startMs": 0, "endMs": 6200, "speaker": "Hành khách", "transcript": "Excuse me, could you tell me where the check-in counter for flight VN209 is?" }
    ]
  }
  ```

  `segments` là phụ đề (người học bật "Hiện phụ đề" mới thấy); **không** kèm bản dịch (`translation_vi` chỉ trả sau khi
  nộp bài, để đối chiếu). `speaker` có thể `null`. `audioUrl` phải phát được trực tiếp bằng thẻ `<audio>` (cùng origin
  hoặc có CORS), hỗ trợ HTTP Range để tua.
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
| `responses` | Các câu đã trả lời trong lượt (ngữ pháp), theo thứ tự câu hỏi của bài, cùng dạng phần tử `review` của `.../complete`. Lượt mới: `[]` |
| `pronunciation` | Các mục đã ghi âm trong lượt (phát âm): số lần ghi (`tryCount`) và điểm tổng cao nhất (`bestScore`). Không trả lại bản ghi hay chi tiết từng từ. Lượt mới hoặc kỹ năng khác: `[]` |

Giao diện mở bài ngữ pháp ở câu đầu tiên chưa trả lời, bài phát âm ở mục đầu tiên chưa ghi âm; các câu đã trả lời hiện
lại đáp án và giải thích như lúc vừa chấm. Đã làm hết mà chưa kết thúc thì mở ở câu, mục cuối để người học bấm "Xem kết
quả".

### `GET /api/exercise-attempts/current` — lượt đang dở gần nhất

Cho thẻ "Tiếp tục" trên trang chủ (`docs/api/progress.md`). Trả lượt `in_progress` **làm tiếp được** có hoạt động cuối
gần nhất của người dùng, ở mọi bài:

```json
{
  "current": {
    "attemptId": 57,
    "lesson": { "id": 3, "skill": "GRAMMAR", "title": "Thì hiện tại hoàn thành", "cefrLevel": "B1", "itemCount": 10 },
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

### `POST /api/exercise-attempts/{attemptId}/responses` — trả lời một câu (ngữ pháp)

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

### `POST /api/exercise-attempts/{attemptId}/complete` — kết thúc lượt

```json
{ "responses": [ { "questionId": 21, "optionId": 211 }, { "questionId": 22, "answer": "gate" } ], "playbackRate": 1.25 }
```

- `responses`: các câu **chưa** gửi qua `.../responses` (nghe hiểu gửi cả bài ở đây; ngữ pháp gửi `[]`). Cùng luật kiểm
  tra như trên. Câu vẫn không có câu trả lời thì tính sai, 0 điểm.
- `playbackRate` (tùy chọn, 0.5 đến 2): tốc độ nghe cuối cùng, lưu vào `exercise_attempts.playback_rate`.
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

> Vì sao WAV 16 kHz mono: đây là định dạng mọi dịch vụ nhận diện giọng nói đều nhận (Azure Speech pronunciation
> assessment, Google Speech-to-Text `LINEAR16`, Whisper), nên backend không cần `ffmpeg` để chuyển đổi. Bản ghi mặc định
> của trình duyệt thì khác nhau (Chrome: WebM/Opus, Safari: MP4/AAC). 10 giây ≈ 320 KB.

Backend gửi file cho dịch vụ AI, lưu một dòng `pronunciation_attempts` (`try_number` tăng dần theo mục trong lượt; điểm;
`assessment_details` là JSON gốc của dịch vụ), rồi trả `201`:

```json
{
  "itemId": 801,
  "tryNumber": 2,
  "overallScore": 86,
  "accuracyScore": 90,
  "fluencyScore": 78,
  "completenessScore": 92,
  "recognizedText": "sustainability",
  "words": [ { "word": "sustainability", "accuracyScore": 88, "errorType": "NONE" } ],
  "tips": [ "Nhấn mạnh âm tiết \"bil\" rõ hơn." ]
}
```

- Điểm từ 0 đến 100 (số). `words`: các từ của câu mẫu theo thứ tự (dùng để tô màu từ đọc sai), `OMISSION` là từ bị bỏ
  sót. `tips`: gợi ý cải thiện bằng tiếng Việt (B3), có thể `[]`.
- `400`: không phải WAV hợp lệ, hoặc ngắn hơn 0,3 giây. `413`: lớn hơn 1 MB. `422`: không nhận diện được giọng nói
  (ngoại lệ B3, giao diện báo "không nhận diện được, thử lại"; **không** lưu dòng nào). `503`: dịch vụ AI lỗi hoặc
  quá thời gian (backend nên tự cắt ở khoảng 20 giây). Giao diện chờ tối đa 60 giây.

## Việc backend cần làm (gợi ý cho Đạt)

1. Entity cho mười bảng (liên kết bằng id thường, converter chữ thường cho enum như `LowercaseEnumConverter` trong
   `common.persistence`), module `modules/exercise`.
2. Seed nội dung mẫu bằng migration Flyway đặt tên theo thời gian (`V<yyyyMMddHHmm>__seed_exercises.sql`). Dữ liệu giả
   trong `frontend/mock/exerciseFixtures.js` dùng làm mẫu được.
3. File audio: đặt trong `src/main/resources/static/media/…` (Spring phục vụ luôn, hỗ trợ Range) hoặc một kho lưu trữ
   ngoài. Nếu đặt trong `static/`, cần mở quyền `permitAll` cho `/media/**` trong `SecurityConfig` (thẻ `<audio>` không gửi
   được header `Authorization`).
4. Chấm điểm là hàm thuần (so khớp đáp án, tính phần trăm), dễ viết unit test. Luật "làm tiếp được" (kỹ năng, 7 ngày,
   `updated_at` của bài) cũng nên là một hàm thuần nhận thời điểm hiện tại, để test không phụ thuộc đồng hồ.
   "Hoạt động cuối" là giá trị lớn nhất của `question_responses.answered_at`, `pronunciation_attempts.assessed_at` và
   `exercise_attempts.started_at` của lượt; không cần thêm cột.
5. `userId` lấy qua `common.security.CurrentUser`. Nếu module Tiến độ (D) cần kết quả bài tập, phát một sự kiện ở
   `common.event` (như `WordReviewedEvent` của module A), đừng để module khác đọc thẳng bảng.
