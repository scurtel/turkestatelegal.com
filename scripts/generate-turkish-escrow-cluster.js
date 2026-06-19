/**
 * Generate Turkish Escrow content cluster via Gemini:
 * - Service page markdown -> content/pages/turkish-escrow-service.md
 * - 2 pillar articles -> content/articles/
 * Usage: node scripts/generate-turkish-escrow-cluster.js
 */
const fs = require("node:fs");
const path = require("node:path");
require("dotenv").config();
const {
  DEFAULT_GEMINI_MODEL,
  generateWithGeminiWithRetry
} = require("../lib/gemini");

const PUBLISHED_AT = "2026-06-20";
const AUTHOR = "Turks Estate Legal";
const DISCLAIMER =
  "This content is for general informational purposes only and does not constitute legal advice. Each transaction should be assessed according to its own facts and current legislation.";
const articlesDir = path.join(process.cwd(), "content", "articles");
const pagesDir = path.join(process.cwd(), "content", "pages");
const REQUEST_DELAY_MS = Number(process.env.GENERATE_SEO_DELAY_MS || 5000);

const SERVICE_URL = "/turkish-escrow-service";
const PILLAR_1 = "/articles/escrow-in-turkey-real-estate-guide";
const PILLAR_2 = "/articles/safe-payment-property-purchase-turkey";

const SHARED_LINKS = [
  SERVICE_URL,
  PILLAR_1,
  PILLAR_2,
  "/articles/buying-property-in-turkey-as-a-foreigner",
  "/articles/real-estate-due-diligence-turkey-foreign-investors",
  "/articles/turkish-title-deed-explained-foreign-buyers",
  "/articles/property-sale-contracts-in-turkey-foreign-buyers",
  "/articles/how-to-verify-a-turkish-property-before-payment",
  "/articles/turkish-citizenship-by-investment-through-real-estate",
  "/topics/due-diligence",
  "/topics/buying-property",
  "/contact"
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function roughWordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function yamlString(value) {
  const text = String(value ?? "");
  if (text.includes("\n") || text.length > 72) {
    return `>-\n  ${text.replace(/\n/g, "\n  ")}`;
  }
  return JSON.stringify(text);
}

function cleanMarkdown(raw) {
  let md = raw.trim().replace(/^\uFEFF/, "");
  if (md.startsWith("```")) {
    md = md
      .replace(/^```(?:markdown|md)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();
  }
  return md;
}

function buildServicePrompt(extraNote = "") {
  const h2Sections = [
    "What Is a Turkish Escrow Service?",
    "Why Foreign Buyers Need Payment Security in Turkey",
    "How Escrow-Like Arrangements Work in Turkish Property Transactions",
    "Our Legal Support for Escrow and Secure Payment",
    "When Should You Use Escrow Support?",
    "Risks We Help You Reduce",
    "Step-by-Step Process",
    "Documents We Review",
    "Why Work With a Turkish Real Estate Lawyer?",
    "FAQ",
    "Further Reading"
  ];

  return `You are a senior legal content strategist writing for turkestatelegal.com (Turkish real estate law guidance for foreign buyers).

TASK: Write the FULL markdown BODY for a commercial SERVICE PAGE (not a blog post).

LANGUAGE: English only.
TONE: Professional, trustworthy, legally cautious. Use "may", "typically", "depending on the transaction" — never "100% safe", "guaranteed", "risk-free".

CRITICAL LEGAL ACCURACY:
- Turkish law does NOT mirror Anglo-Saxon escrow as a single statutory product.
- Explain that secure payment in Turkey is usually structured through: lawyer-supervised holding arrangements, contractual payment conditions tied to title deed (Tapu) transfer, bank blocks where available, staged bank transfers after verification, and notary-linked preliminary agreements — NOT a generic "escrow account" label alone.
- Do not present content as legal advice.

H1 (exactly once at top):
# Turkish Escrow Service for Real Estate Transactions

REQUIRED ## SECTIONS (exact headings, this order):
${h2Sections.map((s) => `- ## ${s}`).join("\n")}

FAQ: At least 8 questions as ### under ## FAQ.

## Further Reading: Bullet list with markdown links to:
- [Escrow in Turkey guide](${PILLAR_1})
- [Safe payment methods guide](${PILLAR_2})
- [Buying property in Turkey as a foreigner](/articles/buying-property-in-turkey-as-a-foreigner)
- [Real estate due diligence](/articles/real-estate-due-diligence-turkey-foreign-investors)

CTAs (weave naturally in relevant sections AND end with a strong closing CTA block before disclaimer):
- Contact a Turkish real estate lawyer
- Request escrow assistance
- Get legal support before transferring funds
Use WhatsApp/contact language pointing to professional review — no hype.

INTERNAL LINKS: Naturally link at least 6 times across the page to paths from this list:
${SHARED_LINKS.join(", ")}

KEYWORDS (natural use): Turkish escrow service, escrow in Turkey, real estate escrow Turkey, Turkish lawyer escrow service, safe payment property Turkey, escrow agreement Turkey, property purchase payment security Turkey

LENGTH: Minimum 1,400 words. Target 1,500–1,800 words.

E-E-A-T themes to include: lawyer-led transaction review, independent due diligence, contractual payment safeguards, title deed checks, communication with seller/agent/bank/land registry, protection before transferring funds.

Do NOT include YAML frontmatter. Return ONLY markdown body starting with # H1.
${extraNote ? `\nEXTRA:\n${extraNote}` : ""}`;
}

function buildPillarPrompt(spec, extraNote = "") {
  return `You are a senior legal content writer for turkestatelegal.com.

TASK: Write a comprehensive PILLAR ARTICLE (informational, SEO authority content).

ARTICLE H1 (exactly once):
# ${spec.title}

REQUIRED ## SECTIONS (exact headings, this order):
${spec.h2Sections.map((s) => `- ## ${s}`).join("\n")}

PRIMARY KEYWORD: ${spec.primaryKeyword}
SECONDARY KEYWORDS: ${spec.secondaryKeywords}

MUST EXPLAIN:
- Escrow is not a single identical Anglo-Saxon product under Turkish law
- Payment security uses contractual safeguards, lawyer supervision, bank transfer discipline, Tapu-linked conditions, due diligence
- Title deed (Tapu), sale contracts, liens/mortgages/debts, zoning, foreign buyer risks
- No guaranteed outcomes; general information only

INTERNAL LINKS (required — use markdown links naturally, at least 8 total):
${spec.mustLink.map((href) => `- Link to ${href}`).join("\n")}
- Strong CTA link to service page: [Turkish escrow service](${SERVICE_URL}) or similar phrasing in Conclusion

FAQ: Minimum ${spec.minFaq} questions as ### under ## FAQ

After FAQ add ## Related Articles with 3–4 bullet markdown links from the must-link list.

LENGTH: Minimum ${spec.minWords} words. Use H3 subheadings where helpful.

Do NOT include YAML frontmatter. Return ONLY markdown body.
${extraNote ? `\nEXTRA:\n${extraNote}` : ""}`;
}

async function generateWithLengthCheck(buildPrompt, minWords, label, maxAttempts = 3) {
  let extraNote = "";

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const raw = await generateWithGeminiWithRetry(buildPrompt(extraNote), {
      model: process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
      maxRetries: 3,
      retryDelayMs: 3000,
      generationConfig: {
        temperature: 0.58,
        maxOutputTokens: 8192
      }
    });

    const md = cleanMarkdown(raw);
    const words = roughWordCount(md);
    console.log(`  ${label}: ${words} words (attempt ${attempt})`);

    if (words >= minWords) {
      return md;
    }

    extraNote = `Previous draft was only ${words} words. Expand with more practical detail, examples, and checklist items. Minimum ${minWords} words required.`;
  }

  throw new Error(`${label}: could not reach ${minWords} words`);
}

function writeServicePage(body) {
  const frontmatter = {
    title: "Turkish Escrow Service for Real Estate Transactions",
    slug: "turkish-escrow-service",
    seoTitle: "Turkish Escrow Service for Real Estate Transactions",
    seoDescription:
      "Lawyer-led secure payment support for foreign property buyers in Turkey: escrow-like safeguards, contract review, and due diligence before you transfer funds.",
    excerpt:
      "Secure payment and escrow-like legal support for foreign buyers purchasing property in Turkey—contract review, due diligence, and staged fund protection.",
    pageType: "service",
    publishedAt: PUBLISHED_AT,
    author: AUTHOR
  };

  const header = `---
title: ${yamlString(frontmatter.title)}
slug: ${yamlString(frontmatter.slug)}
seoTitle: ${yamlString(frontmatter.seoTitle)}
seoDescription: ${yamlString(frontmatter.seoDescription)}
excerpt: ${yamlString(frontmatter.excerpt)}
pageType: service
publishedAt: '${PUBLISHED_AT}'
author: ${AUTHOR}
---
`;

  const content = `${header}\n${body.trim()}\n\n---\n\n*${DISCLAIMER}*\n`;
  const target = path.join(pagesDir, "turkish-escrow-service.md");
  fs.writeFileSync(target, content, "utf8");
  return target;
}

function writeArticle(spec, body) {
  const fm = spec.frontmatter;
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
  const content = `${header}\n${body.trim()}\n\n---\n\n*${DISCLAIMER}*\n`;
  const target = path.join(articlesDir, spec.file);
  fs.writeFileSync(target, content, "utf8");
  return target;
}

const pillarArticles = [
  {
    file: "escrow-in-turkey-real-estate-guide.md",
    title: "Escrow in Turkey: A Complete Guide for Foreign Property Buyers",
    primaryKeyword: "escrow in Turkey",
    secondaryKeywords:
      "how escrow works in Turkey, property escrow Turkey, buying property in Turkey safely, secure property payment Turkey, Turkish real estate lawyer escrow",
    minWords: 2200,
    minFaq: 10,
    frontmatter: {
      title: "Escrow in Turkey: A Complete Guide for Foreign Property Buyers",
      slug: "escrow-in-turkey-real-estate-guide",
      seoTitle: "Escrow in Turkey: A Complete Guide for Foreign Buyers",
      seoDescription:
        "How escrow-like payment security works in Turkish property deals: Tapu timing, lawyer supervision, bank transfers, due diligence, and foreign buyer risks.",
      excerpt:
        "Complete guide to escrow-like payment security for foreign property buyers in Turkey—Tapu timing, lawyer roles, bank transfers, and due diligence.",
      category: "Payment Safety"
    },
    h2Sections: [
      "What Does Escrow Mean in a Property Transaction?",
      "Is There a Standard Escrow System in Turkey?",
      "How Escrow-Like Arrangements Are Used in Practice",
      "Key Risks for Foreign Buyers Before Title Deed Transfer",
      "Why Transferring Money Before Tapu Registration Is Risky",
      "The Role of a Turkish Real Estate Lawyer",
      "Common Secure Payment Methods in Turkey",
      "Due Diligence Checklist Before Any Payment",
      "Typical Red Flags in Turkish Property Transactions",
      "Step-by-Step Safe Buying Process",
      "Practical Example Scenario",
      "How Turk Estate Legal Can Help",
      "FAQ",
      "Conclusion"
    ],
    mustLink: [
      SERVICE_URL,
      PILLAR_2,
      "/articles/buying-property-in-turkey-as-a-foreigner",
      "/articles/real-estate-due-diligence-turkey-foreign-investors",
      "/articles/turkish-title-deed-explained-foreign-buyers",
      "/articles/property-sale-contracts-in-turkey-foreign-buyers",
      "/articles/how-to-verify-a-turkish-property-before-payment",
      "/topics/due-diligence"
    ]
  },
  {
    file: "safe-payment-property-purchase-turkey.md",
    title: "Safe Payment Methods When Buying Property in Turkey",
    primaryKeyword: "safe payment property Turkey",
    secondaryKeywords:
      "secure property payment Turkey, buying real estate in Turkey safely, payment before title deed Turkey, Turkish title deed payment, property purchase lawyer Turkey, escrow alternative Turkey",
    minWords: 2000,
    minFaq: 10,
    frontmatter: {
      title: "Safe Payment Methods When Buying Property in Turkey",
      slug: "safe-payment-property-purchase-turkey",
      seoTitle: "Safe Payment Methods for Property Purchase in Turkey",
      seoDescription:
        "Foreign buyers: learn secure payment methods for Turkish property purchases—Tapu timing, bank transfers, lawyer supervision, and escrow-like safeguards.",
      excerpt:
        "How foreign buyers can structure safer property payments in Turkey—Tapu timing, bank transfers, contractual safeguards, and lawyer-supervised steps.",
      category: "Payment Safety"
    },
    h2Sections: [
      "How Payment Works in a Typical Turkish Property Purchase",
      "Tapu Transfer and Payment Timing",
      "Cash Payment Risks",
      "Risks of Sending Money Directly to the Seller",
      "How to Structure Bank Transfers More Safely",
      "Escrow-Like Contractual Safeguards",
      "Lawyer-Supervised Payment Process",
      "Title Deed, Liens, Mortgages, Debts and Zoning Checks",
      "Foreign Currency Transfer Considerations",
      "Common Scams and Warning Signs",
      "Buyer Protection Checklist",
      "How Turk Estate Legal Can Help",
      "FAQ",
      "Conclusion"
    ],
    mustLink: [
      SERVICE_URL,
      PILLAR_1,
      "/articles/buying-property-in-turkey-as-a-foreigner",
      "/articles/real-estate-due-diligence-turkey-foreign-investors",
      "/articles/turkish-title-deed-explained-foreign-buyers",
      "/articles/property-sale-contracts-in-turkey-foreign-buyers",
      "/articles/mortgage-lien-and-debt-checks-before-buying-property-in-turkey",
      "/articles/how-to-avoid-property-fraud-in-turkey"
    ]
  }
];

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("Missing GEMINI_API_KEY in .env");
    process.exit(1);
  }

  fs.mkdirSync(pagesDir, { recursive: true });
  fs.mkdirSync(articlesDir, { recursive: true });

  console.log("Generating service page…");
  const serviceBody = await generateWithLengthCheck(
    buildServicePrompt,
    1400,
    "Service page"
  );
  const servicePath = writeServicePage(serviceBody);
  console.log(`  Wrote ${servicePath}`);

  console.log(`Waiting ${REQUEST_DELAY_MS}ms…`);
  await sleep(REQUEST_DELAY_MS);

  for (let i = 0; i < pillarArticles.length; i += 1) {
    const spec = pillarArticles[i];
    console.log(`Generating pillar ${i + 1}: ${spec.file}`);
    const body = await generateWithLengthCheck(
      (note) => buildPillarPrompt(spec, note),
      spec.minWords,
      spec.file
    );
    const target = writeArticle(spec, body);
    console.log(`  Wrote ${target}`);
    if (i < pillarArticles.length - 1) {
      console.log(`Waiting ${REQUEST_DELAY_MS}ms…`);
      await sleep(REQUEST_DELAY_MS);
    }
  }

  console.log("\nDone. Run npm run build to verify.");
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}

module.exports = { pillarArticles, SERVICE_URL };
