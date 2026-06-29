#!/usr/bin/env node
/**
 * Weekly auto-article generator for turkestatelegal.com
 * Usage: GEMINI_API_KEY=... node scripts/generate-article.mjs
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const __filename = fileURLToPath(import.meta.url);

const ROOT = process.cwd();
const ARTICLES_DIR = path.join(ROOT, "content", "articles");
const INSTAGRAM_DRAFTS_DIR = path.join(ROOT, "social-drafts", "instagram");
const SITE_BASE_URL = (
  process.env.SITE_BASE_URL || "https://turkestatelegal.com"
).replace(/\/$/, "");
const AUTHOR = "Turks Estate Legal";
const DISCLAIMER =
  "This article is for general informational purposes only and does not constitute legal advice. Each case should be assessed according to its own facts and current legislation.";
const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const RECOMMENDED_MIN_WORDS = 900;
const RECOMMENDED_MAX_WORDS = 1200;

const TOPIC_POOL = [
  {
    topic: "Buying property in Turkey as a foreigner",
    category: "Buying Process",
    focusKeyword: "buying property in Turkey as a foreigner",
    slugHint: "foreigner-guide-buying-property-turkey",
    coveredPatterns: [
      "buying-property-in-turkey-as-a-foreigner",
      "how-can-foreigners-buy-property",
      "can-foreigners-buy-property-in-turkey"
    ]
  },
  {
    topic: "Legal checklist before buying property in Turkey",
    category: "Due Diligence",
    focusKeyword: "legal checklist buying property Turkey",
    slugHint: "legal-checklist-before-buying-property-in-turkey",
    coveredPatterns: [
      "legal-checklist",
      "legal-checks-before-buying",
      "legal-due-diligence-before-buying"
    ]
  },
  {
    topic: "Title deed checks in Turkey",
    category: "Title Deed",
    focusKeyword: "title deed checks Turkey",
    slugHint: "title-deed-checks-turkey-foreign-buyers",
    coveredPatterns: [
      "turkish-title-deed-explained",
      "title-deed-transfer",
      "title-deed-problems"
    ]
  },
  {
    topic: "How to avoid real estate fraud in Turkey",
    category: "Fraud Prevention",
    focusKeyword: "real estate fraud Turkey",
    slugHint: "how-to-avoid-real-estate-fraud-turkey",
    coveredPatterns: ["how-to-avoid-property-fraud", "property-fraud"]
  },
  {
    topic: "Turkish property purchase process for foreigners",
    category: "Buying Process",
    focusKeyword: "Turkish property purchase process foreigners",
    slugHint: "turkish-property-purchase-process-foreigners",
    coveredPatterns: [
      "step-by-step-guide-to-buying-property",
      "buying-property-in-turkey-as-a-foreigner"
    ]
  },
  {
    topic: "Lawyer review before buying property in Turkey",
    category: "Due Diligence",
    focusKeyword: "lawyer review before buying property Turkey",
    slugHint: "lawyer-review-before-buying-property-turkey",
    coveredPatterns: ["lawyer-review-before-buying"]
  },
  {
    topic: "Real estate due diligence in Turkey",
    category: "Due Diligence",
    focusKeyword: "real estate due diligence Turkey",
    slugHint: "real-estate-due-diligence-turkey-foreign-buyers-guide",
    coveredPatterns: [
      "real-estate-due-diligence",
      "property-due-diligence",
      "turkey-due-diligence"
    ]
  },
  {
    topic: "Risks of buying property in Turkey without a lawyer",
    category: "Due Diligence",
    focusKeyword: "buying property Turkey without lawyer",
    slugHint: "risks-buying-property-turkey-without-lawyer",
    coveredPatterns: ["without-a-lawyer", "without-lawyer"]
  },
  {
    topic: "Turkish title deed explained for foreigners",
    category: "Title Deed",
    focusKeyword: "Turkish title deed foreigners",
    slugHint: "turkish-title-deed-guide-foreign-buyers",
    coveredPatterns: ["turkish-title-deed-explained"]
  },
  {
    topic: "Power of attorney for property purchase in Turkey",
    category: "Remote Purchase",
    focusKeyword: "power of attorney property purchase Turkey",
    slugHint: "power-of-attorney-property-purchase-turkey-guide",
    coveredPatterns: ["power-of-attorney"]
  },
  {
    topic: "Citizenship by investment through property in Turkey",
    category: "Citizenship by Investment",
    focusKeyword: "citizenship by investment property Turkey",
    slugHint: "citizenship-by-investment-property-turkey-guide",
    coveredPatterns: [
      "turkish-citizenship-by-investment",
      "turkish-citizenship-by-property",
      "citizenship-by-investment"
    ]
  },
  {
    topic: "Residence permit after buying property in Turkey",
    category: "Residence Permit",
    focusKeyword: "residence permit after buying property Turkey",
    slugHint: "residence-permit-after-buying-property-turkey-guide",
    coveredPatterns: [
      "residence-permit-after-buying",
      "how-to-get-a-residence-permit-by-buying"
    ]
  },
  {
    topic: "Property purchase contract in Turkey",
    category: "Buying Process",
    focusKeyword: "property purchase contract Turkey",
    slugHint: "property-purchase-contract-turkey-foreign-buyers",
    coveredPatterns: ["property-sale-contracts"]
  },
  {
    topic: "Deposit payment risks when buying property in Turkey",
    category: "Payment Safety",
    focusKeyword: "deposit payment risks Turkey property",
    slugHint: "deposit-payment-risks-buying-property-turkey",
    coveredPatterns: ["deposit-payment"]
  },
  {
    topic: "Notary and land registry process in Turkey",
    category: "Title Deed",
    focusKeyword: "notary land registry Turkey property",
    slugHint: "notary-land-registry-process-turkey-foreign-buyers",
    coveredPatterns: [
      "land-registry-appointment",
      "notary-and-land-registry"
    ]
  },
  {
    topic: "Buying off-plan property in Turkey",
    category: "Off-Plan Risk",
    focusKeyword: "buying off-plan property Turkey",
    slugHint: "buying-off-plan-property-turkey-guide",
    coveredPatterns: ["off-plan-property", "buying-off-plan"]
  },
  {
    topic: "Construction company risks in Turkey",
    category: "Off-Plan Risk",
    focusKeyword: "construction company risks Turkey property",
    slugHint: "construction-company-risks-turkey-property-buyers",
    coveredPatterns: ["construction-company"]
  },
  {
    topic: "Property inheritance issues for foreigners in Turkey",
    category: "Inheritance Law",
    focusKeyword: "property inheritance foreigners Turkey",
    slugHint: "property-inheritance-issues-foreigners-turkey",
    coveredPatterns: [
      "inheritance-law-in-turkey",
      "inheritance-of-foreigners",
      "inheriting-property-in-turkey",
      "can-foreigners-inherit"
    ]
  },
  {
    topic: "Rental income and legal issues for foreign owners in Turkey",
    category: "Investment",
    focusKeyword: "rental income foreign property owners Turkey",
    slugHint: "rental-income-legal-issues-foreign-owners-turkey",
    coveredPatterns: ["rental-income"]
  },
  {
    topic: "Turkish real estate lawyer for foreigners",
    category: "Buying Process",
    focusKeyword: "Turkish real estate lawyer foreigners",
    slugHint: "turkish-real-estate-lawyer-for-foreigners",
    coveredPatterns: ["turkish-real-estate-lawyer"]
  },
  {
    topic: "Common scams targeting foreign property buyers in Turkey",
    category: "Fraud Prevention",
    focusKeyword: "scams foreign property buyers Turkey",
    slugHint: "common-scams-foreign-property-buyers-turkey",
    coveredPatterns: [
      "common-scams",
      "how-to-avoid-property-fraud"
    ]
  },
  {
    topic: "Can foreigners buy land in Turkey?",
    category: "Land Purchase",
    focusKeyword: "can foreigners buy land Turkey",
    slugHint: "can-foreigners-buy-land-in-turkey",
    coveredPatterns: [
      "can-foreigners-buy-agricultural-land",
      "can-foreigners-buy-land"
    ]
  },
  {
    topic: "Legal costs when buying property in Turkey",
    category: "Buying Process",
    focusKeyword: "legal costs buying property Turkey",
    slugHint: "legal-costs-buying-property-turkey-foreigners",
    coveredPatterns: ["legal-costs-buying", "taxes-and-fees-when-foreigners"]
  },
  {
    topic: "Turkish property tax basics for foreign buyers",
    category: "Buying Process",
    focusKeyword: "Turkish property tax foreign buyers",
    slugHint: "turkish-property-tax-basics-foreign-buyers",
    coveredPatterns: ["property-tax-basics", "taxes-and-fees-when-foreigners"]
  }
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function yamlString(value) {
  const text = String(value ?? "");
  if (text.includes("\n") || text.length > 72) {
    return `>-\n  ${text.replace(/\n/g, "\n  ")}`;
  }
  if (/[:#'"\n]/.test(text) || text.includes("&")) {
    return JSON.stringify(text);
  }
  return text;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function loadExistingArticles() {
  if (!fs.existsSync(ARTICLES_DIR)) {
    return [];
  }

  return fs
    .readdirSync(ARTICLES_DIR)
    .filter((file) => file.endsWith(".md") || file.endsWith(".mdx"))
    .map((file) => {
      const slug = file.replace(/\.mdx?$/, "");
      const parsed = matter(
        fs.readFileSync(path.join(ARTICLES_DIR, file), "utf8")
      );
      return {
        slug,
        title: String(parsed.data.title || ""),
        seoTitle: String(parsed.data.seoTitle || "")
      };
    });
}

function isTopicCovered(topicDef, existingArticles) {
  const slugs = existingArticles.map((article) => article.slug);
  return topicDef.coveredPatterns.some((pattern) =>
    slugs.some((slug) => slug.includes(pattern))
  );
}

function pickTopic(existingArticles) {
  const uncovered = TOPIC_POOL.filter(
    (topic) => !isTopicCovered(topic, existingArticles)
  );
  if (uncovered.length === 0) {
    return null;
  }

  const dayIndex = new Date().getUTCDay();
  const pickIndex = dayIndex % uncovered.length;
  return uncovered[pickIndex];
}

function logRecommendations(label, issues) {
  if (issues.length > 0) {
    console.warn(
      `${label} recommendations (non-blocking): ${issues.join("; ")}`
    );
  }
}

function getMetaRecommendations(seoTitle, seoDescription) {
  const issues = [];
  if (seoTitle.length < 50 || seoTitle.length > 60) {
    issues.push(`seoTitle length ${seoTitle.length} (recommended 50-60)`);
  }
  if (seoDescription.length < 140 || seoDescription.length > 155) {
    issues.push(
      `seoDescription length ${seoDescription.length} (recommended 140-155)`
    );
  }
  if (/turk estate legal/i.test(seoTitle)) {
    issues.push("seoTitle includes brand name (recommended to omit)");
  }
  return issues;
}

function normalizeMeta(meta) {
  let seoTitle = String(meta.seoTitle || meta.title || "").trim();
  let seoDescription = String(meta.seoDescription || meta.excerpt || "").trim();

  if (seoTitle.length > 60) {
    seoTitle = seoTitle.slice(0, 60).replace(/\s+\S*$/, "").trim();
  }
  if (seoDescription.length > 155) {
    seoDescription = seoDescription.slice(0, 155).replace(/\s+\S*$/, "").trim();
  }

  return { seoTitle, seoDescription };
}

async function callGemini(prompt, options = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable.");
  }

  const model = options.model || DEFAULT_MODEL;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: options.generationConfig || {
        temperature: 0.55,
        maxOutputTokens: 8192,
        responseMimeType: "application/json"
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed: ${response.status}`);
  }

  const data = await response.json();
  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim() || "";

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return text;
}

async function callGeminiWithRetry(prompt, options = {}) {
  const maxRetries = options.maxRetries ?? 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      return await callGemini(prompt, options);
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Gemini attempt ${attempt}/${maxRetries} failed: ${message}`);
      if (attempt < maxRetries) {
        await sleep(2000 * attempt);
      }
    }
  }

  throw lastError;
}

function parseJsonResponse(raw) {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonText = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(jsonText);
}

function buildPrompt(topicDef, existingArticles) {
  const linkCandidates = existingArticles
    .slice(0, 20)
    .map((article) => `/articles/${article.slug}`)
    .join(", ");

  return `You are a senior English legal content writer for turkestatelegal.com, a Turkish real estate law guide for foreign buyers led by Lawyer Ceren Sumer Cilli.

Write ONE new SEO article on this topic:
"${topicDef.topic}"

Return ONLY valid JSON with this shape:
{
  "title": "Full article H1 title",
  "slug": "kebab-case-slug",
  "seoTitle": "recommended 50-60 chars, no brand name",
  "seoDescription": "recommended 140-155 chars",
  "excerpt": "1-2 sentence summary under 180 chars",
  "category": "${topicDef.category}",
  "focusKeyword": "${topicDef.focusKeyword}",
  "secondaryKeywords": ["keyword1", "keyword2", "keyword3"],
  "bodyMarkdown": "markdown body without frontmatter"
}

Suggested slug (use or improve): ${topicDef.slugHint}

BODY RULES for bodyMarkdown:
- Start with ONE # H1 matching title (exactly once).
- Use ## and ### for structure.
- Recommended length: about ${RECOMMENDED_MIN_WORDS}-${RECOMMENDED_MAX_WORDS} words (flexible — quality matters more than exact count).
- English only. Professional, cautious legal information tone.
- Mention Lawyer Ceren Sumer Cilli naturally once in a "How Turk Estate Legal Can Help" section.
- Do NOT use: best lawyer, guaranteed result, 100% safe, risk-free, fastest citizenship, unlock, contact us now.
- Do not present content as legal advice for a specific case.
- Cover Tapu/title deed, contracts, due diligence, payment safety where relevant.
- Include ## FAQ with at least 4 questions as ### headings (recommended).
- After FAQ add ## Related Articles with 3 markdown bullet links to existing paths from: ${linkCandidates} (recommended).
- Include 3-5 natural internal markdown links in the body to paths from that list (recommended).
- Do NOT include YAML frontmatter or code fences inside bodyMarkdown.

FAQ JSON-LD will be generated at build time from the FAQ section when present.

Meta length targets are recommendations only — publish even if slightly outside range.`;
}

function resolveSlug(parsed, topicDef, existingArticles) {
  let slug = slugify(parsed.slug || topicDef.slugHint);

  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    slug = slugify(topicDef.slugHint) || `article-${Date.now()}`;
    logRecommendations("slug", ["invalid slug from model; using fallback"]);
  }

  if (existingArticles.some((article) => article.slug === slug)) {
    const suffix = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    slug = `${slug}-${suffix}`;
    logRecommendations("slug", [`duplicate slug resolved to ${slug}`]);
  }

  return slug;
}

function buildArticleFromParsed(parsed, topicDef, existingArticles) {
  let body = String(parsed.bodyMarkdown || "").trim();
  const meta = normalizeMeta(parsed);

  logRecommendations(
    "meta",
    getMetaRecommendations(meta.seoTitle, meta.seoDescription)
  );

  const words = wordCount(body.replace(/^#.+$/m, ""));
  if (words < RECOMMENDED_MIN_WORDS || words > RECOMMENDED_MAX_WORDS) {
    console.warn(
      `Word count ${words} is outside recommended ${RECOMMENDED_MIN_WORDS}-${RECOMMENDED_MAX_WORDS} range (accepted).`
    );
  }

  if (!body.includes("## FAQ")) {
    logRecommendations("content", ["missing FAQ section"]);
  }

  if (!body) {
    throw new Error("Gemini returned an empty article body.");
  }

  let title = String(parsed.title || "").trim();
  if (!title) {
    title = topicDef.topic;
    logRecommendations("title", ["missing title; using topic label"]);
  }

  if (!body.startsWith("#")) {
    body = `# ${title}\n\n${body}`;
    logRecommendations("content", ["added missing H1"]);
  }

  const slug = resolveSlug(parsed, topicDef, existingArticles);

  return {
    title,
    slug,
    seoTitle: meta.seoTitle || title.slice(0, 60),
    seoDescription:
      meta.seoDescription ||
      String(parsed.excerpt || topicDef.topic).slice(0, 155),
    excerpt: String(parsed.excerpt || topicDef.topic).trim(),
    category: String(parsed.category || topicDef.category).trim(),
    focusKeyword: String(parsed.focusKeyword || topicDef.focusKeyword).trim(),
    secondaryKeywords: Array.isArray(parsed.secondaryKeywords)
      ? parsed.secondaryKeywords.map(String)
      : [],
    body
  };
}

async function generateArticlePayload(topicDef, existingArticles) {
  const raw = await callGeminiWithRetry(
    buildPrompt(topicDef, existingArticles)
  );

  let parsed;
  try {
    parsed = parseJsonResponse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not parse Gemini JSON: ${message}`);
  }

  return buildArticleFromParsed(parsed, topicDef, existingArticles);
}

function writeArticleFile(article, publishedAt) {
  const frontmatter = `---
title: ${yamlString(article.title)}
slug: ${article.slug}
seoTitle: ${yamlString(article.seoTitle)}
seoDescription: ${yamlString(article.seoDescription)}
excerpt: ${yamlString(article.excerpt)}
coverImage: ''
publishedAt: '${publishedAt}'
category: ${yamlString(article.category)}
author: ${AUTHOR}
---

`;

  const content = `${frontmatter}${article.body.trim()}

---

*${DISCLAIMER}*
`;

  const targetPath = path.join(ARTICLES_DIR, `${article.slug}.md`);
  fs.writeFileSync(targetPath, content, "utf8");
  return targetPath;
}

function writeLastArticleMarker(slug) {
  fs.mkdirSync(INSTAGRAM_DRAFTS_DIR, { recursive: true });
  writeJson(path.join(INSTAGRAM_DRAFTS_DIR, "last-article.json"), {
    slug,
    articleUrl: `${SITE_BASE_URL}/articles/${slug}`,
    generatedAt: new Date().toISOString()
  });
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function runBuild() {
  console.log("Running npm run build…");
  execSync("npm run build", {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env
  });
}

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("Missing GEMINI_API_KEY.");
    process.exit(1);
  }

  fs.mkdirSync(ARTICLES_DIR, { recursive: true });

  const existingArticles = loadExistingArticles();
  const topic = pickTopic(existingArticles);

  if (!topic) {
    console.log("All topic pool items appear covered. No new article generated.");
    process.exit(0);
  }

  console.log(`Selected topic: ${topic.topic}`);
  console.log(`Existing articles: ${existingArticles.length}`);

  const article = await generateArticlePayload(topic, existingArticles);
  const publishedAt = new Date().toISOString().slice(0, 10);
  const targetPath = writeArticleFile(article, publishedAt);
  writeLastArticleMarker(article.slug);

  console.log(`Wrote ${targetPath}`);
  console.log(`Slug: ${article.slug}`);
  console.log(`Focus keyword: ${article.focusKeyword}`);
  console.log(
    `Secondary keywords: ${article.secondaryKeywords.join(", ") || "n/a"}`
  );
  console.log(`Word count: ${wordCount(article.body.replace(/^#.+$/m, ""))}`);

  runBuild();
  console.log("Build completed successfully.");
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename);

if (isMain) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  });
}
