#  — Hệ thống hỗ trợ đặt lịch khám (Java + Spring Boot)

Ứng dụng web nội bộ cho đặt lịch khám, quản lý bệnh nhân, quản trị viên và bác sĩ.
Phiên bản hiện tại: Java 17, Spring Boot 3.2.0.

## Mục lục

- Tổng quan
- Trạng thái hiện tại & thay đổi gần đây
- Công nghệ
- Cấu trúc chính
- Chạy ứng dụng (cài đặt & khắc phục nhanh)
- API & kiểm thử nhanh
- Tệp/điểm quan trọng
- Ghi chú cho báo cáo

---

## Tổng quan

Hệ thống phục vụ 3 vai trò chính: `CUSTOMER` (bệnh nhân), `DOCTOR` (bác sĩ), `ADMIN` (quản trị/tiếp tân). Ứng dụng kết hợp backend Spring Boot và frontend tĩnh (HTML/CSS/Vanilla JS) đặt trong `src/main/resources/static`.

Tính năng căn bản: đăng ký/đăng nhập, phân quyền theo vai trò, đặt lịch, quản lý bác sĩ/chuyên khoa, dashboard quản trị, báo cáo thống kê.

Giao diện là các trang HTML tĩnh, đã được chỉnh sửa để khắc phục lỗi mã hóa (chuẩn hoá UTF-8) và thống nhất thương hiệu `PHÒNG KHÁM PHENIKAAMEC`. Logo mặc định: `/images/logo.png`.

---

## Trạng thái hiện tại & thay đổi gần đây

- Đã sửa lỗi encoding (tất cả tài nguyên tĩnh chuyển sang UTF-8), sửa các HTML/JS bị lỗi ký tự.
- Di chuyển trang đăng nhập/đăng ký vào thư mục quản trị: `src/main/resources/static/admin/` (`/admin/dangnhap.html`, `/admin/dangky.html`).
- Frontend xác thực được tích hợp với API backend: `POST /api/auth/login` và `POST /api/auth/register`.
- File client auth chính: `src/main/resources/static/js/xacthuc.js` (chứa `authLogin()`, `authRegister()`, `setCurrentUser()`, `redirectByRole()`, `requireAuth()`).
- Thương hiệu đã đổi tên hiển thị trên các trang tĩnh sang **PHÒNG KHÁM PHENIKAAMEC**; logo đặt tại `/images/logo.png`.

Các mục công việc còn lại: chạy toàn bộ kiểm thử luồng đăng nhập/đăng ký với DB, seed dữ liệu test (user/admin/bác sĩ), kiểm tra chạy ổn định (port 8080).

## Công nghệ

- Java 17, Spring Boot 3.2.0
- Spring Data JPA, MySQL
- Maven
- Frontend: HTML5, CSS, Vanilla JS (no SPA framework)

### 📅 Quản lý lịch khám

- Đặt lịch khám nhanh (3-4 bước)
- Chọn chuyên khoa, bác sĩ, khung giờ phù hợp
- Xem trạng thái lịch hẹn (Chờ xác nhận, Đã xác nhận, Đã khám, v.v.)
- Xác nhận / Hủy lịch (cho bệnh viện)

### 👨‍⚕️ Quản lý bác sĩ & Chuyên khoa

- Danh sách bác sĩ với ảnh đại diện (avatar với 2 chữ cái)
- Phân loại theo chuyên khoa (Nội tổng quát, Tai Mũi Họng, Da liễu, v.v.)
- Lịch làm việc linh hoạt

### 👤 Hồ sơ bệnh nhân

- Cập nhật thông tin cá nhân (Họ tên, Tuổi, Giới tính, CCCD, Địa chỉ)
- Lưu trữ lịch sử khám bệnh
- Hỗ trợ tái khám nhanh

### 📊 Thống kê & Báo cáo

- Thống kê số lượng lịch khám
- Báo cáo tỉ lệ khám thành công
- Phân tích theo chuyên khoa, bác sĩ

### 📱 Giao diện Responsive

- Tối ưu cho desktop, tablet, mobile
- Header thông minh (ẩn/hiển khi cuộn)
- Menu dropdown cho tài khoản người dùng

### 📰 Tin tức & Cẩm nang

- Trang "Tin tức & cẩm nang" với danh sách bài viết
- Hướng dẫn cho bệnh nhân (4 bước chuẩn bị khám)
- Dễ mở rộng để thêm bài viết mới

---

## Cấu trúc chính (tóm tắt)

- `src/main/java/com/example/webapp/` — mã nguồn Java (controllers, entities, repositories, services)
- `src/main/resources/static/` — tài nguyên tĩnh (html, css, js, images)
  - `static/admin/` — trang quản trị (đăng nhập, dashboard)
  - `static/customer/` — trang khách hàng (trang chủ canonical: `/customer/trangchu.html`)
- `src/main/resources/application.properties` — cấu hình (port, DB, encoding)
- `pom.xml` — dependency và build

### Đặc điểm Frontend

- Không dùng React/Vue/Angular (giữ lightweight)
- CSS Grid/Flexbox cho layout responsive
- LocalStorage cho quản lý session khách hàng

---

(Xem trong repo để biết danh sách đầy đủ file; phần quan trọng: `controller`, `entity`, `repository`, `service`, và `static/`.)

---

## 🚀 Hướng dẫn cài đặt

### Yêu cầu hệ thống

- **Java JDK 17 trở lên** - [Tải tại đây](https://www.oracle.com/java/technologies/downloads/#java17)
- **Maven 3.8.1 trở lên** - [Tải tại đây](https://maven.apache.org/download.cgi)
- **MySQL 8.0 trở lên** - [Tải tại đây](https://www.mysql.com/downloads/)
- **IDE** - [IntelliJ IDEA](https://www.jetbrains.com/idea/) hoặc [VS Code](https://code.visualstudio.com/)

### Bước 1: Chuẩn bị cơ sở dữ liệu

```sql
-- Tạo schema
CREATE DATABASE tt_care_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tt_care_db;

-- Spring Boot JPA sẽ tự tạo bảng từ entities
-- Hoặc chạy script init nếu có file schema.sql
```

### Bước 2: Clone/Tải dự án

```bash
# Clone từ GitHub (nếu có)
git clone https://github.com/your-repo/tt-care.git
cd tt-care

# Hoặc extract file ZIP
```

### Bước 3: Cấu hình application.properties

Chỉnh sửa file `src/main/resources/application.properties`:

```properties
# Server
server.port=8080
server.servlet.context-path=/

# Database
spring.datasource.url=jdbc:mysql://localhost:3306/tt_care_db?useSSL=false&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=your_password
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect
spring.jpa.properties.hibernate.format_sql=true

# Encoding
spring.http.encoding.charset=UTF-8
spring.http.encoding.enabled=true
spring.http.encoding.force=true

# Mail (tùy chọn - nếu cần gửi email)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

## Chạy ứng dụng — nhanh & khắc phục lỗi thường gặp (dùng cho báo cáo)

1. Cài đặt yêu cầu: Java 17, Maven, MySQL.

2. Chuẩn bị DB (ví dụ nhanh):

```sql
CREATE DATABASE phenikaamec_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. Cấu hình `src/main/resources/application.properties` với thông tin DB và port.

4. Các lệnh build/run:

```bash
mvn clean install
mvn spring-boot:run
```

5. Nếu gặp lỗi "Port 8080 is already in use" (Windows):

```powershell
netstat -ano | findstr :8080
taskkill /PID <PID> /F
# Hoặc tạm đổi port trong application.properties: server.port=8081
```

6. Trang truy cập chính (canonical):

- Trang khách (công khai): http://localhost:8080/customer/trangchu.html
- Đăng nhập/Quản trị: http://localhost:8080/admin/dangnhap.html

7. Lưu ý về mã hóa: toàn bộ tài nguyên tĩnh đã chuyển về UTF-8 để tránh lỗi font/hiển thị.

## API & kiểm thử nhanh (dùng cho báo cáo)

- Xác thực:
  - `POST /api/auth/register` — body JSON: `{ "username":"...", "password":"..." }`
  - `POST /api/auth/login` — body JSON: `{ "username":"...", "password":"..." }`

Ví dụ kiểm thử nhanh với curl:

```bash
curl -X POST -H "Content-Type: application/json" -d '{"username":"test","password":"pass"}' http://localhost:8080/api/auth/login
```

- Frontend client auth helper: `src/main/resources/static/js/xacthuc.js` — file này lưu user vào `localStorage`, xử lý redirect theo role (`redirectByRole()`), và dùng `/admin/dangnhap.html` làm trang login chuyển hướng.

## Các tệp/điểm quan trọng (báo cáo)

- Backend main: `src/main/java/com/example/webapp/UngDungWeb.java`
- Auth controller: `src/main/java/com/example/webapp/controller/XacThucController.java`
- Home redirect: `src/main/java/com/example/webapp/controller/HomeController.java` (root -> `/customer/trangchu.html`)
- Client auth: `src/main/resources/static/js/xacthuc.js`
- Admin login page: `src/main/resources/static/admin/dangnhap.html`
- Styles: `src/main/resources/static/css/kieu.css`
- Logo: `src/main/resources/static/images/logo.png`

## Ghi chú cho báo cáo

- Trạng thái: hệ thống đã phục hồi nhiều trang tĩnh, sửa lỗi encoding, di chuyển auth vào `/admin/`, tích hợp frontend với API xác thực.
- Công việc ưu tiên tiếp theo: xử lý port conflict khi chạy local, seed dữ liệu test (user/admin/bác sĩ), thực hiện kiểm thử end-to-end cho luồng đăng ký/đăng nhập/đặt lịch.
- Nếu cần, tôi có thể tiếp tục: (1) chạy ứng dụng local, (2) seed DB mẫu, (3) kiểm thử API và chụp kết quả cho báo cáo.

---

Nếu bạn muốn, tôi sẽ chạy thêm một bản `README` ngắn bằng tiếng Anh hoặc tạo file báo cáo PDF tóm tắt thay cho slide trình bày.

## 🗂️ Các thực thể dữ liệu

### Bảng chính

| Thực thể             | Mô tả                | Các trường quan trọng                                         |
| -------------------- | -------------------- | ------------------------------------------------------------- |
| **NguoiDung**        | Người dùng hệ thống  | id, username, email, password, role (CUSTOMER/DOCTOR/ADMIN)   |
| **BenhNhan**         | Bệnh nhân            | id, fullname, age, gender, cccd, phone, address, account (FK) |
| **BacSi**            | Bác sĩ               | id, hoTen, chucDanh, chuyenKhoa (FK), phongKham (FK)          |
| **ChuyenKhoa**       | Chuyên khoa khám     | id, ten, moTa                                                 |
| **PhongKham**        | Phòng khám           | id, ten, dia_chi                                              |
| **LichHen**          | Lịch hẹn khám benh   | id, benhNhan (FK), bacSi (FK), ngayKham, gioKham, trangThai   |
| **LichLamViec**      | Lịch làm việc bác sĩ | id, bacSi (FK), ngayLamViec, gioBatDau, gioKetThuc            |
| **ThongBaoNhacLich** | Thông báo nhắc lịch  | id, lichHen (FK), noiDung, thoiDiemNhac                       |

### Enum (Trạng thái)

- **TrangThaiLichHen**: CHO_XAC_NHAN, DA_XAC_NHAN, DA_HUY, DANG_KHAM, DA_KHAM, BO_LO
- **TrangThaiLichLamViec**: DANG_LAM, NGHI, HUY

---

## 🔌 API chính

### Authentication

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "password123",
  "role": "customer"
}
```

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "password123"
}
```

### Bệnh nhân

```http
GET /api/patient/specialties          # Danh sách chuyên khoa
GET /api/patient/doctors               # Danh sách bác sĩ
GET /api/patient/doctors?specialtyId=1 # Bác sĩ theo chuyên khoa
GET /api/patient/doctors/{id}/available-slots?date=2024-01-15

POST /api/patient/appointments         # Đặt lịch khám
GET /api/patient/{patientId}/appointments # Xem lịch khám

POST /api/patients/upsert-by-account   # Cập nhật hồ sơ bệnh nhân
GET /api/patients/by-account           # Lấy hồ sơ bệnh nhân
```

### Quản trị

```http
GET /api/admin/appointments            # Danh sách lịch khám
PUT /api/admin/appointments/{id}       # Cập nhật lịch khám
DELETE /api/admin/appointments/{id}    # Hủy lịch khám

GET /api/admin/doctors                 # Danh sách bác sĩ
POST /api/admin/doctors                # Thêm bác sĩ
PUT /api/admin/doctors/{id}            # Cập nhật bác sĩ
DELETE /api/admin/doctors/{id}         # Xóa bác sĩ
```

---

## 💻 Hướng dẫn phát triển

### Thêm tính năng mới

#### Bước 1: Tạo Entity (Model dữ liệu)

```java
// src/main/java/com/example/webapp/entity/TinhNang.java
@Entity
@Table(name = "tinh_nang")
public class TinhNang {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "ten")
    private String ten;

    // Getters/Setters
}
```

#### Bước 2: Tạo Repository

```java
// src/main/java/com/example/webapp/repository/TinhNangRepository.java
@Repository
public interface TinhNangRepository extends JpaRepository<TinhNang, Integer> {
    TinhNang findByTen(String ten);
}
```

#### Bước 3: Tạo Service

```java
// src/main/java/com/example/webapp/service/TinhNangService.java
@Service
public class TinhNangService {
    @Autowired
    private TinhNangRepository repo;

    public List<TinhNang> getAll() {
        return repo.findAll();
    }
}
```

#### Bước 4: Tạo Controller

```java
// src/main/java/com/example/webapp/controller/TinhNangController.java
@RestController
@RequestMapping("/api/tinh-nang")
public class TinhNangController {
    @Autowired
    private TinhNangService service;

    @GetMapping
    public ResponseEntity<List<TinhNang>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }
}
```

#### Bước 5: Tạo Frontend (HTML/CSS/JS)

```html
<!-- src/main/resources/static/customer/tinh-nang.html -->
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Tính năng</title>
    <link rel="stylesheet" href="/css/kieu.css" />
  </head>
  <body>
    <header class="customer-header">
      <!-- Header content -->
    </header>

    <main class="customer-content">
      <h1>Tính năng</h1>
      <div id="list"></div>
    </main>

    <script src="/js/xacthuc.js"></script>
    <script>
      fetch("/api/tinh-nang")
        .then((r) => r.json())
        .then((data) => {
          // Render data
        });
    </script>
  </body>
</html>
```

### Quy ước mã

- **Naming**: Sử dụng tiếng Việt cho biến, hàm (dễ hiểu trong team VN)
- **Backend**: Theo chuẩn Clean Code (MVC layer)
- **Frontend**: Vanilla JS (không framework nặng)
- **CSS**: Modular, sử dụng CSS variables

### Cơ sở dữ liệu

- Hibernate sẽ tự tạo bảng từ Entities
- Có thể viết `schema.sql` nếu cần khởi tạo dữ liệu
- Sử dụng migration tool là tùy chọn

---

## 🐛 Xử lý lỗi phổ biến

| Lỗi                    | Nguyên nhân                           | Giải pháp                       |
| ---------------------- | ------------------------------------- | ------------------------------- |
| `Connection refused`   | MySQL chưa chạy                       | Khởi động MySQL service         |
| `Access Denied`        | Sai username/password DB              | Kiểm tra application.properties |
| `404 Not Found`        | URL sai hoặc controller không tồn tại | Kiểm tra @RequestMapping        |
| `CORS error`           | Frontend khác domain                  | Bật CorsConfig trong Spring     |
| `NullPointerException` | Đối tượng null                        | Thêm null check hoặc @Nullable  |

---

## 📚 Tài liệu thêm

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Spring Data JPA](https://spring.io/projects/spring-data-jpa)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [MDN Web Docs (HTML/CSS/JS)](https://developer.mozilla.org/)

---

## 👨‍💻 Đóng góp

Để đóng góp vào dự án:

1. Fork dự án
2. Tạo branch feature (`git checkout -b feature/AmazingFeature`)
3. Commit thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. Push lên branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

---

## 📄 License

Dự án này sử dụng license **MIT**. Xem file [LICENSE](LICENSE) để biết chi tiết.

---

## 📞 Liên hệ hỗ trợ

- **Email**: support@ttcare.vn
- **Hotline**: 1900 1234
- **Website**: https://www.ttcare.vn

---

**Cập nhật lần cuối**: 17 tháng 4, 2026
**Phiên bản**: 1.0.0

- Trang chu landing: `http://localhost:8080/trangchu.html`

- Dang nhap / dang ky: `http://localhost:8080/admin/dangnhap.html`
- Sau khi dang nhap voi vai tro customer: `http://localhost:8080/customer/trangchu.html`
- Dashboard admin: `http://localhost:8080/admin/trangquantri.html`

## 5. Goi y noi dung bao cao do an

Khi viet bao cao cho de tai "Xay dung website quan ly dat lich kham – Benh vien A Thai Nguyen", co the trinh bay cac muc chinh sau:

1. **Mo dau**:
   - Ly do chon de tai: nhu cau dat lich online, giam un tac, tang trai nghiem benh nhan.
2. **Phan tich yeu cau**:
   - Doi voi khach hang: dang ky tai khoan, dang nhap, dat lich, xem lich, xem lich su.
   - Doi voi admin / le tan: xem danh sach lich, xac nhan / huy lich, quan ly thong tin bac si, chuyen khoa, dich vu.
3. **Thiet ke giao dien**:
   - Mo ta cac man hinh chinh duoc liet ke o muc 2 (kem hinh chup man hinh).
   - Chu y trinh bay ro layout: header, sidebar, cac khu vuc card, bang, form.
4. **Thiet ke he thong**:
   - Mo ta ngan ve phan backend (controller, entity, repository neu co).
5. **Danh gia va huong phat trien**:
   - Uu diem: giao dien hien dai, ro rang, phan tach khach hang / admin.
   - Huong mo rong: tich hop co so du lieu that, he thong xac thuc, gui email / SMS nhac lich, bieu do thong ke thuc te.

Tai lieu nay co the dung lam co so de ban tiep tuc hoan thien chuc nang back end va mo rong giao dien theo nhu cau.

# Java Web Project

Dự án web Java sử dụng Spring Boot framework.

## Yêu cầu hệ thống

- Java JDK 17 hoặc cao hơn
- Maven 3.6+ (hoặc sử dụng Maven Wrapper)

## Cài đặt và chạy

### 1. Cài đặt dependencies

```bash
mvn clean install
```

### 2. Chạy ứng dụng

```bash
mvn spring-boot:run
```

Hoặc chạy trực tiếp class `WebApplication.java`

### 3. Truy cập ứng dụng

Sau khi ứng dụng khởi động, truy cập:

- API Home: http://localhost:8080/api/
- API Hello: http://localhost:8080/api/hello

## Cấu trúc dự án

```
java-web-project/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/example/webapp/
│   │   │       ├── WebApplication.java      # Main class
│   │   │       └── controller/
│   │   │           └── HomeController.java  # REST Controller
│   │   └── resources/
│   │       └── application.properties       # Cấu hình ứng dụng
│   └── test/                                 # Test files
├── pom.xml                                   # Maven configuration
└── README.md
```

## API Endpoints

- `GET /api/` - Trang chủ API
- `GET /api/hello` - Lời chào từ server

## Phát triển tiếp

Bạn có thể thêm:

- Database (JPA/Hibernate)
- Security (Spring Security)
- Thymeleaf cho frontend
- REST API endpoints mới
- Service layer
- Repository layer

## Tài liệu tham khảo

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- # [Spring Web MVC](https://docs.spring.io/spring-framework/reference/web/webmvc.html)

# BOOKING HOPITAL
