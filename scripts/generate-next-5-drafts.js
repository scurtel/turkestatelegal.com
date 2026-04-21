const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");
const matter = require("gray-matter");
const { DEFAULT_GEMINI_MODEL, generateWithGemini } = require("../lib/gemini");
const { pickRandomPlaceholder } = require("./utils/placeholder-images");

dotenv.config();

const WORD_MIN = 1000;
const WORD_MAX = 1500;

const ARTICLES = [
  {
    title: "Can Foreigners Inherit Property in Turkey?",
    slug: "can-foreigners-inherit-property-in-turkey",
    seoTitle:
      "Can Foreigners Inherit Property in Turkey? Practical Legal Guidance",
    seoDescription:
      "Learn how inheritance of Turkish property may work for foreigners, what documents are usually needed, and where legal verification matters.",
    excerpt:
      "A practical overview of inheritance pathways, legal steps, and document checks for foreign heirs in Turkey.",
    category: "Inheritance",
    angle:
      "Focus on inheritance process for foreign heirs, succession documentation, probate-related practicalities, and cautious legal verification language.",
    relatedLinks: [
      "/articles/legal-checks-before-buying-property-in-turkey",
      "/articles/title-deed-transfer-in-turkey-for-foreign-buyers",
      "/articles/common-mistakes-foreign-buyers-make-when-purchasing-property-in-turkey"
    ]
  },
  {
    title: "Buying Off-Plan Property in Turkey: Legal Risks",
    slug: "buying-off-plan-property-in-turkey-legal-risks",
    seoTitle: "Buying Off-Plan Property in Turkey: Legal Risks for Foreigners",
    seoDescription:
      "Understand key legal and practical risks in off-plan property purchases in Turkey and how to structure safer contracts.",
    excerpt:
      "A risk-focused guide to contracts, delivery delays, developer obligations, and safer payment controls in off-plan deals.",
    category: "Off-Plan Risk",
    angle:
      "Center on off-plan specific risk: developer credibility, construction progress risk, contract milestones, delivery and permit uncertainty.",
    relatedLinks: [
      "/articles/legal-checks-before-buying-property-in-turkey",
      "/articles/how-to-avoid-property-fraud-in-turkey",
      "/articles/step-by-step-guide-to-buying-property-in-turkey"
    ]
  },
  {
    title: "Can Foreigners Buy Agricultural Land in Turkey?",
    slug: "can-foreigners-buy-agricultural-land-in-turkey",
    seoTitle:
      "Can Foreigners Buy Agricultural Land in Turkey? Rules and Practical Checks",
    seoDescription:
      "A cautious guide for foreigners considering agricultural land in Turkey, including restrictions, use expectations, and due diligence priorities.",
    excerpt:
      "A practical look at agricultural land ownership by foreigners, with emphasis on legal limits and verification steps.",
    category: "Land Purchase",
    angle:
      "Focus on agricultural land-specific issues, not general residential buying: land classification, use obligations, and local planning checks.",
    relatedLinks: [
      "/articles/can-foreigners-buy-property-in-turkey",
      "/articles/legal-checks-before-buying-property-in-turkey",
      "/articles/how-to-avoid-property-fraud-in-turkey"
    ]
  },
  {
    title: "How to Verify a Turkish Property Before Payment",
    slug: "how-to-verify-a-turkish-property-before-payment",
    seoTitle:
      "How to Verify a Turkish Property Before Payment: Foreign Buyer Checklist",
    seoDescription:
      "Use a practical verification workflow before deposit or transfer when buying property in Turkey as a foreigner.",
    excerpt:
      "A practical pre-payment verification workflow for foreign buyers to reduce legal and financial risk.",
    category: "Payment Safety",
    angle:
      "Emphasize pre-payment verification workflow, payment gating logic, and practical evidence checks before deposit transfer.",
    relatedLinks: [
      "/articles/how-to-avoid-property-fraud-in-turkey",
      "/articles/legal-checks-before-buying-property-in-turkey",
      "/articles/title-deed-transfer-in-turkey-for-foreign-buyers"
    ]
  },
  {
    title: "Buying Property in Istanbul as a Foreigner",
    slug: "buying-property-in-istanbul-as-a-foreigner",
    seoTitle:
      "Buying Property in Istanbul as a Foreigner: Practical Legal and Market Guide",
    seoDescription:
      "A practical guide for foreigners buying property in Istanbul, covering district choice, legal checks, and transaction planning.",
    excerpt:
      "A city-specific guide for foreign buyers in Istanbul with practical legal, location, and budgeting considerations.",
    category: "City Guide",
    angle:
      "Keep Istanbul-specific: district dynamics, practical buying strategy, rental/lifestyle considerations, and localized risk controls.",
    relatedLinks: [
      "/articles/step-by-step-guide-to-buying-property-in-turkey",
      "/articles/taxes-and-fees-when-foreigners-buy-property-in-turkey",
      "/articles/common-mistakes-foreign-buyers-make-when-purchasing-property-in-turkey"
    ]
  }
];

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function ensureShape(markdown, title, relatedLinks) {
  const withH1 = markdown.trim().startsWith("# ")
    ? markdown.trim()
    : `# ${title}\n\n${markdown.trim()}`;

  let withFaq = withH1;
  if (!/##\s*FAQ/i.test(withFaq)) {
    withFaq += `\n\n## FAQ\n\n### Do rules change over time?\nYes. Property, planning, and administrative requirements can change, so current legal verification is important.\n\n### Should I rely only on seller-provided documents?\nNo. Independent document checks through qualified local professionals help reduce avoidable risk.\n\n### Is this article legal advice?\nNo. This is educational guidance and should be supplemented with professional legal advice for your case.\n`;
  }

  if (!/##\s*Related Articles/i.test(withFaq)) {
    withFaq += `\n\n## Related Articles\n\n- [Related 1](${relatedLinks[0]})\n- [Related 2](${relatedLinks[1]})\n- [Related 3](${relatedLinks[2]})\n`;
  }

  return withFaq;
}

async function rewriteToRange(article, body, model, note) {
  const prompt = `
Rewrite the markdown article below so it is between ${WORD_MIN} and ${WORD_MAX} words.

Rules:
- Keep H1 exactly "${article.title}".
- Keep tone professional, natural, and written for foreigners only.
- Keep clear H2/H3 structure.
- Keep a "## FAQ" section with at least 3 Q&A pairs.
- Keep a short CTA paragraph at the end.
- Keep a "## Related Articles" section with exactly 3 internal links.
- Do not include frontmatter.
- Preserve the same primary angle: ${article.angle}
- Keep and naturally integrate internal links to existing article URLs.

Reason for rewrite: ${note}

Article:
${body}
`;

  const rewritten = await generateWithGemini(prompt, {
    model,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 3000
    }
  });

  return ensureShape(rewritten, article.title, article.relatedLinks);
}

async function generateArticle(article, model, publishedAt) {
  const prompt = `
Write one original markdown article for turkestatelegal.com.

Audience and style:
- English only
- Foreigners only
- Professional, clear, trustworthy, natural
- No robotic phrases, no keyword stuffing
- Do not use fake certainty; use cautious language where legal review is needed

Topic:
- Title: "${article.title}"
- Primary angle: ${article.angle}
- Keep this angle distinct from generic buying guides.

Length:
- Keep total length between ${WORD_MIN} and ${WORD_MAX} words.

Structure requirements:
1) Start with one H1 exactly matching the title.
2) Strong intro focused on foreign buyers.
3) Use practical H2/H3 sections.
4) Include "## FAQ" with at least 3 Q&A.
5) End with a short CTA paragraph.
6) Add "## Related Articles" with exactly 3 bullet links.

Internal links:
- Add 2 to 4 natural inline internal links within the body.
- Use relevant existing article URLs like:
  - /articles/can-foreigners-buy-property-in-turkey
  - /articles/step-by-step-guide-to-buying-property-in-turkey
  - /articles/legal-checks-before-buying-property-in-turkey
  - /articles/title-deed-transfer-in-turkey-for-foreign-buyers
  - /articles/taxes-and-fees-when-foreigners-buy-property-in-turkey
  - /articles/how-to-avoid-property-fraud-in-turkey
  - /articles/buying-property-in-turkey-with-power-of-attorney
  - /articles/can-buying-property-in-turkey-help-you-get-a-residence-permit
  - /articles/turkish-citizenship-by-investment-through-real-estate
  - /articles/common-mistakes-foreign-buyers-make-when-purchasing-property-in-turkey

Use these links in Related Articles section:
- ${article.relatedLinks[0]}
- ${article.relatedLinks[1]}
- ${article.relatedLinks[2]}

Output:
- Return markdown only.
- No frontmatter.
`;

  let body = await generateWithGemini(prompt, {
    model,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 3000
    }
  });
  body = ensureShape(body, article.title, article.relatedLinks);
  let words = countWords(body);

  let attempts = 0;
  while ((words < WORD_MIN || words > WORD_MAX) && attempts < 3) {
    attempts += 1;
    const note =
      words > WORD_MAX
        ? `Too long at ${words} words; compress while preserving utility.`
        : `Too short at ${words} words; expand with practical detail.`;
    body = await rewriteToRange(article, body, model, note);
    words = countWords(body);
  }

  if (words < WORD_MIN || words > WORD_MAX) {
    throw new Error(`${article.slug}.md is ${words} words after retries.`);
  }

  const frontmatter = {
    title: article.title,
    slug: article.slug,
    seoTitle: article.seoTitle,
    seoDescription: article.seoDescription,
    excerpt: article.excerpt,
    coverImage: pickRandomPlaceholder(),
    publishedAt,
    category: article.category
  };

  return {
    markdown: matter.stringify(`${body.trim()}\n`, frontmatter),
    words
  };
}

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY in .env");
  }

  const model = process.argv[2] || DEFAULT_GEMINI_MODEL;
  const outputDir = path.join(process.cwd(), "content", "articles");
  const publishedAt = new Date().toISOString().slice(0, 10);

  for (let i = 0; i < ARTICLES.length; i += 1) {
    const article = ARTICLES[i];
    const result = await generateArticle(article, model, publishedAt);
    const outPath = path.join(outputDir, `${article.slug}.md`);
    fs.writeFileSync(outPath, result.markdown, "utf8");
    console.log(
      `[${i + 1}/${ARTICLES.length}] Created ${article.slug}.md (${result.words} words)`
    );
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
