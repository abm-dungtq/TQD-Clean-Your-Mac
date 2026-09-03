---
phase: 4
title: "DMG Packaging & Gatekeeper Visual Canvas"
status: completed
priority: P1
effort: "1 day"
dependencies: ["phase-03-progressive-fda-touchid.md"]
---

# Phase 4: DMG Packaging & Gatekeeper Visual Canvas

## 1. Overview
Hiện thực hóa quy trình đóng gói tệp ảnh đĩa cài đặt chuẩn macOS: **`TQD-Clean-Your-Mac.dmg`**. Thiết kế giao diện cửa sổ Finder đồ họa Retina trực quan khi mở DMG (DMG Visual Canvas): Mũi tên kéo thả ứng dụng vào thư mục `Applications` và bảng hướng dẫn đồ họa vượt qua cơ chế kiểm duyệt Gatekeeper trên macOS 14 Sonoma và macOS 15 Sequoia (Control-Click $\rightarrow$ Mở, hoặc Cài đặt hệ thống $\rightarrow$ Vẫn mở) mà **tuyệt đối không bắt người dùng mở Terminal gõ lệnh `xattr`**.

---

## 2. Requirements
- **FR-4.1:** Kịch bản đóng gói tự động `scripts/package-dmg.sh` sử dụng công cụ mã nguồn mở `create-dmg` hoặc AppleScript Finder canvas.
- **FR-4.2:** Thiết kế hình nền đồ họa cửa sổ DMG (`assets/dmg-background.png` và `@2x.png`):
  - Kích thước cửa sổ Finder: 660 x 440 px.
  - Vị trí Icon ứng dụng: `(180, 190)`.
  - Vị trí Thư mục Applications alias: `(480, 190)`.
  - Giữa 2 icon: Mũi tên chỉ dẫn phong cách Cyber-Neon phát sáng.
  - Phía dưới: Bảng thông báo đồ họa song ngữ Việt - Anh hướng dẫn mở lần đầu:
    *"💡 Mở lần đầu: Giữ phím Control + Click chuột phải vào icon $\rightarrow$ Chọn Mở (Open)."*
    *"💡 macOS Sequoia: Vào Cài đặt hệ thống $\rightarrow$ Quyền riêng tư & Bảo mật $\rightarrow$ Chọn 'Vẫn mở'."*
- **FR-4.3:** Ký mã số học Ad-hoc chuẩn hóa:
  - Chạy lệnh: `codesign --force --deep -s - "build/TQD-Clean Your Mac.app"`.
  - Khắc phục lỗi "Ứng dụng bị hỏng" do thiếu metadata `Info.plist`.
- **FR-4.4:** Đính kèm tệp trợ giúp tùy chọn: `Mở Khóa Lần Đầu.command` (Dự phòng cho người dùng muốn 1-click tự động gỡ cờ cách ly).

---

## 3. DMG Visual Canvas Layout

```
┌─────────────────────────────────────────────────────────────┐
│                      TQD-Clean Your Mac                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│         [ 🛡️ TQD-Clean ]   ──────►   [ 📁 Applications ]    │
│            (Icon App)                   (Thư mục Apps)      │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│  📌 HƯỚNG DẪN MỞ ỨNG DỤNG LẦN ĐẦU (MACOS GATEKEEPER):       │
│  • Cách 1: Giữ phím Control + Click chuột phải -> Chọn [Mở] │
│  • Cách 2 (macOS 15 Sequoia): Vào Cài đặt hệ thống ->       │
│    Quyền riêng tư & Bảo mật -> Cuộn xuống bấm [Vẫn mở]      │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Related Code Files
- **Create:** `assets/dmg-background.svg` & `assets/dmg-background.png` (Hình nền đồ họa Finder).
- **Create:** `scripts/package-dmg.sh` (Kịch bản tạo DMG hoàn chỉnh).
- **Output:** `dist-package/TQD-Clean-Your-Mac.dmg` (~45–55 MB).

---

## 5. Implementation Steps
1. **Thiết kế hình nền DMG (`assets/dmg-background.png`)**:
   - Sử dụng đồ họa vector SVG kết hợp phông chữ `Space Grotesk` và `Be Vietnam Pro`.
   - Xuất file PNG chuẩn độ phân giải Retina (`@2x`).
2. **Soạn thảo kịch bản `scripts/package-dmg.sh`**:
   ```bash
   #!/bin/bash
   set -euo pipefail
   APP_PATH="build/TQD-Clean Your Mac.app"
   DMG_OUTPUT="dist-package/TQD-Clean-Your-Mac.dmg"
   mkdir -p dist-package
   rm -f "$DMG_OUTPUT"

   create-dmg \
     --volname "TQD-Clean Your Mac" \
     --volicon "assets/AppIcon.icns" \
     --background "assets/dmg-background.png" \
     --window-pos 200 120 \
     --window-size 660 440 \
     --icon-size 128 \
     --icon "TQD-Clean Your Mac.app" 180 190 \
     --hide-extension "TQD-Clean Your Mac.app" \
     --app-drop-link 480 190 \
     "$DMG_OUTPUT" \
     "$APP_PATH"
   ```
3. **Ký mã Ad-hoc cho App Bundle**:
   ```bash
   codesign --force --deep -s - "build/TQD-Clean Your Mac.app"
   codesign --verify --deep --strict "build/TQD-Clean Your Mac.app"
   ```
4. **Kiểm thử tệp DMG**:
   - Double click mở DMG. Kiểm tra hiển thị hình nền, icon app và alias Applications.
   - Kéo app vào `/Applications` và chạy thử nghiệm.

---

## 6. Todo Checklist
- [x] Thiết kế hình nền đồ họa `assets/dmg-background.png` phong cách Cyber-Glassmorphism.
- [x] Kiểm tra tính sẵn sàng của công cụ `create-dmg` hoặc viết kịch bản hdiutil dự phòng.
- [x] Viết kịch bản tự động hóa `scripts/package-dmg.sh`.
- [x] Ký mã số học ad-hoc và xác minh tính toàn vẹn của gói `.app`.
- [x] Đóng gói thử nghiệm tệp `TQD-Clean-Your-Mac.dmg`.
- [x] Kiểm chứng: Mở DMG trên macOS, kéo vào Applications không bị lỗi quyền.

---

## 7. Success Criteria
- [x] Tệp `dist-package/TQD-Clean-Your-Mac.dmg` được sinh ra hoàn chỉnh, dung lượng $\le$ 55 MB.
- [x] Cửa sổ DMG mở ra có nền đồ họa trực quan, icon căn chỉnh chính xác tọa độ.
- [x] Người dùng không kỹ thuật có thể tự nhìn hình và mở app thành công trên macOS 14 & 15 mà không cần người khác trợ giúp.
