---
phase: 1
title: "Standalone Backend Binary & Mole Asset Relocation"
status: completed
priority: P1
effort: "1 day"
dependencies: []
---

# Phase 1: Standalone Backend Binary & Mole Asset Relocation

## 1. Overview
Biên dịch toàn bộ máy chủ TypeScript (`server/index.ts` và các module cầu nối `mole_bridge.ts`, `telemetry.ts`, `external_watcher.ts`) thành **01 tệp nhị phân duy nhất (Mach-O ARM64 Standalone Executable)** mang tên `tqd-backend`. Tự động hóa cơ chế tìm kiếm tài nguyên Mole bên trong macOS Bundle (`Contents/Resources/mole`) và dự phòng cổng mạng (Port fallback).

---

## 2. Requirements
- **FR-1.1:** Biên dịch `server/index.ts` bằng `bun build --compile --minify --target=bun-darwin-arm64` thành binary thực thi độc lập không cần Bun/Node trên máy đích.
- **FR-1.2:** Cập nhật cơ chế xác định đường dẫn `MOLE_DIR` trong `mole_bridge.ts`:
  1. Kiểm tra biến môi trường `TQD_RESOURCES_PATH`.
  2. Kiểm tra đường dẫn nội bộ Bundle macOS: `../Resources/mole` tương đối từ vị trí file nhị phân `process.execPath`.
  3. Dự phòng đường dẫn phát triển cục bộ: `path.resolve(__dirname, "../mole")`.
- **FR-1.3:** Tự động fallback sang cổng `42101`, `42102`... nếu cổng mặc định `42100` bị chiếm bởi phiên làm việc trước hoặc ứng dụng khác.
- **FR-1.4:** Tích hợp cờ nhận lệnh `--daemon`, `--port`, `--token` và cơ chế lắng nghe tín hiệu ngắt `SIGTERM`/`SIGINT` dọn sạch toàn bộ child processes.

---

## 3. Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│               MACOS STANDALONE BINARY RUNTIME               │
│                  (Contents/MacOS/tqd-backend)               │
├──────────────────────────────┬──────────────────────────────┤
│ 1. Port Resolver             │ Kiểm tra 42100 -> fallback   │
│ 2. Resource Path Resolver    │ Tìm mole trong Bundle / App  │
│ 3. Mole Execution Engine     │ spawn("bash", [MOLE_CLI])    │
│ 4. HTTP & SSE Broadcaster    │ 127.0.0.1 loopback only      │
│ 5. Clean Shutdown Hook       │ process.on("SIGTERM")        │
└──────────────────────────────┴──────────────────────────────┘
```

---

## 4. Related Code Files
- **Modify:** `server/mole_bridge.ts` (Dynamic resource path resolution cho `MOLE_DIR`).
- **Modify:** `server/index.ts` (Port fallback loop & graceful shutdown).
- **Create:** `scripts/build-backend.sh` (Kịch bản build tự động `bun build --compile`).
- **Output:** `build/bin/tqd-backend` (Mach-O 64-bit executable arm64).

---

## 5. Implementation Steps
1. **Dynamic Path Resolution trong `server/mole_bridge.ts`**:
   ```typescript
   export function resolveMolePath(): string {
     if (process.env.TQD_MOLE_PATH && fs.existsSync(process.env.TQD_MOLE_PATH)) {
       return process.env.TQD_MOLE_PATH;
     }
     const bundleResourcesMole = path.resolve(path.dirname(process.execPath), "../Resources/mole");
     if (fs.existsSync(bundleResourcesMole)) return bundleResourcesMole;
     const devMole = path.resolve(__dirname, "../mole");
     if (fs.existsSync(devMole)) return devMole;
     throw new Error("Không tìm thấy lõi Mole trong gói ứng dụng.");
   }
   ```
2. **Port Fallback & Clean Shutdown trong `server/index.ts`**:
   - Thử `server.listen(port)`. Nếu gặp mã lỗi `EADDRINUSE`, tự động tăng `port++` (tối đa 5 lần).
   - Đăng ký `process.on('SIGTERM', ...)` và `process.on('SIGINT', ...)` để tiêu diệt sạch `spawnedChild` và đóng máy chủ.
3. **Viết kịch bản `scripts/build-backend.sh`**:
   ```bash
   mkdir -p build/bin
   bun build --compile --minify --target=bun-darwin-arm64 server/index.ts --outfile build/bin/tqd-backend
   chmod +x build/bin/tqd-backend
   ```
4. **Kiểm thử độc lập**:
   - Chạy `build/bin/tqd-backend` trong môi trường không có biến môi trường `PATH` chứa Bun/Node.

---

## 6. Todo Checklist
- [x] Cập nhật `server/mole_bridge.ts` để định vị động thư mục Mole.
- [x] Cập nhật `server/index.ts` hỗ trợ tự động nhảy port khi `EADDRINUSE`.
- [x] Thêm xử lý `SIGTERM` dọn sạch toàn bộ tiến trình con Mole.
- [x] Tạo file kịch bản `scripts/build-backend.sh`.
- [x] Biên dịch thử nghiệm `build/bin/tqd-backend` và xác minh bằng lệnh `file build/bin/tqd-backend`.
- [x] Test curl API `/api/telemetry` và `/api/scan` trực tiếp từ binary độc lập.

---

## 7. Success Criteria
- [x] File `build/bin/tqd-backend` được sinh ra, định dạng `Mach-O 64-bit executable arm64`.
- [x] Khởi chạy trực tiếp `./build/bin/tqd-backend` thành công mà không phụ thuộc lệnh `bun` trong terminal.
- [x] Khởi động chiếm cổng 42100, mở bản thứ 2 tự động nhảy sang 42101 mà không crash.
- [x] Gửi lệnh `kill -15 <pid>` thì backend tắt sạch trong dưới 200ms không rò rỉ tiến trình con.
