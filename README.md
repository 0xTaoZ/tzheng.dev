# tzheng.dev

[Haitao Zheng’s portfolio](https://tzheng.dev): security tooling, cloud
infrastructure, project case studies and technical writing.

## Development

Use Node.js 24 and npm. Run `npm ci`, then `npm run dev`.
Verify with `npm run check` and `npm run build`.

## Content and presentation

The homepage uses the original HTML presentation in `index.html`, assembled by
`src/pages/index.astro`. Supporting pages use the original shared layout and
dark styles. Articles and project case studies use typed Markdown collections;
existing detail URLs are preserved. The contribution snapshot lives in
`src/data/contributions.json`; refresh verified records and the date together.

## Publishing

A push to `main` uses `.github/workflows/deploy.yml` to check, build and deploy
the static artifact to GitHub Pages. Keep this single deployment path.
