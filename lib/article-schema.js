const SITE_URL = "https://turkestatelegal.com";

function toIsoDate(value) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}

function toAbsoluteUrl(pathOrUrl) {
  if (!pathOrUrl) {
    return `${SITE_URL}/icon.png`;
  }

  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }

  return `${SITE_URL}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
}

export function extractFaqItems(content) {
  if (typeof content !== "string" || !content.includes("## FAQ")) {
    return [];
  }

  const match = content.match(/## FAQ\s*\n([\s\S]*?)(?=\n## |\n---\s*\n|$)/);
  if (!match) {
    return [];
  }

  const items = [];
  for (const chunk of match[1].split(/^### /m).filter(Boolean)) {
    const newlineIndex = chunk.indexOf("\n");
    if (newlineIndex === -1) {
      continue;
    }

    const question = chunk.slice(0, newlineIndex).trim();
    const answer = chunk
      .slice(newlineIndex + 1)
      .trim()
      .replace(/\n+/g, " ")
      .replace(/\s+/g, " ");

    if (question && answer) {
      items.push({ question, answer });
    }
  }

  return items;
}

export function buildArticlePageJsonLd(article) {
  const pageUrl = `${SITE_URL}/articles/${article.slug}`;
  const imageUrl = toAbsoluteUrl(article.coverImage);
  const datePublished = toIsoDate(article.publishedAt);
  const graph = [
    {
      "@type": "BreadcrumbList",
      "@id": `${pageUrl}#breadcrumb`,
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
          name: "Articles",
          item: `${SITE_URL}/articles`
        },
        {
          "@type": "ListItem",
          position: 3,
          name: article.title,
          item: pageUrl
        }
      ]
    },
    {
      "@type": "Article",
      "@id": `${pageUrl}#article`,
      headline: article.title,
      description: article.seoDescription || article.excerpt || "",
      image: [imageUrl],
      ...(datePublished ? { datePublished, dateModified: datePublished } : {}),
      author: {
        "@type": "Organization",
        name: article.author || "Turks Estate Legal"
      },
      publisher: {
        "@type": "Organization",
        name: "Turk Estate Legal",
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/icon.png`
        }
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": pageUrl
      }
    }
  ];

  const faqItems = extractFaqItems(article.content);
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
