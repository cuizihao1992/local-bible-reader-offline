#!/bin/sh
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/ios/LocalBible"
DATA="${BIBLE_DATA_ROOT:-/Volumes/D/bibleDownload}"
if [ ! -d "$DATA/bibles" ]; then
  DATA="${BIBLE_DATA_ROOT:-$HOME/bibleDownload}"
fi

mkdir -p "$DEST/www" "$DEST/bibles" "$DEST/orig" "$DEST/dictionaries" "$DEST/commentaries"

rm -rf "$DEST/www"
mkdir -p "$DEST/www"
cp -R "$ROOT/static/." "$DEST/www/"
rm -f "$DEST/www/ai-defaults.js"

if [ -d "$DATA/bibles" ]; then
  for f in "$DATA/bibles/"*.db; do
    base="$(basename "$f")"
    case "$base" in
      KJV.db|WEB.db|*和合本*.db) cp "$f" "$DEST/bibles/" ;;
    esac
  done
fi

if [ -f "$DATA/orig/cbol.db" ]; then
  cp "$DATA/orig/cbol.db" "$DEST/orig/"
fi

if [ -d "$DATA/cd" ]; then
  find "$DATA/cd" -maxdepth 1 -name "*.db" -size -20M -exec cp {} "$DEST/dictionaries/" \;
fi

echo "iOS assets synced to $DEST"
echo "www index: $([ -f "$DEST/www/index.html" ] && echo ok || echo MISSING)"
echo "bibles: $(ls "$DEST/bibles"/*.db 2>/dev/null | wc -l | tr -d ' ')"
