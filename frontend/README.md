# LinguaStep — Frontend

Giao diện web của nền tảng học tiếng Anh: React 19 + Vite, viết bằng **JavaScript** (không dùng TypeScript),
giao diện **tiếng Việt**. Code và comment viết bằng tiếng Anh, giống backend.

## Yêu cầu

- **Node 22** và npm 10 (đã chạy thử với Node 22.20)
- Backend chạy tại `http://localhost:8080` (xem README ở thư mục gốc). Chưa bật backend vẫn xem được giao diện,
  nhưng các lời gọi API sẽ báo lỗi kết nối.

## Chạy

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Chạy server phát triển (tự nạp lại khi sửa code) |
| `npm run build` | Build bản production vào `dist/` |
| `npm run preview` | Chạy thử bản đã build |
| `npm run lint` | Kiểm tra code bằng oxlint |
| `npm test` | Chạy toàn bộ test một lần (Vitest + React Testing Library) |
| `npm run test:watch` | Chạy test và tự chạy lại khi sửa |

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
| react-router | Điều hướng |
| axios | Gọi API |
| react-hook-form + zod | Form và kiểm tra dữ liệu (tiếng Việt) |
| Vitest, React Testing Library | Test |
| oxlint | Lint |

## Thiết kế (design system)

Màu, font và bo góc lấy từ bản thiết kế LinguaStep và khai báo **một lần** trong `src/index.css`. Mỗi màu thành
một class Tailwind, ví dụ `bg-brand`, `text-brand-dark`, `text-ink`, `border-line`, `bg-canvas`,
`bg-danger-bg`. **Không ghi mã hex trực tiếp trong component**; cần màu mới thì thêm token.

Font là Be Vietnam Pro (có bộ ký tự tiếng Việt), tự host trong `src/assets/fonts/`, không phụ thuộc Google Fonts.

Component dùng chung nằm trong `src/components/ui/`: `Button`, `TextField`, `PasswordField`, `Alert`, `Spinner`,
`Logo`. Hãy dùng lại thay vì tự viết ô nhập hay nút mới, để giao diện các module đồng nhất.

## Cấu trúc thư mục

```
frontend/
├── vite.config.js        # proxy /api, alias "@" trỏ tới src/, cấu hình Vitest
├── .env.example
├── public/               # favicon
└── src/
    ├── main.jsx
    ├── index.css         # Tailwind, design token, @font-face
    ├── app/              # App.jsx (khung ứng dụng)
    ├── components/ui/    # component giao diện dùng chung
    ├── lib/              # hàm tiện ích
    ├── assets/fonts/
    └── test/setup.js     # thiết lập chung cho test
```

Import dùng alias `@/` thay cho đường dẫn tương đối dài: `import { Button } from '@/components/ui/Button'`.
File chứa JSX phải có đuôi `.jsx`, file logic thuần dùng `.js`.
