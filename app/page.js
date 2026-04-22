import Link from "next/link";
import Image from "next/image";
import { getAllArticles } from "@/lib/articles";

export default function HomePage() {
  const articles = getAllArticles();
  const featuredArticles = articles.slice(0, 3);
  const latestArticles = articles.slice(3, 7);

  return (
    <>
      <section className="hero">
        <div className="hero-bg-media" aria-hidden="true">
          <Image
            src="/images/placeholders/legal-4.png"
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 1100px"
            className="hero-bg-image"
            priority
          />
          <div className="hero-bg-overlay" />
        </div>
        <div className="hero-content">
        <h1 className="hero-title">
          Trusted legal guidance for foreigners buying property in Turkey
        </h1>
        <p className="hero-text">
          Turk Estate Legal is an English-only resource for foreign buyers and
          investors who want clear, practical, and careful guidance before
          committing funds.
        </p>
        <div className="hero-actions">
          <Link href="/articles" className="hero-chip">
            Document-first purchase guidance
          </Link>
          <Link href="/articles" className="hero-chip">
            Practical risk and fraud awareness
          </Link>
          <Link href="/articles" className="hero-chip">
            Residency and citizenship context
          </Link>
        </div>
        </div>
      </section>

      <section className="welcome-contact section-space" aria-labelledby="quick-contact-title">
        <div className="welcome-contact-inner">
          <div>
            <p className="welcome-contact-kicker">First time here?</p>
            <h2 id="quick-contact-title">Contact Lawyer Ceren Sumer Cilli</h2>
            <p>
              If you are planning to buy property in Turkey, you can contact us
              directly before making a payment or signing documents.
            </p>
          </div>
          <div className="welcome-contact-actions">
            <a href="tel:+905336342425" className="btn-primary">
              Call: +90 533 634 24 25
            </a>
            <a
              href="https://wa.me/905336342425"
              target="_blank"
              rel="noreferrer"
              className="welcome-contact-link"
            >
              WhatsApp Message
            </a>
            <Link href="/contact" className="welcome-contact-link">
              Contact Page
            </Link>
          </div>
        </div>
      </section>

      <section className="section-space">
        <h2>Why Foreign Clients Trust This Platform</h2>
        <div className="trust-grid">
          <article className="trust-item">
            <h3>Experienced Legal Guidance in Turkish Property Matters</h3>
            <p>
              Lawyer Ceren Sumer Cilli provides legal guidance in
              property-related matters with a careful, document-based, and
              risk-aware approach.
            </p>
            <details className="trust-more">
              <summary>Read more</summary>
              <p>
                Foreign clients often need more than general information - they
                need clear legal assessment before making payments, signing
                contracts, or transferring title deeds.
              </p>
            </details>
          </article>
          <article className="trust-item">
            <h3>Clear Communication for International Clients</h3>
            <p>
              Foreign buyers may face unfamiliar procedures, language barriers,
              and uncertainty about Turkish legal documentation.
            </p>
            <details className="trust-more">
              <summary>Read more</summary>
              <p>
                This platform is designed to make legal information easier to
                understand in plain English, helping clients make better-informed
                decisions before taking action.
              </p>
            </details>
          </article>
          <article className="trust-item">
            <h3>The Advantage of Working Directly with a Lawyer</h3>
            <p>
              Property transactions should not rely only on agents, seller
              statements, or informal assurances.
            </p>
            <details className="trust-more">
              <summary>Read more</summary>
              <p>
                Working directly with a lawyer helps clients identify legal risks
                earlier, review official documents properly, and reduce the
                chance of costly mistakes.
              </p>
            </details>
          </article>
          <article className="trust-item">
            <h3>Legal Review Before Commitment</h3>
            <p>
              A lawyer can examine title deed records, contracts, payment terms,
              restrictions, annotations, and ownership-related issues before the
              transaction is completed.
            </p>
            <details className="trust-more">
              <summary>Read more</summary>
              <p>
                This creates a safer process and gives the buyer a clearer
                picture of the legal position of the property.
              </p>
            </details>
          </article>
        </div>
      </section>

      <section className="section-space">
        <h2>Your Client Journey</h2>
        <div className="journey-grid">
          <article className="journey-item">
            <p className="journey-step">Step 1</p>
            <h3>Read and Prepare</h3>
            <p>
              Start with clear legal and practical articles tailored for
              foreigners.
            </p>
          </article>
          <article className="journey-item">
            <p className="journey-step">Step 2</p>
            <h3>Verify Before Payment</h3>
            <p>
              Use checklists and process guidance to reduce avoidable legal and
              financial risk.
            </p>
          </article>
          <article className="journey-item">
            <p className="journey-step">Step 3</p>
            <h3>Get Legal Support</h3>
            <p>
              Contact legal counsel before commitment if you need review for your
              specific purchase.
            </p>
          </article>
        </div>
      </section>

      <section className="section-space">
        <h2>Featured Articles</h2>
        <div className="article-grid">
          {featuredArticles.map((article) => (
            <article className="article-card" key={article.slug}>
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
              <p>{article.excerpt}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-space">
        <h2>Latest Updates</h2>
        <div className="article-grid">
          {latestArticles.map((article) => (
            <article className="article-card" key={article.slug}>
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
              <p>{article.excerpt}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
