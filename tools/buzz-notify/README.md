# 🐝 Buzz Notifier cho Windows

> **Tự động nhận thông báo khi có tin nhắn hoặc người nhắc tên (@mention) trên Buzz (`buzz.xyz`), tự chạy ngầm cùng Windows.**

---

## ⚡ 1 Phút Cài Đặt (Không Cần Cài Thêm Gì)

Bạn không cần biết lập trình hay gõ lệnh, chỉ cần làm đúng **3 bước** sau:

### Bước 1: Tải file
Tải file **`buzz-notify.exe`** (trong thư mục `dist/`) về máy tính của bạn.

### Bước 2: Bấm đúp chuột để mở
Bấm đúp chuột vào file `buzz-notify.exe`, một cửa sổ nhỏ sẽ hiện lên:

1. **Relay WebSocket URL:** Dán địa chỉ server Buzz của bạn (ví dụ: `wss://communities.buzz.xyz` hoặc đường dẫn nhóm của bạn).
2. **Private Key:** Dán mã khóa tài khoản của bạn (bắt đầu bằng `nsec1...` hoặc 64 ký tự hex).
   - *Có thể bấm vào ô "Hiện khóa" để kiểm tra xem đã dán đúng chưa.*
3. **Bật âm thanh:** Tích chọn nếu muốn nghe chuông khi có thông báo mới.

### Bước 3: Bấm "Lưu & Kích hoạt chạy ngầm"
Bấm nút màu xanh **"Lưu & Kích hoạt chạy ngầm"**:
- Tool sẽ kiểm tra kết nối, lưu cấu hình và tự động cài đặt vào hệ thống Windows.
- Một popup thông báo góc màn hình sẽ hiện lên báo thành công.
- Cửa sổ tự động đóng lại.

🎉 **Xong!** Từ giờ trở đi:
- Mỗi khi có người nhắn tin hoặc nhắc tên bạn trên Buzz, góc phải màn hình máy tính sẽ tự hiện thông báo.
- Bấm vào thông báo sẽ mở ngay trang Buzz trên trình duyệt.
- Tool sẽ **tự động chạy ngầm mỗi khi bạn bật máy tính**, không cần mở lại thủ công.

---

## 🔄 Cách Đổi Tài Khoản / Kiểm Tra Lại

Nếu sau này bạn muốn đổi tài khoản hoặc thử nghiệm thông báo:

👉 **Chỉ cần bấm đúp chuột vào `buzz-notify.exe` một lần nữa:**
- Một bảng quản lý sẽ hiện ra với các lựa chọn:
  - **Bắn thử thông báo (Test):** Bấm vào để nghe chuông và xem thông báo mẫu góc màn hình.
  - **Cấu hình lại:** Bấm vào để đổi link server hoặc đổi mã khóa tài khoản khác.
  - **Khởi động lại dịch vụ:** Bật lại tiến trình nếu mạng bị lỗi.
  - **Đóng:** Tắt cửa sổ quản lý (tool vẫn âm thầm chạy ngầm).

---

## 💡 Ưu Điểm Nổi Bật

- **Cực nhẹ:** Chỉ 1 file duy nhất ~11MB, tốn rất ít RAM (~10MB), không làm chậm máy.
- **Không nháy màn hình đen:** Được viết chuyên dụng cho Windows, mở lên là hiện giao diện đẹp, không có bảng đen CMD khó chịu.
- **Không sợ mất file:** Tool tự động bảo vệ đường dẫn hệ thống, dù bạn có vô tình xóa file trong thư mục Downloads thì thông báo vẫn chạy bình thường.

---

*(Dành cho lập trình viên: Nếu bạn muốn chạy bằng dòng lệnh CMD/PowerShell, tool vẫn hỗ trợ đầy đủ các lệnh: `buzz-notify.exe --help`, `buzz-notify.exe status`, `buzz-notify.exe run`).*
