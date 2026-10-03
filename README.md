# tzheng.dev

[Haitao Zheng’s engineering portfolio](https://tzheng.dev): security tooling,
cloud infrastructure, accepted upstream work and technical writing.

## Run

Use Node.js 24 and npm.

```sh
npm ci
npm run dev
```

## Verify

```sh
npm run check
npm run build
npm test
```

The built-site check verifies headings, skip-link targets, local assets,
internal routes, fragment links and structured identity references.

## Structure

- `src/pages/`: homepage, indexes, generated detail pages and supporting routes
- `src/content/projects/`: project scope, decisions, evidence and limits
- `src/content/articles/`: published notes and drafts
- `src/content.config.ts`: typed Content Layer collections
- `src/data/contributions.json`: dated merged-upstream snapshot
- `src/lib/contributions.ts`: derived totals and selected technical cases
- `src/layouts/BaseLayout.astro`: navigation, metadata and footer
- `src/styles/global.css`: shared editorial design and responsive rules
- `public/`: local font, images and static delivery assets

The homepage reads the same project and article collections as their indexes.
The contribution counts are derived from the snapshot record. Refresh the date
and the verified list together; exclude own-repository PRs and unmerged work.

## Interface

Warm paper, ink, copper and restrained green. Source Serif 4 Display is served
locally under the SIL Open Font License; its license is in `public/fonts/`.
The body uses system fonts. The portrait is served in two WebP sizes.

The archive adds a small search/filter script. The complete archive and native
mobile navigation work without JavaScript. Reduced-motion and print styles
are included. There is no application backend or analytics script.

## Publish

Production uses `.github/workflows/deploy.yml`. A push to `main` installs from
the lockfile, checks the project, builds, verifies generated pages and deploys
the static artifact to GitHub Pages. Cloudflare supplies the domain’s edge layer.

Keep this single publication path. No `gh-pages` branch, manual `dist` publishing
or second hosting workflow is needed. Check the workflow, deployment and
production URL before considering a release complete.
