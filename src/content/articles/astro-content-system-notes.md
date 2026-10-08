---
title: "How I use Astro Content Collections for my portfolio"
slug: "astro-content-system-notes"
date: 2026-07-08
excerpt: "How I keep cards and pages in sync, publish Markdown and search the article archive without a backend."
tags: ["astro", "frontend", "content-system", "cloudflare", "seo"]
category: "Engineering"
featured: true
status: "published"
readingTime: "2 min"
updated: 2026-10-06
project: "tzheng-dev"
---

Project cards used to keep their own copies of the title and summary inside my homepage. I could update a case study and leave its card describing the old version. I now keep those details in one content record.

This July article was updated in October to describe the current site.

## One record for the page and its card

Articles and projects are Markdown files in `src/content/`. The schema in `src/content.config.ts` checks required fields before the build. A separate slug keeps the URL stable when I change a title.

Project metadata includes source links, stack and homepage order. The homepage, complete index and case study read the same collection. The terminal's selected-project list uses the same order too.

For articles, `homepageOrder` selects three reading recommendations. The archive includes all published entries. Drafts are left out of the public routes, homepage and RSS. There is no second article body inside a JavaScript array.

## Dates and finding an article

`date` holds the publication date. An optional `seriesMonth` groups a note into a monthly reading series. It does not change the date shown in RSS or structured data.

Search runs in the browser over the title, summary, category and tags. The whole archive is already in the HTML, so readers can browse it even without JavaScript. I do not need a server query for this amount of content.

Project articles also link back to their case study. That helps a reader find the code after reading about one small part of it.

## Publishing

The build generates article pages, the archive, RSS and sitemap. GitHub Actions publishes the checked output to GitHub Pages, with Cloudflare in front of the site.

For now, Markdown and Git are enough for editing. A browser editor or multiple authors would be a different requirement. The [system page](/system/#content) has the current implementation, and the [site case study](/projects/tzheng-dev/) explains the maintenance work.
