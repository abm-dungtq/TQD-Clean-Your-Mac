#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================================="
echo "  📦 BIÊN DỊCH STANDALONE BACKEND CORE CHO TQD-CLEAN MAC   "
echo "=========================================================="

mkdir -p build/bin

# 1. Đảm bảo giao diện Cyber-HUD đã được biên dịch tĩnh
if [ ! -d "frontend/dist" ] || [ ! -f "frontend/dist/index.html" ]; then
    echo "⚡ Biên dịch frontend Cyber-HUD..."
    (cd frontend && npm run build)
fi

# 2. Biên dịch server/index.ts thành binary Mach-O độc lập
echo "🔨 Đang biên dịch Mach-O ARM64 binary qua bun build --compile..."
bun build --compile --minify --target=bun-darwin-arm64 server/index.ts --outfile build/bin/tqd-backend
chmod +x build/bin/tqd-backend

echo "✅ Biên dịch thành công!"
ls -lh build/bin/tqd-backend
file build/bin/tqd-backend
