# Ý nghĩa các thư mục trong `sample`

Tài liệu này mô tả vai trò của các thư mục trong module mẫu:

```text
com.example.datn.modules.sample
├── config
├── controller
├── dto
├── entity
├── enum
├── exception
├── mapper
├── repository
└── service
```

## 1. Vị trí của `sample` trong project

`sample` là một **module nghiệp vụ** nằm dưới package gốc `com.example.datn.modules`. Cách tổ chức này gom toàn bộ code liên quan đến một chức năng vào cùng một module, thay vì đặt tất cả controller, service và repository của toàn hệ thống vào các thư mục chung.

Khi project phát triển, có thể tạo thêm các module cùng cấp, ví dụ:

```text
modules/
├── sample/
├── user/
├── vocabulary/
├── exercise/
└── progress/
```

Mỗi module có thể giữ cấu trúc thư mục tương tự `sample` và có phạm vi nghiệp vụ riêng.

## 2. Ý nghĩa từng thư mục

### `config`

Chứa các cấu hình dành riêng cho module hoặc cấu hình bổ sung cho Spring, chẳng hạn:

- Khai báo bean bằng `@Configuration`.
- Cấu hình bảo mật, CORS hoặc phân quyền.
- Cấu hình các thành phần tích hợp bên ngoài.
- Cấu hình `ObjectMapper`, bộ chuyển đổi hoặc tham số riêng của module.

Không nên đưa các cấu hình dùng chung cho toàn hệ thống vào đây; các cấu hình đó phù hợp hơn ở package gốc hoặc một package `common`/`config` cấp ứng dụng.

### `controller`

Chứa các lớp tiếp nhận HTTP request và trả về HTTP response, thường được đánh dấu bằng `@RestController`.

Nhiệm vụ chính:

- Khai báo endpoint và HTTP method.
- Nhận `@PathVariable`, `@RequestParam` và `@RequestBody`.
- Kiểm tra dữ liệu đầu vào ở mức request.
- Gọi `service` để thực hiện nghiệp vụ.
- Chuyển kết quả thành response DTO và mã trạng thái HTTP phù hợp.

Controller nên mỏng, không chứa logic nghiệp vụ hoặc thao tác trực tiếp với database.

### `dto`

DTO (*Data Transfer Object*) là các lớp dùng để truyền dữ liệu giữa API và ứng dụng.

Thường có thể tách thành:

- `Create...Request`: dữ liệu tạo mới.
- `Update...Request`: dữ liệu cập nhật.
- `...Response`: dữ liệu trả về cho client.
- `...Filter` hoặc `...Query`: tiêu chí tìm kiếm, lọc và phân trang.

DTO giúp API không phụ thuộc trực tiếp vào cấu trúc entity/database và cho phép kiểm tra dữ liệu bằng các annotation như `@NotNull`, `@Size` hoặc `@Email`.

### `entity`

Chứa các lớp mô hình dữ liệu được ánh xạ với bảng trong database bằng JPA/Hibernate, thường sử dụng `@Entity`.

Một entity thường khai báo:

- Tên bảng và khóa chính.
- Các cột dữ liệu.
- Quan hệ `@OneToMany`, `@ManyToOne`, `@OneToOne` hoặc `@ManyToMany`.
- Quy tắc ánh xạ và trạng thái lưu trữ.

Entity thuộc tầng persistence, không nên được trả thẳng ra API vì có thể làm lộ cấu trúc database hoặc gây vấn đề khi serialize quan hệ hai chiều.

### `enum`

Được dự định dùng cho các giá trị hữu hạn, chẳng hạn trạng thái, loại dữ liệu hoặc vai trò người dùng:

```java
public enum Status {
    ACTIVE,
    INACTIVE
}
```

**Lưu ý:** `enum` là từ khóa của Java. Vì vậy, khi khai báo package Java thực tế, nên đổi tên thư mục này thành `enums`, `constant` hoặc `constants`; không nên dùng `package ...enum;`.

### `exception`

Chứa các exception riêng của module và cơ chế xử lý lỗi, ví dụ:

- `ResourceNotFoundException` khi không tìm thấy dữ liệu.
- `BusinessException` khi vi phạm quy tắc nghiệp vụ.
- Exception handler sử dụng `@RestControllerAdvice` hoặc `@ExceptionHandler`.
- DTO chuẩn hóa nội dung lỗi trả về client.

Mục tiêu là để service mô tả lỗi rõ ràng, còn controller không phải tự xử lý từng loại exception bằng nhiều khối `try/catch`.

### `mapper`

Chứa logic chuyển đổi giữa các kiểu dữ liệu, phổ biến nhất là:

- Request DTO → entity.
- Entity → response DTO.
- Entity/DTO → model hoặc object khác.

Mapper giúp tách logic chuyển đổi khỏi controller và service. Với các mapping lớn, có thể sử dụng MapStruct; với mapping đơn giản, có thể viết class mapper thủ công.

### `repository`

Chứa các interface truy cập database, thường kế thừa `JpaRepository`, `CrudRepository` hoặc `PagingAndSortingRepository`.

Repository chịu trách nhiệm:

- CRUD cơ bản.
- Truy vấn theo tên phương thức.
- Truy vấn bằng `@Query` khi cần.
- Phân trang, sắp xếp và lọc dữ liệu.

Repository không nên chứa quy tắc nghiệp vụ. Quy tắc nghiệp vụ nên nằm ở `service`.

### `service`

Chứa logic nghiệp vụ của module, thường được đánh dấu bằng `@Service`.

Service có thể:

- Kiểm tra điều kiện nghiệp vụ.
- Điều phối nhiều repository.
- Quản lý transaction bằng `@Transactional`.
- Gọi mapper để chuyển đổi dữ liệu.
- Phối hợp với service hoặc thành phần tích hợp khác.

Service là lớp trung tâm của luồng xử lý và nên độc lập với chi tiết HTTP.

## 3. Luồng xử lý điển hình

```text
Client
  ↓ HTTP request
Controller
  ↓ DTO đã kiểm tra
Service
  ↓ nghiệp vụ và transaction
Repository
  ↓ JPA/Hibernate
Database
  ↑
Entity → Mapper → Response DTO → Controller → Client
```

Ví dụ khi tạo một bản ghi:

1. `controller` nhận `CreateRequest`.
2. Spring kiểm tra validation của request.
3. `service` kiểm tra điều kiện nghiệp vụ.
4. `mapper` chuyển request DTO thành entity.
5. `repository` lưu entity vào database.
6. `mapper` chuyển entity kết quả thành response DTO.
7. `controller` trả response cùng HTTP status phù hợp.

## 4. Quan hệ với package gốc

Lớp khởi động `DatnApplication` nằm trong package `com.example.datn` và sử dụng `@SpringBootApplication`. Vì vậy, Spring Boot mặc định quét các component nằm trong package này và toàn bộ package con, bao gồm `modules.sample`.

Các annotation như `@RestController`, `@Service`, `@Repository`, `@Component` và `@Configuration` sẽ được Spring phát hiện khi đặt đúng bên dưới package gốc.

## 5. Trạng thái hiện tại của thư mục

Các thư mục trong `sample` hiện là **skeleton**, tức là cấu trúc đã được tạo để chuẩn bị phát triển module nhưng chưa đại diện cho một chức năng nghiệp vụ hoàn chỉnh. Khi bổ sung code, nên giữ nguyên hướng phụ thuộc sau:

```text
controller → service → repository
                  ↘ mapper/entity
```

`controller` không nên gọi trực tiếp `repository`, và `repository` không nên phụ thuộc ngược vào `controller`.
