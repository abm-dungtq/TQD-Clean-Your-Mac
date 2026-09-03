#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SCRIPT_DIR"

APP_NAME="TQD-Clean Your Mac"
APP_BUNDLE="build/${APP_NAME}.app"
TEMP_DMG="/tmp/tqd-clean-temp.dmg"
OUTPUT_DIR="dist-package"
FINAL_DMG="${OUTPUT_DIR}/TQD-Clean-Your-Mac.dmg"
VOL_NAME="TQD-Clean Your Mac"

echo "=========================================================="
echo "  💿 ĐÓNG GÓI ẢNH ĐĨA TỰ CHỨA MACOS: ${FINAL_DMG}          "
echo "=========================================================="

# 1. Kiểm tra App Bundle
if [ ! -d "$APP_BUNDLE" ]; then
    echo "⚡ Chưa tìm thấy App Bundle. Đang khởi chạy đóng gói..."
    bash scripts/build-app-bundle.sh
fi

# 2. Dọn dẹp tệp cũ
rm -f "$TEMP_DMG"
rm -f "$FINAL_DMG"
mkdir -p "$OUTPUT_DIR"

# Tháo gỡ volume cũ nếu còn mount
if [ -d "/Volumes/${VOL_NAME}" ]; then
    echo "⚡ Tháo gỡ volume cũ đang mount..."
    hdiutil detach "/Volumes/${VOL_NAME}" -force 2>/dev/null || true
fi

# 3. Tạo ảnh đĩa tạm thời Read-Write (140MB)
echo "📦 Khởi tạo đĩa ảo tạm thời..."
hdiutil create -size 140m -fs HFS+ -volname "$VOL_NAME" -ov "$TEMP_DMG" >/dev/null

# 4. Mount đĩa ảo
echo "🔌 Gắn kết đĩa ảo vào hệ điều hành..."
MOUNT_OUTPUT=$(hdiutil attach -readwrite -noverify -noautoopen "$TEMP_DMG")
MOUNT_POINT=$(echo "$MOUNT_OUTPUT" | grep -o '/Volumes/.*' | head -n 1)

if [ -z "$MOUNT_POINT" ] || [ ! -d "$MOUNT_POINT" ]; then
    echo "❌ Lỗi: Không thể gắn kết đĩa ảo."
    exit 1
fi

echo "📂 Chuẩn bị ứng dụng và ký số bên trong đĩa ảo..."
xattr -cr "$APP_BUNDLE"
codesign --remove-signature "${APP_BUNDLE}/Contents/Resources/bin/tqd-backend" 2>/dev/null || true
codesign --force -s - "${APP_BUNDLE}/Contents/Resources/bin/tqd-backend"

codesign --remove-signature "${APP_BUNDLE}/Contents/MacOS/TQD-Clean" 2>/dev/null || true
codesign --force -s - "${APP_BUNDLE}/Contents/MacOS/TQD-Clean"

codesign --force -s - "${APP_BUNDLE}"
cp -R "$APP_BUNDLE" "${MOUNT_POINT}/"

echo "🔗 Tạo liên kết tắt tới /Applications..."
ln -s /Applications "${MOUNT_POINT}/Applications"

# 5. Cài đặt hình nền và biểu tượng volume
echo "🎨 Thiết lập hình nền trực quan Cyber-Canvas..."
mkdir -p "${MOUNT_POINT}/.background"
if [ -f "assets/dmg-background.png" ]; then
    cp "assets/dmg-background.png" "${MOUNT_POINT}/.background/background.png"
fi

if [ -f "assets/AppIcon.icns" ]; then
    cp "assets/AppIcon.icns" "${MOUNT_POINT}/.VolumeIcon.icns"
fi

# 6. Tinh chỉnh bố cục Finder qua AppleScript
echo "📐 Tinh chỉnh vị trí icon và kích thước cửa sổ Finder..."
osascript << APPLESCRIPT || true
tell application "Finder"
    tell disk "${VOL_NAME}"
        open
        set current view of container window to icon view
        set toolbar visible of container window to false
        set statusbar visible of container window to false
        set the bounds of container window to {200, 120, 860, 560}
        set theViewOptions to the icon view options of container window
        set icon size of theViewOptions to 128
        try
            set background picture of theViewOptions to file ".background:background.png"
        end try
        try
            set position of item "${APP_NAME}.app" of container window to {180, 190}
            set position of item "Applications" of container window to {480, 190}
        end try
        close
        open
        update without registering applications
        delay 1
    end tell
end tell
APPLESCRIPT

# 7. Đồng bộ dữ liệu xuống đĩa và unmount
echo "💾 Đồng bộ hóa và đóng đĩa ảo..."
sync
sleep 1
hdiutil detach "$MOUNT_POINT" -force >/dev/null

# 8. Nén thành DMG hoàn chỉnh (UDZO zlib-level 9)
echo "🗜️  Nén ảnh đĩa sang định dạng phân phối cuối cùng (Read-Only Compressed)..."
hdiutil convert "$TEMP_DMG" -format UDZO -imagekey zlib-level=9 -o "$FINAL_DMG" >/dev/null
rm -f "$TEMP_DMG"

echo "=========================================================="
echo "🎉 ĐÓNG GÓI DMG THÀNH CÔNG!"
echo "   👉 Tệp tin: ${FINAL_DMG}"
ls -lh "$FINAL_DMG"
echo "=========================================================="
