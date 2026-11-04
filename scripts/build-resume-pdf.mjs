// Prints the built résumé pages to public/haitao-zheng-resume.pdf and
// public/haitao-zheng-lebenslauf.pdf with a local Chrome or Chromium. Run `npm run build && npm run resume:pdf`, then
// build again so the PDF is copied into dist. The PDF is committed because
// the Pages build has no browser.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";

const root = path.resolve("dist");
const documents = [
  { route: "/resume/", output: path.resolve("public/haitao-zheng-resume.pdf") },
  { route: "/de/resume/", output: path.resolve("public/haitao-zheng-lebenslauf.pdf") },
];
const browsers = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);
const browser = browsers.find((candidate) => existsSync(candidate));
if (!browser) throw new Error("No Chrome or Chromium found; set CHROME_PATH.");
if (!existsSync(path.join(root, "resume/index.html"))) throw new Error("Run npm run build first.");

const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".woff2": "font/woff2", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".avif": "image/avif" };
const server = createServer(async (request, response) => {
  let file = path.join(root, decodeURIComponent(new URL(request.url, "http://x").pathname));
  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
    response.writeHead(200, { "content-type": types[path.extname(file)] ?? "application/octet-stream" });
    response.end(await readFile(file));
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

let failed = false;
for (const { route, output } of documents) {
const url = `http://127.0.0.1:${server.address().port}${route}`;
const profile = await mkdtemp(path.join(tmpdir(), "resume-pdf-"));
await rm(output, { force: true });
const chrome = spawn(browser, [
  "--headless=new",
  "--virtual-time-budget=5000",
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  "--no-pdf-header-footer",
  `--user-data-dir=${profile}`,
  `--print-to-pdf=${output}`,
  url,
], { stdio: "ignore" });

// Chrome sometimes keeps running after writing the file, so wait for it.
const started = Date.now();
while (!existsSync(output) || (await stat(output)).size === 0) {
  if (Date.now() - started > 45_000) throw new Error("Timed out waiting for the PDF.");
  await new Promise((resolve) => setTimeout(resolve, 500));
}
await new Promise((resolve) => setTimeout(resolve, 2500));
const exited = chrome.exitCode === null && chrome.signalCode === null
  ? new Promise((resolve) => chrome.once("exit", resolve))
  : Promise.resolve();
chrome.kill();
await exited;
// Chrome may still be flushing its profile; the temporary folder is disposable.
await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(() => {});

const pdf = await readFile(output);
const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
console.log(`Wrote ${path.relative(process.cwd(), output)}: ${pages} page(s), ${(pdf.length / 1024).toFixed(0)} KB.`);
if (pages !== 1) {
  console.error(`${route} should fit on one A4 page.`);
  failed = true;
}
}
server.close();
if (failed) process.exit(1);
