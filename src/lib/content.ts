import type { CollectionEntry } from "astro:content";

export const entrySlug = (entry: { id: string; data: { slug?: string } }) =>
  entry.data.slug ?? entry.id.replace(/\.(md|mdx)$/, "");

export const selectHomepageProjects = (
  projects: CollectionEntry<"projects">[],
) =>
  projects
    .filter((project) => project.data.homepageOrder !== undefined)
    .sort((a, b) => a.data.homepageOrder! - b.data.homepageOrder!);

export const articleMonth = (article: CollectionEntry<"articles">) =>
  article.data.seriesMonth ?? article.data.date.toISOString().slice(0, 7);

export const monthLabel = (month: string) =>
  new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en", {
    month: "long", year: "numeric", timeZone: "UTC",
  });

export const byPublication = (
  a: CollectionEntry<"articles">, b: CollectionEntry<"articles">,
) => b.data.date.valueOf() - a.data.date.valueOf() || a.id.localeCompare(b.id);
