---
phase: 2
title: "Native macOS App Bundle & WKWebView Shell"
status: completed
priority: P1
effort: "1.5 days"
dependencies: ["phase-01-start.md"]
---

# Phase 2: Native macOS App Bundle & WKWebView Shell

## 1. Overview
Thiết kế cấu trúc gói ứng dụng chuẩn macOS (`TQD-Clean Your Mac.app`). Xây dựng lớp vỏ ứng dụng Native macOS (Native Cocoa/AppKit Shell) sử dụng thành phần `WKWebView` của hệ điều hành để render giao diện Cyber-HUD. Đồng thời kiểm soát vòng đời tiến trình: tự động kích hoạt `tqd-backend` khi mở app và dọn dẹp sạch sẽ toàn bộ tiến trình khi người dùng tắt cửa sổ.

---

## 2. Requirements
- **FR-2.1:** Cấu trúc gói ứng dụng `TQD-Clean Your Mac.app` theo chuẩn Apple:
  - `Contents/MacOS/TQD-Clean`: Binary Native App điều phối.
  - `Contents/Resources/bin/tqd-backend`: Binary backend từ Phase 1.
  - `Contents/Resources/mole/`: Trọn bộ shell script của `tw93/mole`.
  - `Contents/Resources/frontend/`: Thư mục tĩnh `dist/` của React UI.
  - `Contents/Resources/AppIcon.icns`: Bộ biểu tượng ứng dụng độ phân giải cao cho Dock.
  - `Contents/Info.plist`: Cấu hình danh tính tĩnh `CFBundleIdentifier: com.tqd.cleanyourmac`.
- **FR-2.2:** Cửa sổ đồ họa Native:
  - Sử dụng `WKWebView` của macOS WebKit (không cõng Chromium, tiết kiệm 150MB).
  - Tích hợp hiệu ứng kính mờ Frosted Glass (`NSVisualEffectView`) đồng nhất giao diện Cyber-HUD.
  - Kích thước cửa sổ mặc định: 1120 x 760 px, hỗ trợ phóng to, thu nhỏ, có 3 nút điều khiển Apple Traffic Lights.
- **FR-2.3:** Quản lý vòng đời (Process Lifecycle Guard):
  - Bắt sự kiện `applicationShouldTerminateAfterLastWindowClosed` và `applicationWillTerminate`.
  - Khi người dùng bấm nút đỏ đóng cửa sổ hoặc nhấn `Cmd + Q`, Native Shell gửi tín hiệu `SIGTERM` tới `tqd-backend` và xác nhận tiến trình tắt hoàn toàn trong < 300ms.
- **FR-2.4:** Ngăn chặn nghịch lý tự sát (No Browser Self-Kill):
  - Chạy hoàn toàn độc lập với Google Chrome, Safari, Edge của người dùng.

---

## 3. Architecture & Window Lifecycle

```
[Người dùng click icon TQD-Clean trên Dock]
                 │
                 ▼
[Cocoa Native Shell (Contents/MacOS/TQD-Clean)]
    ├── 1. Khởi động ngầm: tqd-backend (Port fallback check)
    ├── 2. Lấy Port & Session Token
    ├── 3. Khởi tạo Cửa sổ NSWindow + WKWebView
    └── 4. Nạp URL: http://127.0.0.1:PORT/?token=SESSION_TOKEN
                 │
      (Người dùng đóng cửa sổ / Cmd + Q)
                 │
                 ▼
[Event: applicationWillTerminate]
    ├── Gửi SIGTERM tới tqd-backend (kill child)
    ├── Giải phóng cổng mạng
    └── Thoát ứng dụng sạch sẽ (< 300ms)
```

---

## 4. Related Code Files
- **Create:** `native/main.swift` (Mã nguồn Cocoa/AppKit Native Window & WKWebView).
- **Create:** `native/Info.plist` (Cấu hình định danh Bundle, Icon, Quyền hệ thống).
- **Create:** `scripts/build-app-bundle.sh` (Kịch bản biên dịch Swift và hợp nhất cấu trúc `.app`).
- **Create:** `assets/AppIcon.iconset` & `assets/AppIcon.icns` (Biểu tượng Cyber-HUD cho Dock).
- **Output:** `build/TQD-Clean Your Mac.app`.

---

## 5. Implementation Steps
1. **Viết Native Shell bằng Swift (`native/main.swift`)**:
   - Sử dụng `NSApplication`, `NSWindow`, `WKWebView`, `Process()`.
   - Quản lý khởi động `tqd-backend` dưới dạng subprocess ẩn (không mở console).
   - Tự động truyền pipe đọc stdout của backend để lấy `PORT` và `TOKEN`.
   - Thiết lập `window.titlebarAppearsTransparent = true` để giữ nguyên viền Cyberpunk.
2. **Biên dịch Native Shell**:
   ```bash
   swiftc -O native/main.swift -o build/TQD-Clean \
     -target arm64-apple-macos12.0 \
     -framework Cocoa -framework WebKit
   ```
3. **Cấu trúc hóa thư mục `.app`**:
   - Sao chép `build/TQD-Clean` vào `Contents/MacOS/`.
   - Đặt `tqd-backend` vào `Contents/Resources/bin/`.
   - Đồng bộ `mole/` vào `Contents/Resources/mole/`.
   - Đồng bộ `frontend/dist/` vào `Contents/Resources/frontend/`.
4. **Kiểm thử vòng đời ứng dụng**:
   - Nhấp đúp mở `TQD-Clean Your Mac.app` từ Finder.
   - Kiểm tra `Activity Monitor`: Xuất hiện `TQD-Clean` và `tqd-backend`.
   - Nhấn `Cmd + Q`: Cả hai tiến trình biến mất ngay lập tức.

---

## 6. Todo Checklist
- [x] Soạn thảo mã nguồn Swift điều phối cửa sổ `native/main.swift`.
- [x] Tạo file `native/Info.plist` với `CFBundleIdentifier = com.tqd.cleanyourmac`.
- [x] Thiết kế và xuất biểu tượng `AppIcon.icns` phong cách Cyber-Shield.
- [x] Tạo kịch bản tự động hóa `scripts/build-app-bundle.sh`.
- [x] Biên dịch thử nghiệm `TQD-Clean Your Mac.app`.
- [x] Kiểm chứng: Mở app bằng double-click trong Finder không mở Terminal.
- [x] Kiểm chứng: Đóng cửa sổ ứng dụng tiêu diệt sạch tiến trình con.

---

## 7. Success Criteria
- [x] Ứng dụng `TQD-Clean Your Mac.app` xuất hiện với icon chuẩn trên Finder và Dock.
- [x] Giao diện Cyber-HUD hiển thị trơn tru trên cửa sổ WebKit native.
- [x] Không có bất kỳ cửa sổ Terminal hay tab trình duyệt Chrome/Safari nào bị bật lên.
- [x] Thử tính năng dọn dẹp cache Chrome: Trình duyệt Chrome tắt đi nhưng cửa sổ TQD-Clean vẫn hoạt động bình thường, không bị sập.
