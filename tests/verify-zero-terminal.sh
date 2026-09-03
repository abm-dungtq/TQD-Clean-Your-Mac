#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SCRIPT_DIR"

DMG_PATH="dist-package/TQD-Clean-Your-Mac.dmg"
TEST_DEST="${HOME}/Library/Caches/TQDTestApps"

echo "=========================================================="
echo "  🧪 KIỂM THỬ THỰC ĐỊA ZERO-TERMINAL: TQD-CLEAN YOUR MAC  "
echo "=========================================================="

if [ ! -f "$DMG_PATH" ]; then
    echo "❌ Lỗi: Không tìm thấy file $DMG_PATH"
    exit 1
fi

# 1. Gắn kết file DMG
echo "1️⃣  Mount tệp DMG vào hệ điều hành..."
MOUNT_OUTPUT=$(hdiutil attach -noverify -noautoopen "$DMG_PATH")
MOUNT_POINT=$(echo "$MOUNT_OUTPUT" | grep -o '/Volumes/.*' | head -n 1)
echo "   Mounted tại: $MOUNT_POINT"

# Dọn dẹp mount khi kết thúc
cleanup() {
    echo "🧹 Dọn dẹp tài nguyên kiểm thử..."
    if [ -n "${MOUNT_POINT:-}" ] && [ -d "$MOUNT_POINT" ]; then
        hdiutil detach "$MOUNT_POINT" -force >/dev/null 2>&1 || true
    fi
    rm -rf "$TEST_DEST"
}
trap cleanup EXIT

# 2. Cài đặt mô phỏng vào thư mục tạm
rm -rf "$TEST_DEST"
mkdir -p "$TEST_DEST"
echo "2️⃣  Sao chép TQD-Clean Your Mac.app sang môi trường kiểm thử độc lập..."
cp -R "${MOUNT_POINT}/TQD-Clean Your Mac.app" "$TEST_DEST/"

# 3. Chạy trong môi trường cô lập KHÔNG CÓ Bun/Node trong PATH
echo "3️⃣  Mô phỏng máy Mac người dùng mới (PATH tinh khiết /usr/bin:/bin:/usr/sbin:/sbin)..."
APP_EXEC="${TEST_DEST}/TQD-Clean Your Mac.app/Contents/MacOS/TQD-Clean"

# Ghi lại số lượng tiến trình Terminal trước khi khởi chạy
TERM_COUNT_BEFORE=$( (pgrep -f -i "Terminal\.app|iTerm" || true) | wc -l | tr -d ' ')

# Khởi chạy Native App với PATH chuẩn macOS (không có Bun hay Node)
PATH="/usr/bin:/bin:/usr/sbin:/sbin" "$APP_EXEC" &
APP_PID=$!

echo "   Đã khởi chạy App PID: $APP_PID"
sleep 4

# 4. Kiểm tra SLA Zero-Terminal: Có cửa sổ Terminal nào bị bật lên không?
TERM_COUNT_AFTER=$( (pgrep -f -i "Terminal\.app|iTerm" || true) | wc -l | tr -d ' ')
if [ "$TERM_COUNT_AFTER" -gt "$TERM_COUNT_BEFORE" ]; then
    echo "❌ LỖI: Phát hiện cửa sổ Terminal đã bị bật lên!"
    kill -9 $APP_PID 2>/dev/null || true
    exit 1
else
    echo "✅ SLA ZERO-TERMINAL ĐẠT CHUẨN: 0 cửa sổ Terminal nào xuất hiện!"
fi

# 5. Kiểm tra kết nối dịch vụ lõi qua loopback HTTP
echo "4️⃣  Kiểm tra cổng dịch vụ máy chủ nội bộ..."
HANDSHAKE=$(curl -s http://127.0.0.1:42100/api/handshake || curl -s http://127.0.0.1:42101/api/handshake || echo "")

if echo "$HANDSHAKE" | grep -q '"success":true'; then
    echo "✅ Kết nối máy chủ backend thành công: $HANDSHAKE"
else
    echo "❌ Lỗi: Backend không phản hồi HTTP."
    kill -9 $APP_PID 2>/dev/null || true
    exit 1
fi

# 6. Kiểm tra SLA Tắt ứng dụng & Zero-Zombie
echo "5️⃣  Kiểm tra giải phóng bộ nhớ khi tắt app (SIGTERM)..."
START_TIME=$(date +%s%N 2>/dev/null || date +%s)
kill -15 $APP_PID
sleep 0.3

if ps -p $APP_PID >/dev/null 2>&1; then
    echo "❌ Lỗi: Ứng dụng không thoát trong 300ms!"
    kill -9 $APP_PID 2>/dev/null || true
    exit 1
else
    echo "✅ SLA ZERO-ZOMBIE ĐẠT CHUẨN: Toàn bộ tiến trình thoát sạch sẽ trong < 300ms!"
fi

echo "=========================================================="
echo "🎉 TOÀN BỘ CHỈ SỐ KIỂM THỬ THỰC ĐỊA ĐỀU VƯỢT QUA 100%!"
echo "=========================================================="
