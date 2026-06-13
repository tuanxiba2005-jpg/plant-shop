# CHƯƠNG 3 — CÀI ĐẶT, ĐÁNH GIÁ VÀ KẾT LUẬN

Chương này trình bày việc triển khai giải pháp đã thiết kế ở Chương 2 thành một website hoàn thiện (hệ thống Website bán cây cảnh – Plant Shop), gồm: yêu cầu cài đặt, kết quả lập trình & tích hợp hệ thống, và thử nghiệm – đánh giá – kết luận. Hệ thống chạy trên nền tảng Node.js / Express.js, kết hợp template engine EJS và sử dụng cơ sở dữ liệu MongoDB (Mongoose ODM).

## 3.1 Cài đặt, yêu cầu trang thiết bị và phần mềm hệ thống

### 3.1.1 Yêu cầu phần cứng (tối thiểu)
| Thành phần | Yêu cầu tối thiểu | Khuyến nghị |
| :--- | :--- | :--- |
| **CPU** | 2 nhân (Intel i3 / tương đương) | 4 nhân trở lên |
| **RAM** | 4 GB | 8 GB trở lên |
| **Ổ cứng** | 2 GB trống (mã nguồn + MongoDB + tệp upload) | SSD 10 GB trở lên |
| **Mạng** | Kết nối Internet (tải thư viện npm, gửi email, tích hợp thanh toán) | Băng thông ổn định |

### 3.1.2 Yêu cầu phần mềm
| Phần mềm | Phiên bản | Vai trò |
| :--- | :--- | :--- |
| **Node.js** | ≥ v18.0.0 | Môi trường chạy backend JavaScript |
| **npm** | Đi kèm Node.js | Quản lý thư viện (package) |
| **MongoDB** | ≥ 5.0 (Community/Atlas) | Cơ sở dữ liệu NoSQL lưu trữ dữ liệu |
| **Trình duyệt web** | Chrome/Edge/Firefox bản mới | Truy cập và tương tác với giao diện website |
| **VS Code (tùy chọn)**| Bản mới | Soạn thảo và gỡ lỗi mã nguồn |

### 3.1.3 Thư viện (dependencies) chính
| Thư viện | Chức năng |
| :--- | :--- |
| **express** | Framework web chính, định tuyến Controller |
| **ejs** | Template engine để render giao diện server-side (SSR) |
| **mongoose** | ODM kết nối, thao tác & mô hình hóa MongoDB |
| **bcryptjs / passport** | Mã hóa mật khẩu và xác thực người dùng (kể cả Google/Facebook Login) |
| **socket.io** | Hỗ trợ tính năng Chat trực tuyến và thông báo theo thời gian thực |
| **multer / sharp** | Xử lý upload tệp hình ảnh và tối ưu kích thước ảnh |
| **nodemailer** | Gửi email thông báo, xác nhận đơn hàng |
| **dotenv** | Nạp cấu hình biến môi trường từ tệp `.env` |

### 3.1.4 Cấu hình biến môi trường (.env)
Hệ thống sử dụng các cấu hình môi trường bảo mật, một mẫu cấu hình điển hình:
```env
# Database
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.../plant_shop

# Session
SESSION_SECRET=<chuỗi_bí_mật_ngẫu_nhiên>

# Cổng khởi chạy 
PORT=3000

# Email cấu hình để gửi thông báo
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=Plant Shop <your_email@gmail.com>

# Cổng thanh toán (VNPAY / MOMO)
VNPAY_TMN_CODE=...
MOMO_PARTNER_CODE=...

# Xác thực Social
GOOGLE_CLIENT_ID=...
FACEBOOK_APP_ID=...
```

### 3.1.5 Các bước cài đặt & khởi chạy
1. Cài đặt Node.js (≥ v18) và cấu hình MongoDB (có thể dùng bản Local hoặc Atlas).
2. Tải mã nguồn về máy và mở thư mục dự án.
3. Cài đặt các thư viện phụ thuộc bằng lệnh: `npm install`
4. Tạo tệp `.env` dựa trên `.env.example` và điền các thông tin kết nối cơ sở dữ liệu, API key.
5. Seed dữ liệu khởi tạo (nếu có): `npm run seed`
6. Khởi chạy dự án:
   - Môi trường phát triển: `npm run dev` (sử dụng nodemon tự khởi động lại).
   - Môi trường chạy thật: `npm start`.
7. Truy cập vào địa chỉ `http://localhost:3000` trên trình duyệt để sử dụng.

---

## 3.2 Lập trình, tích hợp hệ thống

### 3.2.1 Kết quả lập trình
Hệ thống được lập trình theo mô hình MVC (Model - View - Controller), Server-side Rendering với EJS, hoàn thiện các phân hệ cốt lõi để quản lý bán cây cảnh:

| Phân hệ | Controller | Chức năng đã hoàn thiện |
| :--- | :--- | :--- |
| **Tài khoản & Auth** | `UserController` | Đăng ký, đăng nhập (Local, Google, Facebook), quản lý hồ sơ, địa chỉ, wishlist. |
| **Sản phẩm & Danh mục** | `ProductController` | Hiển thị sản phẩm, danh mục cây cảnh, tìm kiếm, lọc, đánh giá (`Review`). |
| **Giỏ hàng & Đơn hàng** | `CartController`, `OrderController` | Thêm vào giỏ, áp dụng mã giảm giá (`Coupon`), checkout thanh toán VNPay/MoMo, theo dõi đơn hàng. |
| **Giao tiếp & Nội dung** | `ChatController`, `BlogController` | Nhắn tin trực tuyến hỗ trợ khách hàng, xem các bài viết/kiến thức chăm sóc cây. |
| **Thông báo** | `NotificationController`, `Newsletter` | Nhận bản tin, thông báo hệ thống tự động cho người dùng. |
| **Quản trị & Nhân sự** | `AdminController`, `StaffController` | Dashboard thống kê doanh thu, quản lý sản phẩm, duyệt đơn hàng, phân quyền nhân sự quản trị. |

*(Bạn chèn các hình ảnh minh họa giao diện thực tế của dự án vào đây theo thứ tự như mẫu)*
- Hình 3.1. Trang chủ cửa hàng cây cảnh
- Hình 3.2. Trang danh sách sản phẩm / Tìm kiếm
- Hình 3.3. Trang chi tiết sản phẩm
- Hình 3.4. Giỏ hàng và tính năng áp mã giảm giá
- Hình 3.5. Chức năng thanh toán và lịch sử đơn hàng
- Hình 3.6. Trang Blog (Kiến thức chăm sóc cây)
- Hình 3.7. Trang quản lý hồ sơ người dùng
- Hình 3.8. Trang Dashboard dành cho Admin (Thống kê)
- Hình 3.9. Giao diện Chat trực tuyến (Socket.io)
- Hình 3.10. Trang quản lý đơn hàng bên phía Admin

### 3.2.2 Xây dựng cơ sở dữ liệu
CSDL MongoDB được thiết kế chuẩn hóa và liên kết qua tham chiếu `ObjectId`, bao gồm 14 collection chính được định nghĩa qua schema Mongoose:
- **User / Address**: Thông tin tài khoản người dùng, vai trò phân quyền và sổ địa chỉ giao hàng.
- **Product / Category / Review**: Thông tin mặt hàng cây cảnh, phân loại và các đánh giá từ khách hàng.
- **Order / Cart / Coupon**: Quản lý giỏ hàng tạm, mã giảm giá và lưu trữ toàn bộ lịch sử các đơn đặt hàng (thanh toán).
- **Article**: Lưu trữ bài viết blog tư vấn chăm sóc cây.
- **Message / Notification**: Lưu tin nhắn chat (qua socket) và thông báo hệ thống.

### 3.2.3 Tích hợp hệ thống
Luồng tích hợp của hệ thống được thiết kế theo **Kiến trúc Dịch vụ (Service Pattern)** nhằm nâng cấp mô hình MVC cơ bản. Các logic nghiệp vụ xử lý dữ liệu phức tạp được bóc tách ra khỏi Controller và gom vào tầng `services` (như `emailService.js`, `paymentService.js`), giúp mã nguồn chuẩn hóa, dễ bảo trì và mở rộng.
Luồng xử lý chạy qua các tầng: Client (trình duyệt) → Routes → Middleware → Controller ↔ Services → Models → MongoDB → View (EJS) → Client.

**Các điểm tích hợp kỹ thuật nổi bật:**
- **Middleware đa tầng**: Xử lý phiên làm việc (`express-session`), xác thực người dùng (`passport`), kiểm tra phân quyền (RBAC cho Admin/Staff), và upload tối ưu ảnh với `multer` kết hợp thư viện `sharp`.
- **Hệ thống tự động hóa Email (Email Automation)**: Ứng dụng thư viện `Nodemailer` thực hiện luồng gửi email tự động: Gửi link xác thực khi tạo tài khoản (Verify Email), cho phép lấy lại mật khẩu an toàn (Reset Password với JWT token hết hạn trong 15 phút), và gửi bảng kê hóa đơn điện tử ngay sau khi đặt hàng thành công.
- **Thanh toán bảo mật chuẩn Webhook/IPN**: Việc tích hợp cổng VNPay/MoMo được thực hiện qua tầng `paymentService`. Nhờ áp dụng chuẩn nhận thông báo Webhook server-to-server (IPN - Instant Payment Notification), ứng dụng loại trừ hoàn toàn các rủi ro khách hàng giả mạo URL hoặc dùng công cụ developer tools để qua mặt quá trình thanh toán.
- **Tích hợp Real-time**: Sử dụng `Socket.io` trong `ChatController` cho phép khách hàng trò chuyện trực tiếp với nhân viên cửa hàng mà không cần tải lại trang.
- **Xác thực Social**: Tích hợp `passport-google-oauth20` và `passport-facebook` giúp khách hàng đăng nhập nhanh không cần tạo mật khẩu thủ công.
- **Tự động hóa (Cron Jobs)**: Hệ thống chạy ngầm các tác vụ tự động (`orderCron.js`), tiêu biểu là việc tự động kiểm tra và hủy các đơn hàng chưa thanh toán VNPAY/MoMo sau 15 phút, đồng thời hoàn lại chính xác số lượng tồn kho của sản phẩm mà không cần ban quản trị thao tác thủ công.
- **Progressive Web App (PWA)**: Website được trang bị Service Worker (`sw.js`) và Web App Manifest (`manifest.json`), cho phép lưu trữ đệm (cache) giao diện để tăng tốc độ tải, hỗ trợ trải nghiệm khi mất kết nối mạng (offline fallback) và cho phép người dùng "Cài đặt" website như một ứng dụng độc lập trên màn hình chính điện thoại/máy tính.
- **Bảo mật chuyên sâu (Security Middlewares)**: Tích hợp `helmet` bảo vệ các HTTP headers, `express-rate-limit` chống tấn công từ chối dịch vụ (DDoS) hoặc spam requests, `xss-clean` ngăn chặn mã độc XSS và `express-mongo-sanitize` ngăn chặn các truy vấn nội suy NoSQL Injection.

### 3.2.4 Chức năng quản lý dữ liệu: Thêm – Sửa – Xóa – Tìm kiếm
Hệ thống xử lý đầy đủ các thao tác CRUD dành cho quản trị. Ví dụ với phân hệ Sản phẩm cây cảnh (`Product`):
- **Thêm mới (Create)**: Quản trị viên nhập thông tin sản phẩm, upload hình ảnh (xử lý resize qua sharp).
- **Cập nhật (Update)**: Chỉnh sửa giá bán, tồn kho, trạng thái (còn hàng/hết hàng).
- **Xóa (Delete)**: Chuyển sang chế độ ẩn (Soft delete) hoặc xóa cứng khỏi database.
- **Tìm kiếm (Search/Filter)**: Tích hợp công cụ tìm kiếm theo tên cây (sử dụng biểu thức chính quy regex) và lọc theo danh mục, khoảng giá tại `ProductController`.

*(Chèn các Hình 3.11, 3.12, 3.13... cho form Thêm, Sửa sản phẩm, Tìm kiếm...)*

### 3.2.5 Báo cáo thống kê
Hệ thống sử dụng sức mạnh của MongoDB Aggregation Pipeline trong `AdminController` để xuất biểu đồ thống kê đơn hàng và doanh thu tại giao diện Dashboard:

| Báo cáo | Ý nghĩa | Toán tử MongoDB sử dụng |
| :--- | :--- | :--- |
| **Tổng doanh thu** | Tổng giá trị của các đơn hàng thành công | `$sum` |
| **Tổng số đơn hàng** | Đếm lượng đơn hàng trong hệ thống | `$sum: 1` hoặc `.countDocuments()` |
| **Doanh thu theo tháng** | Nhóm doanh thu dựa vào ngày tạo đơn hàng | `$group`, `$month`, `$year` |
| **Sản phẩm bán chạy** | Lọc và đếm số lượng bán ra của từng mặt hàng | `$unwind`, `$group`, `$sort` |

Ví dụ truy vấn tổng hợp nhóm doanh thu đơn hàng theo tháng:
```javascript
Order.aggregate([
  { $match: { status: 'completed' } }, // Chỉ tính các đơn đã hoàn thành
  {
    $group: {
      _id: {
        thang: { $month: "$createdAt" },
        nam: { $year: "$createdAt" }
      },
      tongDoanhThu: { $sum: "$totalAmount" },
      soDonHang: { $sum: 1 }
    }
  },
  { $sort: { "_id.nam": 1, "_id.thang": 1 } }
]);
```

Các số liệu này được render thẳng vào view `dashboard.ejs` kết hợp với thư viện vẽ biểu đồ ở phía client để tạo ra các báo cáo trực quan cho ban quản trị.

---

## 3.3 Thử nghiệm, đánh giá hệ thống, kết luận

### 3.3.1 Phương pháp thử nghiệm
- **Kiểm thử chức năng (Functional testing)**: Trải nghiệm luồng thao tác của khách hàng từ việc tìm sản phẩm → thêm giỏ hàng → thanh toán.
- **Kiểm thử tích hợp bên thứ ba**: Kiểm tra luồng gửi mail xác nhận đơn bằng `nodemailer` và luồng redirect đến cổng VNPAY/MoMo.
- **Kiểm thử thời gian thực**: Mở 2 trình duyệt đóng vai trò khách và nhân viên để kiểm tra tính ổn định của tính năng chat qua `Socket.io`.
- **Kiểm thử phân quyền**: Xác thực ranh giới bảo mật giữa User thường, Staff và Admin.

### 3.3.2 Một số ca kiểm thử tiêu biểu
| Mã | Tình huống kiểm thử | Kết quả mong đợi | Kết quả |
| :--- | :--- | :--- | :--- |
| TC01 | Đăng nhập bằng Google Account | Hệ thống tự tạo tài khoản và gán session hợp lệ | ✓ Đạt |
| TC02 | Thêm sản phẩm vượt quá tồn kho | Giao diện cảnh báo giới hạn kho, vô hiệu hóa nút thêm | ✓ Đạt |
| TC03 | Hoàn tất đơn hàng thanh toán VNPay | Cập nhật đơn thành công, gửi email hóa đơn | ✓ Đạt |
| TC04 | User thường cố truy cập `/admin` | Middleware đẩy về lỗi 403 Forbidden hoặc chuyển hướng | ✓ Đạt |
| TC05 | Staff cập nhật trạng thái đơn hàng | Đơn hàng đổi trạng thái, có tạo Activity/Notification | ✓ Đạt |
| TC06 | Nhắn tin hỗ trợ qua Chat Widget | Nhân viên nhận được tin nhắn tức thì (realtime) | ✓ Đạt |
| TC07 | Khách hàng không thanh toán VNPAY sau 15p | Cron job tự động hủy đơn và cộng lại số lượng tồn kho | ✓ Đạt |
| TC08 | Ngắt kết nối mạng và duyệt web (PWA) | Service Worker tự động trả về giao diện từ Cache (Offline) | ✓ Đạt |

### 3.3.3 Đánh giá hệ thống
**Ưu điểm:**
- Giao diện thân thiện, sử dụng template engine EJS hỗ trợ tốt cho SEO – yếu tố quan trọng đối với website thương mại điện tử.
- Các phân hệ phục vụ thương mại điện tử rất đa dạng và hoàn thiện. Đặc biệt, hệ thống được thiết kế hướng tới việc giữ chân khách hàng (Customer Retention) nhờ các module: Mã khuyến mãi (Coupon), Lưu trữ sản phẩm yêu thích (Wishlist), Đăng ký nhận bản tin (Newsletter) và Đánh giá người dùng (Review).
- Cửa hàng có tính tương tác cực kỳ cao nhờ vận hành song song tính năng Real-time Chat (nhắn tin trực tuyến thời gian thực) và các luồng tự động hóa tương tác qua Email.
- Hoạt động tự động hóa tốt thông qua cơ chế Cron Jobs (xử lý đơn hàng quá hạn) giúp tối ưu lượng hàng tồn kho và giảm tải công việc cho quản trị viên.
- Hỗ trợ tốt trên nền tảng di động thông qua công nghệ PWA, nâng cao trải nghiệm người dùng ngay cả khi đường truyền mạng yếu.
- Cơ sở dữ liệu và cấu trúc dự án rõ ràng, bảo vệ an ninh ứng dụng toàn diện với `helmet`, `express-rate-limit`, `xss-clean`, `express-mongo-sanitize` và mã hóa dữ liệu nhạy cảm.

**Hạn chế:**
- Do sử dụng Server-side Rendering thuần, tốc độ chuyển trang sẽ không mượt mà như các ứng dụng SPA (Single Page Application) dùng React/Vue.
- Việc lưu file ảnh cục bộ trên máy chủ có thể làm chậm server khi dữ liệu lớn, cần tối ưu bằng dịch vụ cloud.

### 3.3.4 Hướng phát triển
- Tích hợp thêm các bộ nhớ đệm (như Redis) để tối ưu thời gian tải cho các sản phẩm/trang đích có lượng truy cập cao.
- Triển khai lưu trữ hình ảnh lên Cloud Storage (Amazon S3 hoặc Cloudinary).
- Chuyển đổi kiến trúc sang dạng cung cấp API thuần túy (RESTful) kết hợp với các Frontend Framework hiện đại, chuẩn bị nền tảng phát triển ứng dụng di động cho khách hàng mua cây.

### 3.3.5 Kết luận
Đề tài đã triển khai thành công một website thương mại điện tử bán cây cảnh hoàn chỉnh, đáp ứng trọn vẹn yêu cầu nghiệp vụ: từ quy trình mua sắm của khách hàng, tích hợp thanh toán trực tuyến, chăm sóc khách hàng tự động, cho đến các luồng thống kê - kiểm duyệt của quản trị viên. Việc ứng dụng Node.js kết hợp MongoDB đã chứng minh được tính linh hoạt, hiệu suất cao của hệ thống. Đây là một kết quả hoàn thiện, đủ tiêu chuẩn làm nền tảng có thể được ứng dụng vào hoạt động kinh doanh thực tế.

**Tài liệu tham khảo (Cập nhật)**
1. Node.js Documentation. https://nodejs.org/docs
2. Express.js — Framework for Node.js. https://expressjs.com
3. Mongoose ODM Documentation. https://mongoosejs.com/docs
4. Passport.js - Simple, unobtrusive authentication. https://www.passportjs.org/
5. Socket.IO - Bidirectional and low-latency communication. https://socket.io/
6. EJS - Embedded JavaScript templating. https://ejs.co/
7. Multer & Sharp - Xử lý tệp tin và hình ảnh trong Node.js.
