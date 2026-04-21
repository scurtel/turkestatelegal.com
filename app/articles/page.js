import Link from "next/link";
import Image from "next/image";
import { getAllArticles } from "@/lib/articles";

export const metadata = {
  title: "Articles",
  description:
    "English-only legal and practical articles for foreigners buying property in Turkey."
};

export default function ArticlesPage() {
  const articles = getAllArticles();

  return (
    <section className="section-space">
      <h1>Articles</h1>
      <p>
        Explore practical legal and process guidance written in English for
        foreigners buying property in Turkey.
      </p>

      <div className="article-grid">
        {articles.map((article) => (
          <article className="article-card" key={article.slug}>
            <div className="article-thumb">
              <Image
                src={article.coverImage}
                alt={article.title}
                width={800}
                height={450}
                className="article-thumb-img"
              />
            </div>
            <p className="card-meta-row">
              <span className="card-category">{article.category}</span>
              {article.publishedAt ? (
                <span className="card-date">
                  {new Date(article.publishedAt).toLocaleDateString("en-US")}
                </span>
              ) : null}
            </p>
            <h2 className="article-card-title">
              <Link href={`/articles/${article.slug}`}>{article.title}</Link>
            </h2>
            <p>{article.excerpt}</p>
            <p>
              <Link href={`/articles/${article.slug}`}>Read article</Link>
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
