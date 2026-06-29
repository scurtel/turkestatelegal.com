#!/usr/bin/env node
/**
 * Instagram draft + single post image generator and optional Graph API publisher.
 * Usage:
 *   node scripts/publish-instagram.mjs              # prepare draft + post.png
 *   node scripts/publish-instagram.mjs --publish-only
 *   node scripts/publish-instagram.mjs --slug=my-article
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const ROOT = process.cwd();
const ARTICLES_DIR = path.join(ROOT, "content", "articles");
const DRAFTS_DIR = path.join(ROOT, "social-drafts", "instagram");
const PUBLIC_SOCIAL_DIR = path.join(ROOT, "public", "social", "instagram");
const HISTORY_PATH = path.join(DRAFTS_DIR, "history.json");
const LAST_ARTICLE_PATH = path.join(DRAFTS_DIR, "last-article.json");
const GRAPH_API_VERSION = "v21.0";
const SITE_BASE_URL = (
  process.env.SITE_BASE_URL || "https://turkestatelegal.com"
).replace(/\/$/, "");
const SITE_NAME = "Turk Estate Legal";
const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const IMAGE_MODEL =
  process.env.GEMINI_IMAGE_MODEL || "gemini-2.0-flash-preview-image-generation";
const USE_GEMINI_IMAGES = process.env.USE_GEMINI_IMAGES === "true";
const POST_IMAGE_NAME = "post.png";
const POST_SIZE = 1080;

const args = process.argv.slice(2);
const publishOnly = args.includes("--publish-only");
const slugArg = args.find((arg) => arg.startsWith("--slug="))?.split("=")[1];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function loadHistory() {
  return readJson(HISTORY_PATH, { entries: [] });
}

function saveHistory(history) {
  writeJson(HISTORY_PATH, history);
}

function historyHasSlug(history, slug) {
  return history.entries.some((entry) => entry.slug === slug);
}

function upsertHistoryEntry(history, entry) {
  const next = history.entries.filter((item) => item.slug !== entry.slug);
  next.push(entry);
  history.entries = next;
  saveHistory(history);
}

function getCredentials() {
  const igUserId = process.env.IG_USER_ID?.trim();
  const accessToken = process.env.IG_ACCESS_TOKEN?.trim();
  return {
    igUserId: igUserId || "",
    accessToken: accessToken || "",
    ready: Boolean(igUserId && accessToken)
  };
}

function getSiteDomain() {
  try {
    return new URL(SITE_BASE_URL).hostname.replace(/^www\./i, "");
  } catch {
    return "turkestatelegal.com";
  }
}

function buildArticleUrl(slug) {
  return `${SITE_BASE_URL}/articles/${slug}`;
}

function resolveSlug() {
  if (slugArg) {
    return slugArg.trim();
  }

  const last = readJson(LAST_ARTICLE_PATH, null);
  if (last?.slug) {
    return last.slug;
  }

  if (!fs.existsSync(ARTICLES_DIR)) {
    return null;
  }

  const files = fs
    .readdirSync(ARTICLES_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const filePath = path.join(ARTICLES_DIR, file);
      const stat = fs.statSync(filePath);
      return { slug: file.replace(/\.md$/, ""), mtime: stat.mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);

  return files[0]?.slug ?? null;
}

function loadArticle(slug) {
  const filePath = path.join(ARTICLES_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const source = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(source);
  const siteDomain = getSiteDomain();

  return {
    slug,
    data,
    content,
    title: String(data.title || slug),
    excerpt: String(data.excerpt || data.seoDescription || "").trim(),
    category: String(data.category || "General Guidance"),
    focusKeyword: String(data.focusKeyword || "").trim(),
    articleUrl: buildArticleUrl(slug),
    siteName: SITE_NAME,
    siteDomain
  };
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapLines(text, maxChars = 38, maxLines = 4) {
  const words = String(text || "").replace(/\s+/g, " ").trim().split(" ");
  const lines = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) {
        lines.push(current);
      }
      current = word;
      if (lines.length >= maxLines) {
        break;
      }
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  return lines.slice(0, maxLines);
}

function buildImagePrompt(article) {
  const summary =
    article.excerpt ||
    "Legal guidance for foreign property buyers and investors in Turkey.";

  return `Create a single square Instagram post image for ${article.siteName}.
Topic:
${article.title}
Short summary:
${summary}
Design requirements:
- Create one single Instagram post image, not a carousel.
- Square format, 1080x1080.
- Professional legal / real estate brand style.
- Clean, minimal, trustworthy, premium.
- Large readable headline.
- 2-4 lines of supporting text.
- Show the site domain: ${article.siteDomain}
- Add a subtle CTA such as "Read more at ${article.siteDomain}"
- Do not include hashtags inside the image.
- Do not include the full long article URL inside the image.
- No people, no fake lawyer photos, no cluttered background.
- Make the design suitable for Instagram posting.`;
}

function buildPostSvg(article) {
  const titleLines = wrapLines(article.title, 32, 3);
  const bodyLines = wrapLines(
    article.excerpt ||
      "Practical legal guidance for foreign buyers and investors in Turkey.",
    40,
    4
  );
  const titleStartY = 250;
  const bodyStartY = titleStartY + titleLines.length * 62 + 36;

  const titleSvg = titleLines
    .map(
      (line, lineIndex) =>
        `<text x="90" y="${titleStartY + lineIndex * 62}" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="700" fill="#f8fafc">${escapeXml(line)}</text>`
    )
    .join("\n");

  const bodySvg = bodyLines
    .map(
      (line, lineIndex) =>
        `<text x="90" y="${bodyStartY + lineIndex * 44}" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#cbd5e1">${escapeXml(line)}</text>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${POST_SIZE}" height="${POST_SIZE}" viewBox="0 0 ${POST_SIZE} ${POST_SIZE}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${POST_SIZE}" height="${POST_SIZE}" fill="#0f172a"/>
  <rect x="0" y="0" width="${POST_SIZE}" height="10" fill="#bea15a"/>
  <rect x="70" y="860" width="940" height="2" fill="#334155" opacity="0.6"/>
  <text x="90" y="120" font-family="Arial, Helvetica, sans-serif" font-size="26" letter-spacing="2" fill="#bea15a">${escapeXml(article.siteName.toUpperCase())}</text>
  ${titleSvg}
  ${bodySvg}
  <text x="90" y="940" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="#94a3b8">Read more at</text>
  <text x="90" y="990" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" fill="#bea15a">${escapeXml(article.siteDomain)}</text>
</svg>`;
}

async function writeSvgPostImage(outputPath, article) {
  const svg = buildPostSvg(article);
  await sharp(Buffer.from(svg)).png().toFile(outputPath);
}

async function tryGenerateGeminiImage(imagePrompt, outputPath) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !USE_GEMINI_IMAGES) {
    return false;
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent?key=${apiKey}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: imagePrompt }] }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] }
    })
  });

  if (!response.ok) {
    console.warn("Gemini image generation failed; using SVG post image.");
    return false;
  }

  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((part) => part.inlineData?.data);

  if (!imagePart?.inlineData?.data) {
    console.warn("Gemini returned no image data; using SVG post image.");
    return false;
  }

  const buffer = Buffer.from(imagePart.inlineData.data, "base64");
  await sharp(buffer).resize(POST_SIZE, POST_SIZE, { fit: "cover" }).png().toFile(outputPath);
  return true;
}

async function generateSingleInstagramPost(article) {
  const outputDir = path.join(PUBLIC_SOCIAL_DIR, article.slug);
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, POST_IMAGE_NAME);
  const imagePrompt = buildImagePrompt(article);

  const usedGemini = await tryGenerateGeminiImage(imagePrompt, outputPath);
  if (!usedGemini) {
    await writeSvgPostImage(outputPath, article);
  }

  return {
    outputPath,
    publicPath: `/social/instagram/${article.slug}/${POST_IMAGE_NAME}`,
    imagePrompt,
    source: usedGemini ? "gemini" : "svg"
  };
}

function pickHashtagCandidates(article) {
  const text = `${article.title} ${article.excerpt} ${article.category} ${article.focusKeyword}`.toLowerCase();
  const candidates = [];

  const rules = [
    {
      test: /citizenship|passport|nationality/,
      tags: ["#TurkishCitizenship", "#CitizenshipByInvestment", "#TurkeyPassport"]
    },
    {
      test: /residence|residency|permit/,
      tags: ["#TurkeyResidencePermit", "#ExpatLifeTurkey", "#LivingInTurkey"]
    },
    {
      test: /rent|rental|tenant|lease/,
      tags: ["#TurkeyRentalIncome", "#PropertyInvestment", "#RentalPropertyTurkey"]
    },
    {
      test: /escrow|payment|deposit|transfer/,
      tags: ["#SafePropertyPayment", "#PropertyEscrow", "#ForeignBuyerTurkey"]
    },
    {
      test: /tapu|title deed|ownership/,
      tags: ["#TapuTurkey", "#TitleDeedTurkey", "#PropertyOwnership"]
    },
    {
      test: /due diligence|contract|legal review/,
      tags: ["#LegalDueDiligence", "#PropertyLawTurkey", "#RealEstateLaw"]
    },
    {
      test: /fraud|scam|risk/,
      tags: ["#PropertyFraudPrevention", "#BuyerProtection", "#RealEstateSafety"]
    },
    {
      test: /foreign|international|expat/,
      tags: ["#ForeignBuyersTurkey", "#InternationalInvestors", "#TurkeyRealEstate"]
    }
  ];

  for (const rule of rules) {
    if (rule.test.test(text)) {
      candidates.push(...rule.tags);
    }
  }

  const categoryMap = {
    "Due Diligence": "#DueDiligence",
    "Payment Safety": "#SafePropertyPayment",
    "Citizenship by Investment": "#TurkishCitizenship",
    "Residence Permit": "#TurkeyResidencePermit",
    "Title Deed": "#TapuTurkey",
    "Fraud Prevention": "#PropertyFraudPrevention"
  };

  const categoryTag = categoryMap[article.category];
  if (categoryTag) {
    candidates.unshift(categoryTag);
  }

  const defaults = [
    "#TurkishProperty",
    "#TurkeyRealEstate",
    "#PropertyLawTurkey",
    "#TurkEstateLegal",
    "#ForeignBuyersTurkey"
  ];

  const unique = [];
  for (const tag of [...candidates, ...defaults]) {
    const normalized = tag.startsWith("#") ? tag : `#${tag}`;
    if (!unique.includes(normalized)) {
      unique.push(normalized);
    }
    if (unique.length >= 5) {
      break;
    }
  }

  return unique.slice(0, 5);
}

function buildInstagramHashtags(article) {
  const tags = pickHashtagCandidates(article);
  while (tags.length < 4) {
    tags.push("#TurkishProperty");
    if (tags.length >= 4) {
      break;
    }
  }
  return tags.slice(0, 5).join(" ");
}

function buildInstagramCaption(article, summary, hashtags) {
  const intro =
    summary ||
    article.excerpt ||
    "New legal guidance for foreign property buyers in Turkey.";

  return `${intro.trim()}

Read the full article:
${article.articleUrl}

${hashtags}`;
}

function buildTemplateCaption(article) {
  const hashtags = buildInstagramHashtags(article);
  return buildInstagramCaption(article, article.excerpt, hashtags);
}

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent?key=${apiKey}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.5, maxOutputTokens: 1024 }
    })
  });

  if (!response.ok) {
    console.warn("Gemini caption generation failed; using template caption.");
    return null;
  }

  const data = await response.json();
  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim() || "";

  return text || null;
}

function extractHashtagsFromText(text) {
  const matches = text.match(/#[A-Za-z0-9_]+/g) || [];
  return [...new Set(matches)].slice(0, 5);
}

async function generateCaption(article) {
  const fallbackHashtags = buildInstagramHashtags(article);

  const prompt = `Write an Instagram caption intro in English for ${article.siteName}.

Article title: ${article.title}
Article excerpt: ${article.excerpt}
Article URL: ${article.articleUrl}
Category: ${article.category}

Rules:
- Return ONLY the short intro/summary paragraph (2-3 sentences max).
- Professional, natural tone for foreign property buyers in Turkey.
- Do NOT include the article URL.
- Do NOT include hashtags.
- Do NOT include "Read the full article".
- No hype, no guaranteed outcomes, no "best lawyer".`;

  const generatedIntro = await callGemini(prompt);
  const intro =
    generatedIntro?.trim() ||
    article.excerpt ||
    "New legal guidance for foreign property buyers in Turkey.";

  let hashtags = fallbackHashtags;
  const hashtagPrompt = `Suggest exactly 5 relevant Instagram hashtags for this article.

Title: ${article.title}
Excerpt: ${article.excerpt}
Category: ${article.category}

Rules:
- Return ONLY 5 hashtags on one line, separated by spaces.
- Relevant to Turkish property law and foreign buyers.
- Not spammy, no banned tags.
- Include #TurkEstateLegal if appropriate.`;

  const generatedTags = await callGemini(hashtagPrompt);
  const parsedTags = extractHashtagsFromText(generatedTags || "");
  if (parsedTags.length >= 4) {
    hashtags = parsedTags.slice(0, 5).join(" ");
  }

  return buildInstagramCaption(article, intro, hashtags);
}

function writeDraftFile(slug, article, caption, postMeta) {
  const draftPath = path.join(DRAFTS_DIR, `${slug}.md`);

  const content = `---
slug: ${slug}
articleUrl: ${article.articleUrl}
platform: instagram
format: single-post
account: "@turkestatelegal"
status: draft
---

# Instagram Draft: ${article.title}

## Caption

${caption}

## Image Prompt

${postMeta.imagePrompt}

## Image Path

/social/instagram/${slug}/${POST_IMAGE_NAME}

## Image Source

${postMeta.source}
`;

  fs.mkdirSync(DRAFTS_DIR, { recursive: true });
  fs.writeFileSync(draftPath, content, "utf8");
  return draftPath;
}

async function graphPost(endpoint, params) {
  const body = new URLSearchParams(params);
  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${endpoint}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    }
  );

  const data = await response.json();
  if (!response.ok) {
    const message = data?.error?.message || `Graph API error ${response.status}`;
    throw new Error(message);
  }

  return data;
}

async function publishSingleImageToInstagram(slug, caption, credentials) {
  const imageUrl = `${SITE_BASE_URL}/social/instagram/${slug}/${POST_IMAGE_NAME}`;
  const container = await graphPost(`${credentials.igUserId}/media`, {
    image_url: imageUrl,
    caption,
    access_token: credentials.accessToken
  });

  await sleep(1500);

  const published = await graphPost(`${credentials.igUserId}/media_publish`, {
    creation_id: container.id,
    access_token: credentials.accessToken
  });

  return published.id;
}

async function prepareInstagramContent(slug) {
  const history = loadHistory();
  if (historyHasSlug(history, slug)) {
    console.log(`Slug already processed for Instagram: ${slug}`);
    return { skipped: true, slug };
  }

  const article = loadArticle(slug);
  if (!article) {
    throw new Error(`Article not found for slug: ${slug}`);
  }

  const caption = await generateCaption(article);
  const postMeta = await generateSingleInstagramPost(article);
  const draftPath = writeDraftFile(slug, article, caption, postMeta);

  console.log(`Wrote Instagram draft: ${draftPath}`);
  console.log(`Wrote single post image: ${postMeta.outputPath}`);
  console.log(`Article URL: ${article.articleUrl}`);

  const credentials = getCredentials();
  if (!credentials.ready) {
    console.log(
      "Instagram credentials missing. Draft and post image generated only."
    );
    upsertHistoryEntry(history, {
      slug,
      articleUrl: article.articleUrl,
      status: "draft_only",
      reason: "missing_instagram_credentials",
      preparedAt: new Date().toISOString()
    });
    return { slug, articleUrl: article.articleUrl, status: "draft_only" };
  }

  upsertHistoryEntry(history, {
    slug,
    articleUrl: article.articleUrl,
    status: "pending_publish",
    preparedAt: new Date().toISOString()
  });

  return {
    slug,
    articleUrl: article.articleUrl,
    caption,
    status: "pending_publish"
  };
}

async function publishPreparedInstagram(slug) {
  const history = loadHistory();
  const entry = history.entries.find((item) => item.slug === slug);
  const article = loadArticle(slug);

  if (!article) {
    throw new Error(`Article not found for slug: ${slug}`);
  }

  if (entry?.status === "published") {
    console.log(`Instagram post already published for slug: ${slug}`);
    return { skipped: true, slug, status: "published" };
  }

  const credentials = getCredentials();
  if (!credentials.ready) {
    console.log(
      "Instagram credentials missing. Draft and post image generated only."
    );
    upsertHistoryEntry(history, {
      slug,
      articleUrl: article.articleUrl,
      status: "draft_only",
      reason: "missing_instagram_credentials",
      preparedAt: entry?.preparedAt || new Date().toISOString()
    });
    return { slug, status: "draft_only" };
  }

  const draftPath = path.join(DRAFTS_DIR, `${slug}.md`);
  if (!fs.existsSync(draftPath)) {
    throw new Error(`Instagram draft missing for slug: ${slug}`);
  }

  const postImagePath = path.join(PUBLIC_SOCIAL_DIR, slug, POST_IMAGE_NAME);
  if (!fs.existsSync(postImagePath)) {
    throw new Error(`Instagram post image missing for slug: ${slug}`);
  }

  const caption = await generateCaption(article);

  try {
    const instagramPostId = await publishSingleImageToInstagram(
      slug,
      caption,
      credentials
    );

    upsertHistoryEntry(history, {
      slug,
      articleUrl: article.articleUrl,
      instagramPostId,
      publishedAt: new Date().toISOString(),
      status: "published"
    });

    console.log(`Instagram published. Post ID: ${instagramPostId}`);
    return { slug, status: "published", instagramPostId };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Instagram publish failed: ${message}`);
    upsertHistoryEntry(history, {
      slug,
      articleUrl: article.articleUrl,
      status: "draft_only",
      reason: "publish_failed",
      error: message,
      preparedAt: entry?.preparedAt || new Date().toISOString()
    });
    return { slug, status: "draft_only", reason: "publish_failed" };
  }
}

async function main() {
  const slug = resolveSlug();
  if (!slug) {
    console.log("No article slug found for Instagram processing.");
    process.exit(0);
  }

  if (publishOnly) {
    await publishPreparedInstagram(slug);
    process.exit(0);
  }

  const prepared = await prepareInstagramContent(slug);
  if (prepared.skipped) {
    process.exit(0);
  }

  process.exit(0);
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

export {
  buildArticleUrl,
  buildImagePrompt,
  buildInstagramCaption,
  buildInstagramHashtags,
  generateSingleInstagramPost,
  getSiteDomain
};
