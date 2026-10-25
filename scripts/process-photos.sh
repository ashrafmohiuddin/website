#!/usr/bin/env bash
set -euo pipefail

# Seamless photo pipeline:
# 1) Read edited originals from photos-drop/ (or an explicit folder)
# 2) Generate web previews (orientation-safe)
# 3) Generate watermarked full-res copies (orientation-safe)
# 4) Copy originals into images/ for local fallback
# 5) Build data/photos.manifest.json from photos-drop/metadata.json
# 6) Optional sync to Cloudflare R2 via AWS CLI

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_DIR="$ROOT_DIR/photos-drop"
SYNC_R2="false"

for arg in "$@"; do
  case "$arg" in
    --sync-r2)
      SYNC_R2="true"
      ;;
    --help|-h)
      echo "Usage: scripts/process-photos.sh [edited-folder] [--sync-r2]"
      echo "Default folder: photos-drop/"
      exit 0
      ;;
    *)
      SOURCE_DIR="$arg"
      ;;
  esac
done

if [[ "$SOURCE_DIR" != /* ]]; then
  SOURCE_DIR="$ROOT_DIR/$SOURCE_DIR"
fi

IMAGES_DIR="$ROOT_DIR/images"
PREVIEW_DIR="$IMAGES_DIR/low-res"
WATERMARKED_DIR="$IMAGES_DIR/watermarked"
MANIFEST_SCRIPT="$ROOT_DIR/scripts/build-photo-manifest.mjs"
METADATA_FILE="$ROOT_DIR/photos-drop/metadata.json"

if [[ ! -d "$SOURCE_DIR" ]]; then
  echo "Drop folder not found: $SOURCE_DIR"
  exit 1
fi

if [[ ! -f "$METADATA_FILE" ]]; then
  echo "Metadata file not found: $METADATA_FILE"
  exit 1
fi

mkdir -p "$IMAGES_DIR" "$PREVIEW_DIR" "$WATERMARKED_DIR"

echo "Processing photos from: $SOURCE_DIR"
echo "Metadata: $METADATA_FILE"

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

processed=0
shopt -s nullglob
drop_files=("$SOURCE_DIR"/*.{jpg,JPG,jpeg,JPEG,png,PNG,webp,WEBP})
if [[ ${#drop_files[@]} -gt 0 && ! -e "${drop_files[0]}" ]]; then
  drop_files=()
fi

if [[ ${#drop_files[@]} -gt 0 ]] && ! command -v magick >/dev/null 2>&1; then
  echo "ImageMagick is required (magick). Install via: brew install imagemagick"
  exit 1
fi

for file in "${drop_files[@]}"; do
  [[ -e "$file" ]] || continue
  name="$(basename "$file")"

  cp -f "$file" "$IMAGES_DIR/$name"

  magick "$file" \
    -auto-orient \
    -resize "1800x1800>" \
    -strip \
    -interlace Plane \
    -quality 72 \
    "$PREVIEW_DIR/$name"

  watermark_with_fallback "$file" "$WATERMARKED_DIR/$name" "© Ashraf Mohiuddin"
  processed=$((processed + 1))
done

if [[ "$processed" -eq 0 ]]; then
  echo "No image files in drop folder. Manifest will be empty until you add photos."
fi

echo "Building manifest..."
node "$MANIFEST_SCRIPT" \
  --mode=hybrid \
  --sourceDir="$SOURCE_DIR" \
  --metadata="$METADATA_FILE"

if [[ "$SYNC_R2" == "true" ]]; then
  if ! command -v aws >/dev/null 2>&1; then
    echo "AWS CLI is required for R2 sync. Install via: brew install awscli"
    exit 1
  fi

  : "${R2_BUCKET:?Set R2_BUCKET env var}"
  : "${R2_ENDPOINT:?Set R2_ENDPOINT env var, e.g. https://<accountid>.r2.cloudflarestorage.com}"

  echo "Syncing originals to R2 photos/ ..."
  aws s3 sync "$IMAGES_DIR/" "s3://$R2_BUCKET/photos/" \
    --exclude "low-res/*" --exclude "watermarked/*" --exclude ".DS_Store" --exclude "other/*" \
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
  node "$MANIFEST_SCRIPT" \
    --mode=r2 \
    --sourceDir="$SOURCE_DIR" \
    --previewPrefix=photos-previews \
    --metadata="$METADATA_FILE"
fi

echo "Done. Photos processed: $processed"
echo "Next: commit data/photos.manifest.json (and images/low-res/ if you want git-hosted previews), then deploy."
