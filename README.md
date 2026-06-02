# Plant Shop

Plant Shop là một ứng dụng web thương mại điện tử chuyên cung cấp các loại cây cảnh. Dự án được xây dựng với kiến trúc MVC (Model-View-Controller) giúp dễ dàng mở rộng và bảo trì, cung cấp đầy đủ các tính năng cho người dùng mua sắm, nhân viên xử lý đơn hàng và quản trị viên quản lý toàn bộ hệ thống.

## 🚀 Công nghệ sử dụng

- **Backend:** Node.js, Express.js
- **Cơ sở dữ liệu:** MongoDB (Mongoose)
- **View Engine:** EJS
- **Quản lý Session:** express-session & connect-mongo
- **Bảo mật:** helmet (bảo vệ headers), bcryptjs (mã hóa mật khẩu), express-rate-limit (chống spam/brute-force)
- **Tiện ích khác:** multer (upload file), nodemailer (gửi email thông báo/quên mật khẩu)

## ✨ Các chức năng chính

### Dành cho Khách hàng (User)
- Đăng ký, đăng nhập an toàn.
- Quản lý hồ sơ cá nhân và sổ địa chỉ giao hàng.
- Quên mật khẩu / Lấy lại mật khẩu qua Email.
- Xem danh sách sản phẩm, lọc theo danh mục, xem chi tiết sản phẩm.
- Thêm sản phẩm vào giỏ hàng, quản lý giỏ hàng (lưu qua Session).
- Thanh toán đơn hàng và theo dõi lịch sử mua hàng.

### Dành cho Quản trị viên (Admin)
- Bảng điều khiển (Dashboard) thống kê doanh thu.
- Quản lý Tài khoản (Thêm, Sửa, Xóa, Cấp quyền Admin/Staff/User).
- Quản lý Danh mục (Thêm, Sửa, Xóa).
- Quản lý Sản phẩm (Thêm, Sửa, Xóa, Upload hình ảnh).
- Quản lý Đơn hàng của toàn hệ thống.

### Dành cho Nhân viên (Staff)
- Quản lý các đơn hàng được giao.
- Cập nhật trạng thái đơn hàng (Đang xử lý, Đã giao, Đã hủy, v.v.).

## ⚙️ Yêu cầu hệ thống

- [Node.js](https://nodejs.org/) (Phiên bản 18+ khuyến nghị)
- [MongoDB](https://www.mongodb.com/) (Chạy local hoặc sử dụng MongoDB Atlas)

## 🛠️ Hướng dẫn cài đặt và chạy dự án

1. **Clone dự án (nếu có dùng git):**
   ```bash
   git clone <repo-url>
   cd plant-shop
   ```

2. **Cài đặt các thư viện (Dependencies):**
   ```bash
   npm install
   ```

3. **Thiết lập biến môi trường:**
   Đảm bảo bạn có file `.env` tại thư mục gốc của dự án với các thông số tương tự như sau:
   ```env
   MONGODB_URI=mongodb://localhost:27017/plant_shop
   SESSION_SECRET=your_secret_key_here
   PORT=3000
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   EMAIL_FROM=Plant Shop <your_email@gmail.com>
   ```

4. **Khởi tạo dữ liệu mẫu (Seed Database):**
   Nếu bạn muốn tạo dữ liệu Admin, Danh mục và Sản phẩm mẫu để test:
   ```bash
   npm run seed
   ```
   *Tài khoản Admin mặc định sau khi seed: `admin@plantshop.com` / `password`*

5. **Khởi chạy ứng dụng:**
   - Môi trường phát triển (tự động reload khi có thay đổi code):
     ```bash
     npm run dev
     ```
   - Môi trường thực tế (production):
     ```bash
     npm start
     ```

6. **Truy cập:**
   Mở trình duyệt và truy cập vào địa chỉ: [http://localhost:3000](http://localhost:3000)

## 📁 Cấu trúc thư mục chính

```text
plant-shop/
├── database/      # Chứa các script seed data và sơ đồ usecase
├── public/        # Chứa file tĩnh: CSS, JavaScript client-side, Hình ảnh
├── src/
│   ├── config/    # Cấu hình kết nối Database
│   ├── controllers/# Xử lý logic của ứng dụng
│   ├── middlewares/# Các middleware xử lý phân quyền, upload file, bảo mật
│   ├── models/    # Định nghĩa cấu trúc Schema MongoDB (Mongoose)
│   ├── routes/    # Định nghĩa các API, Route điều hướng
│   └── views/     # Chứa các file giao diện EJS (layouts, admin, user, etc.)
├── app.js         # File entry khởi chạy server
└── package.json   # Quản lý thư viện và scripts
```
