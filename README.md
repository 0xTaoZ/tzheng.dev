# tzheng.dev

[Haitao Zheng’s portfolio](https://tzheng.dev): security tooling, cloud
infrastructure, project case studies and technical writing.

## Development

Use Node.js 24 and npm. Run `npm ci`, then `npm run dev`.
Verify with `npm run check`, `npm run build` and `npm test`.

## Content and presentation

The homepage is composed from `src/components/home/` by
`src/pages/index.astro`. Its original presentation is retained in local CSS and
interaction assets; no browser-time CSS compiler is required.
`home-utilities.css` retains the existing utility rules. Add new styles to
`home.css` rather than relying on runtime generation of new utility classes. Supporting pages use the original shared layout and
dark styles. Articles and project case studies use typed Markdown collections;
existing detail URLs are preserved. A single sitemap integration generates
the index; the postbuild step preserves `/sitemap.xml` as an alias. The contribution snapshot lives in
`src/data/contributions.json`; refresh verified records and the date together.

## Publishing

A push to `main` uses `.github/workflows/deploy.yml` to check, build and deploy
the static artifact to GitHub Pages. Keep this single deployment path.

## Article publishing

Add Markdown to `src/content/articles/`. The collection validates titles, slugs,
publication dates, categories, tags and status. `draft` and `archived` entries
are excluded from routes, the archive, homepage and RSS. The monthly archive
supports local full-text search and category filtering without a service.
All articles remain available when JavaScript is disabled.

`date` is the actual publication date. Optional `seriesMonth` (YYYY-MM) groups
an article into a monthly reading series about a topic or period of work; it
never overrides the publication date in the article, feed or structured data.
New companion guides explicitly describe when they were written. Preserve
original publication dates when updating older notes, and set `updated`.
Optional `homepageOrder` selects the three homepage reading recommendations.
Set `project` to a case-study slug when a note explains that project. The build
rejects unknown project references. Related notes prefer the same project.

No database or authentication service is needed for this editorial workflow.
Revisit that choice if a browser-based multi-author editor, reader accounts or
comments become requirements. Content changes use the same checked Pages build.
