#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "🔨 Building buzz-notify for Windows (x86_64, GUI subsystem - zero console flash)..."
mkdir -p dist
GOOS=windows GOARCH=amd64 go build -ldflags="-H=windowsgui -s -w" -o dist/buzz-notify.exe .

echo "🔨 Building buzz-notify for current OS ($(uname -s)-$(uname -m))..."
go build -ldflags="-s -w" -o dist/buzz-notify .

echo "✅ Build hoàn tất!"
ls -lh dist/
