/**
 * One-off / repeatable: convert generated-articles/*.md (generator format)
 * into content/articles/*.md (site gray-matter format). Strips internal-link
 * and FAQ JSON-LD appendix sections from the public article body.
 */
const fs = require("node:fs");
const path = require("node:path");
const matter = require("gray-matter");

const ROOT = process.cwd();
const GENERATED_DIR = path.join(ROOT, "generated-articles");
const ARTICLES_DIR = path.join(ROOT, "content", "articles");

const CATEGORY_BY_SLUG = {
  "inheritance-of-foreigners-in-turkey": "Inheritance Law",
  "buying-property-in-turkey-pitfalls": "Buyer Mistakes",
  "off-plan-property-turkey": "Off-Plan Risk",
  "turkish-citizenship-with-real-estate": "Citizenship by Investment",
  "turkey-due-diligence": "Due Diligence",
  "inheriting-property-in-turkey": "Inheritance Law",
  "turkish-citizenship-by-property-purchase": "Citizenship by Investment",
  "off-plan-property-turkey-buyers": "Off-Plan Risk",
  "turkey-citizenship-investment-requirements-lawyer": "Citizenship by Investment"
};

const PUBLISHED_AT = "2026-05-14";

function stripGeneratorAppendix(markdownBody) {
  const marker = "\n## Internal link suggestions";
  const idx = markdownBody.indexOf(marker);
  if (idx === -1) {
    return markdownBody.trim();
  }
  return markdownBody.slice(0, idx).trim();
}

function deriveExcerpt(markdownBody, seoDescription) {
  const lines = markdownBody.split("\n");
  const buf = [];
  let pastH1 = false;
  for (const line of lines) {
    if (line.startsWith("# ")) {
      pastH1 = true;
      continue;
    }
    if (!pastH1) {
      continue;
    }
    if (line.trim() === "") {
      if (buf.length > 0) {
        break;
      }
      continue;
    }
    if (line.startsWith("#")) {
      break;
    }
    buf.push(line.trim());
    if (buf.join(" ").length > 260) {
      break;
    }
  }
  const excerpt = buf.join(" ").trim();
  if (excerpt.length > 40) {
    return excerpt.length > 320 ? `${excerpt.slice(0, 317)}...` : excerpt;
  }
  return seoDescription.length > 320
    ? `${seoDescription.slice(0, 317)}...`
    : seoDescription;
}

function yamlQuote(s) {
  return JSON.stringify(s);
}

function buildSiteFile({ data, body }) {
  const slug = data.slug;
  const seoTitle = data.seoTitle;
  const seoDescription = data.seoDescription;
  const category = CATEGORY_BY_SLUG[slug] || "General Guidance";
  const excerpt = deriveExcerpt(body, seoDescription);

  const front = `---
title: ${yamlQuote(seoTitle)}
slug: ${slug}
seoTitle: ${yamlQuote(seoTitle)}
seoDescription: ${yamlQuote(seoDescription)}
excerpt: ${yamlQuote(excerpt)}
coverImage: ""
publishedAt: '${PUBLISHED_AT}'
category: ${yamlQuote(category)}
---

`;

  return `${front}${body}\n`;
}

function main() {
  if (!fs.existsSync(GENERATED_DIR)) {
    console.error("Missing generated-articles/ directory.");
    process.exit(1);
  }

  if (!fs.existsSync(ARTICLES_DIR)) {
    fs.mkdirSync(ARTICLES_DIR, { recursive: true });
  }

  const names = fs
    .readdirSync(GENERATED_DIR)
    .filter((f) => f.endsWith(".md"));

  let count = 0;
  for (const name of names) {
    const full = path.join(GENERATED_DIR, name);
    const raw = fs.readFileSync(full, "utf8");
    const { data, content } = matter(raw);
    if (!data.slug || !data.seoTitle || !data.seoDescription) {
      console.warn(`Skip (unexpected frontmatter): ${name}`);
      continue;
    }

    const body = stripGeneratorAppendix(content);
    const out = buildSiteFile({ data, body });
    const outPath = path.join(ARTICLES_DIR, name);
    fs.writeFileSync(outPath, out, "utf8");
    console.log(`Published: ${path.relative(ROOT, outPath)}`);
    count += 1;
  }

  console.log(`Done. Wrote ${count} article(s) to content/articles/.`);
}

main();
