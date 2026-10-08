import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("dist");
const errors = [];
const pages = new Map();
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(file);
    else if (file.endsWith(".html"))
      pages.set(file, await readFile(file, "utf8"));
  }
}
await walk(root);
const decode = (text) => text.replaceAll("&amp;", "&");
const resolveFile = async (url) => {
  let file = path.join(root, decodeURIComponent(url.pathname));
  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
    await stat(file);
    return file;
  } catch {
    return null;
  }
};
for (const [file, html] of pages) {
  const route =
    `/${path.relative(root, file).replaceAll(path.sep, "/")}`.replace(
      /index\.html$/,
      "",
    );
  if (!html.includes("<main")) continue; // Verification files have no application layout.
  const fail = (message) => errors.push(`${route}: ${message}`);
  if ((html.match(/<h1(?:\s|>)/g) || []).length !== 1) fail("expected one h1");
  if ((html.match(/<main(?:\s|>)/g) || []).length !== 1)
    fail("expected one main landmark");
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  if (new Set(ids).size !== ids.length) fail("duplicate IDs");
  for (const match of html.matchAll(/\b(href|src)="([^"]+)"/g)) {
    const [, kind, raw] = match;
    if (/^(mailto:|tel:|data:|javascript:)/i.test(raw)) continue;
    const url = new URL(decode(raw), `https://tzheng.dev${route}`);
    if (url.origin !== "https://tzheng.dev") continue;
    const target = await resolveFile(url);
    if (!target) {
      fail(`missing ${kind}: ${raw}`);
      continue;
    }
    if (url.hash && kind === "href" && target.endsWith(".html")) {
      const targetHtml = pages.get(target) || (await readFile(target, "utf8"));
      const hash = decodeURIComponent(url.hash.slice(1));
      if (
        ![...targetHtml.matchAll(/\bid="([^"]+)"/g)].some(
          (id) => id[1] === hash,
        )
      )
        fail(`missing anchor: ${raw}`);
    }
  }
  for (const match of html.matchAll(
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
  )) {
    try {
      const data = JSON.parse(match[1]);
      const graph = data["@graph"] || [];
      if (!graph.some((item) => item["@id"] === "https://tzheng.dev/#person"))
        fail("missing shared identity");
      if (JSON.stringify(data).includes("#haitao-zheng"))
        fail("stale identity reference");
    } catch {
      fail("invalid structured data");
    }
  }
}
const home = pages.get(path.join(root, "index.html"));
assert(home, "Build the site before running the checker.");
assert(
  home.includes('id="contributions"'),
  "Homepage contribution section is missing.",
);
assert(
  home.indexOf('id="contributions"') < home.indexOf('id="projects"'),
  "Upstream contributions must precede personal projects.",
);
assert.equal(
  (home.match(/data-upstream-case=/g) || []).length,
  3,
  "Homepage must expose three representative upstream cases.",
);
for (const url of [
  "https://github.com/aws-cloudformation/cfn-lint/pull/4704",
  "https://github.com/pyinfra-dev/pyinfra/pull/1945",
  "https://github.com/prowler-cloud/prowler/pull/11837",
])
  assert(home.includes(url), `Homepage missing accepted patch ${url}`);

assert(
  !home.includes("cdn.tailwindcss.com"),
  "Homepage must serve local styles.",
);
assert(
  !home.includes("note-modal"),
  "Unused modal reader must not be published.",
);
const projectSection = home.slice(home.indexOf('id="projects"'), home.indexOf('id="notes"'));
assert(projectSection.indexOf('/projects/cloudtrail-quickscan/') < projectSection.indexOf('/projects/jsonl-lens/'), "Cloud investigation must lead the homepage projects.");
for (const slug of ['cloudtrail-quickscan', 'jsonl-lens', 'socket-state-triage', 'sentinel-ioc-toolkit']) assert(projectSection.includes(`/projects/${slug}/`), `Missing selected security tool ${slug}`);
assert(!projectSection.includes('/projects/cfn-lint-contribution/'), "Upstream work should not repeat in the homepage personal project section.");
const archive = pages.get(path.join(root, "articles/index.html"));
assert(archive && home.includes('href="/articles/"'), "Article archive must be reachable from the homepage.");
const feed = await readFile(path.join(root, "rss.xml"), "utf8");
for (const name of await readdir("src/content/articles")) {
  if (!name.endsWith(".md")) continue;
  const source = await readFile(path.join("src/content/articles", name), "utf8");
  const slug = source.match(/^slug: "([^"\n]+)"/m)?.[1] ?? name.replace(/\.md$/, "");
  const published = !/^status: "(?:draft|archived)"/m.test(source);
  const articlePage = pages.get(path.join(root, `articles/${slug}/index.html`));
  if (!published) {
    assert(!articlePage && !feed.includes(`/articles/${slug}/`) && !archive.includes(`/articles/${slug}/`), `Unpublished article leaked: ${slug}`);
    continue;
  }
  assert(articlePage && archive.includes(`/articles/${slug}/`) && feed.includes(`/articles/${slug}/`), `Article missing from publication surfaces: ${slug}`);
  const date = source.match(/^date: ["']?(\d{4}-\d{2}-\d{2})/m)?.[1];
  assert(date && articlePage.includes(`"datePublished":"${date}T00:00:00.000Z"`), `Publication date changed: ${slug}`);
  const project = source.match(/^project: "([^"\n]+)"/m)?.[1];
  if (project) assert(articlePage.includes(`href="/projects/${project}/"`), `Missing article project link: ${slug}`);
  const month = source.match(/^seriesMonth: "([^"\n]+)"/m)?.[1] ?? date.slice(0,7);
  assert(archive.includes(`id="month-${month}"`), `Missing archive month: ${month}`);
  if (source.includes("seriesMonth:")) assert(articlePage.includes("Reading series:"), `Unlabeled series date: ${slug}`);
  const item = [...feed.matchAll(/<item>([\s\S]*?)<\/item>/g)].find(match => match[1].includes(`/articles/${slug}/`));
  assert(item && item[1].includes(new Date(date).toUTCString()), `RSS date changed: ${slug}`);
}
const snapshot = JSON.parse(
  await readFile("src/data/contributions.json", "utf8"),
);
assert.equal(
  new Set(snapshot.merged.map((pr) => pr.url)).size,
  snapshot.merged.length,
  "Duplicate contribution records.",
);
const record = pages.get(path.join(root, "contributions/index.html"));
for (const pr of snapshot.merged)
  assert(record.includes(pr.url), `Missing contribution ${pr.url}`);
const sitemapIndex = await readFile(
  path.join(root, "sitemap-index.xml"),
  "utf8",
);
assert.equal(
  await readFile(path.join(root, "sitemap.xml"), "utf8"),
  sitemapIndex,
  "Legacy sitemap must use the same generated index.",
);
const sitemapUrls = new Set();
for (const file of (await readdir(root)).filter((name) =>
  /^sitemap-\d+\.xml$/.test(name),
)) {
  const xml = await readFile(path.join(root, file), "utf8");
  for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const url = new URL(decode(match[1]));
    assert.equal(url.origin, "https://tzheng.dev");
    assert(
      await resolveFile(url),
      `Sitemap references a missing route: ${url}`,
    );
    assert(!sitemapUrls.has(url.pathname), `Duplicate sitemap route: ${url}`);
    sitemapUrls.add(url.pathname);
  }
}
for (const [file, html] of pages) {
  if (!html.includes("<main") || path.basename(file) === "404.html") continue;
  const route =
    `/${path.relative(root, file).replaceAll(path.sep, "/")}`.replace(
      /index\.html$/,
      "",
    );
  assert(sitemapUrls.has(route), `Page missing from sitemap: ${route}`);
}
assert(!sitemapUrls.has("/404/"), "Do not index the error page.");
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(
  `Checked ${pages.size} HTML files: internal links, anchors, landmarks, metadata, sitemap and contribution records.`,
);
