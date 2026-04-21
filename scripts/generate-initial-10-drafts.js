const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");
const { DEFAULT_GEMINI_MODEL, generateWithGemini } = require("../lib/gemini");
const { pickRandomPlaceholder } = require("./utils/placeholder-images");

dotenv.config();

const ARTICLES = [
  {
    title: "Can Foreigners Buy Property in Turkey?",
    slug: "can-foreigners-buy-property-in-turkey",
    seoTitle: "Can Foreigners Buy Property in Turkey? Rules, Limits, and Safe Steps",
    seoDescription:
      "Understand how foreigners can buy property in Turkey, what to verify first, and where legal checks matter most.",
    excerpt:
      "A practical overview of eligibility, limits, and the safest way for foreigners to buy property in Turkey.",
    intent:
      "Informational starter guide for foreign buyers asking if purchase is legally possible and what the key limits are.",
    uniqueOutline:
      "Cover eligibility principles, location/type limits at a high level, document readiness, and safe first actions. Do not present a full end-to-end purchase timeline."
  },
  {
    title: "Step-by-Step Guide to Buying Property in Turkey",
    slug: "step-by-step-guide-to-buying-property-in-turkey",
    seoTitle:
      "Step-by-Step Guide to Buying Property in Turkey for Foreigners",
    seoDescription:
      "Follow a clear purchase roadmap from shortlist to title deed transfer, tailored for foreign buyers in Turkey.",
    excerpt:
      "A chronological purchase checklist for foreigners, from first search to final transfer.",
    intent:
      "Process-focused search intent: users want an end-to-end sequence, timeline thinking, and practical checkpoints.",
    uniqueOutline:
      "Present a chronological roadmap with stage-by-stage actions, decision gates, and timeline management. Do not go deep on fraud patterns or tax breakdown details."
  },
  {
    title: "Legal Checks Before Buying Property in Turkey",
    slug: "legal-checks-before-buying-property-in-turkey",
    seoTitle: "Legal Checks Before Buying Property in Turkey: Foreign Buyer Checklist",
    seoDescription:
      "Learn which legal checks to prioritize before signing or paying, and where independent verification protects your investment.",
    excerpt:
      "A focused due diligence checklist covering ownership, encumbrances, permits, and contract clarity.",
    intent:
      "Risk-reduction intent: users specifically want legal due diligence steps before deposit or contract signature.",
    uniqueOutline:
      "Focus on pre-contract legal due diligence: ownership verification, encumbrance checks, zoning/building status, debt risk, and contract risk clauses."
  },
  {
    title: "Title Deed Transfer in Turkey for Foreign Buyers",
    slug: "title-deed-transfer-in-turkey-for-foreign-buyers",
    seoTitle:
      "Title Deed Transfer in Turkey for Foreign Buyers: What to Expect",
    seoDescription:
      "A practical explanation of title deed transfer flow, document readiness, and common transfer-day issues for foreigners.",
    excerpt:
      "Understand transfer-day workflow, official process points, and how to avoid closing delays.",
    intent:
      "Transactional process intent: users close to purchase want transfer-day clarity and document preparation.",
    uniqueOutline:
      "Center the article on transfer-day flow, appointment readiness, payment sequencing around transfer, and practical closing-day troubleshooting."
  },
  {
    title: "Taxes and Fees When Foreigners Buy Property in Turkey",
    slug: "taxes-and-fees-when-foreigners-buy-property-in-turkey",
    seoTitle: "Taxes and Fees When Foreigners Buy Property in Turkey",
    seoDescription:
      "Plan your budget with a practical overview of likely taxes, title costs, service fees, and recurring ownership expenses.",
    excerpt:
      "A budgeting guide to one-time and ongoing costs for foreign property buyers in Turkey.",
    intent:
      "Cost-planning intent: users want fee categories and budgeting structure before committing to a deal.",
    uniqueOutline:
      "Focus on cost categories and budgeting framework: upfront costs, ongoing ownership costs, and transaction planning buffer."
  },
  {
    title: "How to Avoid Property Fraud in Turkey",
    slug: "how-to-avoid-property-fraud-in-turkey",
    seoTitle: "How to Avoid Property Fraud in Turkey: Warning Signs for Foreign Buyers",
    seoDescription:
      "Protect your purchase by learning common fraud patterns, verification habits, and safer payment practices.",
    excerpt:
      "A prevention-focused guide to red flags, document checks, and safer transaction behavior.",
    intent:
      "Safety intent: users are worried about scams and want concrete warning signs plus prevention methods.",
    uniqueOutline:
      "Use a red-flag and prevention format: common scam scenarios, behavior cues, verification routines, and payment safety habits."
  },
  {
    title: "Buying Property in Turkey with Power of Attorney",
    slug: "buying-property-in-turkey-with-power-of-attorney",
    seoTitle: "Buying Property in Turkey with Power of Attorney: A Foreign Buyer Guide",
    seoDescription:
      "Learn when power of attorney can help foreign buyers purchase remotely and what legal safeguards to include.",
    excerpt:
      "A practical guide to using POA responsibly for remote property transactions in Turkey.",
    intent:
      "Remote purchase intent: users cannot travel and need POA-specific process, scope, and control recommendations.",
    uniqueOutline:
      "Cover POA scope design, authority limits, document controls, and remote transaction governance; avoid duplicating general transfer article content."
  },
  {
    title: "Can Buying Property in Turkey Help You Get a Residence Permit?",
    slug: "can-buying-property-in-turkey-help-you-get-a-residence-permit",
    seoTitle:
      "Can Buying Property in Turkey Help You Get a Residence Permit?",
    seoDescription:
      "Understand how property ownership may relate to residence permit options and why case-by-case legal review matters.",
    excerpt:
      "A cautious, practical look at how property ownership may support residence planning for foreigners.",
    intent:
      "Immigration-adjacent intent: users ask if ownership helps residency and need careful, non-absolute guidance.",
    uniqueOutline:
      "Keep this article focused on residence-permit planning context, documentation discipline, and legal verification language; avoid promising outcomes."
  },
  {
    title: "Turkish Citizenship by Investment Through Real Estate",
    slug: "turkish-citizenship-by-investment-through-real-estate",
    seoTitle:
      "Turkish Citizenship by Investment Through Real Estate: What Foreign Buyers Should Verify",
    seoDescription:
      "A practical overview of citizenship-by-investment considerations, legal verification points, and compliance-focused planning.",
    excerpt:
      "A structured guide to CBI-related real estate planning, with emphasis on verification and compliance.",
    intent:
      "High-intent investment immigration search: users need a cautious roadmap, eligibility sensitivity, and risk controls.",
    uniqueOutline:
      "Focus on citizenship-by-investment pathway planning through real estate with compliance mindset, evidence records, and process caution."
  },
  {
    title:
      "Common Mistakes Foreign Buyers Make When Purchasing Property in Turkey",
    slug: "common-mistakes-foreign-buyers-make-when-purchasing-property-in-turkey",
    seoTitle:
      "Common Mistakes Foreign Buyers Make When Purchasing Property in Turkey",
    seoDescription:
      "Avoid expensive errors with a practical breakdown of the most common legal, financial, and process mistakes.",
    excerpt:
      "A prevention guide that explains frequent mistakes and how to avoid them before and during purchase.",
    intent:
      "Problem-solving intent: users want a clear list of pitfalls and actionable alternatives.",
    uniqueOutline:
      "Use a mistake-by-mistake format with consequences and safer alternatives. Keep this piece tactical and corrective."
  }
];

const WORD_MIN = 1000;
const WORD_MAX = 1500;
const IDEAL_WORD_TARGET = 1200;

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function ensureArticleShape(raw, title) {
  const trimmed = raw.trim();
  const withH1 = trimmed.startsWith("# ") ? trimmed : `# ${title}\n\n${trimmed}`;

  if (!/##\s*FAQ/i.test(withH1)) {
    return `${withH1}\n\n## FAQ\n\n### Should I rely only on online listings?\nNo. Use independent document and identity verification before committing funds.\n\n### Can rules change?\nYes. Requirements and practical procedures may change over time, so verify current conditions with qualified local professionals.\n\n### Is legal support necessary?\nFor most foreign buyers, independent legal review is a practical way to reduce risk.\n`;
  }

  return withH1;
}

async function rewriteIntoWordRange(markdown, title, model, reason) {
  const prompt = `
Rewrite the markdown article below so it stays between ${WORD_MIN} and ${WORD_MAX} words.

Rules:
- Keep the same topic and audience (foreigners buying property in Turkey).
- Keep one H1 heading exactly: "${title}"
- Keep practical H2/H3 structure.
- Keep a "## FAQ" section with at least 3 Q&A pairs.
- End with a short CTA.
- Use professional, natural English.
- Do not add frontmatter.
- Keep writing concise but naturally detailed.

Article to rewrite:
${markdown}
`;
  const rewritten = await generateWithGemini(
    `${prompt}\n\nAdjustment reason: ${reason}`,
    {
      model,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2600
      }
    }
  );
  return ensureArticleShape(rewritten, title);
}

async function generateOneArticle(article, index) {
  const model = process.argv[2] || DEFAULT_GEMINI_MODEL;
  const outputDir = path.join(process.cwd(), "content", "articles");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const prompt = `
Write ONE original English markdown article for turkestatelegal.com.

Audience:
- Foreigners only (buyers and investors interested in Turkey)
- Tone: professional, clear, trustworthy, reassuring, natural
- No robotic phrases, no keyword stuffing, no repetitive templates

Topic:
- Title: "${article.title}"
- Primary search intent: ${article.intent}
- Unique angle requirements: ${article.uniqueOutline}
- This is article ${index + 1} of 10 in a series, so make wording and structure clearly different from generic guides.

Mandatory structure:
1) Start with one H1 heading exactly matching the title.
2) Add a concise intro paragraph.
3) Use practical H2 and H3 sections with actionable guidance.
4) Include a dedicated "## FAQ" section with at least 3 Q&A pairs.
5) End with a short CTA paragraph encouraging a careful, document-first approach and legal verification.

Content constraints:
- Length: MUST stay between ${WORD_MIN} and ${WORD_MAX} words, with ideal target near ${IDEAL_WORD_TARGET}.
- Focus on Turkey property purchase legal and practical guidance for foreigners.
- Where facts can vary or change, write cautiously and advise verification.
- Do not invent precise legal thresholds, rates, deadlines, or guarantees unless you are fully certain.
- Keep the article useful and specific without pretending to provide formal legal advice.
- Avoid repeating section names and phrasing commonly used in general buying guides.

Output:
- Return markdown only.
- Do not include frontmatter.
- Do not include surrounding commentary.
`;
  let articleBody = "";
  let wordCount = 0;
  const draft = await generateWithGemini(prompt, {
    model,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2600
    }
  });
  articleBody = ensureArticleShape(draft, article.title);
  wordCount = countWords(articleBody);

  let attempt = 0;
  while ((wordCount < WORD_MIN || wordCount > WORD_MAX) && attempt < 3) {
    attempt += 1;
    const reason =
      wordCount > WORD_MAX
        ? `Too long at ${wordCount} words. Reduce verbosity while preserving structure.`
        : `Too short at ${wordCount} words. Add useful practical detail while preserving structure.`;
    articleBody = await rewriteIntoWordRange(
      articleBody,
      article.title,
      model,
      reason
    );
    wordCount = countWords(articleBody);
  }

  if (wordCount < WORD_MIN || wordCount > WORD_MAX) {
    throw new Error(
      `${article.slug}.md ended at ${wordCount} words after retries.`
    );
  }

  const frontmatter = `---
title: "${article.title.replace(/"/g, '\\"')}"
slug: ${article.slug}
seoTitle: "${article.seoTitle.replace(/"/g, '\\"')}"
seoDescription: "${article.seoDescription.replace(/"/g, '\\"')}"
excerpt: "${article.excerpt.replace(/"/g, '\\"')}"
coverImage: "${pickRandomPlaceholder()}"
publishedAt: "${todayDate()}"
category: "General Guidance"
---

`;

  const content = `${frontmatter}${articleBody}\n`;
  const outPath = path.join(outputDir, `${article.slug}.md`);
  fs.writeFileSync(outPath, content, "utf8");

  return { slug: article.slug, outPath, wordCount };
}

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY in .env");
  }

  const results = [];
  for (let i = 0; i < ARTICLES.length; i += 1) {
    const result = await generateOneArticle(ARTICLES[i], i);
    results.push(result);
    console.log(
      `[${i + 1}/${ARTICLES.length}] Created ${result.slug}.md (${result.wordCount} words)`
    );
  }

  console.log("\nDone. Generated files:");
  for (const result of results) {
    console.log(`- ${result.outPath}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
