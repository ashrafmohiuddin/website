#!/usr/bin/env bash
set -euo pipefail

# Wipe gallery prefixes on Cloudflare R2.
# Does not delete other bucket keys.
#
# Required env:
#   R2_BUCKET
#   R2_ENDPOINT   e.g. https://<accountid>.r2.cloudflarestorage.com
#   AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY  (R2 API token)
#
# Usage:
#   scripts/wipe-r2-photos.sh           # dry-run (lists objects)
#   scripts/wipe-r2-photos.sh --yes     # delete photos/, photos-previews/, photos-watermarked/

if ! command -v aws >/dev/null 2>&1; then
  echo "AWS CLI is required. Install via: brew install awscli"
  exit 1
fi

: "${R2_BUCKET:?Set R2_BUCKET}"
: "${R2_ENDPOINT:?Set R2_ENDPOINT}"

CONFIRM="${1:-}"
PREFIXES=(photos photos-previews photos-watermarked)

list_prefix() {
  local prefix="$1"
  echo "=== s3://$R2_BUCKET/$prefix/ ==="
  aws s3 ls "s3://$R2_BUCKET/$prefix/" --recursive --endpoint-url "$R2_ENDPOINT" || true
}

echo "Bucket: $R2_BUCKET"
echo "Endpoint: $R2_ENDPOINT"
echo

for prefix in "${PREFIXES[@]}"; do
  list_prefix "$prefix"
  echo
done

if [[ "$CONFIRM" != "--yes" ]]; then
  echo "Dry-run only. Re-run with --yes to delete those three prefixes:"
  echo "  R2_BUCKET=\"\$R2_BUCKET\" R2_ENDPOINT=\"\$R2_ENDPOINT\" scripts/wipe-r2-photos.sh --yes"
  exit 0
fi

for prefix in "${PREFIXES[@]}"; do
  echo "Deleting s3://$R2_BUCKET/$prefix/ ..."
  aws s3 rm "s3://$R2_BUCKET/$prefix/" --recursive --endpoint-url "$R2_ENDPOINT"
done

echo "R2 gallery prefixes wiped."
