# sashraf.in Photography Pipeline

This repo now contains a premium, data-driven photography page at `photography.html`.
It is built to scale from tens of photos to 1000+ using:

- Netlify for page hosting
- Cloudflare R2 for image storage
- Cloudflare image transforms for fast previews and responsive variants
- Watermarked full-resolution download links

## Files added for the new gallery

- `photography.html` - premium UI + manifest-driven gallery + lightbox
- `data/photos.manifest.json` - source of truth for all photos displayed
- `scripts/build-photo-manifest.mjs` - helper to generate manifest entries from image filenames

## R2 + Netlify setup

1. Create an R2 bucket (example: `sashraf-photos`).
2. Upload images to:
   - `photos/` (originals)
   - `photos-watermarked/` (watermarked full-resolution downloads)
3. Attach a public custom domain like `img.sashraf.in` to R2 (recommended).
4. Enable Cloudflare image transformations on that domain.
5. Keep site deployment on Netlify as usual.

The page expects image URLs like:

- Preview variant:
  - `https://img.sashraf.in/cdn-cgi/image/width=900,quality=70,format=auto/photos/ASH02346.jpg`
- Full viewer variant:
  - `https://img.sashraf.in/cdn-cgi/image/width=2800,quality=86,format=auto/photos/ASH02346.jpg`
- Download (full-res watermarked):
  - `https://img.sashraf.in/photos-watermarked/ASH02346.jpg`

## Manifest format

`data/photos.manifest.json`:

```json
{
  "version": 1,
  "updatedAt": "2026-07-09",
  "photos": [
    {
      "slug": "white-bengal-tiger",
      "title": "White Bengal Tiger",
      "alt": "White Bengal tiger portrait",
      "location": "Nehru Zoological Park, Hyderabad",
      "captureDate": "2025-02-08",
      "tags": ["wildlife", "animal", "featured"],
      "previewSrc": "https://img.sashraf.in/cdn-cgi/image/width=900,quality=70,format=auto/photos/ASH02346.jpg",
      "fullResSrc": "https://img.sashraf.in/cdn-cgi/image/width=2800,quality=86,format=auto/photos/ASH02346.jpg",
      "downloadSrc": "https://img.sashraf.in/photos-watermarked/ASH02346.jpg"
    }
  ]
}
```

## Generate manifest quickly

From repo root:

```bash
node scripts/build-photo-manifest.mjs --sourceDir=images --output=data/photos.manifest.json --r2Base=https://img.sashraf.in --originalsPrefix=photos --watermarkedPrefix=photos-watermarked
```

This script auto-generates entries from filenames. Then manually enrich:

- `title`
- `alt`
- `location`
- `captureDate`
- `tags`

## Watermarking workflow

Keep original masters private/offline. Publish only watermarked files for downloads.

Batch watermark example with ImageMagick:

```bash
mkdir -p images/watermarked
for f in images/*.{jpg,JPG,jpeg,JPEG,png,PNG}; do \
  [ -e "$f" ] || continue; \
  bn=$(basename "$f"); \
  magick "$f" -gravity southeast -fill "rgba(255,255,255,0.35)" -pointsize 42 -annotate +50+45 "© Ashraf Mohiuddin" "images/watermarked/$bn"; \
done
```

Upload `images/watermarked/*` to `photos-watermarked/` in R2.

## Scaling notes for 1000+ photos

- Keep all photo metadata in `photos.manifest.json`.
- Use filters + search tags for discoverability.
- Keep `previewSrc` small and responsive via Cloudflare transforms.
- Serve full-res only in lightbox/download flow.
- Consider splitting manifest into `manifest-featured.json` and paginated chunks later if needed.