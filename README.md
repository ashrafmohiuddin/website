# Photography Workflow (Folder -> Website)

This project supports a seamless photography pipeline:

1. Export edited photos from Lightroom to one folder
2. Run one script to create:
   - compressed previews for gallery loading
   - watermarked full-resolution download copies
   - metadata-driven manifest (`data/photos.manifest.json`)
3. Optional R2 sync
4. Deploy to Netlify (`photography.sashraf.in` or `sashraf.in/photography`)

## Important Files

- `photography.html` - premium masonry gallery + lightbox + category/tag filters
- `data/photos.metadata.json` - your manual metadata input (category/tags/title/alt)
- `data/photos.manifest.json` - auto-generated gallery data (do not hand edit)
- `scripts/process-photos.sh` - main processing pipeline
- `scripts/publish-photography.sh` - process + deploy in one command
- `scripts/build-photo-manifest.mjs` - manifest generator

## Install Requirements (Mac)

```bash
brew install imagemagick awscli
npm i -g netlify-cli
```

Also run once:

```bash
netlify login
```

## R2 Bucket Layout

Your R2 should contain:

- `photos/` -> full-resolution originals
- `photos-previews/` -> compressed gallery previews
- `photos-watermarked/` -> full-resolution watermarked download files

## Metadata: How to Add Categories/Tags

Edit `data/photos.metadata.json`:

```json
{
  "photos": {
    "ASH02346.jpg": {
      "title": "White Bengal Tiger",
      "alt": "White Bengal tiger resting and looking ahead",
      "category": "wildlife",
      "tags": ["tiger", "wildlife", "featured"]
    }
  }
}
```

Rules:

- Key must exactly match filename
- `category` is a single string (used in dropdown)
- `tags` is an array (used for tag chips)
- Missing files fall back to auto-generated defaults (`uncategorized`, inferred tags)

## Daily Workflow (Recommended)

### A) Process only (local + manifest)

```bash
scripts/process-photos.sh "/absolute/path/to/lightroom-export-folder"
```

This creates/updates:

- `images/` (full originals copy)
- `images/low-res/` (compressed previews)
- `images/watermarked/` (download copies)
- `data/photos.manifest.json`

Orientation is preserved using `magick -auto-orient`.

### B) Process + R2 sync

```bash
R2_BUCKET="your-bucket-name" \
R2_ENDPOINT="https://<accountid>.r2.cloudflarestorage.com" \
scripts/process-photos.sh "/absolute/path/to/lightroom-export-folder" --sync-r2
```

### C) Process + deploy in one command

```bash
R2_BUCKET="your-bucket-name" \
R2_ENDPOINT="https://<accountid>.r2.cloudflarestorage.com" \
scripts/publish-photography.sh "/absolute/path/to/lightroom-export-folder" --site-id=<netlify-site-id> --sync-r2 --prod
```

If you want preview deploy instead of production, remove `--prod`.

## How Images Load on Site

- Gallery grid: compressed preview image
- On click: full-resolution image in lightbox
- Download option: watermarked full-resolution image

Filters are automatic from metadata (`category` and `tags`).

## First-Time Setup Checklist

1. Configure custom domain for R2 assets (`img.sashraf.in`)
2. Ensure Netlify site points to this repository
3. Fill `data/photos.metadata.json` entries for your key images
4. Run process + sync + deploy command
5. Open `photography.sashraf.in` and verify:
   - grid loads quickly
   - filters show expected categories/tags
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