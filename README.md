## Photography gallery: low‑res thumbnails + high‑res modal

The gallery now loads lightweight thumbnails on the page and only loads the original high‑resolution image after a click.

- Folder structure:
  - `images/` — original high‑resolution photos (unchanged)
  - `images/low-res/` — generated low‑resolution thumbnails (same filenames as originals)
  - `images/other/` — images used by other screens/pages

- How it works:
  - Each gallery item sets `data-image` to the original path (e.g., `./images/ASH02346.jpg`).
  - The `<img>` `src` points to the low‑res thumbnail (e.g., `./images/low-res/ASH02346.jpg`).
  - If a low‑res file is missing, a built-in fallback swaps the `src` to the high‑res path automatically.
  - On click, the modal displays the high‑res image from `data-image`.

- Add new photos:
  1. Drop the full image in `images/`.
  2. Generate a matching low‑res file into `images/low-res/` with the same filename.

- Generate low‑res thumbnails
  - Using ImageMagick (recommended):
    - Single file:
      ```bash
      magick convert images/INPUT.jpg -resize 1600x1600 -quality 65 images/low-res/INPUT.jpg
      ```
    - Batch (macOS/Linux, keep names and sub-100–300 KB typical):
      ```bash
      mkdir -p images/low-res
      for f in images/*.{jpg,JPG,jpeg,JPEG,png,PNG}; do \
        [ -e "$f" ] || continue; \
        bn=$(basename "$f"); \
        magick convert "$f" -resize 1600x1600 -strip -interlace Plane -quality 65 "images/low-res/$bn"; \
      done
      ```
  - Using macOS Preview (manual): Export → reduce size/quality → save into `images/low-res/` with the same filename.

- Notes
  - Keep filenames identical between `images/` and `images/low-res/`.
  - You can tweak `-resize` and `-quality` to balance clarity vs. page weight.
  - Nonexistent thumbnails will gracefully fall back to the original on first load.

# website