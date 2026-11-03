// Generates 1200x630 share cards in public/og from the content collections.
// Run with `npm run og` after adding or renaming an article or project; the
// PNG files are committed. Pages without a card fall back to og/default.png.
import { mkdir, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve("public/og");
const width = 1200;
const height = 630;
const sans = "Helvetica Neue, Helvetica, Arial, sans-serif";
const mono = "Menlo, SFMono-Regular, Consolas, monospace";

const escape = (text) =>
  text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]);

const frontmatter = (source) => {
  const block = source.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
  const field = (name) => block.match(new RegExp(`^${name}:\\s*"?(.+?)"?\\s*$`, "m"))?.[1];
  return { title: field("title"), slug: field("slug"), category: field("category"), type: field("type"), date: field("date"), status: field("status") };
};

// Greedy word wrap using an average glyph width for the chosen font size.
const wrap = (text, size, maxWidth, maxLines) => {
  const perLine = Math.floor(maxWidth / (size * 0.56));
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > perLine && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/\s+\S*$/, "")}…`;
  }
  return lines;
};

const fitTitle = (text, maxWidth) => {
  for (const size of [72, 64, 56, 50, 44]) {
    const lines = wrap(text, size, maxWidth, 3);
    if (!lines.at(-1).endsWith("…")) return { size, lines };
  }
  return { size: 44, lines: wrap(text, 44, maxWidth, 3) };
};

const background = `
  <defs>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0H0V48" fill="none" stroke="rgba(214,224,240,0.05)" stroke-width="1"/>
    </pattern>
    <radialGradient id="glowA" cx="0.12" cy="0.05" r="0.7">
      <stop offset="0" stop-color="#38bdf8" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#38bdf8" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowB" cx="0.92" cy="0.95" r="0.6">
      <stop offset="0" stop-color="#f2b661" stop-opacity="0.12"/>
      <stop offset="1" stop-color="#f2b661" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.55"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="#07090c"/>
  <rect width="${width}" height="${height}" fill="url(#grid)"/>
  <rect width="${width}" height="${height}" fill="url(#glowA)"/>
  <rect width="${width}" height="${height}" fill="url(#glowB)"/>
  <rect width="${width}" height="${height}" fill="url(#fade)"/>`;

const footer = (right = "tzheng.dev") => `
  <line x1="72" y1="520" x2="${width - 72}" y2="520" stroke="rgba(148,163,184,0.18)"/>
  <circle cx="80" cy="566" r="6" fill="#f2b661"/>
  <text x="100" y="574" font-family="${sans}" font-size="26" font-weight="700" fill="#f8fafc">Haitao Zheng</text>
  <text x="285" y="574" font-family="${mono}" font-size="20" fill="#94a3b8">Cyber Security &amp; Privacy · H-BRS</text>
  <text x="${width - 72}" y="574" text-anchor="end" font-family="${mono}" font-size="22" fill="#aeb5c1">${escape(right)}</text>`;

const card = ({ kicker, title, meta, command, titleWidth = 1000 }) => {
  const { size, lines } = fitTitle(title, titleWidth);
  const lineHeight = Math.round(size * 1.08);
  const top = 150 + (3 - lines.length) * lineHeight * 0.35;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    ${background}
    <rect x="72" y="62" rx="18" ry="18" width="${kicker.length * 12.6 + 46}" height="36" fill="rgba(8,20,33,0.75)" stroke="rgba(125,211,252,0.3)"/>
    <circle cx="94" cy="80" r="4" fill="#f2b661"/>
    <text x="108" y="86" font-family="${mono}" font-size="19" fill="#bae6fd">${escape(kicker)}</text>
    ${lines.map((line, i) => `<text x="72" y="${top + (i + 1) * lineHeight}" font-family="${sans}" font-size="${size}" font-weight="700" letter-spacing="-1.5" fill="#ffffff">${escape(line)}</text>`).join("")}
    <text x="72" y="${top + lines.length * lineHeight + 56}" font-family="${mono}" font-size="24" fill="#f2b661">${escape(command)}</text>
    <text x="72" y="${top + lines.length * lineHeight + 96}" font-family="${mono}" font-size="21" fill="#94a3b8">${escape(meta)}</text>
    ${footer()}
  </svg>`;
};

const render = async (svg, file, overlays = []) => {
  await mkdir(path.dirname(file), { recursive: true });
  // Text-only cards quantize well; the portrait card keeps full colour.
  const palette = overlays.length === 0;
  await sharp(Buffer.from(svg)).composite(overlays).png({ compressionLevel: 9, palette, quality: 92 }).toFile(file);
};

// Site card with the portrait.
const portraitSize = { w: 360, h: 450 };
const portrait = await sharp("public/IMG_1419.jpg")
  .resize(portraitSize.w, portraitSize.h, { fit: "cover", position: "top" })
  .composite([{
    input: Buffer.from(`<svg width="${portraitSize.w}" height="${portraitSize.h}"><rect width="${portraitSize.w}" height="${portraitSize.h}" rx="28" ry="28"/></svg>`),
    blend: "dest-in",
  }])
  .png()
  .toBuffer();
const contributions = JSON.parse(await readFile("src/data/contributions.json", "utf8"));
const repositories = Object.keys(contributions.repositories).length;
await render(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    ${background}
    <text x="72" y="96" font-family="${mono}" font-size="20" fill="#bae6fd">blue-team / cloud-security / systems</text>
    <text x="72" y="200" font-family="${sans}" font-size="92" font-weight="700" letter-spacing="-4" fill="#ffffff">HAITAO</text>
    <text x="72" y="292" font-family="${sans}" font-size="92" font-weight="700" letter-spacing="-4" fill="#ffffff">ZHENG</text>
    <text x="72" y="346" font-family="${sans}" font-size="30" fill="#cbd5e1">Cyber Security &amp; Privacy · Systems</text>
    <text x="72" y="410" font-family="${mono}" font-size="24" fill="#f2b661">$ upstream --merged</text>
    <text x="72" y="448" font-family="${mono}" font-size="24" fill="#f2b661">${contributions.merged.length} PRs / ${repositories} projects</text>
    ${footer("tzheng.dev")}
  </svg>`,
  path.join(root, "default.png"),
  [{ input: portrait, left: width - 72 - portraitSize.w, top: 46 }],
);

const formatDate = (date) =>
  new Date(`${date.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

let count = 1;
for (const [collection, folder] of [["articles", "articles"], ["projects", "projects"]]) {
  const dir = path.join("src/content", collection);
  for (const name of (await readdir(dir)).filter((file) => file.endsWith(".md"))) {
    const data = frontmatter(await readFile(path.join(dir, name), "utf8"));
    if (data.status === "draft" || data.status === "archived") continue;
    const slug = data.slug ?? name.replace(/\.md$/, "");
    const svg = collection === "articles"
      ? card({ kicker: `tzheng.dev / articles / ${data.category?.toLowerCase()}`, title: data.title, command: `$ cat notes/${slug}.md`, meta: `${data.category} · ${formatDate(data.date)}` })
      : card({ kicker: "tzheng.dev / projects", title: data.title, command: `$ open case-study --${slug}`, meta: data.type ?? "Project" });
    await render(svg, path.join(root, folder, `${slug}.png`));
    count++;
  }
}
const articleCount = (await readdir("src/content/articles")).filter((file) => file.endsWith(".md")).length;
const pages = [
  { file: "contributions", kicker: "tzheng.dev / open source", title: "Open-source work: merged upstream pull requests", command: "$ upstream --merged", meta: `${contributions.merged.length} PRs / ${repositories} repositories / verified ${contributions.verifiedAt}` },
  { file: "articles", kicker: "tzheng.dev / articles", title: "Security engineering notes and case analyses", command: "$ ls notes/ | wc -l", meta: `${articleCount} articles · monthly archive · RSS` },
  { file: "projects", kicker: "tzheng.dev / projects", title: "Security tools, a study product and upstream work", command: "$ ls projects/", meta: "Case studies with source, tests and limits" },
  { file: "system", kicker: "tzheng.dev / system design", title: "How this site is built, checked and delivered", command: "$ astro build && npm test", meta: "Astro · typed content · GitHub Pages" },
  { file: "resume", kicker: "tzheng.dev / resume", title: "Haitao Zheng: one-page résumé", command: "$ cat resume.md", meta: "Cyber Security & Privacy · H-BRS · open source" },
  { file: "topics", kicker: "tzheng.dev / topics", title: "Browse the work by technical area", command: "$ grep -r topic", meta: "Cloud · infrastructure · logs · learning · publishing" },
];
for (const page of pages) {
  await render(card(page), path.join(root, `${page.file}.png`));
  count++;
}
console.log(`Generated ${count} share cards in public/og.`);
