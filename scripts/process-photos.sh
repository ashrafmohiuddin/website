#!/usr/bin/env bash
set -euo pipefail

# Seamless photo pipeline:
# 1) Read edited originals from a single folder
# 2) Generate web previews (orientation-safe)
# 3) Generate watermarked full-res copies (orientation-safe)
# 4) Copy originals into images/ for local fallback
# 5) Build data/photos.manifest.json
# 6) Optional sync to Cloudflare R2 via AWS CLI

if ! command -v magick >/dev/null 2>&1; then
  echo "ImageMagick is required (magick). Install via: brew install imagemagick"
  exit 1
fi

if [[ $# -lt 1 ]]; then
  echo "Usage: scripts/process-photos.sh <edited-folder> [--sync-r2]"
  exit 1
fi

SOURCE_DIR="$1"
SYNC_R2="false"
if [[ "${2:-}" == "--sync-r2" ]]; then
  SYNC_R2="true"
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGES_DIR="$ROOT_DIR/images"
PREVIEW_DIR="$IMAGES_DIR/low-res"
WATERMARKED_DIR="$IMAGES_DIR/watermarked"
MANIFEST_SCRIPT="$ROOT_DIR/scripts/build-photo-manifest.mjs"

mkdir -p "$IMAGES_DIR" "$PREVIEW_DIR" "$WATERMARKED_DIR"

echo "Processing photos from: $SOURCE_DIR"

watermark_with_fallback() {
  local input_file="$1"
  local output_file="$2"
  local watermark_text="$3"

  local -a fonts_to_try=()

  if [[ -n "${WATERMARK_FONT:-}" ]]; then
    fonts_to_try+=("$WATERMARK_FONT")
  fi

  fonts_to_try+=("Arial" "Helvetica" "DejaVu-Sans" "Times-New-Roman")

  for font_name in "${fonts_to_try[@]}"; do
    if magick "$input_file" \
      -auto-orient \
      -strip \
      -font "$font_name" \
      -gravity southeast \
      -fill "rgba(255,255,255,0.35)" \
      -pointsize 42 \
      -annotate +52+42 "$watermark_text" \
      "$output_file" >/dev/null 2>&1; then
      return 0
    fi
  done

  echo "Warning: could not find a usable font for watermark on $(basename "$input_file")."
  echo "Writing non-watermarked fallback copy for this file."
  magick "$input_file" -auto-orient -strip "$output_file"
}

shopt -s nullglob
for file in "$SOURCE_DIR"/*.{jpg,JPG,jpeg,JPEG,png,PNG,webp,WEBP}; do
  name="$(basename "$file")"

  # Copy full original export for local fallback / archive
  cp -f "$file" "$IMAGES_DIR/$name"

  # Preview for gallery grid (fast load). -auto-orient preserves intended orientation.
  magick "$file" \
    -auto-orient \
    -resize "1800x1800>" \
    -strip \
    -interlace Plane \
    -quality 72 \
    "$PREVIEW_DIR/$name"

  # Watermarked full-res for public downloads.
  watermark_with_fallback "$file" "$WATERMARKED_DIR/$name" "© Ashraf Mohiuddin"
done

echo "Building manifest..."
node "$MANIFEST_SCRIPT" --mode=hybrid --metadata=data/photos.metadata.json

if [[ "$SYNC_R2" == "true" ]]; then
  if ! command -v aws >/dev/null 2>&1; then
    echo "AWS CLI is required for R2 sync. Install via: brew install awscli"
    exit 1
  fi

  : "${R2_BUCKET:?Set R2_BUCKET env var}"
  : "${R2_ENDPOINT:?Set R2_ENDPOINT env var, e.g. https://<accountid>.r2.cloudflarestorage.com}"

  echo "Syncing originals to R2 photos/ ..."
  aws s3 sync "$IMAGES_DIR/" "s3://$R2_BUCKET/photos/" \
    --exclude "low-res/*" --exclude "watermarked/*" --exclude ".DS_Store" \
    --endpoint-url "$R2_ENDPOINT"

  echo "Syncing previews to R2 photos-previews/ ..."
  aws s3 sync "$PREVIEW_DIR/" "s3://$R2_BUCKET/photos-previews/" \
    --exclude ".DS_Store" \
    --endpoint-url "$R2_ENDPOINT"

  echo "Syncing watermarked downloads to R2 photos-watermarked/ ..."
  aws s3 sync "$WATERMARKED_DIR/" "s3://$R2_BUCKET/photos-watermarked/" \
    --exclude ".DS_Store" \
    --endpoint-url "$R2_ENDPOINT"

  echo "Rebuilding manifest for pure R2 delivery..."
  node "$MANIFEST_SCRIPT" --mode=r2 --previewPrefix=photos-previews --metadata=data/photos.metadata.json
fi

echo "Done."
echo "Next: deploy to Netlify (and if --sync-r2 was used, R2 is already updated)."
