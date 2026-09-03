#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SCRIPT_DIR"

APP_NAME="TQD-Clean Your Mac"
APP_BUNDLE="build/${APP_NAME}.app"

echo "=========================================================="
echo "  🍎 ĐÓNG GÓI MACOS APP BUNDLE: ${APP_BUNDLE}             "
echo "=========================================================="

# 1. Đảm bảo backend đã được biên dịch
if [ ! -f "build/bin/tqd-backend" ]; then
    echo "⚡ Biên dịch tqd-backend..."
    bash scripts/build-backend.sh
fi

# 2. Biên dịch Native Shell từ mã nguồn mới nhất
echo "⚡ Biên dịch native/main.swift..."
swiftc native/main.swift -o build/bin/TQD-Clean -framework Cocoa -framework WebKit

# 3. Tạo cấu trúc thư mục .app chuẩn macOS
echo "📁 Chuẩn bị cấu trúc thư mục App Bundle..."
rm -rf "$APP_BUNDLE"
mkdir -p "${APP_BUNDLE}/Contents/MacOS"
mkdir -p "${APP_BUNDLE}/Contents/Resources/bin"
mkdir -p "${APP_BUNDLE}/Contents/Resources/mole"
mkdir -p "${APP_BUNDLE}/Contents/Resources/frontend"

# 4. Sao chép các tệp thực thi và cấu hình
echo "📋 Sao chép tệp nhị phân và tài nguyên..."
cp "build/bin/TQD-Clean" "${APP_BUNDLE}/Contents/MacOS/TQD-Clean"
chmod +x "${APP_BUNDLE}/Contents/MacOS/TQD-Clean"

cp "build/bin/tqd-backend" "${APP_BUNDLE}/Contents/Resources/bin/tqd-backend"
chmod +x "${APP_BUNDLE}/Contents/Resources/bin/tqd-backend"

cp "native/Info.plist" "${APP_BUNDLE}/Contents/Info.plist"

# Sao chép biểu tượng nếu có
if [ -f "assets/AppIcon.icns" ]; then
    cp "assets/AppIcon.icns" "${APP_BUNDLE}/Contents/Resources/AppIcon.icns"
fi

# 5. Sao chép lõi Mole scripts
echo "📦 Tích hợp lõi tw93/mole..."
cp -R mole/* "${APP_BUNDLE}/Contents/Resources/mole/"
chmod +x "${APP_BUNDLE}/Contents/Resources/mole/mole"
find "${APP_BUNDLE}/Contents/Resources/mole/bin" -type f -exec chmod +x {} + 2>/dev/null || true

# 6. Sao chép frontend dist
echo "🎨 Tích hợp giao diện Cyber-HUD..."
cp -R frontend/dist/* "${APP_BUNDLE}/Contents/Resources/frontend/"

# 7. Ký mã số học chuẩn macOS inside-out (KHÔNG dùng --deep để tránh làm hỏng binary Bun)
echo "🔏 Ký mã số học Inside-Out cho App Bundle..."
# Dọn sạch các thuộc tính mở rộng (quarantine, provenance)
xattr -cr "${APP_BUNDLE}"

# Xóa chữ ký cũ của Bun và ký lại hợp lệ
codesign --remove-signature "${APP_BUNDLE}/Contents/Resources/bin/tqd-backend" 2>/dev/null || true
codesign --force -s - "${APP_BUNDLE}/Contents/Resources/bin/tqd-backend"

codesign --remove-signature "${APP_BUNDLE}/Contents/MacOS/TQD-Clean" 2>/dev/null || true
codesign --force -s - "${APP_BUNDLE}/Contents/MacOS/TQD-Clean"

codesign --force -s - "${APP_BUNDLE}"

# Xác thực chữ ký số hợp lệ
codesign -vvv "${APP_BUNDLE}/Contents/Resources/bin/tqd-backend"
codesign --verify --deep --strict -vvv "${APP_BUNDLE}"

echo "✅ Hoàn tất đóng gói App Bundle thành công tại:"
echo "   👉 ${APP_BUNDLE}"
