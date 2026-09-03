#!/bin/bash
# ==============================================================================
#  🛡️ TQD-Clean Your Mac - Upstream Mole Synchronization Engine
#  Tự động hóa đồng bộ mã nguồn & nhị phân từ https://github.com/tw93/mole
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SCRIPT_DIR"

UPSTREAM_REPO="tw93/mole"
TARGET_TAG="${1:-latest}"

echo "=========================================================="
echo "  🔄 ĐỒNG BỘ HÓA LÕI TW93/MOLE CHO TQD-CLEAN YOUR MAC    "
echo "=========================================================="

# 1. Xác định phiên bản hiện tại trong dự án
CURRENT_VERSION="Chưa cài đặt"
if [ -f "mole/mole" ]; then
    CURRENT_VERSION=$(grep 'VERSION=' mole/mole | head -n 1 | cut -d'"' -f2 || echo "v1.53.0")
fi
echo "📌 Phiên bản Mole hiện tại trong repo: v${CURRENT_VERSION}"

# 2. Truy vấn phiên bản mới nhất từ GitHub Releases API
echo "🔍 Đang kiểm tra phiên bản mới từ https://github.com/${UPSTREAM_REPO}..."

if [ "$TARGET_TAG" = "latest" ]; then
    RELEASE_JSON=$(curl -fsSL "https://api.github.com/repos/${UPSTREAM_REPO}/releases/latest" 2>/dev/null || echo "")
    if [ -z "$RELEASE_JSON" ]; then
        echo "❌ Không thể kết nối đến GitHub API (kiểm tra lại mạng hoặc rate limit)."
        exit 1
    fi
    TAG_NAME=$(echo "$RELEASE_JSON" | grep '"tag_name":' | head -n 1 | sed -E 's/.*"([^"]+)".*/\1/')
else
    TAG_NAME="$TARGET_TAG"
    RELEASE_JSON=$(curl -fsSL "https://api.github.com/repos/${UPSTREAM_REPO}/releases/tags/${TAG_NAME}" 2>/dev/null || echo "")
fi

CLEAN_TAG="${TAG_NAME#v}"
CLEAN_TAG="${CLEAN_TAG#V}"
echo "✨ Phiên bản Upstream phát hiện: ${TAG_NAME} (v${CLEAN_TAG})"

if [ "v${CURRENT_VERSION}" = "v${CLEAN_TAG}" ] && [ "${FORCE:-0}" != "1" ]; then
    echo "✅ Kho mã nguồn đã ở phiên bản Mole mới nhất (v${CURRENT_VERSION})."
    echo "💡 Mẹo: Chạy 'FORCE=1 bash scripts/sync-upstream-mole.sh' nếu muốn đồng bộ lại."
    exit 0
fi

# 3. Tạo thư mục làm việc tạm thời
TMP_DIR=$(mktemp -d /tmp/tqd-mole-sync.XXXXXX)
trap 'rm -rf "$TMP_DIR"' EXIT

echo "📁 Thư mục tạm thời: ${TMP_DIR}"

# 4. Tải mã nguồn chính thức (Source Tarball)
echo "⬇️  Đang tải mã nguồn tw93/mole (${TAG_NAME})..."
TARBALL_URL="https://github.com/${UPSTREAM_REPO}/archive/refs/tags/${TAG_NAME}.tar.gz"
curl -fsSL "$TARBALL_URL" -o "${TMP_DIR}/source.tar.gz"

echo "📦 Đang giải nén mã nguồn..."
mkdir -p "${TMP_DIR}/source"
tar -xzf "${TMP_DIR}/source.tar.gz" -C "${TMP_DIR}/source" --strip-components=1

# 5. Tải nhị phân Go cho Darwin ARM64 (Apple Silicon) & x86_64
echo "⬇️  Đang kiểm tra và tải nhị phân biên dịch sẵn (Go binaries)..."
ARM64_BINARIES_URL="https://github.com/${UPSTREAM_REPO}/releases/download/${TAG_NAME}/binaries-darwin-arm64.tar.gz"

if curl -fsSL -I "$ARM64_BINARIES_URL" >/dev/null 2>&1; then
    echo "📦 Tải binaries-darwin-arm64.tar.gz..."
    curl -fsSL "$ARM64_BINARIES_URL" -o "${TMP_DIR}/binaries-arm64.tar.gz"
    mkdir -p "${TMP_DIR}/binaries"
    tar -xzf "${TMP_DIR}/binaries-arm64.tar.gz" -C "${TMP_DIR}/binaries"
    
    # Đặt đúng vị trí analyze-go và status-go
    if [ -f "${TMP_DIR}/binaries/analyze-darwin-arm64" ]; then
        cp "${TMP_DIR}/binaries/analyze-darwin-arm64" "${TMP_DIR}/source/bin/analyze-go"
        chmod +x "${TMP_DIR}/source/bin/analyze-go"
        echo "   ✓ Đã tích hợp analyze-go (arm64)"
    fi
    if [ -f "${TMP_DIR}/binaries/status-darwin-arm64" ]; then
        cp "${TMP_DIR}/binaries/status-darwin-arm64" "${TMP_DIR}/source/bin/status-go"
        chmod +x "${TMP_DIR}/source/bin/status-go"
        echo "   ✓ Đã tích hợp status-go (arm64)"
    fi
else
    echo "ℹ️  Không có release asset binaries-darwin-arm64, kiểm tra analyze-darwin-arm64 riêng..."
    ANALYZE_URL="https://github.com/${UPSTREAM_REPO}/releases/download/${TAG_NAME}/analyze-darwin-arm64"
    if curl -fsSL -I "$ANALYZE_URL" >/dev/null 2>&1; then
        curl -fsSL "$ANALYZE_URL" -o "${TMP_DIR}/source/bin/analyze-go"
        chmod +x "${TMP_DIR}/source/bin/analyze-go"
        echo "   ✓ Đã tải analyze-go riêng lẻ"
    fi
fi

# 6. Đồng bộ có chọn lọc vào thư mục mole/ của TQD-Clean
echo "🔄 Cập nhật thư mục mole/ trong dự án..."
mkdir -p mole
rsync -av --delete \
    --exclude '.git' \
    --exclude '.github' \
    --exclude '.claude' \
    --exclude '.cursor' \
    --exclude '.agents' \
    "${TMP_DIR}/source/" mole/

# 7. Cấp quyền thực thi đầy đủ
echo "🔑 Cấp quyền thực thi cho các script & nhị phân..."
chmod +x mole/mole mole/mo mole/install.sh || true
find mole/bin -type f -exec chmod +x {} + 2>/dev/null || true
find mole/lib -type f -name "*.sh" -exec chmod +x {} + 2>/dev/null || true

# 8. Kiểm định tương thích & Khói (Smoke Testing)
echo "🧪 Chạy kiểm thử khói (Smoke Test)..."
MOLE_TEST_VERSION=$(bash mole/mole version 2>/dev/null | grep 'Mole version' | head -n 1 || echo "Không xác định")
echo "   ✓ Phiên bản phản hồi: ${MOLE_TEST_VERSION}"

echo "🧪 Kiểm tra lệnh dọn dẹp (Dry-run test)..."
DRY_RUN_OUTPUT=$(bash mole/mole clean --dry-run 2>&1 || true)

if echo "$DRY_RUN_OUTPUT" | grep -q "➤"; then
    echo "   ✓ Phát hiện ký tự phân mục '➤' - Tương thích hoàn toàn với server/mole_bridge.ts!"
else
    echo "   ⚠️ Cảnh báo: Ký tự phân mục có thể đã thay đổi. Kiểm tra lại server/mole_bridge.ts."
fi

echo "=========================================================="
echo "  🎉 ĐỒNG BỘ THÀNH CÔNG LÕI TW93/MOLE V${CLEAN_TAG}!      "
echo "=========================================================="
echo ""
echo "Các bước tiếp theo dành cho Bạn (Maintainer):"
echo "1. Đóng gói lại App Bundle:"
echo "   bash scripts/build-app-bundle.sh"
echo "2. Đóng gói tệp DMG phân phối:"
echo "   bash scripts/package-dmg.sh"
echo "3. Kiểm tra ứng dụng:"
echo "   open 'build/TQD-Clean Your Mac.app'"
echo "4. Commit & Đẩy lên GitHub Release:"
echo "   git add mole/"
echo "   git commit -m 'chore(mole): nâng cấp lõi upstream tw93/mole lên v${CLEAN_TAG}'"
echo "   git tag v1.x.y && git push origin main --tags"
echo "=========================================================="
