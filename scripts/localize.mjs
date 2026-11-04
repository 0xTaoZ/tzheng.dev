// Builds the German pages from the English ones, so a page never has to be
// written twice. Every block of text in a built page becomes a template:
// names, numbers and dates turn into <kN/>, inline elements into <xN>…</xN>.
// A template's hash finds its German text in src/i18n/de.json.
//
//   node scripts/localize.mjs          write dist/de and hreflang links (postbuild)
//   node scripts/localize.mjs --fetch  send templates not yet in de.json to DeepL
//
// A changed count, link or date keeps its translation because the template stays
// the same. Text with no translation yet stays English and is listed as a warning.
// Editing a "de" value by hand is safe: it lasts until its English source changes.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { ELEMENT_NODE, TEXT_NODE, parse, render } from "ultrahtml";

const site = "https://tzheng.dev";
const routes = ["/", "/resume/", "/about/"];
const cacheFile = "src/i18n/de.json";
const contributions = JSON.parse(readFileSync("src/data/contributions.json", "utf8"));
const glossary = JSON.parse(readFileSync("src/i18n/glossary.json", "utf8"));

const fileFor = (route) => `dist${route}index.html`;
const germanRoute = (route) => `/de${route}`;
const readCache = () => (existsSync(cacheFile) ? JSON.parse(readFileSync(cacheFile, "utf8")) : {});

// ---------- What stays out of the translation.
const opaque = new Set(["script", "style", "svg", "pre", "kbd", "template", "noscript", "picture", "img", "br", "wbr", "input"]);
const skipped = /(?:^|\s)(?:hero-title|hero-alias|wordmark|footer-name|terminal|code-window|case-stage|case-progress|repo-name|lang-switch|stack-list|cv-sep|cv-refs)(?:\s|$)/;
const translatedAttributes = ["aria-label", "alt", "placeholder", "title"];
const translatedMeta = new Set(["description", "og:title", "og:description", "og:image:alt", "twitter:title", "twitter:description", "twitter:image:alt"]);

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const terms = [...new Set([...glossary.keep, ...contributions.merged.flatMap((pr) => pr.repository.split("/"))])]
  .sort((a, b) => b.length - a.length)
  .map((term) => escapeRegExp(term.replaceAll("&", "&amp;")));
const months = { January: "Januar", February: "Februar", March: "März", April: "April", May: "Mai", June: "Juni", July: "Juli", August: "August", September: "September", October: "Oktober", November: "November", December: "Dezember", Jan: "Jan.", Feb: "Feb.", Mar: "März", Apr: "Apr.", Jun: "Juni", Jul: "Juli", Aug: "Aug.", Sep: "Sept.", Oct: "Okt.", Nov: "Nov.", Dec: "Dez." };
const month = Object.keys(months).sort((a, b) => b.length - a.length).join("|");
// Dates arrive as "Nov 3, 2026", "Oct 2025" or "Jul–Nov".
const germanDate = (text) =>
  text
    .replace(new RegExp(`\\b(${month}) (\\d{1,2}), (\\d{4})\\b`), "$2. $1 $3")
    .replace(new RegExp(`\\b(${month})\\b`, "g"), (name) => months[name]);
const protectedText = new RegExp(
  [
    `\\b(?:${month}) \\d{1,2}, \\d{4}\\b`,
    `\\b(?:${month}) \\d{4}\\b`,
    `\\b(?:${month})–(?:${month})\\b`,
    `(?<![\\w-])(?:${terms.join("|")})(?![\\w-])`,
    `[\\w.+-]+@[\\w.-]+\\.\\w+`,
    `\\b[\\w-]+\\.(?:dev|com|org|md)\\b(?:/[\\w./-]*)?`,
    `\\bFn::\\w+`,
    `\\b[a-z]+[A-Z]\\w*`,
    `[^\\s<>(),;:]*\\d[^\\s<>(),;:]*?(?=[.,;:]?(?:\\s|$|[<>()]))`,
  ].join("|"),
  "g",
);
const wholeMonth = new RegExp(`^(${month})$`);

// One block of text: the stored template, what goes to DeepL, and how to put German back.
const makeUnit = (apply) => ({ template: "", send: "", values: [], germanValues: [], tags: [], apply });
// Astro writes "&" as a numeric reference, which would otherwise look like a number.
const plainEntities = (text) =>
  text
    .replace(/&#(x?)([0-9a-f]+);/gi, (_, hex, code) => {
      const character = String.fromCodePoint(parseInt(code, hex ? 16 : 10));
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[character] ?? character;
    })
    .replace(/&(?!\w+;)/g, "&amp;")
    .replace(/\s+/g, " ");
const addText = (unit, raw) => {
  const text = plainEntities(raw);
  const month = text.trim().match(wholeMonth);
  if (month) {
    const index = unit.values.push(text.trim()) - 1;
    unit.germanValues.push(months[month[1]]);
    unit.template += `<k${index}/>`;
    unit.send += `<k${index}>${text.trim()}</k${index}>`;
    return;
  }
  let last = 0;
  for (const match of text.matchAll(protectedText)) {
    if (!match[0]) continue;
    const chunk = text.slice(last, match.index);
    const index = unit.values.push(match[0]) - 1;
    unit.germanValues.push(germanDate(match[0]));
    unit.template += `${chunk}<k${index}/>`;
    unit.send += `${chunk}<k${index}>${match[0]}</k${index}>`;
    last = match.index + match[0].length;
  }
  unit.template += text.slice(last);
  unit.send += text.slice(last);
};
const openTag = (node) =>
  `<${node.name}${Object.entries(node.attributes ?? {}).map(([name, value]) => (value === "" ? ` ${name}` : ` ${name}="${String(value).replaceAll('"', "&quot;")}"`)).join("")}>`;
const addChildren = async (unit, children) => {
  for (const child of children) {
    if (child.type === TEXT_NODE) addText(unit, child.value);
    else if (child.type !== ELEMENT_NODE) continue;
    else if (opaque.has(child.name) || child.name === "code" || skipped.test(child.attributes?.class ?? "")) {
      const index = unit.values.push(await render(child)) - 1;
      unit.germanValues.push(unit.values[index]);
      unit.template += `<k${index}/>`;
      unit.send += `<k${index}>${child.name === "code" ? child.children.map((item) => item.value ?? "").join("") : ""}</k${index}>`;
    } else {
      const index = unit.tags.push(child) - 1;
      unit.template += `<x${index}>`;
      unit.send += `<x${index}>`;
      await addChildren(unit, child.children);
      unit.template += `</x${index}>`;
      unit.send += `</x${index}>`;
    }
  }
};
const hasWords = (template) => /[A-Za-zÀ-ÿ]{2,}/.test(template.replace(/<[^>]+>/g, "").replace(/&\w+;/g, ""));
// A block of nothing but dates needs no translation, only German month names.
const isDateOnly = (unit) => !hasWords(unit.template) && unit.values.some((value, index) => value !== unit.germanValues[index]);
const worthKeeping = (unit) => hasWords(unit.template) || isDateOnly(unit);
const hashOf = (template) => createHash("sha1").update(template).digest("hex").slice(0, 12);

const placeholders = (template) => (template.match(/<\/?[kx]\d+\/?>/g) ?? []).sort().join("");
const restore = (unit, german) =>
  german
    .replace(/<k(\d+)\/>/g, (_, index) => unit.germanValues[index])
    .replace(/<x(\d+)>/g, (_, index) => openTag(unit.tags[index]))
    .replace(/<\/x(\d+)>/g, (_, index) => `</${unit.tags[index].name}>`);

// Walks a parsed page and returns every translatable block in it.
const collect = async (doc) => {
  const units = [];
  const attribute = (node, name) => {
    const unit = makeUnit((german) => (node.attributes[name] = german));
    addText(unit, node.attributes[name]);
    if (worthKeeping(unit)) units.push(unit);
  };
  const walk = async (node) => {
    for (const child of node.children ?? []) {
      if (child.type !== ELEMENT_NODE) continue;
      const attributes = child.attributes ?? {};
      if (child.name === "meta") {
        if (translatedMeta.has(attributes.name ?? attributes.property) && attributes.content) attribute(child, "content");
        continue;
      }
      if (opaque.has(child.name) && child.name !== "img" && child.name !== "input" && child.name !== "picture") continue;
      if ((attributes.lang && child.name !== "html") || attributes.translate === "no" || skipped.test(attributes.class ?? "")) continue;
      for (const name of translatedAttributes) if (attributes[name]) attribute(child, name);
      if (child.name === "picture") await walk(child);
      if (opaque.has(child.name)) continue;
      const direct = (child.children ?? []).some((item) => item.type === TEXT_NODE && item.value.trim());
      if (!direct) {
        await walk(child);
        continue;
      }
      // Separated fields ("school · degree · note") are translated one by one.
      if (child.children.some((item) => /(?:^|\s)cv-sep(?:\s|$)/.test(item.attributes?.class ?? ""))) {
        for (const item of child.children) {
          if (item.type !== TEXT_NODE || !item.value.trim()) continue;
          const unit = makeUnit((german) => (item.value = german));
          addText(unit, item.value);
          if (worthKeeping(unit)) units.push(unit);
        }
        await walk(child);
        continue;
      }
      const unit = makeUnit((german) => (child.children = [{ type: TEXT_NODE, value: german, parent: child }]));
      await addChildren(unit, child.children);
      if (worthKeeping(unit)) units.push(unit);
      // Labels inside a translated block are still reachable by screen readers.
      const inner = async (item) => {
        for (const nested of item.children ?? []) {
          if (nested.type !== ELEMENT_NODE) continue;
          for (const name of translatedAttributes) if (nested.attributes?.[name]) attribute(nested, name);
          await inner(nested);
        }
      };
      await inner(child);
    }
  };
  await walk(doc);
  return units;
};

// ---------- --fetch: translate what is missing, drop what no page uses any more.
const apiKey = () => {
  if (process.env.DEEPL_API_KEY) return process.env.DEEPL_API_KEY;
  try {
    return execFileSync("security", ["find-generic-password", "-s", "deepl-api-key", "-w"], { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    throw new Error("Set DEEPL_API_KEY or store the key in the macOS keychain as deepl-api-key.");
  }
};
const translate = async (texts) => {
  const key = apiKey();
  const host = key.endsWith(":fx") ? "api-free.deepl.com" : "api.deepl.com";
  const translated = [];
  for (let start = 0; start < texts.length; start += 50) {
    const response = await fetch(`https://${host}/v2/translate`, {
      method: "POST",
      headers: { Authorization: `DeepL-Auth-Key ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: texts.slice(start, start + 50),
        source_lang: "EN",
        target_lang: "DE",
        formality: "prefer_more",
        tag_handling: "xml",
        context: "Personal portfolio and résumé website of a cyber security student, written in the first person for employers and engineers.",
      }),
    });
    if (!response.ok) throw new Error(`DeepL answered ${response.status}: ${await response.text()}`);
    translated.push(...(await response.json()).translations.map((item) => item.text));
  }
  return translated;
};
// DeepL may move an article or a hyphen into a protected span ("der H-BRS",
// "ECS-"); keep that around the placeholder and drop the protected text itself.
const toStored = (unit, translated) =>
  translated
    .replace(/<k(\d+)>(.*?)<\/k\1>/gs, (_, index, content) => {
      const value = unit.values[index];
      const at = content.indexOf(value);
      return at < 0 ? `<k${index}/>` : `${content.slice(0, at)}<k${index}/>${content.slice(at + value.length)}`;
    })
    .replace(/<k(\d+)\/?><\/k\1>/g, "<k$1/>")
    .replace(/&(?!\w+;|#)/g, "&amp;");

const fetchMissing = async () => {
  const cache = readCache();
  const next = {};
  const missing = new Map();
  for (const route of routes) {
    for (const unit of await collect(parse(readFileSync(fileFor(route), "utf8")))) {
      if (isDateOnly(unit)) continue;
      const hash = hashOf(unit.template);
      if (cache[hash]) next[hash] = cache[hash];
      else missing.set(hash, unit);
    }
  }
  const units = [...missing.values()];
  const characters = units.reduce((sum, unit) => sum + unit.send.length, 0);
  const translated = units.length ? await translate(units.map((unit) => unit.send)) : [];
  units.forEach((unit, index) => {
    const de = toStored(unit, translated[index]);
    if (placeholders(de) !== placeholders(unit.template)) console.warn(`Placeholders changed, check by hand: ${de}`);
    next[hashOf(unit.template)] = { en: unit.template, de };
  });
  mkdirSync(path.dirname(cacheFile), { recursive: true });
  writeFileSync(cacheFile, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`Translated ${units.length} new text blocks (${characters} characters), kept ${Object.keys(next).length - units.length}, removed ${Object.keys(cache).length - (Object.keys(next).length - units.length)}.`);
};

// ---------- Default: write dist/de and link the two languages.
const absolute = (route) => `${site}${route}`;
const alternates = (route) =>
  ["en", "de", "x-default"].map((hreflang) => ({
    type: ELEMENT_NODE,
    name: "link",
    attributes: { rel: "alternate", hreflang, href: absolute(hreflang === "de" ? germanRoute(route) : route) },
    children: [],
  }));
const find = (node, test, found = []) => {
  for (const child of node.children ?? []) {
    if (child.type !== ELEMENT_NODE) continue;
    if (test(child)) found.push(child);
    find(child, test, found);
  }
  return found;
};
const addAlternates = (doc, route) => {
  const [head] = find(doc, (node) => node.name === "head");
  const [canonical] = find(head, (node) => node.name === "link" && node.attributes.rel === "canonical");
  const links = alternates(route);
  for (const link of links) link.parent = head;
  head.children.splice(head.children.indexOf(canonical) + 1, 0, ...links);
};
const pdf = "/haitao-zheng-resume.pdf";
const germanPdf = "/haitao-zheng-lebenslauf.pdf";
// Links to pages that exist in German stay in German; everything else is English only.
const germanHref = (href) => {
  if (href === pdf && existsSync(`public${germanPdf}`)) return germanPdf;
  const match = href.match(/^(\/(?:resume\/|about\/)?)(#.*)?$/);
  return match && routes.includes(match[1]) ? `${germanRoute(match[1])}${match[2] ?? ""}` : href;
};
const removeFromParent = (node, parent) => {
  for (const child of parent.children ?? []) {
    if (child === node) return void parent.children.splice(parent.children.indexOf(child), 1);
    removeFromParent(node, child);
  }
};

const localize = async () => {
  const cache = readCache();
  const missing = [];
  for (const route of routes) {
    const source = readFileSync(fileFor(route), "utf8");
    const english = parse(source);
    addAlternates(english, route);
    writeFileSync(fileFor(route), await render(english));

    const doc = parse(source);
    // A summary in German is redundant on the German page.
    for (const section of find(doc, (node) => node.attributes?.id === "de" && node.attributes?.lang === "de")) removeFromParent(section, doc);
    const units = await collect(doc);
    let title = "";
    let description = "";
    for (const unit of units) {
      if (isDateOnly(unit)) {
        unit.apply(restore(unit, unit.template));
        continue;
      }
      const entry = cache[hashOf(unit.template)];
      if (!entry) {
        missing.push(`${route}: ${unit.template}`);
        continue;
      }
      if (placeholders(entry.de) !== placeholders(unit.template)) {
        missing.push(`${route}: placeholders differ in ${hashOf(unit.template)}`);
        continue;
      }
      unit.apply(restore(unit, entry.de));
    }
    const german = germanRoute(route);
    for (const node of find(doc, () => true)) {
      const attributes = node.attributes ?? {};
      if (node.name === "html") attributes.lang = "de";
      if (node.name === "title") title = node.children.map((item) => item.value ?? "").join("");
      if (node.name === "meta" && attributes.name === "description") description = attributes.content;
      if (node.name === "meta" && attributes.property === "og:locale") attributes.content = "de_DE";
      if (node.name === "meta" && attributes.property === "og:url") attributes.content = absolute(german);
      if (node.name === "link" && attributes.rel === "canonical") attributes.href = absolute(german);
      if (node.name === "a" && attributes.href && !("data-lang" in attributes)) attributes.href = germanHref(attributes.href);
      if (node.name === "a" && "data-lang" in attributes) {
        if (attributes["data-lang"] === "de") attributes["aria-current"] = "true";
        else delete attributes["aria-current"];
      }
    }
    addAlternates(doc, route);
    for (const script of find(doc, (node) => node.name === "script" && node.attributes.type === "application/ld+json")) {
      const data = JSON.parse(script.children[0].value);
      for (const item of data["@graph"] ?? []) {
        if (item["@type"] === "WebPage") Object.assign(item, { "@id": absolute(german), url: absolute(german), name: title, description, inLanguage: "de" });
        if (item["@type"] === "ProfilePage") Object.assign(item, { "@id": `${absolute(german)}#profile`, url: absolute(german) });
      }
      script.children[0].value = JSON.stringify(data).replaceAll("<", "\\u003c");
    }
    mkdirSync(path.dirname(fileFor(german)), { recursive: true });
    writeFileSync(fileFor(german), await render(doc));
  }
  if (missing.length) console.warn(`${missing.length} text blocks have no German yet; run npm run translate.\n${missing.map((line) => `  ${line}`).join("\n")}`);
  console.log(`Wrote ${routes.length} German pages.`);
};

await (process.argv.includes("--fetch") ? fetchMissing() : localize());
