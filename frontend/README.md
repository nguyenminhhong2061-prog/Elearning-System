# LinguaStep — Frontend

Giao diện web của nền tảng học tiếng Anh: React 19 + Vite, viết bằng **JavaScript** (không dùng TypeScript),
giao diện **tiếng Việt**. Code và comment viết bằng tiếng Anh, giống backend.

## Yêu cầu

- **Node 22** và npm 10 (đã chạy thử với Node 22.20)
- Backend chạy tại `http://localhost:8080` (xem README ở thư mục gốc). Chưa bật backend vẫn xem được giao diện,
  nhưng đăng nhập sẽ báo "Không kết nối được máy chủ".

## Chạy

Hướng dẫn đầy đủ, chạy cả backend và frontend trên Windows, kèm bảng lỗi thường gặp: mục **"Chạy dự án trên máy"**
trong [README gốc](../README.md#chạy-dự-án-trên-máy). Tóm tắt phần frontend (backend phải đang chạy):

```bash
cd frontend
npm install        # lần đầu, và mỗi khi package.json thay đổi
npm run dev        # http://localhost:5173
```

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Chạy server phát triển (tự nạp lại khi sửa code), mọi API gọi backend thật |
| `npm run dev:mock` | Như `dev`, nhưng các API mô tả trong `docs/api/` (module A và module B: bài tập, trợ lý AI) trả **dữ liệu giả** trong `mock/`, lưu trong bộ nhớ theo từng tài khoản (mất khi tắt server). Dùng khi backend chưa có các API đó; đăng nhập vẫn cần backend thật. Sửa file trong `mock/` thì phải tắt và chạy lại lệnh |
| `npm run build` | Build bản production vào `dist/` |
| `npm run preview` | Chạy thử bản đã build |
| `npm run lint` | Kiểm tra code bằng oxlint |
| `npm test` | Chạy toàn bộ test một lần (Vitest + React Testing Library) |
| `npm run test:watch` | Chạy test và tự chạy lại khi sửa |

Muốn có tài khoản admin để thử: chạy backend với `ADMIN_EMAIL` và `ADMIN_PASSWORD` (xem README gốc).
Tài khoản đăng ký qua giao diện luôn là learner.

## Kết nối tới backend

Backend **chưa cấu hình CORS**, nên khi dev trình duyệt không gọi thẳng `:8080` được. Thay vào đó code gọi
đường dẫn tương đối (`/api/...`) tới chính Vite dev server, và Vite chuyển tiếp `/api` sang backend
(xem `server.proxy` trong `vite.config.js`). Nhờ vậy backend không cần sửa gì.

Cấu hình tùy chọn (copy `.env.example` thành `.env.local`, file này không đưa lên git):

- `DEV_API_PROXY_TARGET`: nơi Vite chuyển tiếp `/api` (mặc định `http://localhost:8080`).
- `VITE_API_BASE_URL`: tiền tố URL của mọi lời gọi API. Để trống khi dev. Khi deploy mà frontend và backend khác
  domain thì phải bật CORS ở backend (việc của Phase 6).

## Công nghệ

| Thư viện | Dùng để |
|---|---|
| React 19, Vite 8 | Giao diện và build |
| Tailwind CSS 4 | Style. Token của thiết kế nằm trong `src/index.css` (khối `@theme`) |
| react-router 7 | Điều hướng |
| axios | Gọi API (qua `httpClient` dùng chung) |
| TanStack Query 5 | Tải và lưu tạm dữ liệu từ server (trạng thái đang tải, lỗi, phân trang, làm mới) |
| react-hook-form + zod | Form và kiểm tra dữ liệu (thông báo tiếng Việt) |
| Vitest, React Testing Library | Test |
| oxlint | Lint |

## Cấu trúc thư mục

```
frontend/
├── LinguaStep-design-source/  # bản thiết kế gốc (chỉ để tham khảo, xem mục Thiết kế)
├── mock/                      # API giả cho `npm run dev:mock`: mockApi.js (plugin), routes/, store.js, scheduler.js,
│                              # exerciseFixtures.js và media.js (bài tập, audio bài nghe) (không vào bản build)
└── src/
    ├── main.jsx               # điểm vào: BrowserRouter + App
    ├── index.css              # Tailwind, design token, @font-face
    ├── app/
    │   ├── App.jsx            # AuthProvider + QueryProvider + routes
    │   ├── QueryProvider.jsx  # cache TanStack Query, mỗi tài khoản một cache riêng
    │   └── router.jsx         # NƠI DUY NHẤT khai báo route
    ├── api/                   # dùng chung: httpClient, ApiError, tokenStorage, hằng số enum, JSDoc typedef
    ├── components/
    │   ├── ui/                # Button, TextField, PasswordField, SearchField, Alert, LoadError, Card, Tag,
    │   │                      # Skeleton, Avatar, Spinner, Logo
    │   └── layout/            # AppLayout (thanh bên), Page, AuthLayout, navItems.js
    ├── features/
    │   ├── auth/              # đăng nhập, đăng ký, đổi mật khẩu, AuthProvider, useAuth, route guard
    │   ├── vocabulary/        # module A: chủ đề, học flashcard (study/), nhắc ôn, lịch sử, danh sách riêng (lists/)
    │   ├── games/             # module A (A4): trò chơi từ vựng và bảng xếp hạng
    │   └── exercises/         # module B (giao diện): ngữ pháp (grammar/), nghe (listening/), phát âm
    │                          # (pronunciation/), trợ lý AI (chat/); API theo docs/api/exercises.md, chatbot.md
    ├── pages/                 # trang chung: HomePage, ComingSoonPage, NotFoundPage, ForbiddenPage
    ├── lib/                   # hàm tiện ích nhỏ
    └── test/                  # setup.js, fakeBackend.js (giả lập backend cho test)
```

Import dùng alias `@/` thay cho đường dẫn tương đối dài: `import { Button } from '@/components/ui/Button'`.
File chứa JSX phải có đuôi `.jsx`, file logic thuần dùng `.js`. Mỗi module đặt code trong `src/features/<module>/`.

## Hướng dẫn cho các module khác

### Thêm trang cho module

1. Tạo trang trong `src/features/<module>/pages/`, bọc nội dung bằng `Page` để có tiêu đề tab, tiêu đề trang và
   độ rộng đúng thiết kế:

   ```jsx
   import { Page } from '@/components/layout/Page'

   export function GrammarListPage() {
     return <Page title="Ngữ pháp">...</Page>
   }
   ```

2. Đăng ký route trong `src/app/router.jsx`, bên trong nhóm `AppLayout` (thay `ComingSoonPage` của mục tương ứng).
3. Nếu cần, sửa mục của mình trong `src/components/layout/navItems.js` (thanh bên).

Trang chỉ dành cho admin: bọc bằng `<Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>`. Đây chỉ là để
giao diện gọn, backend mới là nơi chặn quyền thật (`@PreAuthorize`).

### Lấy người dùng hiện tại

```jsx
import { useAuth } from '@/features/auth/context/useAuth'

const { user, isAdmin } = useAuth()   // user: { id, fullName, email, role, status, currentLevel, createdAt }
```

`currentLevel` có thể là `null` (chưa xác định trình độ). Trong các trang nằm dưới `AppLayout`, `user` luôn có giá trị.

### Gọi API

```js
import { httpClient } from '@/api/httpClient'
import { describeApiError } from '@/api/errorMessages'

const { data } = await httpClient.get('/api/topics')   // token được gắn tự động
```

- Mọi lỗi đều là `ApiError` với `status` là mã HTTP, hoặc `0` khi không kết nối được máy chủ.
- 401 (token hết hạn hoặc sai) được xử lý chung: người dùng bị đăng xuất và chuyển về trang đăng nhập kèm thông
  báo "Phiên đăng nhập đã hết hạn". Module **không** cần tự xử lý 401.
- `error.message` là thông báo tiếng Anh của backend, **không hiện cho người dùng**. Dùng
  `describeApiError(error, 'Thông báo mặc định')` để có câu tiếng Việt cho lỗi mạng, 403, 5xx; lỗi riêng
  (400, 404, 409...) thì tự kiểm tra `error.status`.
- Giá trị enum trong JSON là **chữ hoa** (`'LEARNER'`, `'ADMIN'`, `'ACTIVE'`...), khác với DB (chữ thường). Dùng
  `ROLES`, `USER_STATUS`, `CEFR_LEVELS` trong `@/api/constants` thay vì gõ chuỗi. Kiểu dữ liệu API mô tả bằng
  JSDoc trong `@/api/types`.

### Hiển thị dữ liệu từ server (TanStack Query)

Trong component, đừng tự gọi API trong `useEffect`. Viết hàm gọi API trong `features/<module>/api/` rồi bọc bằng
`useQuery` (xem `src/features/vocabulary/api/queries.js`):

```js
export const grammarKeys = { all: ['grammar'], lessons: () => ['grammar', 'lessons'] }

export function useLessons() {
  return useQuery({ queryKey: grammarKeys.lessons(), queryFn: getLessons })
}
```

Trang dùng `isPending` (hiện `Skeleton`), `isError` (hiện `<LoadError error={...} onRetry={() => query.refetch()} />`)
và `data`. Danh sách dài dùng `useInfiniteQuery` với API trả `PageResponse` (`items`, `page`, `totalPages`...).
Mỗi tài khoản có cache riêng, nên đăng xuất rồi đăng nhập tài khoản khác không thấy dữ liệu của người trước.

### API chưa có ở backend

Chốt contract trước (ví dụ `docs/api/vocabulary.md` ở thư mục gốc), viết frontend theo đó, test bằng
`installFakeBackend`, và muốn xem trên trình duyệt thì thêm API giả trong `mock/` rồi chạy `npm run dev:mock`
(xem `mock/mockApi.js` và `mock/routes/`).

### Test

Test đặt cạnh file, đuôi `.test.js` hoặc `.test.jsx`. Muốn test cả luồng mà không cần backend, dùng
`installFakeBackend` trong `src/test/fakeBackend.js` (xem `src/features/auth/authFlow.test.jsx`).

## Thiết kế (design system)

Bản thiết kế gốc nằm trong `LinguaStep-design-source/`: mở `LinguaStep-standalone.html` bằng trình duyệt để xem,
còn `index.html` là đặc tả (mỗi khối `<sc-if>` là một màn hình, `logic.reference.js` mô tả dữ liệu và tương tác).
Đây chỉ là tài liệu tham khảo, chạy trên runtime riêng của công cụ thiết kế: **không copy code từ đó vào `src/`**.

Mọi token khai báo **một lần** trong `src/index.css` và trở thành class Tailwind.
**Không ghi mã hex trực tiếp trong component**; cần màu mới thì thêm token.

| Nhóm | Class |
|---|---|
| Màu thương hiệu | `brand` (#12A594), `brand-dark` (#0B7B70, chữ/link), `brand-tint`, `brand-tint-line`, `brand-soft` |
| Nền, viền, chữ | `canvas` (nền trang), `surface-alt`, `line` (viền), `ink` (chữ chính), `ink-soft`, `muted`, `muted-light` |
| Thanh bên | `sidebar`, `sidebar-raised`, `sidebar-deep`, `sidebar-text` |
| Trạng thái | `danger`, `danger-bg`, `danger-solid`, `success`, `success-bg`, `success-line`, `success-solid`, `warning-solid`, `accent` (cam) |
| Cỡ chữ | `text-title` (26px), `text-lg` (18px), `text-body` (15px), `text-sm` (14px), `text-label` (13px), `text-xs` (12px), `text-tag` (11px) |

Ví dụ: `bg-brand text-white`, `border-line`, `text-muted`, `bg-danger-bg text-danger`.

Khi chuyển một khối từ file thiết kế sang Tailwind, lưu ý:

- **Kích thước hộp:** file thiết kế dùng `content-box`, nghĩa là padding nằm ngoài `width`/`max-width`. Tailwind
  dùng `border-box`. Ví dụ thẻ đăng nhập `max-width: 420px; padding: 40px` thực tế rộng 500px, nên ở đây là `max-w-125`.
- **Khoảng cách trong Tailwind 4** tính theo bội số của 4px: `p-4` = 16px, `py-2.75` = 11px, `max-w-230` = 920px.
  IDE (extension Tailwind CSS IntelliSense) sẽ gợi ý dạng này nếu viết `[920px]`.
- Font là Be Vietnam Pro (có bộ ký tự tiếng Việt), tự host trong `src/assets/fonts/`, không phụ thuộc Google Fonts.

Component dùng chung nằm trong `src/components/ui/`. Hãy dùng lại thay vì tự viết ô nhập hay nút mới, để giao diện
các module đồng nhất. `Button` có ba kiểu: `primary` (teal), `secondary` (xám, chỉ đặt trên nền trắng vì trên nền
trang sẽ bị chìm) và `outline` (trắng có viền, dùng được trên mọi nền). `Page` có `width="wide"` (920px, mặc định)
và `width="narrow"` (520px, cho màn một cột như chi tiết chủ đề, flashcard).

## Bảo mật và giới hạn đã biết

- Token lưu trong `localStorage` để F5 không mất phiên (backend không dùng cookie). Đổi lại, script chạy trên trang
  đọc được token, nên **không dùng `dangerouslySetInnerHTML`**. Nếu cần hiển thị markdown (ví dụ câu trả lời của
  chatbot), dùng thư viện có sanitize.
- Đăng xuất chỉ xóa token ở trình duyệt. Token cũ vẫn hợp lệ ở backend đến khi hết hạn (8 giờ), kể cả sau khi đổi
  mật khẩu hoặc bị khóa tài khoản. Chưa có refresh token: hết 8 giờ phải đăng nhập lại.
