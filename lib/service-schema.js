import { extractFaqItems } from "./article-schema.js";

const SITE_URL = "https://turkestatelegal.com";

export function buildServicePageJsonLd(page, pagePath) {
  const pageUrl = `${SITE_URL}${pagePath}`;
  const faqItems = extractFaqItems(page.content);
  const graph = [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${SITE_URL}/`
        },
        {
          "@type": "ListItem",
          position: 2,
          name: page.title,
          item: pageUrl
        }
      ]
    },
    {
      "@type": "Service",
      "@id": `${pageUrl}#service`,
      name: page.title,
      description: page.seoDescription || page.excerpt || "",
      url: pageUrl,
      serviceType: "Turkish real estate escrow and secure payment legal support",
      areaServed: {
        "@type": "Country",
        name: "Turkey"
      },
      provider: {
        "@type": "LegalService",
        name: "Turk Estate Legal",
        url: SITE_URL
      },
      audience: {
        "@type": "Audience",
        audienceType: "Foreign property buyers and investors in Turkey"
      }
    },
    {
      "@type": "WebPage",
      "@id": pageUrl,
      name: page.title,
      description: page.seoDescription || page.excerpt || "",
      url: pageUrl,
      isPartOf: {
        "@type": "WebSite",
        name: "Turk Estate Legal",
        url: SITE_URL
      }
    }
  ];

  if (faqItems.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer
        }
      }))
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph
  };
}
