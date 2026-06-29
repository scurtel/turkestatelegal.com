#!/usr/bin/env node
/**
 * Instagram draft + carousel generator and optional Graph API publisher.
 * Usage:
 *   node scripts/publish-instagram.mjs              # prepare drafts/images
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
const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const CAPTION_DISCLAIMER =
  "This post is for general information only and does not constitute legal advice.";

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
  return {
    slug,
    data,
    content,
    title: String(data.title || slug),
    excerpt: String(data.excerpt || data.seoDescription || "").trim(),
    category: String(data.category || "General Guidance"),
    articleUrl: `${SITE_BASE_URL}/articles/${slug}`
  };
}

function extractSlideTexts(article) {
  const skip = new Set([
    "FAQ",
    "Related Articles",
    "Conclusion",
    "How Turk Estate Legal Can Help"
  ]);
  const headings = [...article.content.matchAll(/^##\s+(.+)$/gm)]
    .map((match) => match[1].trim())
    .filter((heading) => !skip.has(heading));

  const slides = [
    {
      headline: article.title,
      body: article.excerpt || "Legal guidance for foreign property buyers in Turkey."
    }
  ];

  for (const heading of headings.slice(0, 4)) {
    slides.push({
      headline: heading,
      body: "Practical legal context for foreign buyers and investors."
    });
  }

  slides.push({
    headline: "Read the full article",
    body: "Tap the link in the caption for the complete legal guide."
  });

  return slides.slice(0, 6);
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapLines(text, maxChars = 34, maxLines = 5) {
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

function buildSlideSvg({ headline, body, index, total }) {
  const titleLines = wrapLines(headline, 30, 3);
  const bodyLines = wrapLines(body, 36, 4);
  const titleStartY = 220;
  const bodyStartY = titleStartY + titleLines.length * 58 + 40;

  const titleSvg = titleLines
    .map(
      (line, lineIndex) =>
        `<text x="90" y="${titleStartY + lineIndex * 58}" font-family="Arial, Helvetica, sans-serif" font-size="46" font-weight="700" fill="#f8fafc">${escapeXml(line)}</text>`
    )
    .join("\n");

  const bodySvg = bodyLines
    .map(
      (line, lineIndex) =>
        `<text x="90" y="${bodyStartY + lineIndex * 42}" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#cbd5e1">${escapeXml(line)}</text>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
  <rect width="1080" height="1080" fill="#0f172a"/>
  <rect x="0" y="0" width="1080" height="12" fill="#bea15a"/>
  <text x="90" y="110" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="#bea15a">Turk Estate Legal</text>
  ${titleSvg}
  ${bodySvg}
  <text x="90" y="980" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="#94a3b8">${index} / ${total}</text>
  <text x="990" y="1030" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#bea15a">turkestatelegal.com</text>
</svg>`;
}

async function writeCarouselImages(slug, slides) {
  const outputDir = path.join(PUBLIC_SOCIAL_DIR, slug);
  fs.mkdirSync(outputDir, { recursive: true });

  const imagePaths = [];
  for (let index = 0; index < slides.length; index += 1) {
    const slide = slides[index];
    const svg = buildSlideSvg({
      headline: slide.headline,
      body: slide.body,
      index: index + 1,
      total: slides.length
    });
    const outputPath = path.join(outputDir, `slide-${index + 1}.png`);
    await sharp(Buffer.from(svg)).png().toFile(outputPath);
    imagePaths.push(outputPath);
  }

  return imagePaths;
}

function buildHashtags(category) {
  const base = [
    "#TurkishProperty",
    "#TurkeyRealEstate",
    "#PropertyLawTurkey",
    "#ForeignBuyersTurkey",
    "#TurkEstateLegal",
    "#TitleDeedTurkey",
    "#LegalDueDiligence",
    "#PropertyLawyerTurkey"
  ];

  const categoryMap = {
    "Due Diligence": "#DueDiligence",
    "Payment Safety": "#SafePropertyPayment",
    "Citizenship by Investment": "#TurkishCitizenship",
    "Residence Permit": "#TurkeyResidencePermit",
    "Title Deed": "#TapuTurkey",
    "Fraud Prevention": "#PropertyFraudPrevention"
  };

  const extra = categoryMap[category];
  const tags = extra ? [...base.slice(0, 7), extra] : base.slice(0, 8);
  return tags.join(" ");
}

function buildTemplateCaption(article) {
  const hashtags = buildHashtags(article.category);
  return `${article.title}

${article.excerpt}

Read more: ${article.articleUrl}

${hashtags}

${CAPTION_DISCLAIMER}`;
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

async function generateCaption(article) {
  const prompt = `Write an Instagram caption in English for turkestatelegal.com.

Article title: ${article.title}
Article excerpt: ${article.excerpt}
Article URL: ${article.articleUrl}
Category: ${article.category}

Rules:
- Professional, natural tone for foreign property buyers in Turkey
- 2-4 short paragraphs max
- Include the article URL once
- End with exactly 6-10 relevant hashtags on one line
- End with this disclaimer on its own final line: "${CAPTION_DISCLAIMER}"
- No hype, no guaranteed outcomes, no "best lawyer"
- Return caption text only`;

  const generated = await callGemini(prompt);
  if (!generated) {
    return buildTemplateCaption(article);
  }

  if (!generated.includes(CAPTION_DISCLAIMER)) {
    return `${generated.trim()}\n\n${CAPTION_DISCLAIMER}`;
  }

  return generated.trim();
}

function writeDraftFile(slug, article, caption, slides) {
  const draftPath = path.join(DRAFTS_DIR, `${slug}.md`);
  const slideList = slides
    .map((slide, index) => `${index + 1}. ${slide.headline}`)
    .join("\n");

  const content = `---
slug: ${slug}
articleUrl: ${article.articleUrl}
platform: instagram
account: "@turkestatelegal"
status: draft
---

# Instagram Draft: ${article.title}

## Caption

${caption}

## Carousel Slides

${slideList}

## Image Paths

${slides.map((_, index) => `/social/instagram/${slug}/slide-${index + 1}.png`).join("\n")}
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

async function publishCarouselToInstagram(slug, caption, slideCount, credentials) {
  const childIds = [];

  for (let index = 1; index <= slideCount; index += 1) {
    const imageUrl = `${SITE_BASE_URL}/social/instagram/${slug}/slide-${index}.png`;
    const child = await graphPost(`${credentials.igUserId}/media`, {
      image_url: imageUrl,
      is_carousel_item: "true",
      access_token: credentials.accessToken
    });
    childIds.push(child.id);
    await sleep(1500);
  }

  const carousel = await graphPost(`${credentials.igUserId}/media`, {
    media_type: "CAROUSEL",
    children: childIds.join(","),
    caption,
    access_token: credentials.accessToken
  });

  const published = await graphPost(`${credentials.igUserId}/media_publish`, {
    creation_id: carousel.id,
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

  const slides = extractSlideTexts(article);
  const caption = await generateCaption(article);
  const draftPath = writeDraftFile(slug, article, caption, slides);
  const imagePaths = await writeCarouselImages(slug, slides);

  console.log(`Wrote Instagram draft: ${draftPath}`);
  console.log(`Wrote ${imagePaths.length} carousel images.`);

  const credentials = getCredentials();
  if (!credentials.ready) {
    console.log(
      "Instagram credentials missing. Draft and carousel images generated only."
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
    slideCount: slides.length,
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
      "Instagram credentials missing. Draft and carousel images generated only."
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

  const slideFiles = fs
    .readdirSync(path.join(PUBLIC_SOCIAL_DIR, slug))
    .filter((file) => /^slide-\d+\.png$/.test(file));
  const slideCount = slideFiles.length;

  if (slideCount < 2) {
    throw new Error(`Not enough carousel images for slug: ${slug}`);
  }

  const caption = await generateCaption(article);

  try {
    const instagramPostId = await publishCarouselToInstagram(
      slug,
      caption,
      slideCount,
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
