# DATN — LinguaStep: học tiếng Anh theo năng lực, có AI hỗ trợ

Đồ án tốt nghiệp PTIT (Khoa CNTT1): **"Xây dựng hệ thống quản lý học tiếng Anh theo năng lực ứng dụng công nghệ AI hỗ
trợ giải thích và gợi ý lộ trình học"**. Nền tảng web cho người học theo trình độ CEFR (A1 đến C2): học từ vựng bằng
flashcard và lặp lại ngắt quãng, làm bài tập đọc hiểu, viết, nghe, phát âm có chatbot AI giải thích, làm bài kiểm tra, theo
dõi tiến độ và kế hoạch học cá nhân; admin quản lý nội dung, người dùng và thống kê.

**Mới vào nhóm? Bắt đầu ở mục [Bắt đầu nhanh cho thành viên mới](#bắt-đầu-nhanh-cho-thành-viên-mới).**

## Mục lục

1. [Bắt đầu nhanh cho thành viên mới](#bắt-đầu-nhanh-cho-thành-viên-mới)
2. [Công nghệ](#công-nghệ)
3. [Phân công và trạng thái](#phân-công-và-trạng-thái)
4. [Cấu trúc thư mục](#cấu-trúc-thư-mục)
5. [Chạy dự án trên máy](#chạy-dự-án-trên-máy)
6. [Quy trình làm việc nhóm](#quy-trình-làm-việc-nhóm)
7. [Kiến trúc và quy ước code](#kiến-trúc-và-quy-ước-code)
8. [Chạy test](#chạy-test)
9. [Xác thực (Auth)](#xác-thực-auth)
10. [Cơ sở dữ liệu và migration](#cơ-sở-dữ-liệu-và-migration)
11. [Dùng Neon (demo / staging)](#dùng-neon-demo--staging)
12. [Bảo mật và dữ liệu nhạy cảm](#bảo-mật-và-dữ-liệu-nhạy-cảm-đọc-trước-khi-commit)
13. [Lưu ý từ module A cho các module khác](#lưu-ý-từ-module-a-từ-vựng-cho-các-module-khác)

## Bắt đầu nhanh cho thành viên mới

Làm lần lượt năm bước dưới đây; mất khoảng một buổi.

### Bước 1. Đọc tài liệu nền tảng trong `docs/starter/`

Đọc theo thứ tự này, vì tài liệu sau dùng khái niệm của tài liệu trước:

| Thứ tự | Tài liệu | Đọc để biết |
|---|---|---|
| 1 | [Mô tả hệ thống bằng ngôn ngữ tự nhiên](docs/starter/Mô%20tả%20hệ%20thống%20bằng%20ngôn%20ngữ%20tự%20nhiên.md) | Hệ thống làm gì, ai dùng, nghiệp vụ từng module A đến E kèm các trường hợp ngoại lệ. Đọc kỹ module của bạn. |
| 2 | [Database](docs/starter/Database.md) | Toàn bộ bảng và kiểu dữ liệu, bảng nào thuộc module nào, các quyết định đã chốt ở buổi họp 23/09/2026. Đây là nguồn chuẩn về schema. |
| 3 | [Cấu trúc module mẫu](docs/starter/ARCHITECTURE_SAMPLE.md) | Một module backend gồm những thư mục nào (`controller`, `service`, `repository`...) và luồng xử lý một request, dựa trên module mẫu `sample`. |

Sau đó đọc tiếp tài liệu của phần mình làm:

- Làm backend một module: contract API của module đó trong [`docs/api/`](docs/api/) (xem [bảng](#tài-liệu-trong-docs)), mục
  [Kiến trúc và quy ước code](#kiến-trúc-và-quy-ước-code) và [Lưu ý từ module A](#lưu-ý-từ-module-a-từ-vựng-cho-các-module-khác).
- Làm frontend: [frontend/README.md](frontend/README.md) (công nghệ, cấu trúc, design system, cách gọi API).

### Bước 2. Cài công cụ

| Phần mềm | Kiểm tra | Ghi chú |
|---|---|---|
| **Git** (kèm Git Bash) | `git --version` | Trên Windows, Git Bash là terminal được dùng trong các hướng dẫn |
| **JDK 21** | `java -version` ra `21.x` | `JAVA_HOME` phải trỏ tới JDK 21 |
| **Docker Desktop** | `docker version` có phần `Server` | Chạy Postgres trên máy và test Testcontainers |
| **Node 22** và npm 10 | `node -v`, `npm -v` | Cho frontend |
| IntelliJ IDEA (khuyên dùng) | | Mở cả thư mục repo. Nếu backend chưa được nhận, chuột phải `datn/pom.xml` → *Add as Maven Project*; *File → Project Structure* đặt SDK là 21 |

Không cần cài Maven (dùng `mvnw` có sẵn) và không cần cài PostgreSQL.

### Bước 3. Lấy code về

Nhờ chủ repo mời vào repository trên GitHub, rồi:

```bash
git clone git@github.com:nguyenminhhong2061-prog/DATN.git   # cần SSH key đã thêm vào GitHub
cd DATN/frontend
npm install                                                  # cài thư viện frontend (lần đầu)
```

Chưa có SSH key thì clone bằng HTTPS: `git clone https://github.com/nguyenminhhong2061-prog/DATN.git`.

### Bước 4. Chạy thử toàn bộ dự án

Làm theo mục [Chạy dự án trên máy](#chạy-dự-án-trên-máy). Xong khi mở được `http://localhost:5173`, đăng ký một tài
khoản và thấy trang Từ vựng có các chủ đề.

### Bước 5. Tạo nhánh đầu tiên

Đọc [Quy trình làm việc nhóm](#quy-trình-làm-việc-nhóm) và [Bảo mật](#bảo-mật-và-dữ-liệu-nhạy-cảm-đọc-trước-khi-commit)
trước lần commit đầu tiên, rồi:

```bash
git switch dev
git pull
git switch -c feature/ten-viec-ngan-gon
```

## Công nghệ

| Phần | Công nghệ |
|---|---|
| Backend | Java 21, Spring Boot 4.1.1, Spring Data JPA (Hibernate), Spring Security (JWT HS256, BCrypt), Flyway |
| Cơ sở dữ liệu | PostgreSQL 16: Docker trên máy cá nhân, Neon cho demo |
| Frontend | React 19, Vite, **JavaScript** (không TypeScript), Tailwind CSS 4, React Router 7, TanStack Query 5, axios |
| Test | JUnit 5, MockMvc, H2, Testcontainers (backend); Vitest, React Testing Library (frontend) |
| Thiết kế giao diện | Bản thiết kế LinguaStep trong `frontend/LinguaStep-design-source/` |

## Phân công và trạng thái

Cập nhật 29/09/2026. Chi tiết phần việc của từng người: `docs/Báo cáo và phân công công việc/Phân chia công việc.docx`.

| Module | Nội dung | Backend | Frontend |
|---|---|---|---|
| Đăng nhập, đăng ký | Đăng ký, đăng nhập, đăng xuất, đổi mật khẩu | Nguyễn Minh Hồng (xong) | Nguyễn Minh Hồng (xong) |
| A. Học từ vựng | Chủ đề, flashcard, lặp lại ngắt quãng, danh sách từ riêng, trò chơi và bảng xếp hạng | Nguyễn Minh Hồng (xong) | Nguyễn Minh Hồng (xong) |
| B. Bài tập và chatbot AI | Đọc hiểu, viết (AI chấm), nghe hiểu, phát âm, trợ lý AI giải thích | Lý Quang Đạt (bản đầu: ngữ pháp, nghe, chatbot Groq; chưa có đọc hiểu, viết, chấm phát âm) | Nguyễn Minh Hồng (xong) |
| C. Kiểm tra | Kiểm tra định kỳ, kiểm tra tổng hợp 4 kỹ năng | Khuất Huy Nhân (bản đầu; AI chấm Nói, Viết còn là bản tạm) | Khuất Huy Nhân, Nguyễn Minh Hồng (xong) |
| D. Tiến độ và kế hoạch | Biểu đồ, huy hiệu, kế hoạch học, nhắc nhở | Khuất Huy Nhân (chưa có) | Nguyễn Minh Hồng (trang chủ Tiến độ xong; Kế hoạch đang làm) |
| E. Admin | Quản lý nội dung, người dùng, thống kê | Chưa phân công | Không làm cho buổi demo (nhóm chốt 29/09) |

**Toàn bộ giao diện (thư mục `frontend/`) do một người làm.** Người làm backend không cần sửa `frontend/`; hai bên
thống nhất với nhau qua contract API trong `docs/api/` (xem [Quy trình làm việc nhóm](#quy-trình-làm-việc-nhóm)).

## Cấu trúc thư mục

```
DATN/
├── README.md                 # tài liệu này
├── docker-compose.yml        # Postgres 16 cho máy cá nhân (cổng 5433)
├── .env.example              # mẫu biến môi trường, không chứa giá trị thật
├── datn/                     # BACKEND Spring Boot
│   ├── pom.xml, mvnw         # Maven (dùng mvnw, không cần cài Maven)
│   └── src/
│       ├── main/java/com/example/datn/
│       │   ├── DatnApplication.java
│       │   ├── common/       # dùng chung mọi module: CurrentUser, PageResponse, sự kiện, CefrLevel...
│       │   └── modules/      # mỗi chức năng một module: auth, user, vocabulary (A), exercise (B), test (C), sample (mẫu)
│       ├── main/resources/
│       │   ├── application.properties
│       │   └── db/migration/ # migration Flyway (V1__init.sql là schema gốc)
│       └── test/             # test H2 (nhanh) và test Postgres (Testcontainers)
├── frontend/                 # FRONTEND React, xem frontend/README.md
│   ├── src/                  # app/ (route), api/, components/, features/<module>/, pages/
│   ├── mock/                 # API giả cho `npm run dev:mock` (không vào bản build)
│   └── LinguaStep-design-source/   # bản thiết kế giao diện (chỉ để tham khảo)
└── docs/                     # TÀI LIỆU
    ├── starter/              # đọc đầu tiên: nghiệp vụ, database, cấu trúc module
    ├── api/                  # contract API từng module
    └── Báo cáo và phân công công việc/   # phiếu giao đề tài, báo cáo, tài liệu B1 đến B3, phân chia công việc
```

### Tài liệu trong `docs/`

| Tài liệu | Nội dung | Trạng thái |
|---|---|---|
| `starter/Mô tả hệ thống bằng ngôn ngữ tự nhiên.md` | Mục đích, actor, nghiệp vụ và đối tượng dữ liệu từng module | Tài liệu yêu cầu |
| `starter/Database.md` | Đặc tả database toàn hệ thống | **Nguồn chuẩn** về schema; đổi bảng thì sửa file này |
| `starter/ARCHITECTURE_SAMPLE.md` | Ý nghĩa từng thư mục của một module backend | Mẫu cho module mới |
| `api/vocabulary.md` | Chủ đề, từ vựng, tìm kiếm, phân trang (module A) | Đã có backend |
| `api/learning.md` | Phiên flashcard, đánh giá thẻ, lịch ôn, lịch sử học (module A) | Đã có backend |
| `api/custom-lists.md` | Danh sách từ riêng (module A) | Đã có backend |
| `api/games.md` | Trò chơi từ vựng và bảng xếp hạng (module A) | Đã có backend |
| `api/exercises.md` | Bài tập đọc hiểu, viết, nghe, phát âm (module B) | Đã có backend cho bản ngữ pháp cũ; đọc hiểu và viết (02/10) chưa có, chưa có chấm phát âm |
| `api/chatbot.md` | Trợ lý AI giải thích bài tập, lịch sử trò chuyện (module B) | Đã có backend (Groq) |
| `api/tests.md` | Kiểm tra định kỳ, tổng hợp 4 kỹ năng, chấm điểm và quy đổi CEFR (module C) | Đã có backend |
| `api/progress.md` | Trang chủ Tiến độ: streak, biểu đồ theo ngày/tuần/tháng, điểm kỹ năng, thành tích; đề xuất quy đổi trình độ CEFR (module D, D1) | Đề xuất, chờ Nhân duyệt |
| `api/plans.md` | Kế hoạch học cá nhân: mục tiêu, lộ trình theo tuần do AI gợi ý, việc nên làm, nhắc học (module D, D2) | Đề xuất, chờ Nhân duyệt |
| `Báo cáo và phân công công việc/` | Tài liệu của đồ án: phiếu giao đề tài, báo cáo, B1 thu thập yêu cầu, B2 phân tích, B3 thiết kế, phân chia công việc | Tài liệu tham khảo |

## Chạy dự án trên máy

> Đã chạy thử theo đúng các bước dưới đây ngày 29/09/2026 (code trên `dev`) trên Windows 10, Git Bash, với JDK 21.0.12,
> Node 22.20 và Docker Desktop 29: backend khởi động và tự áp các migration mới, cả hai chế độ frontend lên; đăng nhập,
> Từ vựng, Bài tập, Kiểm tra chạy với backend thật.

Cần các công cụ ở [Bước 2](#bước-2-cài-công-cụ). Cài thư viện frontend **lần đầu** và **mỗi khi
`frontend/package.json` thay đổi** sau khi pull:

```bash
cd frontend
npm install
```

### Mỗi lần chạy: mở Docker Desktop, rồi 2 cửa sổ terminal

Mở **Docker Desktop** trước và chờ đến khi nó báo engine đang chạy.

**Trước khi gõ lệnh, xem mình đang dùng terminal nào**, vì cú pháp đặt biến môi trường khác nhau và gõ nhầm sẽ báo lỗi:

| Dấu nhắc lệnh trông như | Terminal | Dùng khối lệnh |
|---|---|---|
| `Ten@MAY MINGW64 ~/Desktop/DATN $` | **Git Bash** | Git Bash |
| `PS C:\Users\...\DATN>` | **PowerShell** | PowerShell |

Thay `~/Desktop/DATN` (hoặc `C:\duong-dan\DATN`) bằng thư mục repo trên máy bạn.

**Terminal 1: backend** (để nguyên cửa sổ này, đóng lại là backend tắt)

Git Bash:

```bash
cd ~/Desktop/DATN
docker compose up -d
cd datn
export JWT_SECRET="chuoi-bi-mat-khi-dev-dai-it-nhat-32-ky-tu-0123456789"
./mvnw spring-boot:run
```

PowerShell:

```powershell
cd C:\duong-dan\DATN
docker compose up -d
cd datn
$env:JWT_SECRET = "chuoi-bi-mat-khi-dev-dai-it-nhat-32-ky-tu-0123456789"
./mvnw spring-boot:run
```

- `docker compose up -d` bật Postgres 16 ở cổng **5433**. Lần đầu sẽ tải image. Postgres đã chạy rồi thì lệnh này
  không làm gì.
- Backend sẵn sàng khi terminal hiện dòng `Started DatnApplication in ... seconds`, tại `http://localhost:8080`.
  Lần chạy đầu Maven tải thư viện nên lâu hơn. Flyway tự tạo bảng và dữ liệu mẫu.
- Vì sao đặt `JWT_SECRET`: nếu để trống, mỗi lần khởi động backend sinh một khóa mới, token cũ mất hiệu lực và
  bạn bị đăng xuất. Biến chỉ có tác dụng trong cửa sổ terminal vừa đặt, mở cửa sổ mới thì đặt lại.
- Nếu không đặt cấu hình khác, giá trị trong `application.properties` khớp `docker-compose.yml` (database `datn`,
  cổng 5433). Backend chỉ đọc các biến `R2_*` từ `.env` ở repo root; các biến khác vẫn cần đặt trong terminal hoặc
  *Environment variables* của IntelliJ.
- Audio nghe được backend stream từ R2 khi `.env` có `R2_ENABLED=true` và thông tin S3 chỉ-đọc; object key bài mẫu là
  `media/listening/airport.mp3`. Tạo token chỉ có quyền đọc và giới hạn bucket `learning-audio`.
- **Trợ lý AI (chatbot, module B) cần khóa Groq.** Không đặt thì mọi thứ khác vẫn chạy, riêng trợ lý AI báo "không
  thể trả lời lúc này". Muốn thử chatbot thật, đặt trước `./mvnw spring-boot:run` (lấy khóa ở
  https://console.groq.com/keys; **không commit khóa**, không gửi vào nhóm chat):

  ```bash
  export GROQ_API_KEY="gsk_..."          # Git Bash
  ```

  ```powershell
  $env:GROQ_API_KEY = "gsk_..."          # PowerShell
  ```

  Backend không nạp các biến Groq từ `.env`; đặt `GROQ_API_KEY` trong terminal hoặc *Environment variables* của IntelliJ.

**Terminal 2: frontend** (giống nhau ở Git Bash và PowerShell)

```bash
cd ~/Desktop/DATN/frontend
npm run dev
```

Mở **http://localhost:5173**, bấm "Đăng ký" để tạo tài khoản learner (hoặc đăng nhập tài khoản đã có trong DB
cục bộ). Tài khoản admin: đặt thêm `ADMIN_EMAIL` và `ADMIN_PASSWORD` (cùng cách đặt `JWT_SECRET`) trước khi chạy
backend; backend tạo tài khoản đó lúc khởi động nếu email chưa có.

Command Prompt (cmd): đặt biến bằng `set JWT_SECRET=...` rồi chạy `mvnw spring-boot:run`.

Chạy backend bằng nút Run của IntelliJ (lớp `DatnApplication`) cũng được: vẫn phải bật Docker và
`docker compose up -d` trước; đặt `JWT_SECRET` trong *Run → Edit Configurations → Environment variables*.

### Hai chế độ của frontend

| Lệnh | Dữ liệu | Dùng khi |
|---|---|---|
| `npm run dev` | Mọi API gọi **backend thật** | Kiểm tra các phần đã có backend: đăng nhập, Từ vựng (A), Bài tập và trợ lý AI (B), Kiểm tra (C) |
| `npm run dev:mock` | Từ vựng, Bài tập, trợ lý AI và trang chủ Tiến độ trả **dữ liệu giả** (`frontend/mock/`, nhiều bài mẫu hơn DB); đăng nhập, đăng ký và Kiểm tra vẫn đi qua backend thật (backend vẫn phải chạy) | Xem giao diện phần backend **chưa có** (trang chủ Tiến độ, module D) và thử các tình huống đặc biệt |

Ở `npm run dev` (backend thật), các chỗ sau báo lỗi là **bình thường** vì backend chưa làm tới:

- Trang chủ: các khối biểu đồ hoạt động, điểm kỹ năng, thành tích báo "Không tải được" (backend module D chưa có).
- Bài nghe: "Không phát được file âm thanh" (chưa có file ghi âm trong `datn/src/main/resources/static/media/`).
- Bài phát âm: chấm luôn báo AI lỗi (backend chưa có chấm phát âm).
- Trợ lý AI: báo "không thể trả lời lúc này" nếu chưa đặt `GROQ_API_KEY` (xem terminal 1).

**Chạy cả hai chế độ cùng lúc** (so sánh dữ liệu thật và dữ liệu giả): mỗi lệnh một terminal, backend vẫn ở
terminal 1.

```bash
cd ~/Desktop/DATN/frontend
npm run dev:mock                  # http://localhost:5173, dữ liệu giả
```

```bash
cd ~/Desktop/DATN/frontend
npm run dev -- --port 5174        # http://localhost:5174, backend thật
```

Hai bản dùng chung một backend nên đăng nhập bằng cùng tài khoản; mỗi cổng giữ phiên đăng nhập riêng.

**Thử các tình huống đặc biệt:** chạy `npm run dev:mock`, đăng nhập, rồi mở **http://localhost:5173/__mock**.
Trang này chọn tình huống (bình thường, mạng chậm, chưa có bài, lỗi tải, lỗi lưu bài, AI lỗi, người mới, đang chấm
Nói/Viết), có đường dẫn tới các màn đặc biệt và bảng "muốn xem màn nào thì làm gì". Dữ liệu mẫu có đủ 6 trình độ A1
đến C2, lịch sử làm bài sẵn cho mỗi tài khoản, câu điền từ, bài nghe dài, câu phát âm có từ đọc sai hoặc bỏ sót.

### Kiểm tra nhanh đã chạy đúng chưa

- Mở `http://localhost:8080/api/users/me`: trả JSON lỗi 401 nghĩa là backend đang chạy (chỉ là chưa đăng nhập).
- Mở `http://localhost:5173`: thấy trang đăng nhập nghĩa là frontend đang chạy.

### Tắt

- Nhấn **Ctrl+C** ở từng terminal.
- `docker compose stop`: dừng Postgres, **giữ** dữ liệu. `docker compose down -v` thì **xóa sạch** DB cục bộ, chỉ
  dùng khi muốn làm lại từ đầu.

### Lỗi thường gặp

Các lỗi gõ nhầm cú pháp Git Bash và PowerShell, `ENOENT`, `'.\mvnw' is not recognized`, `Connection to localhost:5433 refused`,
`Port 8080 was already in use`, `http proxy error` và lỗi migration `Detected resolved migration not applied` đã được
tái hiện trên máy khi viết mục này; các dòng còn lại là lỗi hay gặp khác.

| Thông báo | Nguyên nhân | Cách sửa |
|---|---|---|
| `bash: :JWT_SECRET: command not found` và `bash: .mvnw: command not found` | Gõ lệnh **PowerShell** trong **Git Bash** | Dùng khối Git Bash: `export JWT_SECRET="..."` và `./mvnw spring-boot:run` (dấu `/`, không phải `\`) |
| `The term 'export' is not recognized ...` | Gõ lệnh **Git Bash** trong **PowerShell** | Dùng khối PowerShell: `$env:JWT_SECRET = "..."` |
| `npm error code ENOENT` … `path ...\DATN\package.json` | Chạy `npm` ở thư mục gốc repo | `cd frontend` rồi chạy lại |
| PowerShell: `The term '.\mvnw' is not recognized ...`; Git Bash: `./mvnw: No such file or directory` | Không đứng trong thư mục `datn` | `cd datn` rồi chạy lại |
| `Connection to localhost:5433 refused` (khi khởi động backend) | Postgres chưa chạy: Docker Desktop tắt, hoặc chưa `docker compose up -d` | Mở Docker Desktop, chạy `docker compose up -d` ở thư mục gốc, rồi chạy lại backend |
| `docker compose` báo `... dockerDesktopLinuxEngine ... cannot find the file specified` | Docker Desktop chưa mở | Mở Docker Desktop, chờ engine chạy, chạy lại lệnh |
| `Web server failed to start. Port 8080 was already in use.` | Một backend khác đang chạy (terminal khác, IntelliJ, hoặc tiến trình java còn sót) | Dùng backend đang chạy, hoặc `netstat -ano \| findstr :8080` để lấy PID rồi `Stop-Process -Id <PID>` |
| `password authentication failed for user "datn"` | App nối nhầm vào PostgreSQL cài trên máy (cổng 5432) | Đừng đặt `DB_URL` trỏ 5432; mặc định là `localhost:5433` |
| `'vite' is not recognized ...` | Chưa cài thư viện frontend | `cd frontend`, `npm install` |
| Giao diện báo "Không kết nối được máy chủ"; terminal frontend in `[vite] http proxy error: /api/...` và `AggregateError [ECONNREFUSED]` | Backend chưa chạy hoặc chưa khởi động xong | Chờ dòng `Started DatnApplication` ở terminal 1 |
| Bị đưa về trang đăng nhập với "Phiên đăng nhập đã hết hạn" | Backend vừa khởi động lại mà không đặt `JWT_SECRET`, hoặc không thao tác quá 30 phút | Đăng nhập lại; lần sau đặt `JWT_SECRET` |
| Backend không khởi động: `Validate failed: Migrations have failed validation` … `Detected resolved migration not applied to database: 2026...` | DB trên máy đã chạy một migration có số phiên bản **lớn hơn** migration vừa pull về (ví dụ đã chạy code của nhánh khác trước) | Chạy **một lần** (Git Bash): `./mvnw spring-boot:run -Dspring-boot.run.arguments=--spring.flyway.out-of-order=true`; ở PowerShell đặt cả tham số `-D...` trong dấu ngoặc kép. Lần sau chạy bình thường. Không cần giữ dữ liệu cũ thì `docker compose down -v` rồi chạy lại cũng được |
| Trang chủ báo "Không tải được" ở biểu đồ, điểm kỹ năng, thành tích | Đang dùng `npm run dev`; backend module D chưa có | Bình thường. Dùng `npm run dev:mock` để xem trang chủ đầy đủ |
| Trợ lý AI báo "không thể trả lời lúc này"; tab Network của DevTools thấy lời gọi `.../messages` trả 503 `Groq API key is not configured` | Chưa đặt `GROQ_API_KEY` trước khi chạy backend | Đặt khóa (xem terminal 1) rồi khởi động lại backend |
| Danh sách Kiểm tra không còn đề định kỳ | Đề định kỳ mẫu chỉ mở 7 ngày, tính từ lúc migration dữ liệu mẫu chạy trên máy bạn | Bình thường với dữ liệu mẫu; muốn có lại thì làm mới DB cục bộ (`docker compose down -v`, mất dữ liệu cũ) |
| `java -version` không ra 21 | `JAVA_HOME` hoặc `PATH` trỏ JDK khác | Trỏ `JAVA_HOME` về JDK 21, mở terminal mới |

> Postgres trong Docker dùng cổng **5433** (không phải 5432) để không đụng với PostgreSQL cài trực tiếp trên máy.

## Quy trình làm việc nhóm

**Nhánh và pull request**

- Nhánh tích hợp là **`dev`** (nhóm chốt 27/09; là nhánh mặc định trên GitHub). Mỗi việc một nhánh, **luôn tách từ
  `dev` mới nhất** (`git switch dev && git pull && git switch -c ...`). Đặt tên theo loại việc: `feature/...` (tính
  năng), `fix/...` (sửa lỗi), `docs/...` (tài liệu), `chore/...` (cấu hình, hạ tầng).
- Đưa code vào `dev` qua pull request trên GitHub, merge bằng **"Create a merge commit"**. PR nhỏ, một mục đích, để
  người khác xem kịp. Khi `dev` chạy ổn định mới mở PR `dev` → `main` (cũng merge commit, không squash).
- Tên file migration theo **giờ lúc tạo** (`V<yyyyMMddHHmm>__mo_ta.sql`), không đặt giờ trong tương lai: migration
  đến sau mà có số nhỏ hơn migration đã chạy sẽ làm backend của người khác không khởi động được (xem
  [Lỗi thường gặp](#lỗi-thường-gặp)).
- Đừng tự gộp nhiều nhánh sắp mở PR riêng thành một nhánh trên máy rồi làm tiếp trên đó: khi các nhánh gốc được merge
  riêng, GitHub sẽ báo conflict giả. Chờ nhánh trước vào `dev` rồi tách nhánh mới từ `dev`.
- Trước khi mở PR: chạy [test](#chạy-test) của phần mình sửa, và xem lại `git diff`.
- Commit message viết tiếng Anh, câu ngắn ở dạng mệnh lệnh, giống lịch sử hiện có (ví dụ
  `Add security rules and module A notes to the README`).

**Frontend và backend phối hợp qua contract API**

1. Mỗi module có một file trong `docs/api/` mô tả endpoint, JSON, mã lỗi. Người làm frontend viết bản đề xuất theo
   thiết kế và `docs/starter/Database.md`; người làm backend duyệt, góp ý.
2. Frontend làm theo contract, dùng dữ liệu giả trong `frontend/mock/` (`npm run dev:mock`) khi backend chưa có.
3. Backend làm đúng theo contract. **Muốn đổi API thì sửa file contract trước**, rồi mới sửa code hai bên.

**Không đụng phần của người khác**

- Không sửa module của người khác; cần gì từ module khác thì gọi qua service hoặc `common`, hoặc nhắn người phụ trách.
- File dùng chung phía backend phải báo nhóm trước khi sửa: `datn/pom.xml`, `application.properties` (cả bản trong
  `src/test`), `.gitignore`, module `sample`.
- Đổi bảng dùng chung (`users`, `vocabulary`...) phải báo cả nhóm và cập nhật `docs/starter/Database.md`.

## Kiến trúc và quy ước code

Backend là một **modular monolith**: một ứng dụng Spring Boot, mỗi chức năng là một module trong
`datn/src/main/java/com/example/datn/modules/<tên>/`. Chi tiết từng thư mục ở
[docs/starter/ARCHITECTURE_SAMPLE.md](docs/starter/ARCHITECTURE_SAMPLE.md).

```
modules/<tên>/
├── config/        # chỉ khi module cần cấu hình riêng
├── controller/    # @RestController, mỏng, chỉ gọi service
├── dto/request/   # và dto/response/, dùng Java record
├── entity/        # @Entity, constructor không tham số protected
├── enums/         # (không đặt tên "enum" vì là từ khóa Java)
├── exception/     # exception riêng và @RestControllerAdvice(basePackages = ...)
├── mapper/        # chuyển entity thành response DTO
├── repository/    # Spring Data JPA
└── service/       # @Service @Transactional; hàm chỉ đọc dùng @Transactional(readOnly = true)
```

- Luồng xử lý: `controller → service → repository`. Controller không gọi repository trực tiếp.
- Liên kết giữa các module bằng **id** (`Long`), không dùng `@ManyToOne` sang entity của module khác, không gọi
  repository của module khác. Module chỉ phụ thuộc package `common` (xem
  [Lưu ý từ module A](#lưu-ý-từ-module-a-từ-vựng-cho-các-module-khác)).
- Code và comment viết **tiếng Anh**; tài liệu và giao diện viết **tiếng Việt**.
- Quy ước chung đã chốt (họp 23/09/2026): chỉ 2 vai trò `learner` và `admin`; độ khó theo CEFR A1 đến C2; khóa chính
  và khóa ngoại kiểu `BIGINT`.
- `modules/sample` là module mẫu để tham khảo, **không sửa**.
- Frontend có quy ước riêng (thư mục theo module trong `src/features/`, design system Tailwind, TanStack Query): xem
  [frontend/README.md](frontend/README.md).

## Chạy test

```bash
# Backend (Docker Desktop phải đang chạy)
cd datn
./mvnw clean test

# Frontend (không cần backend)
cd frontend
npm test
npm run lint
npm run build
```

Test backend gồm hai loại:

- Test API/nghiệp vụ chạy trên H2 (nhanh, không cần Docker).
- Các test kế thừa `AbstractPostgresIntegrationTest` (ví dụ `DatabaseMigrationTests`) chạy toàn bộ migration trên
  một Postgres tạm (Testcontainers, dùng chung một container cho cả lần chạy) rồi khởi động app với
  `ddl-auto=validate`. Các test này **cần Docker đang chạy** và sẽ lỗi nếu entity không khớp bảng trong schema.
  Dùng lớp này cho test cần kiểm tra ràng buộc thật của schema (CHECK, khóa ngoại...).

Test frontend dùng `installFakeBackend` (`frontend/src/test/fakeBackend.js`) để chạy cả luồng mà không cần backend.

## Xác thực (Auth)

**Mọi API đều cần token, trừ đăng ký và đăng nhập.** Token là JWT (HS256), gửi trong header
`Authorization: Bearer <token>`. Thiếu hoặc sai token trả 401, sai quyền trả 403 (đều có thân JSON).

| Endpoint | Mô tả |
|---|---|
| `POST /api/auth/register` | Đăng ký tài khoản learner (`fullName`, `email`, `password` 8–72 ký tự). 201; 409 nếu trùng email |
| `POST /api/auth/login` | Đăng nhập, trả `accessToken` và `expiresIn` (giây). 401 nếu sai email/mật khẩu; 403 nếu tài khoản bị khóa |
| `POST /api/auth/refresh` | Đổi token đang dùng lấy token mới của cùng phiên (cùng dạng với login). 401 khi phiên đã quá 8 giờ hoặc tài khoản bị khóa |
| `POST /api/auth/change-password` | Đổi mật khẩu (`currentPassword`, `newPassword`). 204; 400 nếu sai mật khẩu hiện tại |
| `GET /api/users/me` | Thông tin người dùng hiện tại |

Phiên đăng nhập (kịch bản 3 nhánh 1a, kịch bản 25):

- Mỗi token sống **30 phút** (`app.jwt.idle-timeout`). Giao diện tự gọi `refresh` khi người dùng còn thao tác,
  nên chỉ không thao tác quá 30 phút mới bị đưa về trang đăng nhập ("Phiên đăng nhập đã hết hạn"). Một phiên dài
  tối đa **8 giờ** kể từ lúc đăng nhập (`app.jwt.expiration`, claim `auth_time` trong token).
- **Mỗi request đều đọc trạng thái tài khoản**: tài khoản bị khóa (hoặc đã bị xóa) bị từ chối ngay ở request kế tiếp
  bằng 401; tài khoản bị khóa có thêm `"code": "ACCOUNT_LOCKED"` để giao diện báo đúng lý do.
- Đăng xuất: client xóa token; token không lưu ở server.

Biến môi trường (xem `.env.example`):

- `JWT_SECRET`: khóa ký token, tối thiểu 32 byte. Nếu để trống, app sinh khóa ngẫu nhiên mỗi lần khởi động
  (tiện khi dev, nhưng phải đăng nhập lại sau mỗi lần restart). **Luôn đặt khi chạy demo/Neon.**
- `ADMIN_EMAIL` và `ADMIN_PASSWORD`: khi cả hai được đặt, app tạo tài khoản admin lúc khởi động (nếu chưa có).

### Dành cho các module khác

Lấy người dùng hiện tại qua `CurrentUser` (`com.example.datn.common.security`), không đọc security context trực tiếp:

```java
private final CurrentUser currentUser;   // inject qua constructor

Long userId = currentUser.id();          // users.id của người đang gọi API
boolean admin = currentUser.isAdmin();
Optional<CefrLevel> level = currentUser.currentLevel();   // users.current_level, rỗng khi chưa có (đọc DB mỗi lần gọi)
```

Giới hạn theo vai trò bằng `@PreAuthorize("hasRole('ADMIN')")` trên phương thức controller hoặc service.

Test MockMvc: dùng `TestAuth` (`com.example.datn.support`). `@WithMockUser` không dùng được vì API là stateless.
`TestAuth` đặt sẵn người dùng vào security context nên không qua bước đọc trạng thái tài khoản; test gửi token thật
(`Authorization: Bearer …`) thì người dùng phải có trong bảng `users` và đang hoạt động.

```java
mockMvc.perform(get("/api/xxx").with(TestAuth.learner(42)));   // CurrentUser.id() == 42
mockMvc.perform(post("/api/xxx").with(TestAuth.admin()));
```

## Cơ sở dữ liệu và migration

- Đặc tả chuẩn của toàn bộ bảng: [docs/starter/Database.md](docs/starter/Database.md).
- Schema nằm trong `datn/src/main/resources/db/migration/`. `V1__init.sql` là schema gốc (38 bảng).
- Hibernate chỉ **kiểm tra** schema (`ddl-auto=validate`), không tự tạo hay sửa bảng. Mỗi entity mới phải có bảng
  tương ứng trong migration, nếu không app không khởi động.
- **Đổi schema = thêm file migration mới**, không sửa file đã có. Đặt tên theo thời gian để nhiều người không
  trùng phiên bản: `V<yyyyMMddHHmm>__mo_ta_ngan.sql`, ví dụ `V202609281030__add_interval_days.sql`.
  Nếu nhánh merge trễ, đổi lại timestamp cho lớn hơn migration đã merge trước.
- Đổi bảng dùng chung (`users`, `vocabulary`...) phải báo cả nhóm vì module khác có khóa ngoại trỏ tới.
- Làm lại DB cục bộ từ đầu: `docker compose down -v && docker compose up -d`.

## Dùng Neon (demo / staging)

Đặt biến môi trường trước khi chạy (xem `.env.example`):

```
DB_URL=jdbc:postgresql://<host>/<db>?sslmode=require
DB_USERNAME=...
DB_PASSWORD=...
```

Dùng chuỗi kết nối **trực tiếp** (không phải bản `-pooler`) để Flyway chạy được migration. Không commit mật khẩu.

## Bảo mật và dữ liệu nhạy cảm (đọc trước khi commit)

Repo được cả nhóm và GitHub nhìn thấy, và **git nhớ mọi thứ đã từng commit**: xóa một file bí mật ở commit sau
không làm nó biến mất khỏi lịch sử.

**Không bao giờ commit:**

- File `.env`, `.env.local` và mọi giá trị thật của `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`,
  `ADMIN_PASSWORD`. Giá trị thật chỉ đặt bằng biến môi trường (IntelliJ: Run Configuration → Environment variables).
  `.env.example` chỉ chứa giá trị mẫu.
- Khóa API của dịch vụ ngoài (ví dụ khóa AI cho chatbot): đặt ở backend bằng biến môi trường, đọc qua
  `application.properties` kiểu `${TEN_BIEN:}`, không ghi thẳng vào code.
- **Bí mật trong frontend:** mọi biến `VITE_*` và mọi thứ trong `frontend/src` đều bị đóng gói vào file JavaScript mà
  trình duyệt tải về, ai cũng đọc được. Frontend không được giữ khóa API; gọi dịch vụ ngoài qua backend.
- Tài liệu có thông tin cá nhân (số điện thoại, email, mã sinh viên, CCCD): để trên Drive nhóm, không đưa vào repo.
- File của IDE, log, bản build: `.idea/`, `*.log`, `target/`, `dist/`, `node_modules/` (đã có trong `.gitignore`).

**Trước mỗi commit:**

- Xem `git status`, rồi `git add <đường dẫn cụ thể>`; tránh `git add .` và `git add -A` vì dễ kéo theo file lạ.
- Xem lại `git diff --cached` trước khi `git commit`.
- **Lỡ commit hoặc push một bí mật:** coi như bí mật đó đã lộ. Đổi ngay (tạo khóa mới, đổi mật khẩu Neon), rồi báo
  nhóm; chỉ xóa file thì không đủ.
- Email trong commit hiển thị công khai trên GitHub. Muốn giấu thì dùng email ẩn danh của GitHub:
  `git config user.email "<id>+<username>@users.noreply.github.com"` (lấy ở GitHub → Settings → Emails).

**Trong code:**

- Token đăng nhập nằm ở `localStorage`, nên một lỗ XSS là mất tài khoản: không dùng `dangerouslySetInnerHTML`;
  nội dung HTML hoặc markdown do AI hay người dùng tạo phải được làm sạch (sanitize) trước khi hiển thị.
- Không trả email, mật khẩu băm hay họ tên đầy đủ của người khác trong API. Cần hiện tên người khác (bảng xếp hạng,
  bình luận...) thì dùng `UserDirectory` (xem mục dưới), chỉ trả tên gọi.
- Tài khoản và mật khẩu trong test (ví dụ `password123`) chỉ là giá trị giả; không dùng mật khẩu thật khi tạo tài
  khoản thử.

## Lưu ý từ module A (Từ vựng) cho các module khác

Contract API của module A nằm trong `docs/api/` (`vocabulary.md`, `learning.md`, `custom-lists.md`, `games.md`).

**Package `common` (module khác chỉ nên phụ thuộc package này, không gọi vào module của người khác):**

| Lớp | Dùng để |
|---|---|
| `common.security.CurrentUser` | `id()`, `isAdmin()`, `currentLevel()` của người đang gọi API (xem mục Xác thực) |
| `common.dto.PageResponse` | Dạng phân trang chung: `items`, `page` (từ 0), `size`, `totalItems`, `totalPages` |
| `common.event.WordReviewedEvent` | Phát mỗi lần người học đánh giá một thẻ flashcard (dùng cho tiến độ, huy hiệu) |
| `common.user.UserDirectory` | Tên gọi (từ cuối của họ tên) của người dùng theo id, để hiện tên người khác |
| `common.persistence.LowercaseEnumConverter` | Lưu enum thành chữ thường, khớp các cột `CHECK` chữ thường của schema |
| `common.enums.CefrLevel` | Trình độ A1 đến C2 |

**Quy tắc cần theo:**

- **Từ vựng riêng tư:** người học tự nhập được từ riêng (`vocabulary.created_by` là id người đó). Từ hệ thống luôn có
  `created_by IS NULL`, kể cả khi admin thêm. **Khi chọn từ để ra đề kiểm tra, bài tập hay trò chơi chung, lọc
  `created_by IS NULL`**, nếu không từ riêng của người này sẽ hiện cho người khác.
- `GET /api/vocabulary` trả `PageResponse` (có `q`, `level`, `topicId`, `page`, `size`), sắp từ A1 đến C2. Chỉ admin
  được thêm, sửa, xóa từ và chủ đề.
- Cần số liệu học từ vựng (đang học, đã thuộc, đến hạn) thì gọi `GET /api/learning/summary` hoặc nghe
  `WordReviewedEvent`; không đọc thẳng bảng `user_vocabulary`. Mẫu listener (`@TransactionalEventListener` pha
  `AFTER_COMMIT` cùng `REQUIRES_NEW`) ở mục "Cho module khác" của `docs/api/learning.md`.
- **"Hôm nay" tính theo giờ Việt Nam** (`Asia/Ho_Chi_Minh`): lượt ôn lúc 6 giờ sáng là 23 giờ hôm trước theo UTC. Cột
  ngày (`next_review_at`, `user_progress.date`...) nên dùng cùng múi giờ để số liệu các module khớp nhau.
- **Bean `Clock` duy nhất** nằm trong `SampleModuleConfig` của module `sample`. Không khai báo `Clock` thứ hai (app sẽ
  không khởi động), và không xóa module `sample` trước khi cả nhóm chuyển bean này sang `common`.
- **`@EnableScheduling` đã bật cho cả ứng dụng** (`modules/vocabulary/config/GameSchedulingConfig`): `@Scheduled` của
  module khác chạy luôn, không cần khai báo lại.
- **Enum chữ thường trong DB:** `@Enumerated(EnumType.STRING)` ghi chữ hoa và bị `CHECK` của Postgres từ chối. Dùng
  `LowercaseEnumConverter`. H2 không phát hiện lỗi này, nên thêm test kế thừa `AbstractPostgresIntegrationTest` cho
  mỗi entity có enum.
- Các bảng trò chơi (`games`, `game_sessions`, `leaderboard`; ba bảng ngân hàng câu hỏi `game_questions`,
  `game_question_options`, `game_session_answers` không còn dùng từ 02/10/2026) và bảng lượt ôn `vocabulary_reviews`
  thuộc module A. Cần điểm trò chơi thì dùng `GET /api/games`, `GET /api/games/leaderboard`.
