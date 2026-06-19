import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const pagesDirectory = path.join(process.cwd(), "content", "pages");

export function getPageBySlug(slug) {
  const filePath = path.join(pagesDirectory, `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const source = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(source);

  return {
    slug,
    content,
    title: data.title ?? slug,
    seoTitle: data.seoTitle ?? data.title ?? slug,
    seoDescription: data.seoDescription ?? data.excerpt ?? "",
    excerpt: data.excerpt ?? "",
    pageType: data.pageType ?? "page",
    publishedAt: data.publishedAt ?? "",
    author: data.author ?? "Turks Estate Legal"
  };
}
