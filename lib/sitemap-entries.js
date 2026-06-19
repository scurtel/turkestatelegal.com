import { getAllArticles } from "./articles.js";
import { getAllTopicSlugs } from "./topic-guides.js";

const BASE_URL = "https://turkestatelegal.com";

const STATIC_PAGES = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/articles", changeFrequency: "weekly", priority: 0.9 },
  { path: "/topics", changeFrequency: "weekly", priority: 0.85 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.7 }
];

export function toSitemapLastModified(value) {
  if (!value) {
    return new Date();
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date();
  }

  return date;
}

export function getSitemapEntries() {
  const now = new Date();
  const staticEntries = STATIC_PAGES.map((page) => ({
    url: `${BASE_URL}${page.path}`,
    lastModified: now,
    changeFrequency: page.changeFrequency,
    priority: page.priority
  }));

  const topicEntries = getAllTopicSlugs().map((slug) => ({
    url: `${BASE_URL}/topics/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.85
  }));

  const articleEntries = getAllArticles().map((article) => ({
    url: `${BASE_URL}/articles/${article.slug}`,
    lastModified: toSitemapLastModified(article.publishedAt),
    changeFrequency: "monthly",
    priority: 0.8
  }));

  return [...staticEntries, ...topicEntries, ...articleEntries];
}

export function sitemapEntriesToXml(entries) {
  const urls = entries
    .map((entry) => {
      const lastModified = toSitemapLastModified(entry.lastModified).toISOString();
      const lines = [
        "  <url>",
        `    <loc>${escapeXml(entry.url)}</loc>`,
        `    <lastmod>${lastModified}</lastmod>`
      ];

      if (entry.changeFrequency) {
        lines.push(`    <changefreq>${entry.changeFrequency}</changefreq>`);
      }

      if (typeof entry.priority === "number") {
        lines.push(`    <priority>${entry.priority.toFixed(1)}</priority>`);
      }

      lines.push("  </url>");
      return lines.join("\n");
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
