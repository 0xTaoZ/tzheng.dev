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
excerpt: "A static engineering portfolio with evidence-linked case studies, technical writing and a shared dark interface."
outcome: "Prebuilt pages and typed content, no public application backend."
---

## A portfolio is an information problem

The first job of this site is to help a visitor understand the work and inspect the evidence. Visual detail should make that easier. It should not compete with the projects.

## Architecture

Astro generates routes from typed Markdown content. The project and article indexes read the same collections as their detail pages. A dated contribution snapshot supplies verified links and derives its totals from the record.

```text
Pages + Markdown + contribution snapshot
    → Astro build
    → static artifact
    → GitHub Actions / GitHub Pages
```

## The renewal

The original homepage presentation is preserved in its HTML source and assembled by an Astro page. Supporting pages share the original dark layout. Project and article metadata are validated independently of that presentation.

The article archive is generated as HTML and remains readable without client-side content fetching.

## Why there is no backend

Visitors need to read, inspect source links and make contact. None of those tasks needs an account system or database. Build-time content validation and version control are enough for publishing.

## Verification

Types and content are checked before the static build. Production uses the existing GitHub Pages workflow; presentation changes also require a browser check.

[Read the colophon](/system/) for the design and publishing decisions.
