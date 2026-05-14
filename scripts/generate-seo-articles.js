const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");
const {
  DEFAULT_GEMINI_MODEL,
  generateWithGeminiWithRetry
} = require("../lib/gemini");
const SEO_TOPICS = require("./topics/seo-gsc-queries");

dotenv.config();

const OUTPUT_DIR = path.join(process.cwd(), "generated-articles");
const REQUEST_DELAY_MS = Number(process.env.GENERATE_SEO_DELAY_MS || 3500);
const MODEL = process.env.GENERATE_SEO_MODEL || DEFAULT_GEMINI_MODEL;

const MARKDOWN_GENERATION_CONFIG = {
  temperature: 0.65,
  maxOutputTokens: 12288
};

const METADATA_JSON_CONFIG = {
  temperature: 0.55,
  maxOutputTokens: 4096,
  responseMimeType: "application/json"
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseJsonFromModelText(text) {
  let trimmed = text.trim().replace(/^\uFEFF/, "");
  if (trimmed.startsWith("```")) {
    trimmed = trimmed
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();
  }
  return JSON.parse(trimmed);
}

function stripMarkdownFences(markdown) {
  let md = markdown.trim().replace(/^\uFEFF/, "");
  if (md.startsWith("```")) {
    md = md
      .replace(/^```(?:markdown|md)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();
  }
  return md;
}

function roughWordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function buildFaqSchemaLd(faqItems) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: (faqItems || []).map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };
}

function validateMetadataPayload(data, expectedSlug) {
  const required = [
    "seoTitle",
    "metaDescription",
    "slug",
    "focusKeyword",
    "secondaryKeywords",
    "faq",
    "internalLinkSuggestions",
    "featuredImagePrompt"
  ];
  for (const key of required) {
    if (data[key] === undefined || data[key] === null) {
      throw new Error(`Missing required field in model JSON: ${key}`);
    }
  }
  if (typeof data.slug !== "string" || data.slug !== expectedSlug) {
    throw new Error(
      `Model returned slug "${data.slug}" but expected "${expectedSlug}".`
    );
  }
  if (!Array.isArray(data.secondaryKeywords)) {
    throw new Error("secondaryKeywords must be an array.");
  }
  if (!Array.isArray(data.faq) || data.faq.length < 4) {
    throw new Error("faq must be an array with at least 4 items.");
  }
  if (!Array.isArray(data.internalLinkSuggestions)) {
    throw new Error("internalLinkSuggestions must be an array.");
  }
  if (data.secondaryKeywords.length < 5 || data.secondaryKeywords.length > 8) {
    throw new Error("secondaryKeywords must contain between 5 and 8 items.");
  }
  if (
    data.internalLinkSuggestions.length < 5 ||
    data.internalLinkSuggestions.length > 8
  ) {
    throw new Error(
      "internalLinkSuggestions must contain between 5 and 8 items."
    );
  }
  if (data.faq.length > 6) {
    throw new Error("faq must contain at most 6 items.");
  }
  for (const item of data.faq) {
    if (!item || typeof item.question !== "string" || typeof item.answer !== "string") {
      throw new Error("Each faq item must have string question and answer.");
    }
  }
}

function buildYamlFrontmatter(obj) {
  const lines = [
    `query: ${JSON.stringify(obj.query)}`,
    `seoTitle: ${JSON.stringify(obj.seoTitle)}`,
    `seoDescription: ${JSON.stringify(obj.seoDescription)}`,
    `slug: ${JSON.stringify(obj.slug)}`,
    `focusKeyword: ${JSON.stringify(obj.focusKeyword)}`,
    "secondaryKeywords:"
  ];
  for (const kw of obj.secondaryKeywords) {
    lines.push(`  - ${JSON.stringify(String(kw))}`);
  }
  lines.push(
    `featuredImagePrompt: ${JSON.stringify(obj.featuredImagePrompt)}`
  );
  return `${lines.join("\n")}\n`;
}

function renderMarkdownFile({ topic, data }) {
  const faqLd = buildFaqSchemaLd(data.faq);

  const internalSection = data.internalLinkSuggestions
    .map((row) => {
      const anchor = row.anchor || "";
      const href = row.suggestedPath || row.suggestedUrl || "";
      const note = row.context ? ` — ${row.context}` : "";
      return `- **${anchor}** → \`${href}\`${note}`;
    })
    .join("\n");

  const faqJson = JSON.stringify(faqLd, null, 2);

  return `---
${buildYamlFrontmatter({
    query: topic.query,
    seoTitle: data.seoTitle,
    seoDescription: data.metaDescription,
    slug: data.slug,
    focusKeyword: data.focusKeyword,
    secondaryKeywords: data.secondaryKeywords,
    featuredImagePrompt: data.featuredImagePrompt
})}---

${data.articleMarkdown.trim()}

## Internal link suggestions

${internalSection}

## FAQ structured data (JSON-LD)

\`\`\`json
${faqJson}
\`\`\`
`;
}

function buildArticleMarkdownPrompt(topic) {
  return `You are a senior legal content writer for a Turkish law firm website: turkestatelegal.com.
The audience is foreigners interested in Turkish real estate law, inheritance law, Turkish citizenship by investment, buying property in Turkey, off-plan property risks, and legal due diligence.

Google Search Console style query to target (semantic intent, not keyword stuffing): "${topic.query}"

OUTPUT FORMAT (strict):
- Return ONLY the article body in Markdown (no JSON, no YAML frontmatter, no commentary before or after).
- Do NOT wrap the output in markdown code fences.

Writing style (strict):
- Natural, professional English suitable for a law firm / legal consultancy.
- Do NOT sound like generic AI content.
- Do NOT make unsupported promises.
- NEVER say "guaranteed citizenship" or "guaranteed legal result".
- Use cautious legal language: may, usually, depending on the facts, legal review is recommended.
- Avoid keyword stuffing.
- Practical warnings, legal risks, and why a Turkish lawyer matters.
- Do NOT invent case law, court names, citation numbers, or fake statutes.
- If you mention investment thresholds, minimum property values, timelines, or eligibility for citizenship by investment, clearly state they can change and must be verified before any action.

Article requirements (strict):
- Length: 1200–1800 words.
- Start with a single H1 line that will work as the page headline (keep it strong for SEO; roughly under ~70 characters when possible).
- Use H2 and H3 headings.
- Include a section titled exactly: ## Why Legal Due Diligence Matters
- Include a section titled exactly: ## How a Turkish Real Estate Lawyer Can Help
- Include ## Frequently asked questions with the FAQ written as normal prose under H3 questions (not JSON, not a code block).
- End with a short, soft call-to-action to contact a Turkish real estate lawyer (no pressure, no guarantees).

Write the article now.`;
}

function buildMetadataPrompt(topic, articleMarkdown) {
  return `You are supporting SEO packaging for turkestatelegal.com.

The article Markdown below is FINAL and must not be rewritten. Your job is to produce metadata and structured FAQ items only.

Return ONLY valid JSON (no markdown fences, no commentary). Use this exact shape:
{
  "seoTitle": string,
  "metaDescription": string,
  "slug": "${topic.slug}",
  "focusKeyword": string,
  "secondaryKeywords": string[],
  "faq": { "question": string, "answer": string }[],
  "internalLinkSuggestions": { "anchor": string, "suggestedPath": string, "context"?: string }[],
  "featuredImagePrompt": string
}

Rules:
- seoTitle: max ~60 characters when reasonable; align closely with the article H1.
- metaDescription: 140–160 characters; professional; strong click-through potential.
- slug MUST be exactly: "${topic.slug}"
- focusKeyword: one main keyword phrase.
- secondaryKeywords: 5 to 8 items.
- faq: 4 to 6 items; questions and answers must be plain text (no markdown). Answers should be concise but helpful.
- internalLinkSuggestions: 5 to 8 items. Use these anchor texts where relevant (repeat if needed): "Turkish real estate lawyer", "buying property in Turkey", "Turkish citizenship by investment", "inheritance law in Turkey", "property due diligence in Turkey", "off-plan property in Turkey".
- suggestedPath must start with "/" (use "/articles" or "/contact" if unsure).
- featuredImagePrompt: one realistic image prompt for a legal/real estate website; NO text inside the image.

Article markdown:
---
${articleMarkdown}
---`;
}

function buildMetadataRepairPrompt(topic, lastError, previousRaw) {
  return `Your previous output was not valid JSON or failed validation.

Error: ${lastError}

Return ONLY one valid JSON object (no markdown fences) with these keys:
seoTitle, metaDescription, slug, focusKeyword, secondaryKeywords, faq, internalLinkSuggestions, featuredImagePrompt

slug MUST be exactly: "${topic.slug}"
Do NOT include articleMarkdown.

Broken output (truncated):
${previousRaw.slice(0, 12000)}`;
}

async function generateArticleMarkdown(topic) {
  const prompt = buildArticleMarkdownPrompt(topic);
  const raw = await generateWithGeminiWithRetry(prompt, {
    model: MODEL,
    maxRetries: 3,
    retryDelayMs: 2500,
    generationConfig: MARKDOWN_GENERATION_CONFIG
  });

  const md = stripMarkdownFences(raw);
  const words = roughWordCount(md);
  if (words < 900) {
    throw new Error(
      `Article markdown seems too short (${words} words). Expected roughly 1200–1800 words.`
    );
  }
  return md;
}

async function generateMetadataBundle(topic, articleMarkdown) {
  let lastError = "";
  let previousRaw = "";

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const prompt =
      attempt === 1
        ? buildMetadataPrompt(topic, articleMarkdown)
        : buildMetadataRepairPrompt(topic, lastError, previousRaw);

    const raw = await generateWithGeminiWithRetry(prompt, {
      model: MODEL,
      maxRetries: 3,
      retryDelayMs: 2500,
      generationConfig: METADATA_JSON_CONFIG
    });
    previousRaw = raw;

    try {
      const meta = parseJsonFromModelText(raw);
      validateMetadataPayload(meta, topic.slug);
      return meta;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.warn(`  Metadata JSON attempt ${attempt}/3 failed: ${lastError}`);
      if (attempt === 3) {
        throw error;
      }
    }
  }

  throw new Error("Unexpected: metadata generation finished without data.");
}

async function generateOneArticle(topic) {
  console.log("  Step 1/2: article body (markdown)…");
  const articleMarkdown = await generateArticleMarkdown(topic);

  console.log("  Step 2/2: SEO metadata (small JSON)…");
  await sleep(600);
  const meta = await generateMetadataBundle(topic, articleMarkdown);

  return {
    ...meta,
    articleMarkdown
  };
}

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("Missing GEMINI_API_KEY. Add it to your .env file.");
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const index = [];

  for (let i = 0; i < SEO_TOPICS.length; i += 1) {
    const topic = SEO_TOPICS[i];
    console.log(
      `\n[${i + 1}/${SEO_TOPICS.length}] Generating: ${topic.fileName}`
    );
    console.log(`Query: ${topic.query}`);

    const data = await generateOneArticle(topic);
    const body = renderMarkdownFile({ topic, data });
    const outPath = path.join(OUTPUT_DIR, topic.fileName);
    fs.writeFileSync(outPath, body, "utf8");
    console.log(`Saved: ${outPath}`);

    index.push({
      title: data.seoTitle,
      slug: data.slug,
      focusKeyword: data.focusKeyword,
      metaDescription: data.metaDescription,
      fileName: topic.fileName,
      query: topic.query
    });

    if (i < SEO_TOPICS.length - 1) {
      console.log(`Waiting ${REQUEST_DELAY_MS}ms before next request...`);
      await sleep(REQUEST_DELAY_MS);
    }
  }

  const indexPath = path.join(OUTPUT_DIR, "index.json");
  fs.writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
  console.log(`\nWrote index: ${indexPath}`);
  console.log(`Done. Model: ${MODEL}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
