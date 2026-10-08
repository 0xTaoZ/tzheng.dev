import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const articles = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/articles" }),
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    project: z.string().optional(),
    seriesMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),
    homepageOrder: z.number().int().positive().optional(),
    excerpt: z.string(),
    tags: z.array(z.string()).default([]),
    category: z.string(),
    featured: z.boolean().default(false),
    status: z.enum(["draft", "published", "archived"]).default("published"),
    readingTime: z.string(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),
    date: z.coerce.date(),
    status: z.enum([
      "active",
      "archived",
      "learning",
      "open-source",
      "security",
    ]),
    type: z.string(),
    featured: z.boolean().default(false),
    priority: z.number().default(99),
    homepageOrder: z.number().int().positive().optional(),
    homepageFacts: z
      .array(z.object({ label: z.string(), text: z.string() }))
      .default([]),
    stack: z.array(z.string()).default([]),
    github: z.url().optional(),
    demo: z.url().optional(),
    excerpt: z.string(),
    outcome: z.string().optional(),
  }),
});

export const collections = { articles, projects };
