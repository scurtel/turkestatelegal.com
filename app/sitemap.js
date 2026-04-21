import { getAllArticles } from "@/lib/articles";

export default function sitemap() {
  const baseUrl = "https://turkestatelegal.com";
  const articleEntries = getAllArticles().map((article) => ({
    url: `${baseUrl}/articles/${article.slug}`,
    lastModified: article.publishedAt || new Date().toISOString()
  }));

  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date().toISOString()
    },
    {
      url: `${baseUrl}/articles`,
      lastModified: new Date().toISOString()
    },
    ...articleEntries
  ];
}
