#!/usr/bin/env bash
# Download Swiss Ephemeris data files (planets + Moon) for in-house astrology calculation.
# Run from backend directory: ./scripts/download-ephemeris.sh
# Or: TARGET_DIR=/var/syncro/ephe ./scripts/download-ephemeris.sh

TARGET_DIR="${TARGET_DIR:-ephe}"
BASE_URL="${BASE_URL:-https://github.com/aloistr/swisseph/raw/master/ephe}"

mkdir -p "$TARGET_DIR"

for r in 0 6 12 18 24 30 36 42 48 54 60 66 72 78 84 90 96 102 108 114 120 126 132 138 144 150 156 162; do
  for name in sepl semo; do
    f="${name}_$(printf '%03d' $r).se1"
    out="$TARGET_DIR/$f"
    if [ -f "$out" ]; then
      echo "Skip (exists): $f"
    else
      echo "Downloading $f ..."
      curl -sfL -o "$out" "$BASE_URL/$f" || echo "Warning: failed to download $f"
    fi
  done
done

echo "Done. Ephemeris files in: $(cd "$TARGET_DIR" && pwd)"
echo "Set SWISS_EPHEMERIS_PATH or app.astrology.ephemeris-path to this path."
