import { createHash } from "node:crypto";
import { copyFile, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// Preserve the previously published sitemap URL without a second generator.
await copyFile("dist/sitemap-index.xml", "dist/sitemap.xml");

// GitHub Pages cannot send response headers, so each page carries its
// Content-Security-Policy in a meta element. Inline scripts are allowed by
// their SHA-256 hash only; JSON-LD blocks are data and need no hash.
// Style attributes stay allowed because syntax highlighting and a few
// data-driven widths use them.
const policy = (hashes) =>
  [
    "default-src 'self'",
    `script-src 'self' 'inline-speculation-rules'${hashes.map((hash) => ` '${hash}'`).join("")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://images.unsplash.com",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");

const inlineScripts = (html) =>
  [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)]
    .filter(([, attributes]) => !/type="application\/ld\+json"/.test(attributes))
    .map(([, , body]) => body);

const scriptHash = (body) =>
  `sha256-${createHash("sha256").update(body).digest("base64")}`;

const walk = async (directory) => {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(file)));
    else if (file.endsWith(".html")) files.push(file);
  }
  return files;
};

let pages = 0;
for (const file of await walk("dist")) {
  const html = await readFile(file, "utf8");
  if (!html.includes("<head>") || !html.includes('<meta charset="utf-8">')) continue;
  const hashes = [...new Set(inlineScripts(html).map(scriptHash))];
  const meta = `<meta http-equiv="Content-Security-Policy" content="${policy(hashes)}">`;
  await writeFile(file, html.replace('<meta charset="utf-8">', `<meta charset="utf-8">${meta}`));
  pages++;
}
console.log(`Added a Content-Security-Policy to ${pages} pages.`);
