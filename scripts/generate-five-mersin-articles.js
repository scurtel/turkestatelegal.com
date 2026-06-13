/**
 * Generate five Mersin-focused SEO articles via Gemini into content/articles/.
 * Usage: node scripts/generate-five-mersin-articles.js
 */
const fs = require("node:fs");
const path = require("node:path");
require("dotenv").config();
const {
  DEFAULT_GEMINI_MODEL,
  generateWithGeminiWithRetry
} = require("../lib/gemini");

const PUBLISHED_AT = "2026-06-11";
const AUTHOR = "Turks Estate Legal";
const DISCLAIMER =
  "This article is for general informational purposes only and does not constitute legal advice. Each case should be assessed according to its own facts and current legislation.";
const outDir = path.join(process.cwd(), "content", "articles");
const REQUEST_DELAY_MS = Number(process.env.GENERATE_SEO_DELAY_MS || 4000);

const SITE_LINKS = {
  buyingProperty:
    "/articles/buying-property-in-turkey-as-a-foreigner",
  citizenship:
    "/articles/turkish-citizenship-by-investment-through-real-estate",
  residence:
    "/articles/residence-permit-after-buying-property-in-turkey",
  mersinBuying: "/articles/buying-property-in-mersin-as-a-foreigner",
  dueDiligence:
    "/articles/real-estate-due-diligence-turkey-foreign-investors",
  citizenship2026:
    "/articles/turkish-citizenship-real-estate-investment-2026"
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function roughWordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const articles = [
  {
    file: "investing-in-mersin-real-estate-as-a-foreigner.md",
    frontmatter: {
      title: "Investing in Mersin Real Estate as a Foreigner: Legal Guide for 2026",
      slug: "investing-in-mersin-real-estate-as-a-foreigner",
      seoTitle:
        "Investing in Mersin Real Estate as a Foreigner | 2026 Legal Guide",
      seoDescription:
        "Learn how foreigners can legally invest in Mersin real estate in 2026, including title deed checks, payments, residence permits and citizenship risks.",
      excerpt:
        "2026 legal guide for foreigners investing in Mersin real estate—Tapu checks, payment safety, residence vs citizenship, and common buyer mistakes.",
      category: "Mersin Investment"
    },
    h1: "Investing in Mersin Real Estate as a Foreigner: Legal Guide for 2026",
    h2Sections: [
      "Why Mersin Attracts Foreign Real Estate Investors",
      "Can Foreigners Buy Property in Mersin?",
      "Legal Checks Before Buying Property",
      "Tapu Process and Payment Safety",
      "Residence Permit vs Citizenship by Investment",
      "Common Mistakes Foreign Buyers Make",
      "How Turk Estate Legal Can Help"
    ],
    faq: [
      "Can foreigners buy property in Mersin?",
      "Does buying property in Mersin give automatic residence?",
      "Can Mersin property qualify for Turkish citizenship?",
      "Do I need a lawyer before signing a sales contract?"
    ],
    mustMention: [
      "Tapu, valuation report, zoning status, military/restricted area checks",
      "Tax number and traceable bank transfers",
      "Property ownership does not automatically grant residence permit",
      "Citizenship route: USD 400,000 threshold and 3-year no-sale annotation (rules may change)",
      "Legal guidance and case-specific review—not guaranteed outcomes"
    ],
    mustLink: [
      SITE_LINKS.buyingProperty,
      SITE_LINKS.citizenship,
      SITE_LINKS.residence,
      SITE_LINKS.mersinBuying
    ]
  },
  {
    file: "best-areas-in-mersin-for-foreign-property-investors.md",
    frontmatter: {
      title: "Best Areas in Mersin for Foreign Property Investors",
      slug: "best-areas-in-mersin-for-foreign-property-investors",
      seoTitle: "Best Areas in Mersin for Foreign Property Investment",
      seoDescription:
        "Discover key Mersin districts for foreign property buyers and learn what legal checks should be done before investing.",
      excerpt:
        "District-by-district look at Mezitli, Yenişehir, Erdemli and port-adjacent areas—plus due diligence, rental, resale and residence considerations.",
      category: "Mersin Investment"
    },
    h1: "Best Areas in Mersin for Foreign Property Investors",
    h2Sections: [
      "Why Location Matters in Mersin",
      "Mezitli: Residential Demand and Coastal Living",
      "Yenişehir: Central Lifestyle and Rental Potential",
      "Erdemli: Holiday Homes and Long-Term Growth",
      "Akdeniz and Port-Adjacent Areas: Commercial Considerations",
      "Legal Due Diligence by District",
      "Rental, Resale and Citizenship Considerations",
      "How Turk Estate Legal Can Help"
    ],
    faq: [
      "Which area of Mersin is best for foreign buyers?",
      "Is coastal property in Mersin a good investment?",
      "Should I buy residential or commercial property?",
      "Can all properties be used for residence permit applications?"
    ],
    mustMention: [
      "District-level foreign ownership limits and zone checks still apply per parcel",
      "Residential vs commercial affects residence permit eligibility",
      "Due diligence before deposit",
      "USD 400,000 citizenship threshold where relevant"
    ],
    mustLink: [
      SITE_LINKS.mersinBuying,
      SITE_LINKS.dueDiligence,
      SITE_LINKS.residence,
      SITE_LINKS.citizenship
    ]
  },
  {
    file: "turkish-citizenship-by-investment-mersin-property.md",
    frontmatter: {
      title: "Turkish Citizenship by Investment Through Property in Mersin",
      slug: "turkish-citizenship-by-investment-mersin-property",
      seoTitle: "Turkish Citizenship by Investment in Mersin Property",
      seoDescription:
        "A legal guide for foreigners considering Turkish citizenship by investing in Mersin real estate worth at least 400,000 USD.",
      excerpt:
        "Citizenship-by-investment through Mersin property: USD 400,000 threshold, three-year şerh, valuation, payments, and risks that can block applications.",
      category: "Citizenship by Investment"
    },
    h1: "Turkish Citizenship by Investment Through Property in Mersin",
    h2Sections: [
      "Why Mersin Is Considered for Citizenship Investment",
      "Minimum Investment Amount: 400,000 USD",
      "Three-Year No-Sale Annotation",
      "Valuation Report and Official Procedures",
      "Multiple Properties: Can They Be Combined?",
      "Risks That Can Block Citizenship Applications",
      "Why Legal Review Matters Before Payment",
      "How Turk Estate Legal Can Help"
    ],
    faq: [
      "Can I apply for Turkish citizenship by buying property in Mersin?",
      "What is the minimum real estate investment for Turkish citizenship?",
      "Can I sell the property after citizenship?",
      "Can one lawyer handle both property purchase and citizenship process?"
    ],
    mustMention: [
      "USD 400,000 minimum (verify current rules)",
      "Three-year no-sale title deed annotation",
      "Valuation report and bank transfer records",
      "No guaranteed citizenship—administrative review applies",
      "Title deed annotation, seller eligibility, property history"
    ],
    mustLink: [
      SITE_LINKS.citizenship,
      SITE_LINKS.citizenship2026,
      SITE_LINKS.buyingProperty,
      SITE_LINKS.mersinBuying
    ]
  },
  {
    file: "residence-permit-property-ownership-mersin.md",
    frontmatter: {
      title: "Residence Permit in Turkey Through Property Ownership in Mersin",
      slug: "residence-permit-property-ownership-mersin",
      seoTitle: "Residence Permit Through Property Ownership in Mersin",
      seoDescription:
        "Learn how property ownership in Mersin may support a Turkish residence permit application and what foreign buyers should know.",
      excerpt:
        "How Mersin property ownership may support a short-term residence permit—and why ownership alone does not equal residency approval.",
      category: "Residence Permit"
    },
    h1: "Residence Permit in Turkey Through Property Ownership in Mersin",
    h2Sections: [
      "Property Ownership and Residence Permit: Not the Same Thing",
      "Short-Term Residence Permit for Property Owners",
      "Why the Property Must Be Residential",
      "Documents Commonly Required",
      "Family Members and Shared Ownership",
      "Renewal Risks and Practical Issues",
      "Difference Between Residence Permit and Citizenship",
      "How Turk Estate Legal Can Help"
    ],
    faq: [
      "Does buying property in Mersin automatically give residence?",
      "Can my family apply with me?",
      "Can commercial property support a residence permit?",
      "How long does a property-based residence permit last?"
    ],
    mustMention: [
      "Ownership does NOT automatically grant residence—separate application required",
      "Residential property requirement",
      "Distinct from USD 400,000 citizenship route",
      "Renewal and documentation practicalities"
    ],
    mustLink: [
      SITE_LINKS.residence,
      "/articles/how-to-get-a-residence-permit-by-buying-property-in-turkey",
      SITE_LINKS.mersinBuying,
      SITE_LINKS.citizenship
    ]
  },
  {
    file: "setting-up-company-in-mersin-foreign-investor.md",
    frontmatter: {
      title: "Setting Up a Company in Mersin as a Foreign Investor",
      slug: "setting-up-company-in-mersin-foreign-investor",
      seoTitle: "Setting Up a Company in Mersin as a Foreign Investor",
      seoDescription:
        "Legal guide for foreigners who want to establish a company in Mersin for real estate, trade, logistics or investment operations.",
      excerpt:
        "Foreign investors establishing a company in Mersin: entity types, tax number, banking, property holding, work permit and compliance risks.",
      category: "Business & Investment"
    },
    h1: "Setting Up a Company in Mersin as a Foreign Investor",
    h2Sections: [
      "Why Mersin Is Attractive for Business Investors",
      "Logistics, Port and Trade Advantages",
      "Can Foreigners Own a Company in Turkey?",
      "Limited Company vs Joint Stock Company",
      "Tax Number, Bank Account and Articles of Association",
      "Real Estate Investment Through a Company",
      "Work Permit, Residence Permit and Tax Considerations",
      "Legal Risks Before Starting Operations",
      "How Turk Estate Legal Can Help"
    ],
    faq: [
      "Can a foreigner open a company in Mersin?",
      "Can a Turkish company owned by foreigners buy property?",
      "Is Mersin good for logistics and trade businesses?",
      "Do I need a work permit if I own a company?"
    ],
    mustMention: [
      "Foreigners can typically own Turkish companies subject to sector rules",
      "Corporate property holding has different tax/residence implications than personal purchase",
      "Work permit is not automatic from company ownership",
      "Due diligence on articles of association and signatory authority",
      "Cross-reference property purchase legal checks"
    ],
    mustLink: [
      SITE_LINKS.buyingProperty,
      SITE_LINKS.dueDiligence,
      SITE_LINKS.residence,
      "/articles/investing-in-mersin-real-estate-as-a-foreigner"
    ]
  }
];

function buildPrompt(spec, extraNote = "") {
  const h2List = spec.h2Sections.map((s) => `- ## ${s}`).join("\n");
  const faqList = spec.faq.map((q) => `- ${q}`).join("\n");
  const mentionList = spec.mustMention.map((m) => `- ${m}`).join("\n");
  const linkList = spec.mustLink
    .map(
      (href) =>
        `- Link naturally at least once: [descriptive anchor](${href})`
    )
    .join("\n");

  return `You are a senior legal content writer for turkestatelegal.com (brand: Turk Estate Legal / Turks Estate Legal).
AUDIENCE: Foreign investors and expats interested in Mersin, Turkey—real estate, residence, citizenship, company setup, investment safety.
LANGUAGE: English only.

TONE:
- Professional, trustworthy, clear legal guidance—not aggressive sales
- Use: legal guidance, due diligence, case-specific review, may, usually, depending on facts
- NO guaranteed citizenship, residence, or legal outcomes
- NO "best lawyer", "fastest citizenship", hype
- Short readable paragraphs

ARTICLE H1 (exactly one): ${spec.h1}

REQUIRED H2 SECTIONS (exact ## headings, in order):
${h2List}

MUST COVER:
${mentionList}

FAQ (after "How Turk Estate Legal Can Help", add ## FAQ with these 4 questions as ### headings):
${faqList}

INTERNAL LINKS (markdown, required):
${linkList}

Also mention these topic hubs naturally where relevant (as text or links):
- Buying property in Turkey → ${SITE_LINKS.buyingProperty}
- Turkish citizenship by investment → ${SITE_LINKS.citizenship}
- Residence permit in Turkey → ${SITE_LINKS.residence}

STRUCTURE:
- Strong opening paragraphs after H1 (before first H2)
- Use H3 under H2 sections where helpful
- Section "## How Turk Estate Legal Can Help" should describe case-specific legal review, due diligence, contract/title support—calm and credible, not pushy
- Do NOT add YAML frontmatter or code fences
- FAQ: use ### Question (single # level, never ### ###)

LENGTH: STRICT 900–1,250 words maximum. Concise, no filler.

${extraNote ? `EXTRA:\n${extraNote}\n` : ""}
Return ONLY the markdown article body.`;
}

function yamlString(value) {
  if (value.includes("\n") || value.length > 70) {
    return `>-\n  ${value.replace(/\n/g, "\n  ")}`;
  }
  return JSON.stringify(value);
}

function writeArticle(spec, body) {
  const fm = spec.frontmatter;
  const trimmed = body.trim();
  const withDisclaimer = `${trimmed}

---

*${DISCLAIMER}*
`;
  const header = `---
title: ${yamlString(fm.title)}
slug: ${fm.slug}
seoTitle: ${yamlString(fm.seoTitle)}
seoDescription: ${yamlString(fm.seoDescription)}
excerpt: ${yamlString(fm.excerpt)}
coverImage: ""
publishedAt: '${PUBLISHED_AT}'
category: ${JSON.stringify(fm.category)}
author: ${AUTHOR}
---
`;
  fs.writeFileSync(
    path.join(outDir, spec.file),
    `${header}\n${withDisclaimer}\n`,
    "utf8"
  );
  return roughWordCount(trimmed);
}

async function generateBody(spec, attempt = 1) {
  const extraNote = spec._retryNote || "";
  const raw = await generateWithGeminiWithRetry(buildPrompt(spec, extraNote), {
    model: process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
    maxRetries: 3,
    retryDelayMs: 2500,
    generationConfig: { temperature: 0.62, maxOutputTokens: 4096 }
  });

  let md = raw.trim().replace(/^\uFEFF/, "");
  if (md.startsWith("```")) {
    md = md
      .replace(/^```(?:markdown|md)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();
  }

  const words = roughWordCount(md);
  if (words > 1350 && attempt < 2) {
    console.warn(`  Too long (${words}), retrying shorter…`);
    return generateBody(
      {
        ...spec,
        _retryNote:
          "Rewrite SHORTER: max 1,150 words. Keep all required H2 sections including How Turk Estate Legal Can Help."
      },
      attempt + 1
    );
  }
  if (words < 850 && attempt < 2) {
    console.warn(`  Too short (${words}), retrying…`);
    return generateBody(
      {
        ...spec,
        _retryNote: "Expand to at least 950 words with practical Mersin-specific detail."
      },
      attempt + 1
    );
  }
  if (words < 800) {
    throw new Error(`Too short: ${words} words`);
  }
  return md;
}

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("Missing GEMINI_API_KEY in .env");
    process.exit(1);
  }
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  console.log(`Model: ${model}\n`);

  for (let i = 0; i < articles.length; i += 1) {
    const spec = articles[i];
    console.log(`[${i + 1}/${articles.length}] ${spec.file}`);
    const body = await generateBody(spec);
    const words = writeArticle(spec, body);
    console.log(`  → ${words} words`);
    if (i < articles.length - 1) {
      await sleep(REQUEST_DELAY_MS);
    }
  }
  console.log("\nDone.");
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e.message || e);
    process.exit(1);
  });
}
