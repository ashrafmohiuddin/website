# Adding photos (quick guide)

## 1. Drop exports here

Export from Lightroom into:

```text
photos-inbox/
```

Do not commit those files. Git ignores everything in this folder except the empty placeholder.

## 2. Run the pipeline

From the repo root (`/developer/website` on your Mac):

```bash
scripts/process-photos.sh photos-inbox
```

That writes:

- `images/` — full originals (local copy)
- `images/low-res/` — gallery previews (safe to commit)
- `images/watermarked/` — download copies (prefer R2, not git)
- `data/photos.manifest.json` — gallery data (commit this)

Optional: add titles/categories in `data/photos.metadata.json` before or after processing, then re-run if needed.

## 3. What R2 does

With `--sync-r2` (and `R2_BUCKET` / `R2_ENDPOINT` set), the same script uploads originals, previews, and watermarked files to Cloudflare R2. The live site loads full-res and downloads from `img.sashraf.in`.

## 4. What gets deployed

Netlify deploys this repo (HTML, CSS, JS, manifest, and preferably `images/low-res/`). Full-res and watermarked images should come from R2, not from a huge git push.

Process + sync + deploy in one go:

```bash
R2_BUCKET="your-bucket" R2_ENDPOINT="https://<accountid>.r2.cloudflarestorage.com" \
  scripts/publish-photography.sh photos-inbox --site-id=<netlify-site-id> --sync-r2 --prod
```

More detail: [README.md](README.md).
