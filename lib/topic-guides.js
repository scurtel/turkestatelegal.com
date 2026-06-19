import { getAllArticles } from "./articles.js";

export const TOPIC_GUIDES = [
  {
    slug: "buying-property",
    title: "Buying Property in Turkey",
    intro:
      "Start here if you are planning your first purchase. These guides cover eligibility, documents, title deed transfer, contracts, taxes, and city-specific buying routes for foreign nationals.",
    seoTitle: "Buying Property in Turkey Guides for Foreign Buyers",
    seoDescription:
      "Hub of legal guides for foreigners buying property in Turkey: eligibility, Tapu transfer, contracts, taxes, power of attorney, and city-specific routes.",
    pillarSlug: "buying-property-in-turkey-as-a-foreigner",
    articleSlugs: [
      "buying-property-in-turkey-as-a-foreigner",
      "how-can-foreigners-buy-property-in-turkey",
      "can-foreigners-buy-property-in-turkey",
      "step-by-step-guide-to-buying-property-in-turkey",
      "what-documents-do-foreign-buyers-need-to-buy-property-in-turkey",
      "title-deed-transfer-in-turkey-for-foreign-buyers",
      "turkish-title-deed-explained-foreign-buyers",
      "property-sale-contracts-in-turkey-foreign-buyers",
      "taxes-and-fees-when-foreigners-buy-property-in-turkey",
      "buying-property-in-turkey-with-power-of-attorney",
      "buying-property-in-turkey-remotely-with-power-of-attorney",
      "can-foreigners-buy-agricultural-land-in-turkey",
      "buying-property-in-istanbul-as-a-foreigner",
      "buying-property-in-antalya-as-a-foreigner",
      "buying-property-in-adana-as-a-foreigner",
      "buying-property-in-mersin-as-a-foreigner"
    ]
  },
  {
    slug: "due-diligence",
    title: "Due Diligence & Risk Checks",
    intro:
      "Verify before you pay. These articles explain title deed checks, debt and lien searches, off-plan risks, fraud patterns, and the due diligence steps foreign buyers should complete before transfer.",
    seoTitle: "Turkish Property Due Diligence Guides for Foreigners",
    seoDescription:
      "Due diligence hub for foreign property buyers in Turkey: Tapu checks, debts, zoning, off-plan risk, fraud prevention, and pre-payment verification steps.",
    pillarSlug: "real-estate-due-diligence-turkey-foreign-investors",
    articleSlugs: [
      "real-estate-due-diligence-turkey-foreign-investors",
      "escrow-in-turkey-real-estate-guide",
      "safe-payment-property-purchase-turkey",
      "legal-due-diligence-before-buying-a-house-in-turkey",
      "legal-checks-before-buying-property-in-turkey",
      "property-due-diligence-in-turkey-for-foreign-buyers",
      "how-to-verify-a-turkish-property-before-payment",
      "mortgage-lien-and-debt-checks-before-buying-property-in-turkey",
      "how-to-avoid-property-fraud-in-turkey",
      "title-deed-problems-in-turkey-foreign-buyer-mistakes",
      "common-mistakes-foreign-buyers-make-when-purchasing-property-in-turkey",
      "buying-off-plan-property-in-turkey-legal-risks",
      "off-plan-property-turkey",
      "off-plan-property-turkey-buyers",
      "turkey-due-diligence"
    ]
  },
  {
    slug: "citizenship",
    title: "Turkish Citizenship by Investment",
    intro:
      "Understand how qualifying real estate may support a citizenship-by-investment application, what thresholds and annotations matter, and why case-specific legal review is essential before you commit.",
    seoTitle: "Turkish Citizenship by Real Estate Investment Guides",
    seoDescription:
      "Citizenship-by-investment hub for foreign buyers: real estate thresholds, Tapu annotations, application steps, Mersin routes, and legal verification priorities.",
    pillarSlug: "turkish-citizenship-by-investment-through-real-estate",
    articleSlugs: [
      "turkish-citizenship-by-investment-through-real-estate",
      "turkish-citizenship-real-estate-investment-2026",
      "turkish-citizenship-by-property-purchase",
      "turkish-citizenship-by-real-estate-step-by-step-legal-guide",
      "turkish-citizenship-with-real-estate",
      "turkey-citizenship-investment-requirements-lawyer",
      "turkish-citizenship-by-investment-mersin-property",
      "is-buying-property-in-turkey-better-for-residence-permit-or-citizenship-goals"
    ]
  },
  {
    slug: "residence-permit",
    title: "Residence Permit & Property Ownership",
    intro:
      "Property ownership and residence status are related but not identical. These guides explain short-term stay rules, residence permit pathways linked to property, and common planning mistakes.",
    seoTitle: "Turkey Residence Permit Guides for Property Owners",
    seoDescription:
      "Residence permit hub for foreign property owners in Turkey: eligibility after purchase, application documents, Mersin ownership context, and permit vs citizenship planning.",
    pillarSlug: "residence-permit-after-buying-property-in-turkey",
    articleSlugs: [
      "residence-permit-after-buying-property-in-turkey",
      "how-to-get-a-residence-permit-by-buying-property-in-turkey",
      "can-buying-property-in-turkey-help-you-get-a-residence-permit",
      "can-you-buy-property-in-turkey-without-a-residence-permit",
      "residence-permit-property-ownership-mersin",
      "is-buying-property-in-turkey-better-for-residence-permit-or-citizenship-goals"
    ]
  },
  {
    slug: "mersin",
    title: "Mersin Property & Investment",
    intro:
      "Focused guidance for foreigners exploring Mersin real estate, district choice, residence planning, citizenship-linked purchases, and company setup alongside property investment.",
    seoTitle: "Mersin Real Estate Guides for Foreign Investors",
    seoDescription:
      "Mersin property hub for foreign investors: district guides, legal checks, residence and citizenship context, company setup, and investment planning in southern Turkey.",
    pillarSlug: "investing-in-mersin-real-estate-as-a-foreigner",
    articleSlugs: [
      "investing-in-mersin-real-estate-as-a-foreigner",
      "best-areas-in-mersin-for-foreign-property-investors",
      "buying-property-in-mersin-as-a-foreigner",
      "real-estate-in-mersin-apartments-villas-investment-potential",
      "turkish-citizenship-by-investment-mersin-property",
      "residence-permit-property-ownership-mersin",
      "setting-up-company-in-mersin-foreign-investor"
    ]
  }
];

const topicBySlug = new Map(TOPIC_GUIDES.map((topic) => [topic.slug, topic]));

export function getAllTopicSlugs() {
  return TOPIC_GUIDES.map((topic) => topic.slug);
}

export function getTopicGuide(slug) {
  return topicBySlug.get(slug) ?? null;
}

export function getAllTopicGuides() {
  return TOPIC_GUIDES;
}

export function getTopicArticles(topicSlug) {
  const topic = getTopicGuide(topicSlug);
  if (!topic) {
    return [];
  }

  const bySlug = new Map(getAllArticles().map((article) => [article.slug, article]));
  return topic.articleSlugs.map((slug) => bySlug.get(slug)).filter(Boolean);
}

export function getTopicPillarArticle(topicSlug) {
  const topic = getTopicGuide(topicSlug);
  if (!topic) {
    return null;
  }

  return getTopicArticles(topicSlug).find(
    (article) => article.slug === topic.pillarSlug
  ) ?? null;
}

export function getTopicSpokeArticles(topicSlug) {
  const topic = getTopicGuide(topicSlug);
  if (!topic) {
    return [];
  }

  return getTopicArticles(topicSlug).filter(
    (article) => article.slug !== topic.pillarSlug
  );
}

export function buildTopicPageJsonLd(topic, articles) {
  const pageUrl = `https://turkestatelegal.com/topics/${topic.slug}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://turkestatelegal.com/"
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Topic Guides",
            item: "https://turkestatelegal.com/topics"
          },
          {
            "@type": "ListItem",
            position: 3,
            name: topic.title,
            item: pageUrl
          }
        ]
      },
      {
        "@type": "CollectionPage",
        "@id": pageUrl,
        name: topic.title,
        description: topic.intro,
        url: pageUrl,
        isPartOf: {
          "@type": "WebSite",
          name: "Turk Estate Legal",
          url: "https://turkestatelegal.com"
        },
        hasPart: articles.map((article) => ({
          "@type": "Article",
          name: article.title,
          url: `https://turkestatelegal.com/articles/${article.slug}`
        }))
      }
    ]
  };
}
