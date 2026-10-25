# Adding photos (quick guide)

Clean-slate intake. The old `ASH*` set is gone. The gallery stays empty until you add new edited files.

## 1. Drop exports

Put edited JPEGs (or PNG/WebP) in:

```text
photos-drop/
```

On your Mac that is `/developer/website/photos-drop/`. Git ignores the image files.

## 2. Fill metadata

Edit `photos-drop/metadata.json`. One object per photo. **`skip: true`** entries (the example and the empty template) are ignored — copy the template, set `"skip": false` or delete that field, and fill real values.

```json
{
  "filename": "goa-beach.jpg",
  "title": "Summer Beach Day at Goa",
  "alt": "Evening light on a Goa beach",
  "category": "landscape",
  "tags": ["nature", "landscape", "travel"]
}
```

- `filename` must match the file in `photos-drop/` exactly (including `.jpg` vs `.JPG`)
- `category` is the dropdown (one value: `nature`, `landscape`, `portraits`, `wildlife`, `travel`, or your own)
- `tags` is an array (or a comma-separated string). Filter chips come from these.
- Gallery order is the order of entries in this file

## 3. Process

From `/developer/website`:

```bash
scripts/process-photos.sh
```

That reads **only** `photos-drop/` + `photos-drop/metadata.json` and writes:

- `images/` — local full copies (gitignored)
- `images/low-res/` — gallery previews (safe to commit)
- `images/watermarked/` — download copies (gitignored; prefer R2)
- `data/photos.manifest.json` — gallery data (commit this)

## 4. Optional R2 sync

```bash
R2_BUCKET="your-bucket" \
R2_ENDPOINT="https://<accountid>.r2.cloudflarestorage.com" \
scripts/process-photos.sh --sync-r2
```

**First time after this rebuild:** wipe the old R2 prefixes before syncing. See [README.md](README.md#r2-clean-slate-wipe) or `scripts/wipe-r2-photos.sh`.

## 5. Deploy

```bash
R2_BUCKET="your-bucket" R2_ENDPOINT="https://<accountid>.r2.cloudflarestorage.com" \
  scripts/publish-photography.sh --site-id=<netlify-site-id> --sync-r2 --prod
```
