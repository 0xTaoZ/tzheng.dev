export const entrySlug = (entry: { id: string; data: { slug?: string } }) =>
  entry.data.slug ?? entry.id.replace(/\.(md|mdx)$/, "");
