import { readdirSync, readFileSync } from "node:fs";
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

const site = "https://tzheng.dev";

// Last-modified dates for the sitemap, read from the same frontmatter and
// contribution snapshot that the pages use.
const lastModified = new Map();
for (const collection of ["articles", "projects"]) {
  const dir = `./src/content/${collection}`;
  for (const name of readdirSync(dir).filter((file) => file.endsWith(".md"))) {
    const source = readFileSync(`${dir}/${name}`, "utf8");
    const field = (key) =>
      source.match(new RegExp(`^${key}:\\s*["']?(\\d{4}-\\d{2}-\\d{2})`, "m"))?.[1];
    const slug =
      source.match(/^slug:\s*"([^"\n]+)"/m)?.[1] ?? name.replace(/\.md$/, "");
    const date = field("updated") ?? field("date");
    if (date) lastModified.set(`${site}/${collection}/${slug}/`, date);
  }
}
const { verifiedAt } = JSON.parse(
  readFileSync("./src/data/contributions.json", "utf8"),
);
for (const path of ["/", "/contributions/", "/about/"])
  lastModified.set(`${site}${path}`, verifiedAt);

export default defineConfig({
  compressHTML: true,
  site,
  // Links are prerendered on hover through the Speculation Rules API, so the
  // next page is usually ready before the click.
  prefetch: { prefetchAll: true, defaultStrategy: "hover" },
  experimental: { clientPrerender: true },
  // Emit fonts and images as files; inlined data: URIs would need a looser CSP.
  // Three.js is one lazily loaded chunk of about 150 KB compressed.
  vite: { build: { assetsInlineLimit: 0, chunkSizeWarningLimit: 800 } },
  integrations: [
    sitemap({
      filter: (page) => !page.includes("/404"),
      serialize(item) {
        const date = lastModified.get(item.url);
        if (date) item.lastmod = new Date(`${date}T00:00:00Z`).toISOString();
        return item;
      },
    }),
  ],
  markdown: {
    shikiConfig: {
      theme: "vitesse-dark",
    },
  },
});
