// Regenerates the optimized images in public/img from the original files in
// public/. Run with `npm run images` after replacing a source image; the
// output is committed so the Pages build does not depend on image processing.
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const out = path.resolve("public/img");
await mkdir(out, { recursive: true });

const jobs = [
  // Hero and profile portrait: same crop as the original photograph.
  ...[480, 720, 1122].flatMap((width) => [
    { src: "IMG_1419.jpg", name: `portrait-${width}.avif`, width, format: "avif", quality: 52 },
    { src: "IMG_1419.jpg", name: `portrait-${width}.webp`, width, format: "webp", quality: 74 },
  ]),
  { src: "IMG_1419.jpg", name: "portrait-720.jpg", width: 720, format: "jpeg", quality: 78 },
  // Navigation mark is displayed at 32 CSS pixels.
  { src: "logo.png", name: "logo-64.webp", width: 64, format: "webp", quality: 82 },
  { src: "logo.png", name: "logo-64.png", width: 64, format: "png" },
  { src: "logo.png", name: "logo-512.png", width: 512, format: "png" },
  // Education marks are displayed at 32-40 CSS pixels.
  ...["hbrs", "fhm", "harvard", "jimei"].map((name) => ({
    src: `${name}-logo.png`, name: `${name}-logo.webp`, width: 96, format: "webp", quality: 86,
  })),
];

for (const job of jobs) {
  const target = path.join(out, job.name);
  let pipeline = sharp(path.resolve("public", job.src)).resize({ width: job.width, withoutEnlargement: true });
  if (job.format === "avif") pipeline = pipeline.avif({ quality: job.quality, effort: 6 });
  if (job.format === "webp") pipeline = pipeline.webp({ quality: job.quality, effort: 6 });
  if (job.format === "jpeg") pipeline = pipeline.jpeg({ quality: job.quality, mozjpeg: true, progressive: true });
  if (job.format === "png") pipeline = pipeline.png({ compressionLevel: 9, palette: job.width <= 64 });
  await pipeline.toFile(target);
  console.log(`${job.name.padEnd(24)} ${((await stat(target)).size / 1024).toFixed(1)} KB`);
}
