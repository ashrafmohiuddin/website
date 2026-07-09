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
  mode: args.mode || "r2",
  sourceDir: args.sourceDir || "images",
  outputFile: args.output || "data/photos.manifest.json",
  previewDir: args.previewDir || "images/low-res",
  r2Base: args.r2Base || "https://img.sashraf.in",
  originalsPrefix: args.originalsPrefix || "photos",
  previewPrefix: args.previewPrefix || "photos",
  watermarkedPrefix: args.watermarkedPrefix || "photos-watermarked",
  useTransforms: args.useTransforms === "true"
};

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".JPG", ".JPEG", ".PNG", ".WEBP"]);

const TITLE_MAP = {
  "ASH02346.jpg": "White Bengal Tiger",
  "ASH02373.jpg": "White Bengal Tiger and Bengal Tiger",
  "ASH03655-crop.JPG": "Bike Riding Adventure",
  "ASH04929.jpg": "Nature Photography",
  "ASH05056.jpg": "Landscape Shot",
  "20211212_180203.jpg": "Summer Beach Day at Goa",
  "ASH03049.jpg": "Wildlife Photography",
  "ASH03547-3.jpg": "Adventure Shot",
  "ASH03620.jpg": "Scenic View",
  "ASH03648.jpg": "Nature Scene",
  "ASH03890.JPG": "Adventure Moment",
  "ASH03963.JPG": "Scenic Landscape",
  "ASH04012.JPG": "Wildlife Moment",
  "ASH04151.JPG": "Nature Beauty",
  "ASH04307.JPG": "Adventure Photography",
  "ASH04692.jpg": "Landscape Photography",
  "ASH04718.JPG": "Nature Photography",
  "ASH04955.jpg": "Wildlife Shot",
  "ASH04976.jpg": "Adventure Scene",
  "ASH05075.jpg": "Nature Scene",
  "ASH05621-2.jpg": "Landscape View",
  "ASH05626.jpg": "Nature Photography",
  "ASH05835.jpg": "Adventure Shot",
  "ASH06363.jpg": "Wildlife Photography",
  "ASH06431.jpg": "Nature Beauty",
  "ASH06438-2.jpg": "Landscape Photography",
  "ASH06840.jpg": "Adventure Photography",
  "ASH06899.jpg": "Nature Scene",
  "ASH06941.jpg": "Wildlife Photography",
  "ASH06964.jpg": "Landscape Shot"
};

function toSlug(filename) {
  return path
    .basename(filename, path.extname(filename))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toTitle(filename) {
  if (TITLE_MAP[filename]) return TITLE_MAP[filename];
  const base = path.basename(filename, path.extname(filename)).replace(/[_-]+/g, " ");
  return base.replace(/\b\w/g, (char) => char.toUpperCase());
}

function inferTags(nameLower) {
  const tags = [];
  if (nameLower.includes("tiger") || nameLower.includes("wild") || nameLower.includes("ash0")) tags.push("wildlife");
  if (nameLower.includes("bike") || nameLower.includes("crop")) tags.push("travel");
  if (nameLower.includes("beach") || nameLower.includes("goa")) tags.push("travel");
  if (nameLower.includes("landscape") || tags.length === 0) tags.push("landscape");
  return [...new Set(tags)];
}

function buildUrls(filename) {
  if (config.mode === "local") {
    return {
      previewSrc: `./${config.previewDir}/${filename}`,
      fullResSrc: `./${config.sourceDir}/${filename}`,
      downloadSrc: `./${config.sourceDir}/${filename}`
    };
  }

  const originalKey = `${config.originalsPrefix}/${filename}`;
  const previewKey = `${config.previewPrefix}/${filename}`;
  const directOriginal = `${config.r2Base}/${originalKey}`;
  const directPreview = `${config.r2Base}/${previewKey}`;

  if (config.useTransforms) {
    const transformed = (width, quality, key) =>
      `${config.r2Base}/cdn-cgi/image/width=${width},quality=${quality},format=auto/${key}`;

    return {
      previewSrc: transformed(900, 70, previewKey),
      fullResSrc: transformed(2800, 86, originalKey),
      downloadSrc: `${config.r2Base}/${config.watermarkedPrefix}/${filename}`,
      srcSet: [
        transformed(480, 68, previewKey) + " 480w",
        transformed(900, 70, previewKey) + " 900w",
        transformed(1400, 75, previewKey) + " 1400w"
      ].join(", ")
    };
  }

  return {
    previewSrc: directPreview,
    fullResSrc: directOriginal,
    downloadSrc: `${config.r2Base}/${config.watermarkedPrefix}/${filename}`
  };
}

async function buildManifest() {
  const sourceAbsolute = path.resolve(process.cwd(), config.sourceDir);
  const files = await fs.readdir(sourceAbsolute);
  const imageFiles = files.filter((file) => IMAGE_EXTENSIONS.has(path.extname(file)));

  const photos = imageFiles.map((filename) => {
    const lowered = filename.toLowerCase();
    const title = toTitle(filename);
    return {
      slug: toSlug(filename),
      title,
      alt: title,
      tags: inferTags(lowered),
      ...buildUrls(filename)
    };
  });

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
