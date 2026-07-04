import { getCollection } from "astro:content";
import { entrySlug } from "../lib/content";

const site = "https://tzheng.dev";

const xmlEscape = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export async function GET() {
  const articles = await getCollection("articles", ({ data }) => data.status === "published");
  const projects = await getCollection("projects");
  const urls = [
    "/",
    "/articles/",
    ...articles.map((article) => `/articles/${entrySlug(article)}/`),
    "/projects/",
    ...projects.map((project) => `/projects/${entrySlug(project)}/`),
    "/system/",
    "/topics/",
    "/legal/"
  ];

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${xmlEscape(new URL(url, site).toString())}</loc></url>`).join("\n")}
</urlset>`,
    {
      headers: {
        "Content-Type": "application/xml; charset=utf-8"
      }
    }
  );
}
