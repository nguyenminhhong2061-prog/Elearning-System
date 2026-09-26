# DATN — Nền tảng học tiếng Anh cá nhân hóa theo AI

Backend Spring Boot (Java 21) + PostgreSQL. Schema do Flyway quản lý. Frontend React (Vite) nằm trong `frontend/`.
Cách chạy cả hai phần ở mục **"Chạy dự án trên máy"** ngay dưới; chi tiết riêng của frontend (công nghệ, cấu trúc
thư mục, quy ước) ở [frontend/README.md](frontend/README.md).

## Chạy dự án trên máy

> Đã chạy thử theo đúng các bước dưới đây ngày 26/09/2026 trên Windows 10 (PowerShell), với JDK 21.0.12,
> Node 22.20 và Docker Desktop 29: backend khởi động, frontend lên, đăng ký và đăng nhập qua giao diện được, trang
> Từ vựng lấy dữ liệu từ backend thật.

### Cần có (cài một lần)

| Phần mềm | Kiểm tra | Ghi chú |
|---|---|---|
| **JDK 21** | `java -version` ra `21.x` | `JAVA_HOME` phải trỏ tới JDK 21 |
| **Docker Desktop** | `docker version` có phần `Server` | Chạy Postgres cục bộ và test Testcontainers |
| **Node 22** và npm 10 | `node -v`, `npm -v` | Cho frontend |

Không cần cài Maven (dùng `mvnw` có sẵn) và không cần cài PostgreSQL.

Cài thư viện frontend: làm **lần đầu** và **mỗi khi `frontend/package.json` thay đổi** sau khi pull.

```powershell
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
- Giá trị mặc định trong `application.properties` đã khớp `docker-compose.yml` (database, user, mật khẩu đều là
  `datn`, cổng 5433), nên không cần tạo file `.env`.

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
| `npm run dev` | Mọi API gọi **backend thật** | Kiểm tra các phần đã có backend: đăng nhập, Từ vựng, học flashcard, danh sách riêng, trò chơi |
| `npm run dev:mock` | API mô tả trong `docs/api/` trả **dữ liệu giả** (`frontend/mock/`); chỉ đăng nhập, đăng ký đi qua backend thật (backend vẫn phải chạy) | Xem giao diện các phần backend **chưa có**, như Bài tập (module B) |

Ở `npm run dev`, trang **Bài tập** báo "Không tải được danh sách bài tập": đây là **bình thường**, vì backend
module B chưa có. Chỉ chạy một chế độ một lúc (cùng cổng 5173): Ctrl+C rồi chạy lệnh kia.

### Kiểm tra nhanh đã chạy đúng chưa

- Mở `http://localhost:8080/api/users/me`: trả JSON lỗi 401 nghĩa là backend đang chạy (chỉ là chưa đăng nhập).
- Mở `http://localhost:5173`: thấy trang đăng nhập nghĩa là frontend đang chạy.

### Tắt

- Nhấn **Ctrl+C** ở từng terminal.
- `docker compose stop`: dừng Postgres, **giữ** dữ liệu. `docker compose down -v` thì **xóa sạch** DB cục bộ, chỉ
  dùng khi muốn làm lại từ đầu.

### Lỗi thường gặp

Các lỗi gõ nhầm cú pháp Git Bash và PowerShell, `ENOENT`, `'.\mvnw' is not recognized`, `Connection to localhost:5433 refused`,
`Port 8080 was already in use`, `http proxy error` và trang Bài tập báo lỗi đã được tái hiện trên máy khi viết mục
này; các dòng còn lại là lỗi hay gặp khác.

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
| Bị đưa về trang đăng nhập với "Phiên đăng nhập đã hết hạn" | Backend vừa khởi động lại mà không đặt `JWT_SECRET` | Đăng nhập lại; lần sau đặt `JWT_SECRET` |
| Trang Bài tập báo "Không tải được danh sách bài tập" | Đang dùng `npm run dev`, backend module B chưa có | Dùng `npm run dev:mock` để xem giao diện |
| `java -version` không ra 21 | `JAVA_HOME` hoặc `PATH` trỏ JDK khác | Trỏ `JAVA_HOME` về JDK 21, mở terminal mới |

> Postgres trong Docker dùng cổng **5433** (không phải 5432) để không đụng với PostgreSQL cài trực tiếp trên máy.

## Chạy test

```bash
cd datn
./mvnw test
```

Bộ test gồm hai loại:

- Test API/nghiệp vụ chạy trên H2 (nhanh, không cần Docker).
- Các test kế thừa `AbstractPostgresIntegrationTest` (ví dụ `DatabaseMigrationTests`) chạy toàn bộ migration trên
  một Postgres tạm (Testcontainers, dùng chung một container cho cả lần chạy) rồi khởi động app với
  `ddl-auto=validate`. Các test này **cần Docker đang chạy** và sẽ lỗi nếu entity không khớp bảng trong schema.
  Dùng lớp này cho test cần kiểm tra ràng buộc thật của schema (CHECK, khóa ngoại...).

## Xác thực (Auth)

**Mọi API đều cần token, trừ đăng ký và đăng nhập.** Token là JWT (HS256), gửi trong header
`Authorization: Bearer <token>`. Thiếu hoặc sai token trả 401, sai quyền trả 403 (đều có thân JSON).

| Endpoint | Mô tả |
|---|---|
| `POST /api/auth/register` | Đăng ký tài khoản learner (`fullName`, `email`, `password` 8–72 ký tự). 201; 409 nếu trùng email |
| `POST /api/auth/login` | Đăng nhập, trả `accessToken`. 401 nếu sai email/mật khẩu; 403 nếu tài khoản bị khóa |
| `POST /api/auth/change-password` | Đổi mật khẩu (`currentPassword`, `newPassword`). 204; 400 nếu sai mật khẩu hiện tại |
| `GET /api/users/me` | Thông tin người dùng hiện tại |

Đăng xuất: client xóa token. Token không lưu ở server và tự hết hạn sau 8 giờ.

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

```java
mockMvc.perform(get("/api/xxx").with(TestAuth.learner(42)));   // CurrentUser.id() == 42
mockMvc.perform(post("/api/xxx").with(TestAuth.admin()));
```

## Cơ sở dữ liệu và migration

- Schema nằm trong `datn/src/main/resources/db/migration/`. `V1__init.sql` là schema gốc (38 bảng).
- Hibernate chỉ **kiểm tra** schema (`ddl-auto=validate`), không tự tạo hay sửa bảng.
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
- Các bảng trò chơi (`games`, `game_questions`, `game_question_options`, `game_sessions`, `game_session_answers`,
  `leaderboard`) thuộc module A. Cần điểm trò chơi thì dùng `GET /api/games`, `GET /api/games/leaderboard`.

## Cấu trúc thư mục

| Đường dẫn | Nội dung |
|---|---|
| `datn/` | Backend Spring Boot (module nằm trong `src/main/java/com/example/datn/modules/`) |
| `datn/src/main/resources/db/migration/` | Migration Flyway |
| `docs/api/` | Contract API (frontend và backend cùng làm theo) |
| `frontend/` | Frontend React, xem `frontend/README.md` |
| `docker-compose.yml` | Postgres cục bộ |
| `Database.md` | Đặc tả database toàn hệ thống |
| `ARCHITECTURE_SAMPLE.md` | Cấu trúc một module mẫu |
