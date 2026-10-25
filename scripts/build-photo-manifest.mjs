#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.split("=");
    return [key.replace(/^--/, ""), value];
  })
);

const config = {
  mode: args.mode || "hybrid",
  sourceDir: args.sourceDir || "photos-drop",
  outputFile: args.output || "data/photos.manifest.json",
  previewDir: args.previewDir || "images/low-res",
  r2Base: args.r2Base || "https://img.sashraf.in",
  originalsPrefix: args.originalsPrefix || "photos",
  previewPrefix: args.previewPrefix || "photos-previews",
  watermarkedPrefix: args.watermarkedPrefix || "photos-watermarked",
  useTransforms: args.useTransforms === "true"
};

const metadataFile = args.metadata || "photos-drop/metadata.json";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".JPG", ".JPEG", ".PNG", ".WEBP"]);

function toSlug(filename) {
  return path
    .basename(filename, path.extname(filename))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toTitle(filename) {
  const base = path.basename(filename, path.extname(filename)).replace(/[_-]+/g, " ");
  return base.replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return [...new Set(tags.map((tag) => String(tag).trim()).filter(Boolean))];
  }
  if (typeof tags === "string") {
    return [...new Set(tags.split(",").map((tag) => tag.trim()).filter(Boolean))];
  }
  return [];
}

async function loadMetadataEntries() {
  const raw = await fs.readFile(path.resolve(process.cwd(), metadataFile), "utf8");
  const parsed = JSON.parse(raw);
  const photos = parsed && parsed.photos;

  if (Array.isArray(photos)) return photos;

  if (photos && typeof photos === "object") {
    return Object.entries(photos).map(([filename, meta]) => ({ filename, ...meta }));
  }

  throw new Error(`${metadataFile} must contain a "photos" array`);
}

function buildUrls(filename) {
  if (config.mode === "local") {
    return {
      filename,
      previewSrc: `./${config.previewDir}/${filename}`,
      fullResSrc: `./images/${filename}`,
      downloadSrc: `./images/watermarked/${filename}`
    };
  }

  const originalKey = `${config.originalsPrefix}/${filename}`;
  const previewKey = `${config.previewPrefix}/${filename}`;
  const directOriginal = `${config.r2Base}/${originalKey}`;
  const directPreview = `${config.r2Base}/${previewKey}`;
  const watermarked = `${config.r2Base}/${config.watermarkedPrefix}/${filename}`;

  if (config.mode === "hybrid") {
    return {
      filename,
      previewSrc: `./${config.previewDir}/${filename}`,
      fullResSrc: directOriginal,
      downloadSrc: watermarked
    };
  }

  if (config.useTransforms) {
    const transformed = (width, quality, key) =>
      `${config.r2Base}/cdn-cgi/image/width=${width},quality=${quality},format=auto/${key}`;

    return {
      filename,
      previewSrc: transformed(900, 70, previewKey),
      fullResSrc: transformed(2800, 86, originalKey),
      downloadSrc: watermarked,
      srcSet: [
        transformed(480, 68, previewKey) + " 480w",
        transformed(900, 70, previewKey) + " 900w",
        transformed(1400, 75, previewKey) + " 1400w"
      ].join(", ")
    };
  }

  return {
    filename,
    previewSrc: directPreview,
    fullResSrc: directOriginal,
    downloadSrc: watermarked
  };
}

async function listDropImages(sourceAbsolute) {
  try {
    const files = await fs.readdir(sourceAbsolute);
    return new Set(files.filter((file) => IMAGE_EXTENSIONS.has(path.extname(file))));
  } catch (error) {
    if (error && error.code === "ENOENT") return new Set();
    throw error;
  }
}

function isActiveEntry(entry) {
  if (!entry || entry.skip === true) return false;
  const filename = typeof entry.filename === "string" ? entry.filename.trim() : "";
  return Boolean(filename);
}

async function buildManifest() {
  const entries = await loadMetadataEntries();
  const sourceAbsolute = path.resolve(process.cwd(), config.sourceDir);
  const onDisk = await listDropImages(sourceAbsolute);

  const photos = [];
  const seen = new Set();

  for (const entry of entries) {
    if (!isActiveEntry(entry)) continue;
    const filename = entry.filename.trim();
    if (!onDisk.has(filename)) {
      console.warn(`Skipping ${filename}: listed in metadata but not in ${config.sourceDir}/`);
      continue;
    }
    seen.add(filename);
    const title = (entry.title && String(entry.title).trim()) || toTitle(filename);
    photos.push({
      slug: toSlug(filename),
      title,
      alt: (entry.alt && String(entry.alt).trim()) || title,
      category: (entry.category && String(entry.category).trim()) || "uncategorized",
      tags: normalizeTags(entry.tags),
      ...buildUrls(filename)
    });
  }

  for (const filename of [...onDisk].sort()) {
    if (seen.has(filename)) continue;
    console.warn(`Skipping ${filename}: in ${config.sourceDir}/ but not listed in ${metadataFile}`);
  }

  const manifest = {
    version: 1,
    updatedAt: new Date().toISOString().slice(0, 10),
    photos
  };

  const outputAbsolute = path.resolve(process.cwd(), config.outputFile);
  await fs.mkdir(path.dirname(outputAbsolute), { recursive: true });
  await fs.writeFile(outputAbsolute, JSON.stringify(manifest, null, 2) + "\n", "utf8");

  console.log(`Manifest created: ${outputAbsolute}`);
  console.log(`Mode: ${config.mode}`);
  console.log(`Photos indexed: ${photos.length}`);
}

buildManifest().catch((error) => {
  console.error("Failed to build manifest:", error.message);
  process.exit(1);
});
