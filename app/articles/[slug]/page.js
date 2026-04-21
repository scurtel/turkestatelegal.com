import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import Image from "next/image";
import Link from "next/link";
import { getAllArticleSlugs, getArticleBySlug } from "@/lib/articles";
import ShareArticleButton from "./ShareArticleButton";
import ArticleTocClient from "./ArticleTocClient";

function slugifyHeading(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function flattenText(children) {
  if (Array.isArray(children)) {
    return children.map(flattenText).join("");
  }
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }
  if (children && typeof children === "object" && "props" in children) {
    return flattenText(children.props.children);
  }
  return "";
}

function extractToc(content) {
  const matches = [...content.matchAll(/^##\s+(.+)$/gm)];
  return matches.map((entry) => {
    const text = entry[1].trim();
    return {
      text,
      id: slugifyHeading(text)
    };
  });
}

function getReadingTime(content) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export async function generateStaticParams() {
  return getAllArticleSlugs();
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) {
    return {
      title: "Article Not Found"
    };
  }

  return {
    title: article.seoTitle,
    description: article.seoDescription,
    alternates: {
      canonical: `/articles/${article.slug}`
    },
    openGraph: {
      title: article.seoTitle,
      description: article.seoDescription,
      type: "article",
      url: `/articles/${article.slug}`
    }
  };
}

export default async function ArticleDetailPage({ params }) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) {
    notFound();
  }
  const tocItems = extractToc(article.content);
  const readingTime = getReadingTime(article.content);

  return (
    <article>
      <section className="article-header">
        <div className="article-header-bg" aria-hidden="true">
          <Image
            src={article.coverImage}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 1100px"
            className="article-header-bg-img"
            priority
          />
          <div className="article-header-overlay" />
        </div>
        <div className="article-header-content">
          <p className="article-header-breadcrumb">
            <Link href="/articles">Articles</Link> / {article.category}
          </p>
          <h1>{article.title}</h1>
          <p className="article-header-meta">
            {article.publishedAt
              ? new Date(article.publishedAt).toLocaleDateString("en-US")
              : ""}
            {` • ${readingTime} min read`}
          </p>
          {article.excerpt ? (
            <p className="article-header-excerpt">{article.excerpt}</p>
          ) : null}
          <div className="article-header-actions">
            <ShareArticleButton
              url={`https://turkestatelegal.com/articles/${article.slug}`}
              title={article.seoTitle || article.title}
              className="article-header-action"
            />
            <a
              href="https://wa.me/905336342425"
              target="_blank"
              rel="noreferrer"
              className="article-header-action article-header-action-primary"
            >
              WhatsApp Legal Contact
            </a>
          </div>
        </div>
      </section>

      <div className="article-shell">
        {tocItems.length > 0 ? (
          <aside className="article-toc">
            <h2>On This Page</h2>
            <ArticleTocClient items={tocItems} />
          </aside>
        ) : null}

        <section className="article-content">
          <ReactMarkdown
            components={{
              h2({ children, ...props }) {
                const text = flattenText(children);
                const id = slugifyHeading(text);
                return (
                  <h2 id={id} {...props}>
                    {children}
                  </h2>
                );
              },
              h3({ children, ...props }) {
                const text = flattenText(children);
                const id = slugifyHeading(text);
                return (
                  <h3 id={id} {...props}>
                    {children}
                  </h3>
                );
              }
            }}
          >
            {article.content}
          </ReactMarkdown>

          <section className="article-cta">
            <h2>Need Legal Review Before You Pay?</h2>
            <p>
              If you want case-specific legal guidance before signing documents or
              transferring funds, contact Lawyer Ceren Sumer Cilli directly.
            </p>
            <div className="cta-row">
              <a
                className="btn-primary"
                href="https://wa.me/905336342425"
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp Legal Contact
              </a>
              <Link href="/contact">Go to Contact Page</Link>
            </div>
          </section>
        </section>
      </div>
    </article>
  );
}
