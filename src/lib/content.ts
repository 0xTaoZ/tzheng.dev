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

const wordCount = (text = "") =>
  text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .split(/\s+/)
    .filter(Boolean).length;

// The stated reading time wins; otherwise estimate at 220 words per minute.
export const readingTime = (article: CollectionEntry<"articles">) =>
  article.data.readingTime ??
  `${Math.max(1, Math.round(wordCount(article.body) / 220))} min`;

export const formatDate = (
  date: Date,
  month: "short" | "long" = "long",
) =>
  date.toLocaleDateString("en", {
    month,
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

// Related notes: the same project counts most, then shared tags, then the
// same category. Ties go to the most recent publication. Articles with no
// signal at all are only used to fill the list up to `limit`.
export const relatedArticles = (
  article: CollectionEntry<"articles">,
  all: CollectionEntry<"articles">[],
  limit = 3,
) => {
  const tags = new Set(article.data.tags);
  return all
    .filter((item) => entrySlug(item) !== entrySlug(article))
    .map((item) => ({
      item,
      score:
        (article.data.project && item.data.project === article.data.project ? 6 : 0) +
        item.data.tags.filter((tag) => tags.has(tag)).length * 2 +
        (item.data.category === article.data.category ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score || byPublication(a.item, b.item))
    .slice(0, limit)
    .map(({ item }) => item);
};
