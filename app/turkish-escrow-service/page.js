import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { getPageBySlug } from "@/lib/pages";
import { buildServicePageJsonLd } from "@/lib/service-schema";
import { notFound } from "next/navigation";

const PAGE_SLUG = "turkish-escrow-service";
const PAGE_PATH = "/turkish-escrow-service";

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

export async function generateMetadata() {
  const page = getPageBySlug(PAGE_SLUG);
  if (!page) {
    return { title: "Page Not Found" };
  }

  return {
    title: { absolute: page.seoTitle },
    description: page.seoDescription,
    alternates: {
      canonical: PAGE_PATH
    },
    openGraph: {
      title: page.seoTitle,
      description: page.seoDescription,
      url: PAGE_PATH,
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title: page.seoTitle,
      description: page.seoDescription
    }
  };
}

export default function TurkishEscrowServicePage() {
  const page = getPageBySlug(PAGE_SLUG);
  if (!page) {
    notFound();
  }

  const jsonLd = buildServicePageJsonLd(page, PAGE_PATH);

  return (
    <article className="service-page section-space">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <p className="topic-breadcrumb">
        <Link href="/">Home</Link> / {page.title}
      </p>

      <section className="service-content article-content">
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
            },
            a({ href, children, ...props }) {
              if (href?.startsWith("/")) {
                return (
                  <Link href={href} {...props}>
                    {children}
                  </Link>
                );
              }
              return (
                <a href={href} {...props}>
                  {children}
                </a>
              );
            }
          }}
        >
          {page.content}
        </ReactMarkdown>
      </section>

      <section className="article-cta service-page-cta">
        <h2>Get Legal Support Before Transferring Funds</h2>
        <p>
          If you are buying property in Turkey and need lawyer-led review of
          payment structure, contracts, and due diligence, contact Lawyer Ceren
          Sumer Cilli before you send money.
        </p>
        <div className="cta-row">
          <a
            className="btn-primary"
            href="https://wa.me/905336342425"
            target="_blank"
            rel="noreferrer"
          >
            Request Escrow Assistance
          </a>
          <Link href="/contact">Contact a Turkish Real Estate Lawyer</Link>
        </div>
      </section>
    </article>
  );
}
