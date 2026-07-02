import { defineCollection, z } from "astro:content";

const articles = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),
    date: z.date(),
    updated: z.date().optional(),
    excerpt: z.string(),
    tags: z.array(z.string()).default([]),
    category: z.string(),
    featured: z.boolean().default(false),
    status: z.enum(["draft", "published", "archived"]).default("published"),
    readingTime: z.string()
  })
});

const projects = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),
    date: z.date(),
    status: z.enum(["active", "archived", "learning", "open-source", "security"]),
    type: z.string(),
    featured: z.boolean().default(false),
    priority: z.number().default(99),
    stack: z.array(z.string()).default([]),
    github: z.string().url().optional(),
    demo: z.string().url().optional(),
    excerpt: z.string()
  })
});

export const collections = { articles, projects };
