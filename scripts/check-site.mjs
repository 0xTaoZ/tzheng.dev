import { readdir, readFile, access } from "node:fs/promises";
import { join, extname } from "node:path";
import assert from "node:assert/strict";

const root = "dist";
const walk = async (dir) =>
  (
    await Promise.all(
      (await readdir(dir, { withFileTypes: true })).map((entry) =>
        entry.isDirectory()
          ? walk(join(dir, entry.name))
          : join(dir, entry.name),
      ),
    )
  ).flat();
const pages = (await walk(root)).filter(
  (file) => extname(file) === ".html" && !file.includes("yandex_"),
);
const errors = [];
for (const file of pages) {
  const html = await readFile(file, "utf8");
  if ((html.match(/<h1(?:\s|>)/g) ?? []).length !== 1)
    errors.push(`${file}: expected one h1`);
  if (!html.includes('id="main-content"'))
    errors.push(`${file}: missing skip-link target`);
  for (const match of html.matchAll(/(?:href|src)="([^"\s]+)"/g)) {
    const value = match[1].replaceAll("&amp;", "&");
    if (!value.startsWith("/") && !value.startsWith("#")) continue;
    const current =
      "/" + file.slice(root.length + 1).replace(/index\.html$/, "");
    const url = new URL(value, `https://tzheng.dev${current}`);
    const target = join(
      root,
      decodeURIComponent(url.pathname),
      extname(url.pathname) ? "" : "index.html",
    );
    try {
      await access(target);
      if (url.hash && extname(target) === ".html") {
        const document = await readFile(target, "utf8");
        const fragment = decodeURIComponent(url.hash.slice(1));
        if (!document.includes(`id="${fragment}"`))
          errors.push(`${file}: missing anchor ${value}`);
      }
    } catch {
      errors.push(`${file}: missing local resource ${value}`);
    }
  }
  if (html.includes("#haitao-zheng"))
    errors.push(`${file}: unresolved Person identifier`);
}
assert.equal(errors.length, 0, errors.join("\n"));
console.log(
  `Verified ${pages.length} HTML pages: headings, skip links, local routes, fragments, assets and identity references.`,
);
