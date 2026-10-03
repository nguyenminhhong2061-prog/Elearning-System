# Cấu trúc code frontend: một mẫu cho mọi module

Tài liệu này mô tả **một cách tổ chức code duy nhất** cho mọi module của frontend: file nào để ở đâu, file nào được
gọi file nào, và các bước làm khi thêm API, thêm trang. Mục đích là để mở bất kỳ module nào cũng đoán được ngay chỗ
cần tìm.

Đã áp dụng cho: **đăng nhập, đăng ký** (`features/auth`), **từ vựng** (`features/vocabulary`) và **trò chơi từ vựng**
(`features/games`). Các module còn lại (`exercises`, `tests`, `progress`, `plan`) sẽ chuyển dần theo mẫu này (xem mục 7).

Mẫu dựa trên cấu trúc "theo tính năng" (feature-based) của dự án tham khảo
[bulletproof-react](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md), rút gọn cho
JavaScript, cộng với cách dùng TanStack Query để lấy dữ liệu từ server.

## 1. Dữ liệu đi qua 4 tầng

```
 Trang                 pages/TopicDetailPage.jsx      đọc URL, gọi hook, chọn trạng thái để hiển thị
   │  gọi hook
   ▼
 Hook dữ liệu          api/vocabularyQueries.js       useTopic(id): cache, đang tải, lỗi, làm mới
   │  gọi hàm
   ▼
 Hàm gọi API           api/vocabularyApi.js           getTopic(id): một endpoint, trả về data
   │  dùng
   ▼
 httpClient            src/api/httpClient.js          gắn token, lỗi thành ApiError, 401 thì đăng xuất
```

Mỗi tầng chỉ gọi tầng ngay dưới nó. Trang không gọi thẳng `httpClient`, cũng không gọi thẳng `vocabularyApi.js`.
Vì vậy:

- Muốn biết một màn lấy dữ liệu gì: nhìn các hook `useXxx` ở đầu file trang.
- Muốn biết hook đó gọi endpoint nào: mở `*Queries.js`, hook trỏ tới một hàm trong `*Api.js`, hàm đó chứa đường
  dẫn `/api/...`, còn đầu file ghi tên contract trong `docs/api/`.
- Backend đổi URL: chỉ sửa trong `*Api.js`.

Bên cạnh 4 tầng đó, giao diện được chia nhỏ thành **component** (vẽ một mảnh màn hình) và **hook logic** (luật có
trạng thái: lật thẻ, đếm giờ, phím tắt).

## 2. Thư mục của một module

Lấy `features/vocabulary` làm ví dụ:

```
features/vocabulary/
├── api/                          GỌI SERVER
│   ├── vocabularyApi.js            hàm gọi API: getTopics(), getTopic(id), getVocabularyPage(...)
│   ├── vocabularyQueries.js        hook: useTopics(), useTopic(id), useTopicWords(id), useWordSearch(term)
│   ├── learningApi.js              (học thẻ, ôn tập, lịch sử)
│   ├── learningQueries.js
│   ├── listsApi.js                 (danh sách riêng)
│   ├── listsQueries.js
│   └── keys.js                     khóa cache của cả module
├── components/                   MẢNH GIAO DIỆN
│   ├── WordList.jsx                dùng ở nhiều màn của module: để ngay trong components/
│   ├── StudyButton.jsx, LoadMoreButton.jsx, VocabularyShell.jsx, DueReview.jsx, GamesBanner.jsx
│   ├── topics/                     chỉ dùng cho một khu màn hình: gom vào thư mục con
│   ├── lists/
│   ├── history/
│   └── study/
├── hooks/                        LOGIC CÓ TRẠNG THÁI (không phải dữ liệu server)
│   ├── useFlashcardSession.js      luật của một phiên học thẻ
│   ├── useTopicSearch.js           ô tìm kiếm giữ trong URL (?q=)
│   └── useAutoSpeak.js             cài đặt "Tự động phát âm"
├── pages/                        MỖI ROUTE MỘT FILE
│   ├── VocabularyPage.jsx          /vocabulary, chọn tab theo ?tab=
│   ├── TopicsTab.jsx, ListsTab.jsx, HistoryTab.jsx   (3 tab của trang trên)
│   ├── TopicDetailPage.jsx, ListDetailPage.jsx, StudySessionPage.jsx
├── utils/                        HÀM THUẦN (không React), mỗi file có test bên cạnh
│   ├── learning.js                 isLearned, reviewOption, studyableCount
│   ├── topicProgress.js            "240 từ · 45% đã học"
│   ├── wordEntry.js                đọc "negotiate — thương lượng"
│   └── backLink.js
├── constants.js                  hằng số (chỉ giá trị, không có hàm)
├── schemas.js                    luật kiểm tra form (zod)
├── types.js                      JSDoc mô tả JSON của API (không có code chạy)
└── __tests__/                    test cả luồng màn hình
```

Module nhỏ thì bỏ thư mục không cần (`games` không có `schemas.js`). `auth` có thêm `context/` vì trạng thái đăng nhập
dùng cho cả app (xem mục 3.6).

Phần dùng chung cho mọi module nằm ngoài `features/`:

| Đường dẫn | Nội dung |
|---|---|
| `src/api/` | `httpClient`, `ApiError`, `errorMessages` (`describeApiError`), `pagination.js` (`nextPageParam`, `loadedItems`, `totalItems`) |
| `src/components/ui/` | `Button`, `Card`, `EmptyState`, `BackLink`, `LoadError`, `Skeleton`… |
| `src/components/layout/` | `Page`, `AppLayout`, thanh bên |
| `src/config/paths.js` | **mọi URL** của các trang |
| `src/lib/` | hàm tiện ích: `format.js` (`formatCount`: 1248 → "1.248"), `routeParams.js` (`parseId`), `dates.js`… |
| `src/app/router.jsx` | nơi duy nhất khai báo route |

## 3. Quy tắc của từng loại file

### 3.1. Hàm gọi API (`api/xxxApi.js`)

Mỗi endpoint một hàm, đặt tên động từ + danh từ, trả về `data`. Comment ghi endpoint; đầu file ghi contract.

```js
// Calls of the vocabulary API. The contract is in docs/api/vocabulary.md.

/** GET /api/topics/{id}. Rejects with status 404 when it does not exist. */
export async function getTopic(id) {
  const { data } = await httpClient.get(`/api/topics/${id}`)
  return data
}
```

### 3.2. Hook dữ liệu (`api/xxxQueries.js`)

- **Đọc** dữ liệu: `useQuery` với một khóa cache (`queryKey`) lấy từ `keys.js`.
- **Ghi** dữ liệu (tạo, sửa, xóa, chấm thẻ): `useMutation`, và trong `onSuccess` đánh dấu cũ (`invalidateQueries`)
  những dữ liệu bị ảnh hưởng, để màn khác tự tải lại.
- Danh sách nhiều trang ("Xem thêm"): `useInfiniteQuery` với `getNextPageParam: nextPageParam`.

```js
// Rút gọn từ vocabularyQueries.js và learningQueries.js.
export function useTopic(id) {
  return useQuery({ queryKey: vocabularyKeys.topic(id), queryFn: () => getTopic(id), enabled: id !== null })
}

/** Saves one rating, then marks every count (topics, lists, statistics) as out of date. */
export function useSubmitReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: submitReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vocabularyKeys.all })
      queryClient.invalidateQueries({ queryKey: learningKeys.all })
      queryClient.invalidateQueries({ queryKey: listKeys.all })
    },
  })
}
```

Khóa cache lồng nhau (`['vocabulary', 'topics', 3]` nằm dưới `['vocabulary']`), nên đánh dấu cũ `vocabularyKeys.all`
là làm mới mọi thứ bên dưới.

**Component và trang luôn gọi server qua hook**, kể cả khi không cần cache (bắt đầu ván chơi, kiểm tra đáp án:
`useStartRound`, `useCheckAnswer` là `useMutation`). Nhờ đó `isPending`, `isError`, `error` luôn có sẵn, không cần tự
viết `useState` cho "đang gửi" và "lỗi".

### 3.3. Trang (`pages/`)

Một trang làm 3 việc, theo đúng thứ tự, và comment đánh số giống nhau ở mọi trang:

```jsx
export function TopicDetailPage() {
  // 1. What the URL asks for.
  const topicId = parseId(useParams().topicId)

  // 2. The data.
  const topicQuery = useTopic(topicId)

  // 3. One state at a time: not found, error, then the page.
  if (topicId === null || topicQuery.error?.status === 404) return <Page …>Không tìm thấy</Page>

  const topic = topicQuery.data
  return (
    <Page title={topic?.name ?? 'Chủ đề'} heading={<TopicHeading … />}>
      {topicQuery.isError ? <LoadError … /> : <TopicWords topicId={topicId} />}
    </Page>
  )
}
```

**Thứ tự trạng thái** luôn là: không hợp lệ hoặc không tìm thấy → đang tải → lỗi → rỗng → có dữ liệu. Mỗi trạng thái
một `return` sớm (early return), không dùng chuỗi `let body; if … else if …`:

```jsx
function TopicWords({ topicId }) {
  const query = useTopicWords(topicId)

  if (query.isPending) return <WordListSkeleton />
  if (query.isError) return <LoadError error={query.error} onRetry={() => query.refetch()} message="…" />
  if (totalItems(query.data) === 0) return <EmptyState>Chủ đề này chưa có từ nào.</EmptyState>

  return <WordList words={loadedItems(query.data)} />
}
```

Trang nên ngắn (dưới ~150 dòng). Phần nào dài thì tách ra `components/`.

### 3.4. Component (`components/`)

- Nhận dữ liệu qua props, trả về JSX. Không đọc URL (việc của trang).
- **Được** tự gọi hook dữ liệu cho phần nó hiển thị: `TopicWords` gọi `useTopicWords`, `ListWords` gọi
  `useListWords`. Trang chỉ gọi hook cho dữ liệu quyết định cả trang (không tìm thấy, tiêu đề).
- Component con nhỏ chỉ dùng trong đúng một file thì để ngay trong file đó, phía trên component chính (ví dụ
  `ReviewState` trong `ReviewedWords.jsx`). Dùng ở hai nơi trở lên thì tách file riêng.
- Lặp lại ở 3 nơi trở lên thì thành component dùng chung: `LoadMoreButton` (nút "Xem thêm"), `StudyButton` (nút
  "Học N từ →" của chủ đề và danh sách), `EmptyState`, `BackLink`.

### 3.5. Hook logic (`hooks/`)

Khi một component có nhiều `useState`, `useEffect`, phím tắt, đồng hồ, thì chuyển phần luật đó vào một hook, để
component chỉ còn phần vẽ:

| Hook | Giữ luật gì | Component dùng nó |
|---|---|---|
| `useFlashcardSession(cards)` | thẻ đang xem, lật, chấm (lưu ngay), phím Space/1/2/3, "Kết thúc" | `FlashcardSession` |
| `useGameRound(gameId)` | các giai đoạn intro → starting → playing → finished, ghi đáp án, tính điểm, đồng hồ, tạm dừng khi hỏi thoát, nộp ván | `GamePlayPage` |
| `useTopicSearch()` | ô tìm kiếm, chờ ngừng gõ, ghi `?q=` vào URL | `TopicsTab` |

Hook trả về một object có tên rõ ràng (`{ card, flipped, flip, rate, done }`), component chỉ việc dùng.

### 3.6. Trạng thái đăng nhập (`auth/context/`)

Đây là trạng thái duy nhất dùng cho cả app, nên `auth` có thêm thư mục `context/`:

- `authReducer.js`: **mọi** trạng thái (`loading`, `authenticated`, `anonymous`, `error`) và **mọi** sự kiện làm đổi
  trạng thái (`signedIn`, `signedOut`, `checkFailed`, `checkStarted`, `userUpdated`, `tokenChanged`). Muốn biết "khi
  nào người dùng bị đăng xuất" thì đọc file này. Có test riêng (`authReducer.test.js`).
- `AuthProvider.jsx`: gửi các sự kiện đó đúng lúc (kiểm tra token khi mở app, 401 từ API, hết phiên, tab khác).
- `useAuth.js`: module khác đọc người dùng hiện tại qua đây: `const { user, logout } = useAuth()`.
- Hai hook phụ ở `auth/hooks/`: `useSessionKeepAlive` (gia hạn token khi đang thao tác) và `useTabSync` (đồng bộ
  đăng nhập, đăng xuất giữa các tab).

### 3.7. Hàm thuần, hằng số, form

- `utils/`: hàm không dùng React, nhận vào và trả ra giá trị. Mỗi file có test cạnh nó (`topicProgress.test.js`).
- `constants.js`: chỉ giá trị (enum, nhãn, cỡ trang `TOPIC_WORDS_PAGE_SIZE`, `HISTORY_FILTERS`). Hàm tính từ các giá
  trị đó để trong `utils/`.
- `schemas.js`: luật kiểm tra form bằng zod, thông báo tiếng Việt. Form dùng react-hook-form với `zodResolver`.

### 3.8. URL: luôn dùng `paths`

```jsx
import { paths } from '@/config/paths'

<Link to={paths.topic(topic.id)}>…</Link>          // '/vocabulary/topics/3'
navigate(paths.vocabularyLists)                      // '/vocabulary?tab=lists'
```

URL cố định là chuỗi, URL có tham số là hàm. Đổi một URL thì sửa `paths.js` **và** `router.jsx`.

### 3.9. Import

Thứ tự trong mỗi file: thư viện (`react`, `react-router`…) → phần dùng chung `@/api`, `@/components`, `@/config`,
`@/lib` → module khác `@/features/...` → file cùng module (đường dẫn tương đối `../`).

Module này **không import** file bên trong module khác, trừ những thứ được dùng chung có chủ đích:

| Lấy từ | Thứ được dùng | Ai dùng |
|---|---|---|
| `auth` | `useAuth` | mọi module |
| `vocabulary` | `DueReviewCard`, `useLearningSummary` | trang chủ (`progress`) |
| `progress` | `useStudyTime` | học thẻ, trò chơi, bài tập |

Thứ gì hai module cùng cần thì đưa ra `src/lib/` hoặc `src/components/` (đã làm với `formatCount`, `parseId`).

### 3.10. Đặt tên

| Loại | Quy ước | Ví dụ |
|---|---|---|
| Component, trang | `PascalCase.jsx` | `TopicCard.jsx`, `TopicDetailPage.jsx` |
| Trang | kết thúc bằng `Page`; tab của một trang kết thúc bằng `Tab` | `ListDetailPage`, `HistoryTab` |
| Hook | `useXxx.js` | `useFlashcardSession.js` |
| Hàm gọi API, hook dữ liệu | `<nhóm>Api.js`, `<nhóm>Queries.js`, theo cặp | `listsApi.js` + `listsQueries.js` |
| File khác | `camelCase.js` | `topicProgress.js`, `constants.js` |
| Test | cùng tên file + `.test.js(x)`; test luồng màn hình trong `__tests__/` | `wordEntry.test.js`, `__tests__/lists.test.jsx` |

Code và comment viết bằng tiếng Anh; chữ hiển thị cho người dùng bằng tiếng Việt.

## 4. Đọc một màn từ đầu đến cuối: "Chi tiết chủ đề"

1. `src/app/router.jsx`: `topics/:topicId` → `TopicDetailPage`.
2. `pages/TopicDetailPage.jsx`: đọc `topicId` từ URL bằng `parseId`, gọi `useTopic(topicId)`.
3. `api/vocabularyQueries.js` → `useTopic` gọi `getTopic(id)` trong `api/vocabularyApi.js` → `GET /api/topics/{id}`
   (contract `docs/api/vocabulary.md`).
4. Trang vẽ `TopicHeading` (tên, số từ, `StudyButton` dẫn tới `paths.topicStudy(id)`) và
   `components/topics/TopicWords.jsx`.
5. `TopicWords` tự gọi `useTopicWords(topicId)` (20 từ mỗi lần), vẽ `WordList` và `LoadMoreButton`.
6. Test của màn này: `__tests__/vocabulary.test.jsx` (render cả app với backend giả `installFakeBackend`).

## 5. Các bước khi làm việc mới

### Thêm một API

1. Chốt contract trong `docs/api/<module>.md` (đường dẫn, dữ liệu gửi, dữ liệu trả về, mã lỗi).
2. Thêm hàm vào `api/<nhóm>Api.js`.
3. Thêm khóa vào `keys.js` (nếu là dữ liệu đọc).
4. Thêm hook vào `api/<nhóm>Queries.js`: `useQuery` để đọc; `useMutation` để ghi, kèm `invalidateQueries` cho dữ liệu
   bị ảnh hưởng.
5. Backend chưa có thì thêm API giả trong `mock/routes/` để xem bằng `npm run dev:mock`.
6. Dùng hook trong trang hoặc component.

### Thêm một trang

1. Tạo `pages/XxxPage.jsx` theo khuôn mục 3.3, bọc bằng `Page`.
2. Thêm URL vào `src/config/paths.js`.
3. Khai báo trong `src/app/router.jsx` bằng `lazyPage` (mỗi trang một file JS riêng, chỉ tải khi mở) rồi thêm
   `<Route>`.
4. Cần mục trên thanh bên thì sửa `src/components/layout/navItems.js`.
5. Viết test luồng trong `__tests__/`, dùng `installFakeBackend` (xem `auth/__tests__/authFlow.test.jsx`).

### Thêm một thao tác ghi (nút "Xóa", form "Lưu"…)

```jsx
const remove = useDeleteList(list.id, { onDeleted: () => navigate(paths.vocabularyLists, { replace: true }) })

<Button variant="danger" loading={remove.isPending} onClick={() => remove.mutate()}>Xóa danh sách</Button>
{remove.isError && <Alert variant="error">{describeApiError(remove.error, 'Chưa xóa được danh sách.')}</Alert>}
```

`describeApiError` đổi lỗi thành câu tiếng Việt (mất mạng, 403, 5xx); lỗi riêng (400, 404, 409) thì tự xét
`error.status`. 401 không cần xử lý: app tự đăng xuất.

## 6. Đổi gì so với trước (03/10/2026)

Không đổi giao diện hay hành vi: 392 test cũ vẫn qua mà không phải sửa nội dung (chỉ chuyển chỗ file; test
`formatCount` chuyển sang `src/lib/format.test.js`), thêm 5 test cho `authReducer`. Các file đã chuyển:

| Trước | Sau |
|---|---|
| `auth/authApi.js` | `auth/api/authApi.js` (+ `authQueries.js`: `useChangePassword`) |
| `auth/guards/GuestRoute.jsx`, `ProtectedRoute.jsx` | `auth/components/` |
| `auth/context/useSessionKeepAlive.js` | `auth/hooks/` (+ `useTabSync.js` tách từ `AuthProvider`) |
| `auth/redirect.js` | `auth/utils/redirect.js` |
| `setState` rải rác trong `AuthProvider` | `auth/context/authReducer.js` |
| `vocabulary/api/queries.js` | `vocabulary/api/vocabularyQueries.js` |
| `vocabulary/study/*` | `vocabulary/components/study/*`; luật phiên học → `hooks/useFlashcardSession.js` |
| `vocabulary/lists/*` | `vocabulary/components/lists/*`, `schemas.js`, `utils/wordEntry.js` |
| phần trong `ListDetailPage`, `TopicDetailPage`, `TopicsTab`, `HistoryTab` | `components/lists/`, `topics/`, `history/` |
| `vocabulary/topicProgress.js` | `vocabulary/utils/topicProgress.js`; `formatCount` → `src/lib/format.js` |
| `vocabulary/routeParams.js` | `parseId` → `src/lib/routeParams.js`; URL → `src/config/paths.js`; `backLinkTarget` → `utils/backLink.js` |
| hàm trong `vocabulary/constants.js` | `vocabulary/utils/learning.js` |
| `games/components/GamesBanner.jsx` | `vocabulary/components/GamesBanner.jsx` (hiện trên trang từ vựng) |
| `games/clock.js`, `games/useGameClock.js` | `games/utils/clock.js`, `games/hooks/useGameClock.js` |
| luật ván chơi trong `GamePlayPage` | `games/hooks/useGameRound.js` |
| `checkAnswer`, `playGame` gọi thẳng trong component | `useCheckAnswer`, `useStartRound` trong `gamesQueries.js` |
| test luồng ở gốc module | `__tests__/` |

## 7. Module chưa theo mẫu

| Module | Khác mẫu ở đâu |
|---|---|
| `exercises` | khu màn hình nằm ngay ở gốc module (`reading/`, `writing/`, `listening/`, `pronunciation/`, `chat/`) thay vì trong `components/`; `useAttempt.js`, `time.js`, `testFixtures.js` ở gốc |
| `tests` | `TestTakingPage.jsx` dài 461 dòng; `useAnswerSaver.js`, `answers.js` ở gốc |
| `progress` | `chart.js`, `useStudyTime.js` ở gốc; khóa cache viết trong `progressQueries.js` |
| `plan` | `PlanPage.jsx` dài 261 dòng; `plan.js` ở gốc |

Khi chuyển một module: làm đúng các bước như mục 6 (chuyển file bằng `git mv`, tách trang dài, đưa luật vào `hooks/`,
URL vào `paths.js`), và test cũ phải chạy nguyên vẹn.
