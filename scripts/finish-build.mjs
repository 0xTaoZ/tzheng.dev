import { copyFile } from "node:fs/promises";

// Preserve the previously published sitemap URL without a second generator.
await copyFile("dist/sitemap-index.xml", "dist/sitemap.xml");
