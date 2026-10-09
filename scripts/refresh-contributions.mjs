// Refreshes src/data/contributions.json from GitHub with the authenticated
// `gh` CLI. Only merged pull requests to repositories outside the author's
// own account are recorded. Review the diff before committing: the snapshot
// is the published claim, and `npm test` checks the pages against it.
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";

const author = "0xTaoZ";
const file = new URL("../src/data/contributions.json", import.meta.url);

const graphql = (query, variables = {}) => {
  const args = ["api", "graphql", "-f", `query=${query}`];
  for (const [key, value] of Object.entries(variables))
    args.push("-F", `${key}=${value}`);
  return JSON.parse(execFileSync("gh", args, { encoding: "utf8" })).data;
};

const searchQuery = `
  query($q: String!, $cursor: String) {
    search(query: $q, type: ISSUE, first: 100, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      issueCount
      nodes {
        ... on PullRequest {
          number title url mergedAt createdAt
          repository { nameWithOwner stargazerCount owner { login } }
        }
      }
    }
  }`;

const search = (q) => {
  const nodes = [];
  let cursor;
  for (;;) {
    const variables = { q };
    if (cursor) variables.cursor = cursor;
    const { search: page } = graphql(searchQuery, variables);
    nodes.push(...page.nodes);
    if (!page.pageInfo.hasNextPage) return { nodes, count: page.issueCount };
    cursor = page.pageInfo.endCursor;
  }
};

const external = (pr) => pr.repository.owner.login.toLowerCase() !== author.toLowerCase();
const merged = search(`is:pr is:merged author:${author} -user:${author}`).nodes
  .filter(external)
  .sort((a, b) => b.mergedAt.localeCompare(a.mergedAt) || b.number - a.number);
const open = search(`is:pr is:open author:${author} -user:${author}`).nodes.filter(external);

// The public contribution calendar, as any visitor sees it on the profile.
const calendarHtml = await (await fetch(`https://github.com/users/${author}/contributions`)).text();
const dateById = new Map(
  [...calendarHtml.matchAll(/data-date="(\d{4}-\d{2}-\d{2})" id="([^"]+)"/g)].map((match) => [match[2], match[1]]),
);
const calendar = [...calendarHtml.matchAll(/<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)]
  .filter(([, id]) => dateById.has(id))
  .map(([, id, text]) => ({ date: dateById.get(id), count: Number(text.match(/^(\d+) contribution/)?.[1] ?? 0) }))
  .sort((a, b) => a.date.localeCompare(b.date));
if (calendar.length < 300) throw new Error(`Unexpected contribution calendar (${calendar.length} days).`);

const previous = JSON.parse(await readFile(file, "utf8"));
const repositories = Object.fromEntries(
  [...new Map(merged.map((pr) => [pr.repository.nameWithOwner, pr.repository])).values()]
    .sort((a, b) => b.stargazerCount - a.stargazerCount)
    .map((repo) => [repo.nameWithOwner, { stars: repo.stargazerCount }]),
);

const snapshot = {
  verifiedAt: new Date().toISOString().slice(0, 10),
  openCount: open.length,
  open: open
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((pr) => ({
      repository: pr.repository.nameWithOwner,
      number: pr.number,
      title: pr.title,
      url: pr.url,
      openedAt: pr.createdAt.slice(0, 10),
    })),
  repositories,
  calendar,
  merged: merged.map((pr) => ({
    repository: pr.repository.nameWithOwner,
    number: pr.number,
    title: pr.title,
    url: pr.url,
    mergedAt: pr.mergedAt.slice(0, 10),
  })),
};

await writeFile(file, `${JSON.stringify(snapshot, null, 2)}\n`);
const before = new Set(previous.merged.map((pr) => pr.url));
const added = snapshot.merged.filter((pr) => !before.has(pr.url));
const removed = previous.merged.filter((pr) => !snapshot.merged.some((item) => item.url === pr.url));
console.log(`${calendar.reduce((sum, day) => sum + day.count, 0)} public contributions over ${calendar.length} days.`);
console.log(`${snapshot.merged.length} merged PRs across ${Object.keys(repositories).length} repositories; ${open.length} open.`);
for (const pr of added) console.log(`+ ${pr.repository}#${pr.number} ${pr.title}`);
for (const pr of removed) console.log(`- ${pr.repository}#${pr.number} ${pr.title}`);
