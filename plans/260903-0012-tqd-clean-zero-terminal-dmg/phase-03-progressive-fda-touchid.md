---
phase: 3
title: "Progressive Privilege Elevation & Touch ID UX"
status: completed
priority: P1
effort: "1 day"
dependencies: ["phase-02-native-wkwebview-shell.md"]
---

# Phase 3: Progressive Privilege Elevation & Touch ID UX

## 1. Overview
Hiện thực hóa cơ chế **Phân cấp Đặc quyền Tịnh tiến (Progressive Privilege Elevation)**. Loại bỏ hoàn toàn màn hình chặn đòi quyền Full Disk Access (FDA) ngay khi mở ứng dụng. Cho phép người dùng trải nghiệm ngay giá trị dọn dẹp >75% dung lượng rác an toàn thuộc User Space trong 45 giây đầu tiên. Tích hợp deep-link thông minh mở Cài đặt Hệ thống macOS khi người dùng chủ động muốn dọn sâu, và ủy quyền xác thực Touch ID bản địa qua `osascript`.

---

## 2. Requirements
- **FR-3.1:** Phân loại 2 tầng quyền dọn dẹp trong `mole_bridge.ts`:
  - **Tầng 1 (Mặc định - Zero Permission Required):**
    - Bộ nhớ đệm ứng dụng người dùng (`~/Library/Caches`).
    - Thùng rác hệ thống (`~/.Trash`).
    - Bộ nhớ đệm công cụ phát triển (`~/.npm`, `~/.gradle`, `~/.cache`).
    - Rác dự án lập trình (`node_modules`, `target`, `venv` cũ > 30 ngày).
    - Bộ nhớ đệm Chrome & Safari cơ bản người dùng.
    - 👉 *Hoạt động 100% không cần Full Disk Access và không cần mật khẩu Admin.*
  - **Tầng 2 (Nâng cao - Advanced System Deep Clean):**
    - Bộ nhớ đệm hệ thống chung (`/Library/Caches`, `/private/var/folders`).
    - Xả RAM không hoạt động (`purge`).
    - Xả cache DNS và tái lập chỉ mục Spotlight.
    - 👉 *Yêu cầu Touch ID hoặc Full Disk Access.*
- **FR-3.2:** Tích hợp Deep-Link TCC tự động:
  - Khi người dùng muốn quét/dọn tầng 2 mà chưa có FDA:
  - Nút bấm `[Cấp Quyền 1-Chạm]` kích hoạt lệnh:
    `open "x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles"`
  - Giao diện hiển thị minh họa 2 bước: Gạt công tắc xanh cho `TQD-Clean Your Mac`.
- **FR-3.3:** Xử lý từ chối quyền (Graceful Degradation):
  - Nếu người dùng bấm "Hủy" (Cancel) ở hộp thoại Touch ID hoặc không cấp FDA:
  - Ứng dụng **tuyệt đối không crash**, mà tự động dọn sạch 100% các mục thuộc Tầng 1 và hiển thị thông báo: *"Đã hoàn tất dọn dẹp các mục an toàn người dùng."*

---

## 3. Architecture & Progressive Flow

```
                     ┌────────────────────────────────────────┐
                     │          NGƯỜI DÙNG NHẤN DỌN DẸP       │
                     └───────────────────┬────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
  ┌──────────────────────────────┐                ┌──────────────────────────────┐
  │     TẦNG 1: USER SPACE       │                │    TẦNG 2: SYSTEM ROOT       │
  │ (~/Library/Caches, Trash,    │                │ (/Library/Caches, Purge RAM, │
  │  Dev Purge, Chrome Cache)    │                │  Spotlight, DNS Flush)       │
  ├──────────────────────────────┤                ├──────────────────────────────┤
  │ • Thực thi ngay lập tức      │                │ • Gọi osascript native popup │
  │ • Quyền: User thường (uid501)│                │ • Hỗ trợ Touch ID vân tay    │
  │ • KHÔNG CẦN ROOT, KHÔNG FDA  │                │ • Người dùng Hủy -> Bỏ qua,  │
  │ • Giải phóng >75% dung lượng │                │   vẫn hoàn tất Tầng 1!       │
  └──────────────────────────────┘                └──────────────────────────────┘
```

---

## 4. Related Code Files
- **Modify:** `server/mole_bridge.ts` (Gắn cờ `requiresFDA` và `requiresRoot` cho từng danh mục).
- **Modify:** `frontend/src/types.ts` (Bổ sung cờ `requiresFDA?: boolean`, `requiresRoot?: boolean` vào `ScanCategoryItem`).
- **Modify:** `frontend/src/components/CleanView.tsx` (Hiển thị nhãn phân tầng và nút cấp quyền deep-link).
- **Modify:** `frontend/src/components/Dashboard.tsx` (Banner trạng thái FDA tinh tế, không chặn màn hình).

---

## 5. Implementation Steps
1. **Phân loại danh mục trong `server/mole_bridge.ts`**:
   - `user_app_cache`: `safe: true, requiresFDA: false, requiresRoot: false`
   - `browser_cache`: `safe: true, requiresFDA: false, requiresRoot: false`
   - `dev_tools_cache`: `safe: true, requiresFDA: false, requiresRoot: false`
   - `trash`: `safe: true, requiresFDA: false, requiresRoot: false`
   - `system_cache`: `safe: false, requiresFDA: true, requiresRoot: true`
2. **Nâng cấp `frontend/src/components/CleanView.tsx`**:
   - Nhóm danh mục thành 2 khu vực:
     - **"Dọn dẹp An toàn Tức thì (Không cần quyền)"**: Check sẵn 100%.
     - **"Tối ưu hóa Hệ thống Sâu (Cần Touch ID / FDA)"**: Mặc định bỏ chọn hoặc hiển thị biểu tượng chìa khóa bảo mật.
   - Khi chọn mục cần FDA, hiển thị popover hướng dẫn kèm nút `Mở Cài Đặt Hệ Thống`.
3. **Cải tiến `executeOptimization` trong `server/mole_bridge.ts`**:
   - Bắt lỗi khi người dùng bấm Hủy hộp thoại Touch ID (`User canceled` - error code 128) để trả về trạng thái thân thiện `{ success: false, cancelled: true }`, không báo lỗi đỏ lòm hoảng sợ người dùng.

---

## 6. Todo Checklist
- [x] Cập nhật định nghĩa dữ liệu `ScanCategoryItem` hỗ trợ `requiresFDA` và `requiresRoot`.
- [x] Phân tầng danh mục quét trong `server/mole_bridge.ts`.
- [x] Tinh chỉnh giao diện `CleanView.tsx` với 2 nhóm phân tầng trực quan.
- [x] Bổ sung cơ chế mở deep-link `Privacy_AllFiles` từ frontend.
- [x] Xử lý mã lỗi người dùng hủy hộp thoại Touch ID một cách mềm mại.
- [x] Kiểm thử luồng: Bấm dọn dẹp ngay mà không có quyền FDA -> Vẫn dọn thành công rác User.

---

## 7. Success Criteria
- [x] Người dùng mới mở app lần đầu bấm Quét và Dọn dẹp ngay không bị chặn bởi bất kỳ popup nào.
- [x] Giải phóng thành công hàng gigabyte rác User Cache và Dev Purge ngay trong 30 giây đầu.
- [x] Bấm dọn mục hệ thống: Hộp thoại Touch ID macOS xuất hiện chuẩn mực. Bấm "Hủy" thì ứng dụng vẫn tiếp tục dọn xong các mục khác an toàn.
