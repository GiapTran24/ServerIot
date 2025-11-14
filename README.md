# ServerIoT

ServerIoT là một dự án mẫu cho hệ thống thu thập dữ liệu cảm biến từ ESP32, lưu trữ vào MySQL và cung cấp API REST cho giao diện web/dashboard.

**Yêu cầu**
- Node.js (khuyến nghị >= 16)
- npm
- MySQL server
- Arduino IDE (hoặc PlatformIO) để nạp `CodeESP32.ino` lên ESP32

**Nội dung chính của kho**
- `server.js`: server Express chính (API endpoints)
- `db.js`: cấu hình kết nối MySQL
- `routes/`, `controllers/`, `models/`: mã xử lý API và logic
- `public/`: giao diện web tĩnh (dashboard)
- `CodeESP32.ino`: mã mẫu cho ESP32 (gửi dữ liệu và kiểm tra trạng thái thiết bị)
- `query.sql`: tập lệnh SQL để tạo các bảng mẫu

**Cài đặt**
1. Clone repo:

```powershell
git clone https://github.com/GiapTran24/ServerIot.git
cd ServerIot
```

2. Cài đặt dependencies:

```powershell
npm install
```

3. Tạo file cấu hình môi trường `.env` (tạo thủ công hoặc copy từ ví dụ):

Tạo file ` .env ` trong thư mục gốc với các biến sau:

```
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password
DB_NAME=serveriot
DB_PORT=3306
PORT=5000
JWT_SECRET=your_jwt_secret
```

Trên Windows PowerShell bạn có thể copy từ file mẫu (nếu thêm `.env.example`):

```powershell
Copy-Item .env.example .env
```

**Thiết lập cơ sở dữ liệu**
1. Tạo database và import schema (dùng MySQL client hoặc MySQL Workbench):

```powershell
mysql -u root -p < query.sql
```

2. Hoặc đăng nhập vào MySQL và chạy nội dung `query.sql`.

**Chạy server**
- Chạy trực tiếp:

```powershell
node server.js
```

- (Tùy chọn) Thêm script `start` vào `package.json` để dùng `npm start`:

```json
"scripts": {
  "start": "node server.js",
  "test": "echo \"Error: no test specified\" && exit 1"
}
```

Sau đó chạy:

```powershell
npm start
```

Server mặc định lắng nghe cổng trong biến `PORT` (mặc định 3000 nếu không set). Kiểm tra log console để biết cổng đang chạy.

**Cấu hình và nạp firmware ESP32**
- Mở `CodeESP32.ino` trong Arduino IDE (hoặc PlatformIO).
- Cập nhật WiFi:
  - `ssid` và `password` — thay bằng SSID/mật khẩu mạng của bạn.
- Cập nhật đường dẫn server (API):
  - `serverName` trong file ESP32: thay `http://192.168.1.198:5000` bằng `http://<SERVER_IP>:<PORT>` (ví dụ `http://192.168.1.100:5000`).
- Cập `DEVICE_ID` và `DEVICE_NAME` nếu cần.
- Nạp vào bo ESP32.

Lưu ý: ESP32 gửi dữ liệu tới endpoint `/api/sensordata` và truy vấn trạng thái thiết bị từ `/api/devices/{id}` — đảm bảo server đang chạy và các routes này tồn tại.

**Các biến môi trường quan trọng**
- `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`, `DB_PORT` — cấu hình MySQL
- `PORT` — cổng HTTP server
- `JWT_SECRET` — khóa bí mật để ký JWT cho auth

**Endpoints chính (ví dụ)**
- `POST /api/auth/register` — đăng ký
- `POST /api/auth/login` — đăng nhập (trả token JWT)
- `GET /api/devices/:id` — lấy trạng thái thiết bị
- `POST /api/sensordata` — ESP32 gửi dữ liệu cảm biến

(Tham khảo chi tiết trong thư mục `routes/` và `controllers/`)

**Gợi ý phát triển**
- Thêm script khởi động trong `package.json` như trên.
- Thêm file `.env.example` vào repo để người khác biết phải khai báo biến nào.
- Bảo mật: không commit file `.env` chứa mật khẩu thật.

**Gỡ lỗi**
- Nếu server không kết nối đến MySQL, kiểm tra `DB_*` trong `.env` và cho phép kết nối từ host
- Nếu ESP32 không gửi dữ liệu: kiểm tra `serverName`, WiFi connection logs, và endpoint đúng

**Đóng góp**
- Mọi PR và issue đều hoan nghênh. Vui lòng mô tả rõ bước tái tạo lỗi và môi trường.

**License**
- Mặc định: ISC (theo `package.json`).

---