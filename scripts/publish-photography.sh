#!/usr/bin/env bash
set -euo pipefail

# One-command publish:
# - process photos from photos-drop/ (or an explicit folder)
# - (optional) sync to R2
# - deploy site to Netlify
#
# Usage:
# scripts/publish-photography.sh [edited-folder] --site-id=<netlify-site-id> [--prod] [--sync-r2]

SOURCE_DIR=""
SITE_ID=""
PROD="false"
SYNC_R2="false"

for arg in "$@"; do
  case "$arg" in
    --site-id=*)
      SITE_ID="${arg#*=}"
      ;;
    --prod)
      PROD="true"
      ;;
    --sync-r2)
      SYNC_R2="true"
      ;;
    --help|-h)
      echo "Usage: scripts/publish-photography.sh [edited-folder] --site-id=<netlify-site-id> [--prod] [--sync-r2]"
      echo "Default folder: photos-drop/"
      exit 0
      ;;
    *)
      if [[ -z "$SOURCE_DIR" ]]; then
        SOURCE_DIR="$arg"
      else
        echo "Unknown option: $arg"
        exit 1
      fi
      ;;
  esac
done

if [[ -z "$SITE_ID" ]]; then
  echo "--site-id is required."
  exit 1
fi

if ! command -v netlify >/dev/null 2>&1; then
  echo "Netlify CLI required. Install: npm i -g netlify-cli"
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ -z "$SOURCE_DIR" ]]; then
  SOURCE_DIR="$ROOT_DIR/photos-drop"
fi

echo "Step 1/3: Processing photos..."
if [[ "$SYNC_R2" == "true" ]]; then
  "$ROOT_DIR/scripts/process-photos.sh" "$SOURCE_DIR" --sync-r2
else
  "$ROOT_DIR/scripts/process-photos.sh" "$SOURCE_DIR"
fi

echo "Step 2/3: Preparing Netlify deploy..."
NETLIFY_CMD=(netlify deploy --dir="$ROOT_DIR" --site="$SITE_ID")
if [[ "$PROD" == "true" ]]; then
  NETLIFY_CMD+=(--prod)
fi

echo "Step 3/3: Deploying..."
"${NETLIFY_CMD[@]}"

echo "Publish complete."
