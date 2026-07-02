# tzheng.dev

Personal engineering website for Haitao Zheng: a cyber-inspired portfolio, technical writing system, and curated project documentation space.

The site is designed as a static-first engineering project instead of a one-off resume page. It keeps the public surface small, makes content version-controlled, and gives articles and projects a maintainable structure for long-term growth.

## Purpose

tzheng.dev is built to present:

- selected security, cloud, systems, and tooling projects
- technical articles and study notes
- education, language background, and personal engineering direction
- the system design behind the website itself

The site is recruiter-friendly, but it is also meant to be useful for engineers who want to understand the actual project thinking behind the work.

## Design Language

The visual direction is cyber-inspired, premium, minimal, and readable:

- dark interface with restrained neon accents
- terminal-inspired details without noisy decoration
- responsive cards and editorial article layouts
- fast scanning for recruiters
- code-friendly long-form reading for technical notes
- mobile-first constraints for navigation, cards, and article pages

## Architecture

The project uses Astro with static output.

```text
Astro source files
        |
        v
MDX content collections
        |
        v
Static build in dist/
        |
        v
GitHub Pages or Cloudflare Pages
```

Static output is a deliberate choice: it is fast, easy to deploy, simple to cache, and safer for a personal technical website than running a public login surface or unnecessary database.

## Frontend System

The frontend is organized around shared layout and styling primitives:

- reusable base layout with SEO, Open Graph, favicon, navigation, and footer
- responsive homepage sections for identity, selected projects, writing, education, toolkit, and personal context
- article index and detail pages generated from content collections
- project index and case-study pages generated from content collections
- consistent card, chip, metadata, table-of-contents, and footer patterns
- static-friendly animations and effects with a restrained performance budget

## Content System

Articles and projects are stored as independent Markdown/MDX files.

```text
src/content/articles/
src/content/projects/
```

Articles use frontmatter for title, slug, date, updated date, excerpt, tags, category, featured state, publication status, and reading time.

Projects use frontmatter for title, slug, date, status, type, featured state, priority, stack, GitHub link, demo link, excerpt, and body content.

This keeps content portable. It can be edited locally, in GitHub, through a future Git-based CMS, or by any workflow that writes structured files to the repository.

## Publishing Workflow

Publishing is Git-based:

- content and code changes are committed to version control
- updates are reviewable, traceable, and reversible
- Astro builds the site into static files
- deployment can run through GitHub Pages or Cloudflare Pages

The local `admin.html` tool can remain a drafting aid, but the source of truth is the MDX content collection.

## Security Posture

The public site is intentionally static-first:

- no public password-only publishing surface
- no unnecessary database attack surface
- no intentional advertising trackers
- HTTPS-first deployment
- Cloudflare nameservers for DNS and edge protection
- version-controlled content and code changes

This fits the purpose of a personal cybersecurity and engineering website: publish clearly, keep the attack surface small, and avoid pretending that client-side password gates are real backend security.

## Performance

The site is optimized for static delivery:

- generated HTML routes
- content-driven pages without runtime database calls
- shared CSS instead of heavy page-specific bundles
- image assets served from the static public directory
- RSS and sitemap generation during build

Future changes should keep a strict performance budget so the site stays fast while the content system grows.

## Roadmap

- richer MDX components for technical articles
- deeper project case-study pages
- tag and category archive pages
- improved client-side search and filtering
- richer Open Graph preview images
- optional Git-based CMS integration
- accessibility improvements
- documented performance budget
- privacy-respecting analytics without invasive tracking

## Repository Structure

```text
src/
  content/
    articles/      Markdown/MDX article source files
    projects/      Markdown/MDX project source files
  layouts/         Shared Astro layouts
  lib/             Small content helpers
  pages/           Static routes, generated routes, RSS
  styles/          Global design system styles
public/            Static assets and local drafting tools
astro.config.mjs   Astro, MDX, sitemap, and markdown config
package.json       Build, check, preview, and dependency scripts
```
