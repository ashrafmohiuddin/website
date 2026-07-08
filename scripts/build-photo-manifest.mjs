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
  sourceDir: args.sourceDir || "images",
  outputFile: args.output || "data/photos.manifest.json",
  r2Base: args.r2Base || "https://img.sashraf.in",
  originalsPrefix: args.originalsPrefix || "photos",
  watermarkedPrefix: args.watermarkedPrefix || "photos-watermarked",
  previewWidth: Number(args.previewWidth || 900),
  fullWidth: Number(args.fullWidth || 2800),
  qualityPreview: Number(args.qualityPreview || 70),
  qualityFull: Number(args.qualityFull || 86)
};

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

function inferTags(nameLower) {
  const tags = [];
  if (nameLower.includes("ash0")) tags.push("featured");
  if (nameLower.includes("bike")) tags.push("bike");
  if (nameLower.includes("tiger") || nameLower.includes("wild")) tags.push("wildlife");
  if (nameLower.includes("beach") || nameLower.includes("goa")) tags.push("travel");
  if (tags.length === 0) tags.push("photography");
  return [...new Set(tags)];
}

function transformedUrl(base, width, quality, key) {
  return `${base}/cdn-cgi/image/width=${width},quality=${quality},format=auto/${key}`;
}

async function buildManifest() {
  const sourceAbsolute = path.resolve(process.cwd(), config.sourceDir);
  const files = await fs.readdir(sourceAbsolute);
  const imageFiles = files.filter((file) => IMAGE_EXTENSIONS.has(path.extname(file)));

  const photos = imageFiles.map((filename) => {
    const slug = toSlug(filename);
    const key = `${config.originalsPrefix}/${filename}`;
    const lowered = filename.toLowerCase();
    return {
      slug,
      title: toTitle(filename),
      alt: toTitle(filename),
      location: "",
      captureDate: "",
      tags: inferTags(lowered),
      previewSrc: transformedUrl(config.r2Base, config.previewWidth, config.qualityPreview, key),
      fullResSrc: transformedUrl(config.r2Base, config.fullWidth, config.qualityFull, key),
      downloadSrc: `${config.r2Base}/${config.watermarkedPrefix}/${filename}`,
      srcSet: [
        transformedUrl(config.r2Base, 480, 68, key) + " 480w",
        transformedUrl(config.r2Base, 900, 70, key) + " 900w",
        transformedUrl(config.r2Base, 1400, 75, key) + " 1400w"
      ].join(", ")
    };
  });

  const manifest = {
    version: 1,
    updatedAt: new Date().toISOString().slice(0, 10),
    notes: "Generated with scripts/build-photo-manifest.mjs. Fill captureDate/location/tags as needed.",
    photos
  };

  const outputAbsolute = path.resolve(process.cwd(), config.outputFile);
  await fs.mkdir(path.dirname(outputAbsolute), { recursive: true });
  await fs.writeFile(outputAbsolute, JSON.stringify(manifest, null, 2) + "\n", "utf8");

  console.log(`Manifest created: ${outputAbsolute}`);
  console.log(`Photos indexed: ${photos.length}`);
}

buildManifest().catch((error) => {
  console.error("Failed to build manifest:", error.message);
  process.exit(1);
});
