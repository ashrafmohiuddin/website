# Photography Workflow (Folder -> Website)

**New photos:** drop edited files in `photos-drop/`, list them in `photos-drop/metadata.json`, then follow [PHOTOS.md](PHOTOS.md).

This is a clean-slate pipeline. The previous `ASH*` / dated gallery set has been removed from the repo. The live gallery will be empty until you add new photos and process them.

1. Export edited photos from Lightroom into `photos-drop/`
2. Add one metadata row per file (filename, title, category, tags)
3. Run one script to create:
   - compressed previews for gallery loading
   - watermarked full-resolution download copies
   - metadata-driven manifest (`data/photos.manifest.json`)
4. Optional R2 sync
5. Deploy to Netlify (`photography.sashraf.in` or `sashraf.in/photography`)

## Important Files

- `photos-drop/` — drop folder for edited JPEGs (images are gitignored)
- `photos-drop/metadata.json` — source of truth for titles, categories, tags, and gallery order
- `photography.html` — masonry gallery + lightbox + category/tag filters
- `data/photos.manifest.json` — auto-generated gallery data (do not hand edit)
- `scripts/process-photos.sh` — main processing pipeline
- `scripts/publish-photography.sh` — process + deploy in one command
- `scripts/build-photo-manifest.mjs` — manifest generator
- `scripts/wipe-r2-photos.sh` — dry-run / wipe old R2 gallery prefixes

## Install Requirements (Mac)

```bash
brew install imagemagick awscli
npm i -g netlify-cli
```

Also run once:

```bash
netlify login
```

## Metadata schema

`photos-drop/metadata.json`:

```json
{
  "photos": [
    {
      "filename": "goa-beach.jpg",
      "title": "Summer Beach Day at Goa",
      "alt": "Evening light on a Goa beach",
      "category": "landscape",
      "tags": ["nature", "landscape", "travel"]
    }
  ]
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `filename` | yes | Exact name in `photos-drop/` |
| `title` | no | Defaults to a cleaned-up filename |
| `alt` | no | Defaults to title |
| `category` | no | One string; drives the category dropdown. Suggested: `nature`, `landscape`, `portraits`, `wildlife`, `travel` |
| `tags` | no | Array, or comma-separated string. Drives filter chips |
| `skip` | no | `true` skips example/template rows |

Gallery order = array order. Files on disk that are not listed are not published. Listed files that are missing on disk are skipped with a warning.

The shipped file includes a filled example and an empty template, both with `"skip": true`. Duplicate the template for each new photo and remove `skip`.

## Daily workflow

From `/developer/website`:

### A) Process only (local + manifest)

```bash
scripts/process-photos.sh
```

Optional explicit folder (still uses `photos-drop/metadata.json` for titles/tags):

```bash
scripts/process-photos.sh photos-drop
```

This creates/updates:

- `images/` (full originals copy, gitignored)
- `images/low-res/` (compressed previews)
- `images/watermarked/` (download copies, gitignored)
- `data/photos.manifest.json`

Orientation is preserved using `magick -auto-orient`.

### B) Process + R2 sync

```bash
R2_BUCKET="your-bucket-name" \
R2_ENDPOINT="https://<accountid>.r2.cloudflarestorage.com" \
scripts/process-photos.sh --sync-r2
```

### C) Process + deploy in one command

```bash
R2_BUCKET="your-bucket-name" \
R2_ENDPOINT="https://<accountid>.r2.cloudflarestorage.com" \
scripts/publish-photography.sh --site-id=<netlify-site-id> --sync-r2 --prod
```

If you want preview deploy instead of production, remove `--prod`.

## R2 bucket layout

- `photos/` — full-resolution originals
- `photos-previews/` — compressed gallery previews
- `photos-watermarked/` — full-resolution watermarked download files

## R2 clean-slate wipe

This environment does not have R2 credentials, so the old objects were **not** deleted remotely. Do this once on your machine before the first new `--sync-r2` (otherwise leftover `ASH*` files stay on `img.sashraf.in`).

```bash
cd /developer/website

export R2_BUCKET="your-bucket-name"
export R2_ENDPOINT="https://<accountid>.r2.cloudflarestorage.com"
# plus AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY for the R2 API token

# list first
scripts/wipe-r2-photos.sh

# then delete photos/, photos-previews/, photos-watermarked/
scripts/wipe-r2-photos.sh --yes
```

Equivalent AWS CLI:

```bash
aws s3 rm "s3://$R2_BUCKET/photos/" --recursive --endpoint-url "$R2_ENDPOINT"
aws s3 rm "s3://$R2_BUCKET/photos-previews/" --recursive --endpoint-url "$R2_ENDPOINT"
aws s3 rm "s3://$R2_BUCKET/photos-watermarked/" --recursive --endpoint-url "$R2_ENDPOINT"
```

## How images load on site

- Gallery grid: compressed preview image
- On click: full-resolution image in lightbox
- Download option: watermarked full-resolution image

Filters are built from metadata (`category` dropdown, `tags` chips).

## First-time setup checklist

1. Wipe R2 gallery prefixes (commands above)
2. Configure custom domain for R2 assets (`img.sashraf.in`)
3. Ensure Netlify site points to this repository
4. Drop new photos into `photos-drop/` and fill `photos-drop/metadata.json`
5. Run process + sync + deploy
6. Open `photography.sashraf.in` and verify:
   - grid loads quickly
   - filters show your categories/tags
   - lightbox opens full-res
   - download returns watermarked image

## Security Setup

### Already added in repo

- `netlify.toml` security headers (HSTS, CSP, frame protection, nosniff)
- `.well-known/security.txt` for responsible disclosure
- `robots.txt` blocks common AI training crawlers
- Photography page is isolated (no links back to portfolio)

### Enable in Cloudflare dashboard (manual)

For `sashraf.in` and `photography.sashraf.in`:

1. **Bot Fight Mode** -> ON
2. **AI Labyrinth** -> ON (optional extra bot disruption)
3. **Security.txt** in Cloudflare can stay disabled if using repo file at `/.well-known/security.txt`
4. **Always Use HTTPS** -> ON
5. **Browser Integrity Check** -> ON

### Photography subdomain (one-way sharing)

1. In Netlify -> Domain settings -> add `photography.sashraf.in`
2. In Cloudflare DNS -> CNAME `photography` -> your Netlify site
3. Share only: `https://photography.sashraf.in`

Main site (`sashraf.in`) links to photography in a new tab.
Photography page has no navigation back to portfolio/personal details.
