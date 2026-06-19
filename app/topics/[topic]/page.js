import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  buildTopicPageJsonLd,
  getAllTopicSlugs,
  getTopicArticles,
  getTopicGuide,
  getTopicPillarArticle,
  getTopicSpokeArticles
} from "@/lib/topic-guides";
import { truncateArticleExcerpt } from "@/lib/articles";

export async function generateStaticParams() {
  return getAllTopicSlugs().map((topic) => ({ topic }));
}

export async function generateMetadata({ params }) {
  const { topic: topicSlug } = await params;
  const topic = getTopicGuide(topicSlug);

  if (!topic) {
    return { title: "Topic Not Found" };
  }

  return {
    title: { absolute: topic.seoTitle },
    description: topic.seoDescription,
    alternates: {
      canonical: `/topics/${topic.slug}`
    },
    openGraph: {
      title: topic.seoTitle,
      description: topic.seoDescription,
      url: `/topics/${topic.slug}`,
      type: "website"
    }
  };
}

function ArticleCard({ article }) {
  return (
    <article className="article-card">
      <div className="article-thumb">
        <Image
          src={article.coverImage}
          alt={article.title}
          width={800}
          height={450}
          sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 360px"
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
      <h3>
        <Link href={`/articles/${article.slug}`}>{article.title}</Link>
      </h3>
      <p>{truncateArticleExcerpt(article.excerpt)}</p>
    </article>
  );
}

export default async function TopicGuidePage({ params }) {
  const { topic: topicSlug } = await params;
  const topic = getTopicGuide(topicSlug);

  if (!topic) {
    notFound();
  }

  const pillar = getTopicPillarArticle(topicSlug);
  const spokes = getTopicSpokeArticles(topicSlug);
  const articles = getTopicArticles(topicSlug);
  const jsonLd = buildTopicPageJsonLd(topic, articles);

  return (
    <section className="section-space topic-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <p className="topic-breadcrumb">
        <Link href="/">Home</Link> / <Link href="/topics">Topic Guides</Link> /{" "}
        {topic.title}
      </p>

      <p className="topic-kicker">Topic Guide</p>
      <h1>{topic.title}</h1>
      <p className="topic-lead">{topic.intro}</p>

      {pillar ? (
        <section className="topic-pillar">
          <p className="topic-pillar-label">Start with the main guide</p>
          <div className="topic-pillar-card">
            <div className="topic-pillar-copy">
              <h2>
                <Link href={`/articles/${pillar.slug}`}>{pillar.title}</Link>
              </h2>
              <p>{truncateArticleExcerpt(pillar.excerpt, 220)}</p>
              <Link
                href={`/articles/${pillar.slug}`}
                className="btn-primary topic-pillar-cta"
              >
                Read pillar guide
              </Link>
            </div>
            <div className="topic-pillar-media">
              <Image
                src={pillar.coverImage}
                alt={pillar.title}
                width={800}
                height={450}
                className="topic-pillar-img"
              />
            </div>
          </div>
        </section>
      ) : null}

      {spokes.length > 0 ? (
        <section className="topic-spokes">
          <h2>Related guides in this topic</h2>
          <div className="article-grid">
            {spokes.map((article) => (
              <ArticleCard article={article} key={article.slug} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="topic-crosslinks">
        <h2>Explore other topics</h2>
        <div className="topic-chip-row">
          <Link href="/topics/buying-property" className="topic-chip">
            Buying Property
          </Link>
          <Link href="/topics/due-diligence" className="topic-chip">
            Due Diligence
          </Link>
          <Link href="/topics/citizenship" className="topic-chip">
            Citizenship
          </Link>
          <Link href="/topics/residence-permit" className="topic-chip">
            Residence Permit
          </Link>
          <Link href="/topics/mersin" className="topic-chip">
            Mersin
          </Link>
        </div>
      </section>
    </section>
  );
}
