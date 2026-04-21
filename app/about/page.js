import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "About",
  description:
    "Learn about Lawyer Ceren Sumer Cilli and how turkestatelegal.com supports foreigners buying property in Turkey."
};

export default function AboutPage() {
  return (
    <section className="section-space">
      <h1>About Turk Estate Legal</h1>
      <p>
        Turk Estate Legal is an English-focused legal information platform for
        foreign clients who want to buy property in Turkey with greater clarity
        and confidence.
      </p>

      <section className="content-section profile-layout">
        <div>
          <h2>Legal Contact: Lawyer Ceren Sumer Cilli</h2>
          <p>
            Lawyer Ceren Sumer Cilli is the legal contact behind this website. She
            provides legal guidance for foreign buyers who need clear support on
            Turkish property procedures, document review, and transaction safety.
          </p>
          <p>
            The goal is straightforward: help international clients understand what
            matters legally before they commit to a purchase.
          </p>
        </div>
        <aside className="profile-card">
          <div className="profile-photo-wrap">
            <Image
              src="/images/ceren-sumer-cilli.webp"
              alt="Lawyer Ceren Sumer Cilli"
              width={360}
              height={430}
              className="profile-photo"
            />
          </div>
          <h3>Professional Profile</h3>
          <p className="meta">Adana Bar Association*</p>
          <p className="meta">
            Focus Areas: Property purchase due diligence, title deed transfer,
            buyer-side legal risk review.
          </p>
          <p className="meta">Province: Adana</p>
          <p className="meta">*Registration details shared during consultation.</p>
        </aside>
      </section>

      <section className="content-section">
        <h2>What This Website Helps You With</h2>
        <div className="help-grid">
          <article className="help-item">
            <p className="help-icon">⚖</p>
            <h3>Legal Clarity</h3>
            <p>
              Understand title deed process, ownership checks, and contract
              fundamentals in clear English.
            </p>
          </article>
          <article className="help-item">
            <p className="help-icon">✓</p>
            <h3>Practical Guidance</h3>
            <p>
              Learn what to verify before payment, what documents to request, and
              which steps to complete first.
            </p>
          </article>
          <article className="help-item">
            <p className="help-icon">🛡</p>
            <h3>Risk Awareness</h3>
            <p>
              Reduce avoidable mistakes through document-first checks and early
              legal review.
            </p>
          </article>
        </div>
      </section>

      <section className="content-section">
        <h2>Legal Support for Foreign Property Buyers</h2>
        <p>
          Legal consultation and guidance are available for foreign buyers who
          need support before signing contracts, transferring funds, or completing
          title deed transactions.
        </p>
        <p>
          Support can include legal review of documents, practical risk checks,
          and guidance on process-related requirements that should be verified for
          each transaction.
        </p>
      </section>

      <section className="content-section">
        <h2>Why Legal Guidance Matters Before Buying</h2>
        <p>
          Property purchases in another country involve legal details that are not
          always visible in listings or sales conversations. Early legal guidance
          can help reduce avoidable risk, clarify obligations, and support safer
          decisions.
        </p>
        <p>
          For foreign clients, this is especially important when language,
          unfamiliar procedures, and cross-border payments are involved.
        </p>
      </section>

      <section className="content-section info-block">
        <h2>Contact Information</h2>
        <p>
          <strong>Lawyer:</strong> Ceren Sumer Cilli
        </p>
        <p>
          <strong>Address:</strong> Gazipasa Mh, Ordu Cd. Dinckan Apt No:7 A Blok
          Daire:3, 01010 Seyhan/Adana
        </p>
        <p>
          <strong>Province:</strong> Adana
        </p>
        <p>
          <strong>Phone:</strong>{" "}
          <a href="tel:+905336342425">+90 533 634 24 25</a> (Local: 0533 634 24
          25)
        </p>
        <p>
          <strong>Hours:</strong> Open 24 hours
        </p>
      </section>

      <section className="content-section">
        <h2>Need Legal Guidance for Your Property Purchase?</h2>
        <p>
          If you are planning to buy property in Turkey and want legal guidance
          tailored to your case, you can make contact directly.
        </p>
        <div className="cta-row">
          <a
            className="btn-primary"
            href="https://wa.me/905336342425"
            target="_blank"
            rel="noreferrer"
          >
            Contact via WhatsApp
          </a>
          <Link href="/contact">Go to Contact Page</Link>
        </div>
        <p className="meta">
          You can also return to the <Link href="/">homepage</Link> or explore all{" "}
          <Link href="/articles">articles</Link>.
        </p>
      </section>
    </section>
  );
}
