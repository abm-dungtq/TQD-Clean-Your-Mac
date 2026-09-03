# 🛡️ TQD-Clean Your Mac

<div align="center">

![TQD-Clean Logo](assets/AppIcon.icns)

### Hệ Thống Dọn Dẹp & Tối Ưu Hóa macOS Toàn Diện Với Giao Diện Tiếng Việt Phong Cách Cyber-HUD

[![macOS](https://img.shields.io/badge/macOS-12.0+-black?style=for-the-badge&logo=apple)](https://www.apple.com/macos/)
[![Engine](https://img.shields.io/badge/Engine-tw93%2Fmole-00f2ff?style=for-the-badge)](https://github.com/tw93/mole)
[![Design](https://img.shields.io/badge/Design-Cyber--HUD-bc13fe?style=for-the-badge)](https://stitch.withgoogle.com)
[![Status](https://img.shields.io/badge/Status-Zero--Terminal-00ff9f?style=for-the-badge)](https://github.com/abm-dungtq/TQD-Clean-Your-Mac)
[![License](https://img.shields.io/badge/License-GPL--3.0-orange?style=for-the-badge)](LICENSE)

**Tác giả:** TQD • **Hotline / Zalo:** [0976.202.028](tel:0976202028)

</div>

---

## 🌟 Giới Thiệu

**TQD-Clean Your Mac** là phần mềm tối ưu hóa, làm sạch và giám sát hệ thống dành riêng cho người dùng máy tính Apple Mac. Dự án kế thừa trọn vẹn sức mạnh từ bộ công cụ dọn dẹp mã nguồn mở nổi tiếng **Mole** ([`tw93/mole`](https://github.com/tw93/mole)), kết hợp cùng giao diện máy tính độc lập phong cách **Cyber-Glassmorphism HUD** hiện đại, 100% tiếng Việt, giúp người dùng phổ thông không cần am hiểu dòng lệnh vẫn có thể chăm sóc máy Mac của mình một cách an toàn và chuyên nghiệp nhất.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          TQD-CLEAN YOUR MAC (.DMG)                          │
│                                                                             │
│  [ TQD-Clean.app ] ──────────────► [ Applications ]                        │
│                                                                             │
│  • 100% Zero-Terminal: Không cần mở Terminal, không cần gõ lệnh             │
│  • 100% Standalone: Tự chứa runtime Mach-O ARM64 (không cần Node/Bun)       │
│  • Native Cocoa Shell: Cửa sổ Desktop riêng biệt, kéo thả mượt mà 120Hz     │
│  • An toàn tuyệt đối: Mặc định Dry-run, Whitelist bảo vệ dữ liệu            │
│  • Tác giả phát triển & Hỗ trợ: TQD - 0976.202.028                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Điểm Nhấn Đột Phá

1. **Giao Diện Tiếng Việt Chuẩn Mực:**
   - 100% ngôn ngữ tiếng Việt kỹ thuật, thiết kế dựa trên Typography `Space Grotesk` (tiêu đề HUD) và `Be Vietnam Pro` (thân văn bản).
   - Phong cách Cyberpunk HUD với hiệu ứng kính mờ (Frosted Glassmorphism), tông màu Void Black `#050505`, Neon Cyan `#00f2ff`, Electric Purple `#bc13fe` và Emerald Green `#00ff9f`.
2. **Cửa Sổ Desktop Native AppKit (Di Chuyển Siêu Mượt):**
   - Tích hợp lớp phủ điều khiển kéo cửa sổ phần cứng `TitleBarDragView`, hỗ trợ tần số quét ProMotion 120Hz và tính năng Window Snapping trên macOS Sequoia.
   - Nút Apple Traffic Lights (Đóng, Ẩn, Phóng to) hoạt động 100% nguyên bản.
3. **Cơ Chế Phân Cấp An Toàn (Progressive Safety):**
   - **Tầng 1 (Safe User-Space):** Dọn dẹp cache ứng dụng, logs, trash, browser cache... giải phóng ngay 75% rác mà không đòi hỏi mật khẩu root.
   - **Tầng 2 (Sâu hệ thống):** Dọn dẹp cache hệ thống, Xcode Dev tools, bộ nhớ RAM... hỗ trợ xác thực Touch ID vân tay hoặc quyền quản trị viên an toàn.
4. **Bảo Vệ Dự Án Lập Trình (Dev Purge):**
   - Tự động quét sạch các thư mục nặng như `node_modules`, `target`, `.gradle`, `venv` bị lãng quên (>30 ngày không chỉnh sửa) và cảnh báo nếu có git uncommitted.
5. **Zero-Zombie & Tiết Kiệm Pin:**
   - Thoát ứng dụng dọn sạch toàn bộ tiến trình con trong < 300ms, tiêu thụ CPU cực thấp (~0.0% khi nghỉ).

---

## 🚀 Hướng Dẫn Cài Đặt (Setup Guide)

### Cách 1: Cài đặt 1-Click qua file DMG (Khuyên dùng cho mọi người)

1. Tải về file ảnh đĩa [**`TQD-Clean-Your-Mac.dmg`**](dist-package/TQD-Clean-Your-Mac.dmg) (Dung lượng siêu nhẹ ~36 MB).
2. Nhấp đúp chuột để mở file `TQD-Clean-Your-Mac.dmg`.
3. Trong cửa sổ Finder hiện ra, **kéo biểu tượng `TQD-Clean` thả vào thư mục `Applications`**.
4. Mở ứng dụng từ Launchpad hoặc thư mục Applications để bắt đầu sử dụng!

> **💡 Hướng dẫn vượt qua cảnh báo Gatekeeper (Lần đầu mở app):**  
> Do ứng dụng được ký mã số học ad-hoc độc lập, macOS có thể hiện thông báo nhà phát triển chưa được xác minh:
> - **macOS Ventura / Sonoma:** Giữ phím `Control` + Click chuột phải vào `TQD-Clean` trong Applications $\rightarrow$ Chọn **Mở (Open)** $\rightarrow$ Bấm **Mở**.
> - **macOS 15 Sequoia:** Vào **Cài đặt hệ thống (System Settings)** $\rightarrow$ **Quyền riêng tư & Bảo mật (Privacy & Security)** $\rightarrow$ Cuộn xuống mục Bảo mật và bấm **"Vẫn mở" (Open Anyway)**.

---

### Cách 2: Biên dịch & Khởi chạy từ mã nguồn (Dành cho Lập trình viên)

Yêu cầu môi trường: macOS 12+, Xcode Command Line Tools (`swiftc`), Node.js hoặc Bun.

```bash
# 1. Clone repository về máy
git clone https://github.com/abm-dungtq/TQD-Clean-Your-Mac.git
cd TQD-Clean-Your-Mac

# 2. Cài đặt thư viện frontend
cd frontend
npm install
npm run build
cd ..

# 3. Biên dịch backend độc lập (Mach-O ARM64)
bash scripts/build-backend.sh

# 4. Đóng gói macOS App Bundle
bash scripts/build-app-bundle.sh

# 5. Khởi chạy ứng dụng trực tiếp
open "build/TQD-Clean Your Mac.app"

# Hoặc đóng gói thành file DMG phân phối:
bash scripts/package-dmg.sh
```

---

## 📖 Hướng Dẫn Sử Dụng Chi Tiết

Ứng dụng gồm 6 phân hệ chuyên sâu, được sắp xếp trên thanh điều hướng bên trái:

```
├── 1. 📊 TỔNG QUAN HỆ THỐNG (DASHBOARD)
│   ├── Đồng hồ đo Điểm Sức Khỏe Mac (0 - 100 điểm)
│   ├── Khối viễn thám Telemetry thời gian thực: CPU, RAM, Ổ cứng SSD, Pin
│   ├── Nút bấm nhanh: "QUÉT TOÀN BỘ HỆ THỐNG" & "XẢ RAM NHANH"
│   └── Cửa sổ dòng hoạt động Activity Stream Terminal
│
├── 2. 🗑️ DỌN DẸP BỘ NHỚ ĐỆM (SYSTEM & APP CACHES)
│   ├── Tầng 1: Bộ nhớ đệm ứng dụng (~/Library/Caches), Nhật ký lỗi, Thùng rác
│   ├── Tầng 2: Cache Safari, Chrome, Edge, Xcode / Công cụ lập trình
│   ├── Chế độ Quét trước (Dry-Run): Hiện dung lượng dự kiến trước khi xóa
│   └── Nút mở nhanh cấp quyền Full Disk Access (FDA)
│
├── 3. 💾 DỌN RÁC LẬP TRÌNH (DEV PURGE)
│   ├── Tự động truy vết node_modules, target (Rust), .gradle, venv (Python)
│   ├── Bộ lọc thông minh: Lọc các thư mục không chạm đến > 30 ngày
│   └── Cho phép chọn lọc từng dự án để dọn dẹp hàng chục GB dung lượng
│
├── 4. 📦 GỠ CÀI ĐẶT ỨNG DỤNG (UNINSTALLER)
│   ├── Quét danh mục toàn bộ ứng dụng cài trong máy
│   └── Tìm và xóa sạch các file tàn dư mồ côi (Preferences, Application Support, Caches)
│
├── 5. ⚡ TỐI ƯU & TĂNG TỐC (OPTIMIZER)
│   ├── Giải phóng RAM (Purge Inactive Memory) tăng RAM trống ngay lập tức
│   ├── Xả sạch bộ nhớ đệm DNS (Flush DNS Cache) sửa lỗi mạng
│   ├── Tái tạo chỉ mục tìm kiếm Spotlight (Rebuild Spotlight Index)
│   └── Sửa lỗi menu chuột phải Open With (Rebuild LaunchServices)
│
└── ⚙️ CÀI ĐẶT & DANH SÁCH AN TOÀN (SETTINGS)
    ├── Quản lý thư mục loại trừ (Whitelist): Đảm bảo thư mục quan trọng không bị xóa
    ├── Xem lịch sử dọn dẹp các phiên trước (Operations History)
    └── Thông tin ứng dụng, phiên bản và liên hệ hỗ trợ tác giả
```

### Thao tác dọn dẹp cơ bản trong 3 bước:
1. **Bước 1:** Bấm vào tab **Dọn dẹp bộ nhớ đệm** $\rightarrow$ Bấm nút **"Quét Lại (Dry-Run)"**.
2. **Bước 2:** Xem xét các danh mục muốn dọn (các mục an toàn Tầng 1 đã được chọn sẵn).
3. **Bước 3:** Bấm nút **"Dọn Dẹp Ngay"** $\rightarrow$ Cửa sổ Modal hiện ra yêu cầu xác nhận $\rightarrow$ Bấm **"Bắt đầu dọn dẹp"** và quan sát tiến trình dọn dẹp hiển thị trực tiếp trên giao diện!

---

## 🔒 Cơ Chế An Toàn & Bảo Mật

- **Không bao giờ xóa nhầm:** Danh sách loại trừ (`~/.config/mole/whitelist`) được tuân thủ nghiêm ngặt ở mọi lần chạy.
- **Minh bạch 100%:** Mọi lệnh xóa đều ghi lại đường dẫn và dung lượng vào `~/Library/Logs/mole/operations.log`.
- **Bảo mật cục bộ:** Máy chủ nội bộ chỉ lắng nghe trên giao diện loopback `127.0.0.1` với mã Token ngẫu nhiên (Session Secret), miễn nhiễm hoàn toàn với các cuộc tấn công CSRF / DNS Rebinding từ trình duyệt.

---

## 👨‍💻 Thông Tin Tác Giả & Hỗ Trợ Kỹ Thuật

Mọi ý kiến đóng góp, báo lỗi hoặc yêu cầu hỗ trợ tính năng, xin vui lòng liên hệ:

- **Tác giả phát triển:** TQD
- **Số điện thoại / Zalo:** [**0976.202.028**](tel:0976202028)
- **Mã nguồn dự án:** [https://github.com/abm-dungtq/TQD-Clean-Your-Mac](https://github.com/abm-dungtq/TQD-Clean-Your-Mac)
- **Bản quyền:** Phát hành theo giấy phép **GPL-3.0** (Kế thừa động cơ mã nguồn mở `tw93/mole`).
