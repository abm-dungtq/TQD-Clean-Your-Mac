---
phase: 5
title: "End-to-End Field Verification & CI/CD Pipeline"
status: completed
priority: P1
effort: "1 day"
dependencies: ["phase-04-dmg-gatekeeper-packaging.md"]
---

# Phase 5: End-to-End Field Verification & CI/CD Pipeline

## 1. Overview
Kiểm thử thực địa toàn diện (Field Testing & Verification) trên môi trường macOS độc lập không cài đặt công cụ phát triển (No Node, No Bun, No Homebrew, No Xcode). Đo lường và xác minh bộ chỉ số SLA khắt khe: **$\le$ 3 clicks, 0 cửa sổ Terminal, thời gian giải phóng dung lượng đầu tiên < 45 giây**. Xây dựng quy trình tự động hóa tích hợp liên tục (CI/CD) qua GitHub Actions để tự động build và đính kèm tệp `.dmg` vào mỗi bản phát hành (Release).

---

## 2. Requirements
- **FR-5.1:** Bộ kịch bản kiểm thử tự động `tests/verify-zero-terminal.sh`:
  - Mô phỏng người dùng tải DMG và mount vào hệ thống qua `hdiutil attach`.
  - Sao chép `TQD-Clean Your Mac.app` vào thư mục tạm `/tmp/TestApplications`.
  - Khởi chạy app bằng lệnh `open -a "/tmp/TestApplications/TQD-Clean Your Mac.app"`.
  - Kiểm tra bảng tiến trình hệ điều hành: Đảm bảo **không có bất kỳ tiến trình `Terminal.app` hay `iTerm` nào được khởi động**.
  - Kiểm tra cổng mạng: Backend phản hồi HTTP 200 tại loopback `127.0.0.1`.
- **FR-5.2:** Đo lường chỉ số SLA (Stopwatch Benchmark):
  - Thời gian khởi động cửa sổ native: $\le$ 1.5 giây.
  - Quét an toàn ban đầu: $\le$ 3.0 giây.
  - Vòng đời tắt app: $\le$ 300 mili-giây giải phóng hoàn toàn bộ nhớ và cổng mạng.
- **FR-5.3:** Thiết lập GitHub Actions Workflow (`.github/workflows/release.yml`):
  - Chạy trên runner `macos-latest` (Apple Silicon M1/M2).
  - Tự động thực thi: Cài đặt Bun $\rightarrow$ Build frontend React $\rightarrow$ Build backend Mach-O $\rightarrow$ Biên dịch Swift Native Shell $\rightarrow$ Tạo file `.dmg` $\rightarrow$ Tự động đính kèm vào GitHub Release khi có tag `v*.*.*`.

---

## 3. Verification Architecture & SLA Matrix

```
┌─────────────────────────────────────────────────────────────┐
│                 MACOS CLEAN RUNTIME SANDBOX                 │
│              (PATH=/usr/bin:/bin:/usr/sbin:/sbin)           │
├──────────────────────────────┬──────────────────────────────┤
│ 1. Terminal Leak Check       │ pgrep -f "Terminal|iTerm"    │
│                              │ 👉 Kết quả: 0 tiến trình     │
│ 2. Click Budget Audit        │ [DMG Open] -> [App Click] -> │
│                              │ [Clean Click] 👉 Đúng 3 lần  │
│ 3. Time to First Clean       │ Từ lúc Mount DMG đến khi dọn │
│                              │ 👉 Đạt SLA: < 45 giây        │
│ 4. Zombie Process Sweep      │ killall TQD-Clean -> kiểm tra│
│                              │ tqd-backend chết trong 200ms │
└──────────────────────────────┴──────────────────────────────┘
```

---

## 4. Related Code Files
- **Create:** `tests/verify-zero-terminal.sh` (Kịch bản kiểm thử quy chuẩn không Terminal).
- **Create:** `.github/workflows/release.yml` (CI/CD tự động đóng gói phát hành DMG).
- **Update:** `README.md` (Hướng dẫn người dùng tải file DMG 1-click thay vì hướng dẫn Terminal).

---

## 5. Implementation Steps
1. **Viết kịch bản kiểm thử `tests/verify-zero-terminal.sh`**:
   - Tự động mount tệp DMG từ `dist-package/`.
   - Giả lập môi trường sạch (xóa biến môi trường `PATH` chứa Bun/Node).
   - Kiểm tra output log và tiến trình con.
2. **Cấu hình GitHub Actions `.github/workflows/release.yml`**:
   ```yaml
   name: Release TQD-Clean DMG
   on:
     push:
       tags:
         - "v*"
   jobs:
     build-dmg:
       runs-on: macos-14
       steps:
         - uses: actions/checkout@v4
         - uses: oven-sh/setup-bun@v2
         - run: cd frontend && npm install && npm run build
         - run: bash scripts/build-backend.sh
         - run: bash scripts/build-app-bundle.sh
         - run: brew install create-dmg && bash scripts/package-dmg.sh
         - uses: softprops/action-gh-release@v2
           with:
             files: dist-package/TQD-Clean-Your-Mac.dmg
   ```
3. **Cập nhật `README.md`**:
   - Đưa link tải trực tiếp `TQD-Clean-Your-Mac.dmg` lên vị trí nổi bật nhất.
   - Thêm ảnh động hướng dẫn kéo thả vào `Applications`.

---

## 6. Todo Checklist
- [x] Soạn thảo kịch bản kiểm thử thực địa `tests/verify-zero-terminal.sh`.
- [x] Chạy kiểm thử tự động: Đo lường số click, thời gian khởi động, và kiểm tra rò rỉ Terminal.
- [x] Kiểm chứng kịch bản tắt ứng dụng: Đảm bảo không để lại tiến trình zombie.
- [x] Cấu hình file GitHub Actions `.github/workflows/release.yml`.
- [x] Cập nhật `README.md` với giao diện hướng dẫn người dùng mới thân thiện.

---

## 7. Success Criteria
- [x] Toàn bộ bài kiểm thử `tests/verify-zero-terminal.sh` vượt qua 100% (Passed).
- [x] Đạt đúng tiêu chuẩn: **$\le$ 3 clicks, 0 terminal encounters, < 45s dọn xong lần đầu**.
- [x] File DMG hoàn thiện sẵn sàng tải về và cài đặt trực tiếp trên mọi máy Mac của người dùng Việt Nam.
