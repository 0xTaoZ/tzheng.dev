import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { entrySlug } from "../lib/content";

export async function GET(context) {
  const articles = (await getCollection("articles", ({ data }) => data.status === "published"))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: "Haitao Zheng Articles",
    description: "Security notes, learning logs, and project writing by Haitao Zheng.",
    site: context.site,
    items: articles.map((article) => ({
      title: article.data.title,
      description: article.data.excerpt,
      pubDate: article.data.date,
      link: `/articles/${entrySlug(article)}/`
    }))
  });
}
