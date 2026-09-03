---
title: "TQD-Clean Your Mac: Kế Hoạch Đóng Gói Native DMG Zero-Terminal"
description: "Phân rã PRD và lộ trình 5 giai đoạn module hóa để chuyển đổi TQD-Clean Your Mac thành ứng dụng macOS độc lập, kéo thả .dmg, 0 dòng lệnh terminal cho người dùng mới."
status: completed
priority: P1
effort: "5 days"
tags: [dmg, packaging, zero-terminal, macos, tauri, bun-compile, wkwebview, fda, gatekeeper]
created: 2026-09-03
---

# 🛡️ TQD-Clean Your Mac: Kế Hoạch Đóng Gói Native DMG Zero-Terminal

> **Kỷ luật ngữ cảnh (Context Management Rule):**  
> Để tránh tràn Context Window trong các phiên làm việc tiếp theo, **không bao giờ nạp toàn bộ kế hoạch vào prompt cùng lúc**. Mỗi phiên làm việc chỉ cần mở duy nhất tệp phase tương ứng (`phase-01-*.md`, `phase-02-*.md`,...) để triển khai.

---

## 1. Tổng Quan & Bài Toán Nghiệp Vụ (PRD Summary)

### 1.1. Thực trạng & Nỗi đau người dùng mới
- Hiện tại, **TQD-Clean Your Mac** hoạt động xuất sắc qua giao diện webapp Cyber-HUD trên cổng `http://127.0.0.1:42100`.
- Tuy nhiên, để khởi chạy, người dùng bắt buộc phải mở **macOS Terminal**, cài đặt **Bun hoặc Node.js**, và gõ `./tqd-clean`.
- **Rào cản chí mạng:** 95% người dùng Mac phổ thông (nhân viên văn phòng, học sinh, nhà thiết kế) không biết Terminal là gì, hoảng sợ trước màn hình đen dòng lệnh, và không biết cài đặt môi trường lập trình.

### 1.2. Trọng tâm Giải pháp (Solution Paradigm)
- Đóng gói toàn bộ hệ thống (lõi Mole shell scripts + backend TypeScript + giao diện Cyber-HUD React) thành **01 tệp tin ảnh đĩa duy nhất: `TQD-Clean-Your-Mac.dmg`**.
- Người dùng chỉ cần: **Tải về $\rightarrow$ Kéo thả icon vào `/Applications` $\rightarrow$ Nhấp đúp mở app $\rightarrow$ Quét & Dọn rác**.
- **Cam kết vàng:**
  - **0** cửa sổ Terminal xuất hiện.
  - **0** dòng lệnh cần gõ.
  - **0** yêu cầu cài đặt phần mềm phụ trợ (Zero Dependencies).
  - Khởi chạy trong cửa sổ ứng dụng độc lập (**Native macOS WKWebView Window**) có Dock icon và traffic lights Apple, không chạy trên tab trình duyệt (loại trừ hoàn toàn *Browser Cache Self-Kill Paradox*).

---

## 2. Thẩm Định Chiến Lược Hội Đồng Ultra (Kongming Verification)

Kế hoạch này được xây dựng dựa trên bản hợp đồng chiến thắng **Candidate E** (đạt **78/80 điểm**) do Thẩm định viên Tối cao **Kongming** phê duyệt:

| Yếu tố cốt lõi | Quyết định chiến lược | Rationale kỹ thuật |
| :--- | :--- | :--- |
| **Backend Core** | `bun build --compile` Mach-O standalone | Tận dụng 100% mã nguồn TypeScript của `server/index.ts` và `mole_bridge.ts` mà không cần viết lại bằng Rust. |
| **Giao diện Shell** | Cocoa / AppKit Native `WKWebView` | Cửa sổ riêng biệt, giải quyết triệt để lỗi tự sát khi dọn cache Chrome/Safari. Tiết kiệm 150MB so với Electron. |
| **Quyền hạn TCC** | Phân cấp quyền hạn tịnh tiến (*Progressive FDA*) | Quét và dọn ngay >75% rác User Space trong 45s đầu; chỉ hỏi FDA khi người dùng chủ động dọn sâu hệ thống. |
| **Vượt Gatekeeper** | Thiết kế nền DMG đồ họa 3 tầng | Hướng dẫn trực quan Control-Click / System Settings cho macOS 15 Sequoia, tuyệt đối không bắt gõ lệnh `xattr`. |

---

## 3. Lộ Trình 5 Giai Đoạn Module Hóa (Phased Roadmap)

Mỗi giai đoạn được đóng gói thành 1 tệp tài liệu độc lập với đầy đủ yêu cầu, kiến trúc, danh sách tệp và lệnh kiểm thử:

| # | Giai đoạn (Phase) | Tệp chi tiết | Trọng tâm công việc | Trạng thái | Phụ thuộc |
| :---: | :--- | :--- | :--- | :---: | :---: |
| **1** | **Standalone Backend Binary** | [`phase-01-start.md`](./phase-01-start.md) | Biên dịch `server/index.ts` thành binary Mach-O độc lập (`tqd-core`), tự định vị thư mục `mole` trong bundle, tự động chọn port rảnh. | 🟡 Đang chờ | Không |
| **2** | **Native WKWebView Shell** | [`phase-02-native-wkwebview-shell.md`](./phase-02-native-wkwebview-shell.md) | Tạo cấu trúc `TQD-Clean.app`, cửa sổ AppKit kính mờ native, gắn Dock icon, quản lý vòng đời (tắt app = diệt sạch zombie process <300ms). | ⚪ Chờ Phase 1 | Phase 1 |
| **3** | **Progressive FDA & Touch ID** | [`phase-03-progressive-fda-touchid.md`](./phase-03-progressive-fda-touchid.md) | Phân tầng dọn dẹp không cần quyền (Tier 1) vs cần quyền (Tier 2), tích hợp deep-link TCC và hộp thoại Touch ID native qua `osascript`. | ⚪ Chờ Phase 2 | Phase 2 |
| **4** | **DMG Packaging & Gatekeeper** | [`phase-04-dmg-gatekeeper-packaging.md`](./phase-04-dmg-gatekeeper-packaging.md) | Tạo file `TQD-Clean-Your-Mac.dmg` với nền đồ họa hướng dẫn kéo thả và chỉ dẫn bypass Gatekeeper trên macOS 15 Sequoia. | ⚪ Chờ Phase 3 | Phase 3 |
| **5** | **Field Verification & CI/CD** | [`phase-05-e2e-field-verification-ci.md`](./phase-05-e2e-field-verification-ci.md) | Kiểm thử máy Mac trắng sạch (Zero Node/Bun), đo lường SLA (<3 clicks, <45s, 0 terminal), thiết lập GitHub Actions Release. | ⚪ Chờ Phase 4 | Phase 4 |

---

## 4. Tiêu Chí Nghiệm Thu Toàn Dự Án (Project Acceptance Criteria)

- [ ] **PAC-01 (Click Budget):** Người dùng từ file DMG tới khi dọn xong lần đầu thực hiện tối đa 3 lần click chuột.
- [ ] **PAC-02 (Zero Terminal):** 100% không có cửa sổ Terminal hay prompt dòng lệnh nào xuất hiện.
- [ ] **PAC-03 (Zero Dependencies):** Chạy mượt mà trên máy macOS mới xuất xưởng không cài Bun/Node/Xcode.
- [ ] **PAC-04 (No Self-Kill):** Dọn dẹp "Bộ nhớ đệm trình duyệt Web (Chrome & Safari)" không làm sập cửa sổ ứng dụng.
- [ ] **PAC-05 (Zero Zombie):** Nhấn `Cmd + Q` đóng cửa sổ lập tức dừng sạch server và các sub-process Mole trong vòng dưới 300ms.
- [ ] **PAC-06 (Bundle Footprint):** Dung lượng file `.dmg` hoàn chỉnh khống chế trong khoảng 45–55 MB.

<!-- slug: tqd-clean-zero-terminal-dmg -->
