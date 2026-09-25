# DATN — Nền tảng học tiếng Anh cá nhân hóa theo AI

Backend Spring Boot (Java 21) + PostgreSQL. Schema do Flyway quản lý. Frontend React (Vite) nằm trong `frontend/`,
xem [frontend/README.md](frontend/README.md) để biết cách chạy.

## Yêu cầu

- **JDK 21** (`java -version` phải ra 21.x, `JAVA_HOME` trỏ tới JDK 21)
- **Docker Desktop** đang chạy (dùng cho Postgres cục bộ và cho test Testcontainers)
- Không cần cài Maven (dùng `./mvnw`) và không cần cài PostgreSQL

## Chạy backend

```bash
# 1. Bật Postgres cục bộ (lần đầu sẽ tải image)
docker compose up -d

# 2. Chạy ứng dụng (Flyway tự tạo schema ở lần chạy đầu)
cd datn
./mvnw spring-boot:run
```

Ứng dụng chạy tại `http://localhost:8080`. Giá trị mặc định trong `application.properties` khớp với
`docker-compose.yml` (database `datn`, user `datn`, mật khẩu `datn`, cổng `5433`), nên không cần tạo file `.env`.

> Postgres trong Docker dùng cổng **5433** (không phải 5432) để không đụng với PostgreSQL cài trực tiếp trên máy.
> Nếu không kết nối được với lỗi `password authentication failed`, kiểm tra xem app có đang nối nhầm vào
> một Postgres khác đang nghe cổng đó không.

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

## Cấu trúc thư mục

| Đường dẫn | Nội dung |
|---|---|
| `datn/` | Backend Spring Boot (module nằm trong `src/main/java/com/example/datn/modules/`) |
| `datn/src/main/resources/db/migration/` | Migration Flyway |
| `docker-compose.yml` | Postgres cục bộ |
| `Database.md` | Đặc tả database toàn hệ thống |
| `ARCHITECTURE_SAMPLE.md` | Cấu trúc một module mẫu |
