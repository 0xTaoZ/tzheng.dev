import { getCollection } from "astro:content";
import { entrySlug, readingTime } from "../lib/content";

// Search index for the command palette: pages, project cases and articles.
// Article bodies are reduced to plain words so the file stays small.
const plain = (markdown = "") =>
  markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

export async function GET() {
  const articles = await getCollection("articles", ({ data }) => data.status === "published");
  const projects = await getCollection("projects");
  const pages = [
    { title: "Home", url: "/", kind: "Page", text: "haitao zheng tao 郑海涛 overview" },
    { title: "Open-source work", url: "/contributions/", kind: "Page", text: "merged pull requests upstream contributions pyinfra cfn-lint prowler trivy guarddog ansible-lint graphtage" },
    { title: "Projects", url: "/projects/", kind: "Page", text: "tools case studies" },
    { title: "Articles", url: "/articles/", kind: "Page", text: "writing archive notes rss" },
    { title: "About", url: "/about/", kind: "Page", text: "profile education languages 中文 deutsch kurzprofil" },
    { title: "Résumé", url: "/resume/", kind: "Page", text: "resume cv lebenslauf pdf" },
    { title: "Topics", url: "/topics/", kind: "Page", text: "browse by subject" },
    { title: "System design", url: "/system/", kind: "Page", text: "architecture astro build delivery security" },
    { title: "Legal & security", url: "/legal/", kind: "Page", text: "impressum datenschutz privacy" },
  ];
  const index = [
    ...pages.map((page) => ({ ...page, meta: "", tags: "" })),
    ...projects.map((project) => ({
      title: project.data.title,
      url: `/projects/${entrySlug(project)}/`,
      kind: "Project",
      meta: project.data.type,
      tags: project.data.stack.join(" ").toLowerCase(),
      text: `${project.data.excerpt} ${plain(project.body)}`.toLowerCase(),
    })),
    ...articles.map((article) => ({
      title: article.data.title,
      url: `/articles/${entrySlug(article)}/`,
      kind: "Article",
      meta: `${article.data.category} · ${readingTime(article)}`,
      tags: [article.data.category, ...article.data.tags].join(" ").toLowerCase(),
      text: `${article.data.excerpt} ${plain(article.body)}`.toLowerCase(),
    })),
  ];
  return new Response(JSON.stringify(index), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
