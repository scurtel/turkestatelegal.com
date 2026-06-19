/**
 * Optimize seoTitle (50-60 chars) and seoDescription (140-155 chars) via Gemini.
 * Usage: node scripts/optimize-article-meta.js [--all] [--dry-run]
 */
const fs = require("node:fs");
const path = require("node:path");
const matter = require("gray-matter");
require("dotenv").config();
const {
  DEFAULT_GEMINI_MODEL,
  generateWithGeminiWithRetry
} = require("../lib/gemini");

const articlesDir = path.join(process.cwd(), "content", "articles");
const REQUEST_DELAY_MS = Number(process.env.GENERATE_SEO_DELAY_MS || 3500);
const TITLE_MIN = 50;
const TITLE_MAX = 60;
const DESC_MIN = 140;
const DESC_MAX = 155;

const dryRun = process.argv.includes("--dry-run");
const optimizeAll = process.argv.includes("--all");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function needsOptimization(data) {
  const titleLength = (data.seoTitle || "").length;
  const descLength = (data.seoDescription || "").length;
  return (
    titleLength < TITLE_MIN ||
    titleLength > TITLE_MAX ||
    descLength < DESC_MIN ||
    descLength > DESC_MAX
  );
}

function stripBrand(text) {
  return String(text || "")
    .replace(/\s*\|\s*Turk Estate Legal/gi, "")
    .replace(/Turk Estate Legal\s*[-|:]?\s*/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function enforceLength(text, min, max) {
  let value = stripBrand(text).replace(/\s+/g, " ").trim();

  if (value.length > max) {
    while (value.length > max && value.includes(" ")) {
      value = value.slice(0, value.lastIndexOf(" ")).trim();
    }
    if (value.length > max) {
      value = value.slice(0, max).trim();
    }
    value = value.replace(/[,:;\-–—\s]+$/u, "").trim();
  }

  if (value.length < min) {
    const suffixes = [
      " in Turkey",
      " | Legal Guide",
      " for Foreign Buyers",
      " — Legal Guide",
      " for Foreign Property Buyers"
    ];
    for (const suffix of suffixes) {
      const candidate = `${value}${suffix}`;
      if (candidate.length >= min && candidate.length <= max) {
        return candidate;
      }
    }
    const filler = " Practical legal guidance for foreign buyers.";
    value = `${value}${filler}`.replace(/\s+/g, " ").trim();
    if (value.length > max) {
      while (value.length > max && value.includes(" ")) {
        value = value.slice(0, value.lastIndexOf(" ")).trim();
      }
    }
  }

  return value.slice(0, max);
}

function validateMeta(seoTitle, seoDescription) {
  const issues = [];
  const titleLength = seoTitle.length;
  const descLength = seoDescription.length;

  if (titleLength < TITLE_MIN || titleLength > TITLE_MAX) {
    issues.push(`seoTitle length ${titleLength} (want ${TITLE_MIN}-${TITLE_MAX})`);
  }
  if (descLength < DESC_MIN || descLength > DESC_MAX) {
    issues.push(
      `seoDescription length ${descLength} (want ${DESC_MIN}-${DESC_MAX})`
    );
  }
  if (/turk estate legal/i.test(seoTitle)) {
    issues.push("seoTitle must not include brand name");
  }

  return issues;
}

function buildFallbackMeta(article, candidate = {}) {
  const baseTitle =
    candidate.seoTitle ||
    stripBrand(article.seoTitle) ||
    stripBrand(article.title) ||
    article.title;
  const baseDescription =
    candidate.seoDescription ||
    article.seoDescription ||
    article.excerpt ||
    article.content
      .replace(/^#.+$/m, "")
      .replace(/\n+/g, " ")
      .trim()
      .slice(0, 220);

  return {
    seoTitle: enforceLength(baseTitle, TITLE_MIN, TITLE_MAX),
    seoDescription: enforceLength(baseDescription, DESC_MIN, DESC_MAX)
  };
}

function finalizeMeta(seoTitle, seoDescription, article) {
  const normalized = {
    seoTitle: enforceLength(seoTitle, TITLE_MIN, TITLE_MAX),
    seoDescription: enforceLength(seoDescription, DESC_MIN, DESC_MAX)
  };

  if (validateMeta(normalized.seoTitle, normalized.seoDescription).length === 0) {
    return normalized;
  }

  return buildFallbackMeta(article, normalized);
}

function parseJsonResponse(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(raw);
}

function buildPrompt(article, previousIssues) {
  const contentPreview = article.content
    .replace(/^#.+$/m, "")
    .trim()
    .slice(0, 900);

  const retryNote =
    previousIssues.length > 0
      ? `\nPrevious attempt failed validation:\n- ${previousIssues.join("\n- ")}\nFix character counts exactly.\n`
      : "";

  return `You are an SEO editor for Turk Estate Legal, an English-language Turkish property law guide for foreign buyers.

Optimize meta title and meta description for this article.
${retryNote}
Strict rules:
- seoTitle: ${TITLE_MIN}-${TITLE_MAX} characters (count every character)
- seoDescription: ${DESC_MIN}-${DESC_MAX} characters (count every character)
- English only, professional and factual tone
- No hype or sales language (avoid: Unlock, guaranteed, contact us, best deal)
- Do NOT include "Turk Estate Legal" or site name in seoTitle
- Use primary keywords naturally; match search intent

Article H1/title: ${article.title}
Category: ${article.category || "General"}
Slug: ${article.slug}
Current seoTitle (${(article.seoTitle || "").length} chars): ${article.seoTitle || ""}
Current seoDescription (${(article.seoDescription || "").length} chars): ${article.seoDescription || ""}
Excerpt: ${article.excerpt || ""}

Content preview:
${contentPreview}

Return ONLY valid JSON:
{"seoTitle":"...","seoDescription":"..."}`;
}

async function optimizeArticleMeta(article) {
  let previousIssues = [];
  let lastCandidate = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await generateWithGeminiWithRetry(
        buildPrompt(article, previousIssues),
        {
          model: DEFAULT_GEMINI_MODEL,
          generationConfig: {
            temperature: 0.35,
            responseMimeType: "application/json"
          }
        }
      );

      const parsed = parseJsonResponse(response);
      lastCandidate = {
        seoTitle: String(parsed.seoTitle || "").trim(),
        seoDescription: String(parsed.seoDescription || "").trim()
      };
      const finalized = finalizeMeta(
        lastCandidate.seoTitle,
        lastCandidate.seoDescription,
        article
      );
      const issues = validateMeta(finalized.seoTitle, finalized.seoDescription);

      if (issues.length === 0) {
        return finalized;
      }

      previousIssues = issues;
    } catch (error) {
      previousIssues = [
        error instanceof Error ? error.message : String(error)
      ];
    }
  }

  return finalizeMeta(
    lastCandidate?.seoTitle || article.seoTitle || article.title,
    lastCandidate?.seoDescription ||
      article.seoDescription ||
      article.excerpt ||
      "",
    article
  );
}

function loadArticles() {
  return fs
    .readdirSync(articlesDir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const filePath = path.join(articlesDir, file);
      const source = fs.readFileSync(filePath, "utf8");
      const parsed = matter(source);
      return {
        file,
        filePath,
        data: parsed.data,
        content: parsed.content,
        title: parsed.data.title || "",
        slug: parsed.data.slug || file.replace(/\.md$/, ""),
        seoTitle: parsed.data.seoTitle || "",
        seoDescription: parsed.data.seoDescription || "",
        excerpt: parsed.data.excerpt || "",
        category: parsed.data.category || ""
      };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

async function main() {
  const articles = loadArticles();
  const targets = articles.filter((article) =>
    optimizeAll ? true : needsOptimization(article.data)
  );

  console.log(
    `Meta optimization: ${targets.length}/${articles.length} articles to process${
      dryRun ? " (dry run)" : ""
    }`
  );

  let updated = 0;

  for (let index = 0; index < targets.length; index += 1) {
    const article = targets[index];
    console.log(
      `[${index + 1}/${targets.length}] ${article.slug} (title ${article.seoTitle.length}, desc ${article.seoDescription.length})`
    );

    const nextMeta = await optimizeArticleMeta(article);
    console.log(`  -> title ${nextMeta.seoTitle.length}: ${nextMeta.seoTitle}`);
    console.log(
      `  -> desc ${nextMeta.seoDescription.length}: ${nextMeta.seoDescription}`
    );

    if (!dryRun) {
      const nextData = {
        ...article.data,
        seoTitle: nextMeta.seoTitle,
        seoDescription: nextMeta.seoDescription
      };
      const output = matter.stringify(`${article.content.trim()}\n`, nextData);
      fs.writeFileSync(article.filePath, output, "utf8");
      updated += 1;
    }

    if (index < targets.length - 1) {
      await sleep(REQUEST_DELAY_MS);
    }
  }

  console.log(`\nDone. Updated: ${updated}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
