# DATN — Nền tảng học tiếng Anh cá nhân hóa theo AI

Backend Spring Boot (Java 21) + PostgreSQL. Schema do Flyway quản lý.

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
- `DatabaseMigrationTests` chạy toàn bộ migration trên một Postgres tạm (Testcontainers) rồi khởi động app với
  `ddl-auto=validate`. Test này **cần Docker đang chạy** và sẽ lỗi nếu entity không khớp bảng trong schema.

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
