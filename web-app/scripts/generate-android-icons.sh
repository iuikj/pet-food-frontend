#!/usr/bin/env bash
# Android 应用图标生成脚本
#
# 用法：./generate-android-icons.sh <source_image>
#   source_image: 源图片路径（建议 1024x1024 PNG）
#
# 需要安装 ImageMagick: apt install imagemagick 或 brew install imagemagick

set -euo pipefail

SOURCE="${1:?Usage: generate-android-icons.sh <source_image>}"
ANDROID_RES="android/app/src/main/res"

if ! command -v convert &> /dev/null; then
    echo "ERROR: ImageMagick not found. Install it first:" >&2
    echo "  Ubuntu/Debian: sudo apt install imagemagick" >&2
    echo "  macOS: brew install imagemagick" >&2
    exit 1
fi

if [ ! -f "$SOURCE" ]; then
    echo "ERROR: Source image not found: $SOURCE" >&2
    exit 1
fi

echo "==> Generating Android launcher icons from $SOURCE"

# mipmap 尺寸定义
declare -A SIZES=(
    ["mdpi"]=48
    ["hdpi"]=72
    ["xhdpi"]=96
    ["xxhdpi"]=144
    ["xxxhdpi"]=192
)

for density in "${!SIZES[@]}"; do
    size=${SIZES[$density]}
    dir="$ANDROID_RES/mipmap-$density"

    echo "  → $density (${size}x${size})"

    # 标准图标
    convert "$SOURCE" -resize "${size}x${size}" "$dir/ic_launcher.png"

    # 圆形图标
    convert "$SOURCE" -resize "${size}x${size}" "$dir/ic_launcher_round.png"

    # 前景图标（用于 adaptive icon）
    convert "$SOURCE" -resize "${size}x${size}" "$dir/ic_launcher_foreground.png"
done

echo "==> Done! Icons generated in $ANDROID_RES/mipmap-*/"
echo ""
echo "Next steps:"
echo "  1. cd android && ./gradlew assembleDebug"
echo "  2. Install APK and check the app icon"
