import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const articlesDirectory = path.join(process.cwd(), "content", "articles");
const placeholderImages = [
  "/images/placeholders/legal-1.png",
  "/images/placeholders/legal-2.png",
  "/images/placeholders/legal-3.png",
  "/images/placeholders/legal-4.png",
  "/images/placeholders/legal-5.png",
  "/images/placeholders/legal-6.png",
  "/images/placeholders/legal-7.png",
  "/images/placeholders/legal-8.png",
  "/images/placeholders/legal-9.png",
  "/images/placeholders/legal-10.png"
];

const categoryPlaceholderPools = {
  "City Guide": placeholderImages,
  "Fraud Prevention": placeholderImages,
  "Due Diligence": placeholderImages,
  "Payment Safety": placeholderImages
};

function getStablePlaceholderBySlug(slug, category) {
  let hash = 0;
  const key = `${slug}:${category ?? ""}`;
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash << 5) - hash + key.charCodeAt(index);
    hash |= 0;
  }
  const pool = categoryPlaceholderPools[category] ?? placeholderImages;
  const normalized = Math.abs(hash) % pool.length;
  return pool[normalized];
}

function resolveCoverImage(coverImage, slug, category) {
  const cleaned = typeof coverImage === "string" ? coverImage.trim() : "";
  if (cleaned) {
    return cleaned;
  }
  return getStablePlaceholderBySlug(slug, category);
}

function toIsoDate(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

function parseArticleFile(fileName) {
  const slug = fileName.replace(/\.mdx?$/, "");
  const fullPath = path.join(articlesDirectory, fileName);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);
  const category = data.category ?? "General Guidance";

  return {
    slug,
    content,
    title: data.title ?? slug,
    excerpt: data.excerpt ?? "",
    publishedAt: data.publishedAt ?? data.date ?? "",
    seoTitle: data.seoTitle ?? data.title ?? slug,
    seoDescription: data.seoDescription ?? data.excerpt ?? "",
    coverImage: resolveCoverImage(data.coverImage, slug, category),
    category
  };
}

export function getAllArticles() {
  if (!fs.existsSync(articlesDirectory)) {
    return [];
  }

  const fileNames = fs
    .readdirSync(articlesDirectory)
    .filter((file) => file.endsWith(".md") || file.endsWith(".mdx"));

  const articles = fileNames.map(parseArticleFile);

  return articles.sort((a, b) => {
    const left = toIsoDate(a.publishedAt);
    const right = toIsoDate(b.publishedAt);
    if (!left || !right) {
      return a.slug.localeCompare(b.slug);
    }
    return right.localeCompare(left);
  });
}

export function getAllArticleSlugs() {
  return getAllArticles().map((article) => ({ slug: article.slug }));
}

export function getArticleBySlug(slug) {
  const articlePathMd = path.join(articlesDirectory, `${slug}.md`);
  const articlePathMdx = path.join(articlesDirectory, `${slug}.mdx`);

  if (!fs.existsSync(articlePathMd) && !fs.existsSync(articlePathMdx)) {
    return null;
  }

  const filePath = fs.existsSync(articlePathMd) ? articlePathMd : articlePathMdx;
  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);
  const category = data.category ?? "General Guidance";

  return {
    slug,
    content,
    title: data.title ?? slug,
    excerpt: data.excerpt ?? "",
    publishedAt: data.publishedAt ?? data.date ?? "",
    seoTitle: data.seoTitle ?? data.title ?? slug,
    seoDescription: data.seoDescription ?? data.excerpt ?? "",
    coverImage: resolveCoverImage(data.coverImage, slug, category),
    category
  };
}
