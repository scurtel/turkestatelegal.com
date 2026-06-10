/**
 * Generate five June 2026 SEO articles via Gemini into content/articles/.
 * Usage: node scripts/generate-five-seo-articles-jun2026.js
 */
const fs = require("node:fs");
const path = require("node:path");
require("dotenv").config();
const {
  DEFAULT_GEMINI_MODEL,
  generateWithGeminiWithRetry
} = require("../lib/gemini");

const PUBLISHED_AT = "2026-06-10";
const AUTHOR = "Turks Estate Legal";
const DISCLAIMER =
  "This article is for general informational purposes only and does not constitute legal advice. Each case should be assessed according to its own facts and current legislation.";
const outDir = path.join(process.cwd(), "content", "articles");
const REQUEST_DELAY_MS = Number(process.env.GENERATE_SEO_DELAY_MS || 4000);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function roughWordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const articles = [
  {
    file: "buying-property-in-turkey-as-a-foreigner.md",
    frontmatter: {
      title:
        "Buying Property in Turkey as a Foreigner: Legal Steps and Key Risks",
      slug: "buying-property-in-turkey-as-a-foreigner",
      seoTitle: "Buying Property in Turkey as a Foreigner | Legal Guide",
      seoDescription:
        "A legal guide for foreigners buying property in Turkey, including title deed transfer, due diligence, valuation reports, contracts, tax number and common risks.",
      excerpt:
        "Legal steps and key risks when foreigners buy property in Turkey—from Law No. 2644 limits to Tapu transfer and due diligence.",
      category: "Buying Process"
    },
    h2Sections: [
      "Introduction",
      "Can Foreigners Buy Property in Turkey?",
      "Legal Restrictions for Foreign Buyers",
      "Step-by-Step Property Purchase Process",
      "Title Deed Transfer at the Land Registry",
      "Why Due Diligence Matters",
      "Common Legal Risks for Foreign Buyers",
      "Should You Sign a Preliminary Sales Contract?",
      "Conclusion"
    ],
    mustMention: [
      "Foreigners can acquire property in Turkey subject to legal restrictions.",
      "Land Registry Law No. 2644 Article 35.",
      "Foreign individuals may acquire property up to legal limits but cannot buy in prohibited military/security zones.",
      "Title deed transfer is completed at the Land Registry.",
      "Preliminary contracts alone do not transfer ownership.",
      "Due diligence: title deed, mortgages, liens, zoning, occupancy permit, seller authority."
    ],
    mustLink: [
      "/articles/can-foreigners-buy-property-in-turkey",
      "/articles/title-deed-transfer-in-turkey-for-foreign-buyers",
      "/articles/legal-checks-before-buying-property-in-turkey",
      "/articles/property-sale-contracts-in-turkey-foreign-buyers"
    ],
    keywords:
      "buying property in Turkey as a foreigner, Turkish real estate lawyer, property lawyer Turkey, title deed Turkey"
  },
  {
    file: "turkish-title-deed-explained-foreign-buyers.md",
    frontmatter: {
      title:
        "Turkish Title Deed Explained: What Foreign Buyers Should Check Before Signing",
      slug: "turkish-title-deed-explained-foreign-buyers",
      seoTitle: "Turkish Title Deed Explained | Tapu Guide for Foreign Buyers",
      seoDescription:
        "Learn what a Turkish title deed shows, how foreign buyers should review Tapu records, and which legal risks must be checked before buying property in Turkey.",
      excerpt:
        "What the Tapu shows, why it governs ownership, and which registry red flags foreign buyers should verify before signing.",
      category: "Title Deed"
    },
    h2Sections: [
      "What Is a Turkish Title Deed?",
      "Why the Tapu Is the Key Ownership Document",
      "Information Included in a Turkish Title Deed",
      "Red Flags Foreign Buyers Should Check",
      "Mortgages, Liens and Annotations",
      "Zoning and Building Permit Issues",
      "Difference Between Land, Apartment and Independent Section",
      "Why Legal Due Diligence Is Important",
      "Conclusion"
    ],
    mustMention: [
      "Tapu is the official title deed document.",
      "Ownership transfer must be registered at the Land Registry.",
      "Check encumbrances, annotations, mortgages, seizure records, zoning and construction legality.",
      "Do not rely only on seller statements or agent promises."
    ],
    mustLink: [
      "/articles/title-deed-transfer-in-turkey-for-foreign-buyers",
      "/articles/mortgage-lien-and-debt-checks-before-buying-property-in-turkey",
      "/articles/property-due-diligence-in-turkey-for-foreign-buyers"
    ],
    keywords:
      "Turkish title deed, Tapu Turkey, title deed check Turkey, property due diligence Turkey"
  },
  {
    file: "turkish-citizenship-real-estate-investment-2026.md",
    frontmatter: {
      title:
        "Turkish Citizenship by Real Estate Investment in 2026: Legal Requirements",
      slug: "turkish-citizenship-real-estate-investment-2026",
      seoTitle: "Turkish Citizenship by Real Estate Investment 2026",
      seoDescription:
        "A 2026 legal guide to Turkish citizenship by real estate investment, including the USD 400,000 threshold, title deed annotation, valuation report and holding period.",
      excerpt:
        "2026 legal requirements for citizenship through qualifying real estate: threshold, Tapu şerh, valuation, payments, and common filing mistakes.",
      category: "Citizenship by Investment"
    },
    h2Sections: [
      "Overview of Turkish Citizenship by Real Estate Investment",
      "Minimum Investment Amount in 2026",
      "Can Multiple Properties Be Combined?",
      "Valuation Report and Payment Requirements",
      "Three-Year Sale Restriction Annotation",
      "Application Process After Title Deed Transfer",
      "Common Mistakes That May Risk the Application",
      "Legal Due Diligence Before Citizenship Purchase",
      "Conclusion"
    ],
    mustMention: [
      "Current real estate route threshold is USD 400,000 (rules may change).",
      "Property generally subject to three-year non-sale annotation (şerh).",
      "Valuation report, bank transfer records, proper Tapu registration are critical.",
      "Do NOT promise guaranteed citizenship.",
      "Rules may change; verify current legislation before purchase."
    ],
    mustLink: [
      "/articles/turkish-citizenship-by-investment-through-real-estate",
      "/articles/taxes-and-fees-when-foreigners-buy-property-in-turkey",
      "/articles/legal-due-diligence-before-buying-a-house-in-turkey"
    ],
    keywords:
      "Turkish citizenship by investment 2026, Turkish citizenship real estate, Turkey citizenship 400000 USD, citizenship lawyer Turkey"
  },
  {
    file: "real-estate-due-diligence-turkey-foreign-investors.md",
    frontmatter: {
      title:
        "Real Estate Due Diligence in Turkey: Legal Checklist for Foreign Investors",
      slug: "real-estate-due-diligence-turkey-foreign-investors",
      seoTitle: "Real Estate Due Diligence in Turkey | Legal Checklist",
      seoDescription:
        "A legal due diligence checklist for foreign investors buying property in Turkey, covering title deed checks, zoning, debts, tenants, permits and contract risks.",
      excerpt:
        "A foreign-investor due diligence checklist: Tapu, encumbrances, zoning, tenants, debts, permits, and contracts before you pay.",
      category: "Due Diligence"
    },
    h2Sections: [
      "Why Due Diligence Is Essential in Turkish Real Estate",
      "Title Deed and Ownership Verification",
      "Mortgage, Lien and Annotation Checks",
      "Zoning Status and Municipality Records",
      "Building Permit and Occupancy Permit",
      "Tenant and Lease Agreement Review",
      "Tax, Fee and Debt Checks",
      "Contract Review Before Payment",
      "Conclusion"
    ],
    mustMention: [
      "Due diligence before deposit/payment where possible.",
      "Check seller authority if company, heir, proxy or contractor.",
      "Check whether property has tenants.",
      "Check unpaid dues, tax risks, construction problems, management debts.",
      "Cheap property may carry hidden legal risks."
    ],
    mustLink: [
      "/articles/legal-checks-before-buying-property-in-turkey",
      "/articles/turkish-title-deed-explained-foreign-buyers",
      "/articles/property-sale-contracts-in-turkey-foreign-buyers"
    ],
    keywords:
      "real estate due diligence Turkey, property legal checklist Turkey, Turkish property lawyer, foreign investor Turkey property"
  },
  {
    file: "property-sale-contracts-in-turkey-foreign-buyers.md",
    frontmatter: {
      title:
        "Property Sale Contracts in Turkey: What Foreign Buyers Should Know",
      slug: "property-sale-contracts-in-turkey-foreign-buyers",
      seoTitle: "Property Sale Contracts in Turkey | Foreign Buyer Guide",
      seoDescription:
        "A guide for foreign buyers on Turkish property sale contracts, deposits, preliminary agreements, notary procedures, penalty clauses and title deed transfer.",
      excerpt:
        "How Turkish sale contracts work: deposits, preliminary agreements, notary forms, penalties, and why Tapu transfer creates ownership.",
      category: "Contracts"
    },
    h2Sections: [
      "Why the Sale Contract Matters",
      "Does a Private Contract Transfer Ownership?",
      "Preliminary Sale Agreements Before a Notary",
      "Deposit and Payment Clauses",
      "Penalty Clauses and Deadlines",
      "Delivery Date and Construction Projects",
      "Currency, Tax and Fee Clauses",
      "What to Check Before Signing",
      "Conclusion"
    ],
    mustMention: [
      "Private written contract does not by itself transfer ownership.",
      "Ownership transfer at the Land Registry.",
      "Preliminary agreements may require notary form and annotation.",
      "Deposit clauses: refundable/non-refundable, conditions, deadlines.",
      "Foreign buyers should avoid signing documents they do not fully understand."
    ],
    mustLink: [
      "/articles/how-to-verify-a-turkish-property-before-payment",
      "/articles/real-estate-due-diligence-turkey-foreign-investors",
      "/articles/buying-property-in-turkey-as-a-foreigner"
    ],
    keywords:
      "property sale contract Turkey, preliminary real estate contract Turkey, Turkish property contract, real estate lawyer Turkey"
  }
];

function buildPrompt(spec, extraNote = "") {
  const h2List = spec.h2Sections.map((s) => `- ## ${s}`).join("\n");
  const mentionList = spec.mustMention.map((m) => `- ${m}`).join("\n");
  const linkList = spec.mustLink
    .map(
      (href) =>
        `- Naturally link at least once to ${href} (markdown [anchor text](${href})).`
    )
    .join("\n");

  return `You are a senior legal content writer for turkestatelegal.com.
AUDIENCE: Foreigners buying property in Turkey, investors, expats, citizenship-by-investment applicants.
LANGUAGE: English only.

TONE:
- Professional legal information; cautious (may, usually, depending on facts).
- NO "best lawyer", "guaranteed result", "fastest citizenship", or hype.
- Short readable paragraphs. Original content—no copying other sites.
- Do NOT invent case citations or fake statute numbers beyond what is specified below.

ARTICLE TITLE (use as the single H1): ${spec.frontmatter.title}

REQUIRED H2 SECTIONS (use these exact headings as ## lines, in this order):
${h2List}

MUST COVER (weave naturally into the article):
${mentionList}

TARGET KEYWORDS (use naturally, no stuffing): ${spec.keywords}

STRUCTURE RULES:
- Exactly ONE H1 at the top (the article title).
- Use H3 subheadings under H2 sections where helpful.
- After ## FAQ, add exactly 4 questions as ### headings (single hash level only — never ### ###).
- After FAQ, add ## Related Articles with 3 bullet markdown links using ONLY these valid paths (pick 3): ${spec.mustLink.join(", ")}.
- Do NOT add YAML frontmatter or code fences.

LENGTH: STRICT — 900 to 1,250 words maximum for the body (excluding disclaimer). Do not exceed 1,250 words. Prefer concise paragraphs.

INTERNAL LINKS (required):
${linkList}

${extraNote ? `\nEXTRA:\n${extraNote}\n` : ""}
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
  const content = `${header}\n${withDisclaimer}\n`;
  const target = path.join(outDir, spec.file);
  fs.writeFileSync(target, content, "utf8");
  return { target, words: roughWordCount(trimmed) };
}

async function generateBody(spec, attempt = 1) {
  const extraNote = spec._retryNote || "";
  const prompt = buildPrompt(spec, extraNote);
  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const raw = await generateWithGeminiWithRetry(prompt, {
    model,
    maxRetries: 3,
    retryDelayMs: 2500,
    generationConfig: {
      temperature: 0.62,
      maxOutputTokens: 4096
    }
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
    console.warn(`  Too long (${words} words), retrying with shorter target…`);
    return generateBody(
      {
        ...spec,
        _retryNote:
          "Previous draft was too long. Rewrite SHORTER: maximum 1,150 words. Cut repetition; keep all required H2 sections but use tighter prose."
      },
      attempt + 1
    );
  }
  if (words < 850 && attempt < 2) {
    console.warn(`  Too short (${words} words), retrying with expansion hint…`);
    return generateBody(
      {
        ...spec,
        _retryNote:
          "Previous draft was too short. Expand to at least 950 words with more practical detail."
      },
      attempt + 1
    );
  }
  if (words < 800) {
    throw new Error(`Article too short after generation: ${words} words`);
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
  console.log(`Model: ${model}`);
  console.log(`Output: ${outDir}\n`);

  for (let i = 0; i < articles.length; i += 1) {
    const spec = articles[i];
    console.log(`[${i + 1}/${articles.length}] ${spec.file}`);
    const body = await generateBody(spec);
    const { target, words } = writeArticle(spec, body);
    console.log(`  Wrote ${target} (${words} words)`);
    if (i < articles.length - 1) {
      console.log(`  Waiting ${REQUEST_DELAY_MS}ms…`);
      await sleep(REQUEST_DELAY_MS);
    }
  }

  console.log("\nDone.");
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}
