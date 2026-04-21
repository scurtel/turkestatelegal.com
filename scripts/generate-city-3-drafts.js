const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");
const { DEFAULT_GEMINI_MODEL, generateWithGemini } = require("../lib/gemini");
const { pickRandomPlaceholder } = require("./utils/placeholder-images");

dotenv.config();

const WORD_MIN = 1000;
const WORD_MAX = 1500;

const ARTICLES = [
  {
    title: "Buying Property in Adana as a Foreigner",
    slug: "buying-property-in-adana-as-a-foreigner",
    seoTitle:
      "Buying Property in Adana as a Foreigner: Practical Legal and Value Guide",
    seoDescription:
      "A practical guide for foreigners considering property in Adana, with emphasis on local-market realities, due diligence, and value-focused decisions.",
    excerpt:
      "A value-focused Adana guide for foreign buyers who want practical legal checks and realistic market expectations.",
    category: "City Guide",
    cityAngle:
      "Adana should feel local-market and value-oriented, with lower foreign-buyer visibility, stronger emphasis on practical due diligence and neighborhood-level verification.",
    relatedLinks: [
      "/articles/legal-checks-before-buying-property-in-turkey",
      "/articles/how-to-verify-a-turkish-property-before-payment",
      "/articles/common-mistakes-foreign-buyers-make-when-purchasing-property-in-turkey"
    ]
  },
  {
    title: "Buying Property in Mersin as a Foreigner",
    slug: "buying-property-in-mersin-as-a-foreigner",
    seoTitle:
      "Buying Property in Mersin as a Foreigner: Affordability and Growth Guide",
    seoDescription:
      "Understand how foreigners can approach Mersin property with practical legal checks, affordability planning, and development-led risk control.",
    excerpt:
      "A practical Mersin guide focused on affordability, development momentum, and legal checks for safer decisions.",
    category: "City Guide",
    cityAngle:
      "Mersin should emphasize relative affordability, emerging demand, development-led opportunities, and practical budgeting/value angle.",
    relatedLinks: [
      "/articles/step-by-step-guide-to-buying-property-in-turkey",
      "/articles/taxes-and-fees-when-foreigners-buy-property-in-turkey",
      "/articles/buying-off-plan-property-in-turkey-legal-risks"
    ]
  },
  {
    title: "Buying Property in Antalya as a Foreigner",
    slug: "buying-property-in-antalya-as-a-foreigner",
    seoTitle:
      "Buying Property in Antalya as a Foreigner: Coastal Lifestyle and Legal Guide",
    seoDescription:
      "A practical guide for foreign buyers in Antalya, covering holiday-home demand, seasonal usage planning, and legal verification priorities.",
    excerpt:
      "A coastal-focused Antalya guide for foreign buyers balancing lifestyle goals, seasonal use, and legal risk control.",
    category: "City Guide",
    cityAngle:
      "Antalya should focus on coastal foreign-buyer demand, holiday-home and seasonal use planning, and residence-related practical considerations.",
    relatedLinks: [
      "/articles/can-buying-property-in-turkey-help-you-get-a-residence-permit",
      "/articles/title-deed-transfer-in-turkey-for-foreign-buyers",
      "/articles/taxes-and-fees-when-foreigners-buy-property-in-turkey"
    ]
  }
];

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function ensureSections(body, title, relatedLinks) {
  let text = body.trim().startsWith("# ") ? body.trim() : `# ${title}\n\n${body.trim()}`;

  if (!/##\s*FAQ/i.test(text)) {
    text +=
      "\n\n## FAQ\n\n### Can rules change over time?\nYes. Local implementation details and administrative practices can change, so current legal verification is essential.\n\n### Should I rely only on listing descriptions?\nNo. Independent document checks and local professional review reduce avoidable risk.\n\n### Is this legal advice?\nNo. This article is educational and should be supplemented with qualified legal advice for your specific case.\n";
  }

  if (!/##\s*Related Articles/i.test(text)) {
    text += `\n\n## Related Articles\n\n- [Related 1](${relatedLinks[0]})\n- [Related 2](${relatedLinks[1]})\n- [Related 3](${relatedLinks[2]})\n`;
  }

  return text;
}

function buildFrontmatter(article) {
  const publishedAt = new Date().toISOString().slice(0, 10);
  const coverImage = pickRandomPlaceholder();
  return `---
title: "${article.title.replace(/"/g, '\\"')}"
slug: ${article.slug}
seoTitle: "${article.seoTitle.replace(/"/g, '\\"')}"
seoDescription: "${article.seoDescription.replace(/"/g, '\\"')}"
excerpt: "${article.excerpt.replace(/"/g, '\\"')}"
coverImage: "${coverImage}"
publishedAt: "${publishedAt}"
category: "${article.category}"
---
`;
}

async function rewriteToRange(article, markdown, model, reason) {
  const prompt = `
Rewrite the markdown article below so it is strictly between ${WORD_MIN} and ${WORD_MAX} words.

Requirements:
- Keep H1 exactly: "${article.title}"
- Preserve the same city-specific identity and angle: ${article.cityAngle}
- Keep professional legal-guidance tone for foreigners.
- Keep H2/H3 structure.
- Keep "## FAQ" with at least 3 Q&A.
- Keep a short CTA at the end.
- Keep "## Related Articles" with exactly 3 internal links.
- No frontmatter.

Reason for rewrite: ${reason}

Article:
${markdown}
`;

  const rewritten = await generateWithGemini(prompt, {
    model,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 3000
    }
  });

  return ensureSections(rewritten, article.title, article.relatedLinks);
}

async function generateArticle(article, model) {
  const prompt = `
Write one original English markdown article for turkestatelegal.com.

Audience and tone:
- Foreigners only
- Professional, useful, practical, trustworthy
- Legal-guidance tone (not tourism-blog tone)
- No keyword stuffing, no generic AI phrasing
- Use cautious language where legal verification is needed

Topic:
- Title: "${article.title}"
- Distinct city identity requirement: ${article.cityAngle}
- Very important: do not just swap city names from other city articles.

Content requirements:
- Length between ${WORD_MIN} and ${WORD_MAX} words.
- Start with H1 exactly matching the title.
- Include strong intro.
- Use practical H2/H3 sections.
- Include FAQ section with at least 3 Q&A.
- End with short CTA paragraph.
- Include 2 to 4 natural inline internal links to relevant existing articles.
- Add a short "## Related Articles" section with exactly these links:
  - ${article.relatedLinks[0]}
  - ${article.relatedLinks[1]}
  - ${article.relatedLinks[2]}

Useful existing links:
- /articles/can-foreigners-buy-property-in-turkey
- /articles/step-by-step-guide-to-buying-property-in-turkey
- /articles/legal-checks-before-buying-property-in-turkey
- /articles/title-deed-transfer-in-turkey-for-foreign-buyers
- /articles/taxes-and-fees-when-foreigners-buy-property-in-turkey
- /articles/how-to-avoid-property-fraud-in-turkey
- /articles/how-to-verify-a-turkish-property-before-payment
- /articles/buying-off-plan-property-in-turkey-legal-risks
- /articles/can-buying-property-in-turkey-help-you-get-a-residence-permit
- /articles/common-mistakes-foreign-buyers-make-when-purchasing-property-in-turkey

Output:
- Markdown only
- No frontmatter
`;

  let body = await generateWithGemini(prompt, {
    model,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 3000
    }
  });

  body = ensureSections(body, article.title, article.relatedLinks);
  let words = countWords(body);
  let attempts = 0;

  while ((words < WORD_MIN || words > WORD_MAX) && attempts < 3) {
    attempts += 1;
    const reason =
      words > WORD_MAX
        ? `Too long at ${words} words. Compress while preserving clarity.`
        : `Too short at ${words} words. Expand with practical city-specific detail.`;
    body = await rewriteToRange(article, body, model, reason);
    words = countWords(body);
  }

  if (words < WORD_MIN || words > WORD_MAX) {
    throw new Error(`${article.slug}.md ended at ${words} words after retries.`);
  }

  return {
    content: `${buildFrontmatter(article)}\n${body.trim()}\n`,
    words
  };
}

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY in .env");
  }

  const model = process.argv[2] || DEFAULT_GEMINI_MODEL;
  const outputDir = path.join(process.cwd(), "content", "articles");

  for (let i = 0; i < ARTICLES.length; i += 1) {
    const article = ARTICLES[i];
    const result = await generateArticle(article, model);
    const filePath = path.join(outputDir, `${article.slug}.md`);
    fs.writeFileSync(filePath, result.content, "utf8");
    console.log(
      `[${i + 1}/${ARTICLES.length}] Created ${article.slug}.md (${result.words} words)`
    );
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
