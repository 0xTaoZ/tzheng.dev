---
title: "tzheng.dev"
slug: "tzheng-dev"
date: "2026-10-03"
status: "active"
type: "Publishing system"
featured: false
priority: 7
stack: ["Astro", "Markdown", "CSS", "GitHub Pages"]
github: "https://github.com/0xTaoZ/tzheng.dev"
excerpt: "A static engineering portfolio with evidence-linked case studies, technical writing and a shared editorial interface."
outcome: "Prebuilt pages, local fonts and images, no public application backend."
---

## A portfolio is an information problem

The first job of this site is to help a visitor understand the work and inspect the evidence. Visual detail should make that easier. It should not compete with the projects.

## Architecture

Astro generates routes from typed Markdown content. The homepage reads the same collections as the project and article indexes. A dated contribution snapshot supplies verified links and derives its totals from the record.

```text
Pages + Markdown + contribution snapshot
    → Astro build
    → static artifact
    → GitHub Actions / GitHub Pages
```

## The renewal

The homepage previously read a legacy HTML file and modified it through string replacements. It now uses the shared Astro layout and collection-backed components. Navigation, typography, accessibility and metadata use the same system across the site.

Fonts and optimized portraits are served locally. The article archive has lightweight client-side filtering; the full archive remains readable when JavaScript is disabled.

## Why there is no backend

Visitors need to read, inspect source links and make contact. None of those tasks needs an account system or database. Build-time content validation and version control are enough for publishing.

## Verification

The build is followed by checks for generated routes, local assets, fragment links, page headings and identity references. Production uses the existing GitHub Pages workflow.

[Read the colophon](/system/) for the design and publishing decisions.
