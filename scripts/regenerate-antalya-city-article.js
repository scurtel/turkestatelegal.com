const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");
const { DEFAULT_GEMINI_MODEL, generateWithGemini } = require("../lib/gemini");
const { pickRandomPlaceholder } = require("./utils/placeholder-images");

dotenv.config();

const WORD_MIN = 1000;
const WORD_MAX = 1500;

const ARTICLE = {
  title: "Buying Property in Antalya as a Foreigner",
  slug: "buying-property-in-antalya-as-a-foreigner",
  seoTitle:
    "Buying Property in Antalya as a Foreigner: Coastal Lifestyle and Legal Guide",
  seoDescription:
    "A practical guide for foreign buyers in Antalya, covering holiday-home demand, seasonal usage planning, and legal verification priorities.",
  excerpt:
    "A coastal-focused Antalya guide for foreign buyers balancing lifestyle goals, seasonal use, and legal risk control.",
  category: "City Guide"
};

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function withFrontmatter(markdown) {
  const date = new Date().toISOString().slice(0, 10);
  const coverImage = pickRandomPlaceholder();
  return `---
title: "${ARTICLE.title}"
slug: ${ARTICLE.slug}
seoTitle: "${ARTICLE.seoTitle}"
seoDescription: "${ARTICLE.seoDescription}"
excerpt: "${ARTICLE.excerpt}"
coverImage: "${coverImage}"
publishedAt: "${date}"
category: "${ARTICLE.category}"
---

${markdown.trim()}
`;
}

async function main() {
  const model = process.argv[2] || DEFAULT_GEMINI_MODEL;
  const prompt = `
Write one original markdown article for turkestatelegal.com.

Title:
"${ARTICLE.title}"

Audience and tone:
- English-only
- Foreigners only
- Professional legal-guidance tone, practical and natural
- Not a tourism article

Very important identity:
- Make this Antalya-specific and distinct.
- Emphasize coastal second-home demand, seasonal occupancy planning, holiday-rental compliance caution, residence-related practical considerations, and remote ownership management.
- Do not write a generic Turkey purchase guide with city name replaced.

Requirements:
- 1000 to 1500 words.
- Start with one H1 exactly matching the title.
- Strong intro.
- Use practical H2/H3 sections.
- Include 2 to 4 natural inline internal links to existing site articles.
- Include "## FAQ" with at least 3 Q&A.
- End with a short CTA paragraph.
- Include "## Related Articles" with exactly these 3 links:
  - /articles/can-buying-property-in-turkey-help-you-get-a-residence-permit
  - /articles/title-deed-transfer-in-turkey-for-foreign-buyers
  - /articles/taxes-and-fees-when-foreigners-buy-property-in-turkey

Output rules:
- Return markdown only.
- No frontmatter.
`;

  let markdown = await generateWithGemini(prompt, {
    model,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 3000
    }
  });

  let words = countWords(markdown);
  let attempts = 0;
  while ((words < WORD_MIN || words > WORD_MAX) && attempts < 3) {
    attempts += 1;
    const reason =
      words > WORD_MAX
        ? `Too long (${words}). Rewrite to 1100-1300 words.`
        : `Too short (${words}). Rewrite to 1100-1300 words.`;
    markdown = await generateWithGemini(`${prompt}\n\n${reason}`, {
      model,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 3000
      }
    });
    words = countWords(markdown);
  }

  if (words < WORD_MIN || words > WORD_MAX) {
    throw new Error(`Generated article still out of range: ${words} words.`);
  }

  const full = withFrontmatter(markdown);
  const outputPath = path.join(
    process.cwd(),
    "content",
    "articles",
    `${ARTICLE.slug}.md`
  );
  fs.writeFileSync(outputPath, full, "utf8");
  console.log(`Regenerated ${ARTICLE.slug}.md (${words} words)`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
