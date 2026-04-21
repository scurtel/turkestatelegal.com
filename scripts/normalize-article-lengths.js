const fs = require("node:fs");
const path = require("node:path");
const matter = require("gray-matter");
const dotenv = require("dotenv");
const { DEFAULT_GEMINI_MODEL, generateWithGemini } = require("../lib/gemini");

dotenv.config();

const WORD_MIN = 1000;
const WORD_MAX = 1500;

const TARGET_SLUGS = [
  "can-foreigners-buy-property-in-turkey",
  "step-by-step-guide-to-buying-property-in-turkey",
  "legal-checks-before-buying-property-in-turkey",
  "title-deed-transfer-in-turkey-for-foreign-buyers",
  "taxes-and-fees-when-foreigners-buy-property-in-turkey",
  "how-to-avoid-property-fraud-in-turkey",
  "buying-property-in-turkey-with-power-of-attorney",
  "can-buying-property-in-turkey-help-you-get-a-residence-permit",
  "turkish-citizenship-by-investment-through-real-estate",
  "common-mistakes-foreign-buyers-make-when-purchasing-property-in-turkey"
];

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function ensureShape(text, title) {
  const trimmed = text.trim();
  const withH1 = trimmed.startsWith("# ") ? trimmed : `# ${title}\n\n${trimmed}`;
  if (!/##\s*FAQ/i.test(withH1)) {
    return `${withH1}\n\n## FAQ\n\n### Should I verify details independently?\nYes. Always confirm legal and procedural details with qualified local professionals before committing funds.\n\n### Can policies change over time?\nYes. Requirements and implementation can change, so current verification is essential.\n\n### Is this legal advice?\nNo. This content is educational and should be supplemented with professional legal guidance.\n`;
  }
  return withH1;
}

async function rewriteBody(title, sourceBody, model, reason) {
  const prompt = `
Rewrite this markdown article so it is between ${WORD_MIN} and ${WORD_MAX} words.

Rules:
- Audience: foreigners buying property in Turkey.
- Keep tone professional, clear, trustworthy, and natural.
- Keep one H1 with this exact title: "${title}".
- Keep useful H2/H3 sections.
- Keep a "## FAQ" section with at least 3 Q&A pairs.
- End with a short CTA.
- Do not include frontmatter.
- Do not use robotic phrases.

Reason for rewrite: ${reason}

Source article:
${sourceBody}
`;

  const rewritten = await generateWithGemini(prompt, {
    model,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2600
    }
  });

  return ensureShape(rewritten, title);
}

async function forceExpandBody(title, sourceBody, model, currentWords) {
  const prompt = `
Expand this markdown article from ${currentWords} words to between 1050 and 1250 words.

Rules:
- Keep the same title as H1: "${title}".
- Keep the same overall angle and practical value.
- Add useful detail with concise H3 subsections where needed.
- Keep "## FAQ" and short CTA.
- No frontmatter.

Article:
${sourceBody}
`;
  const expanded = await generateWithGemini(prompt, {
    model,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 3000
    }
  });
  return ensureShape(expanded, title);
}

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY in .env");
  }

  const model = process.argv[2] || DEFAULT_GEMINI_MODEL;
  const baseDir = path.join(process.cwd(), "content", "articles");

  for (const slug of TARGET_SLUGS) {
    const filePath = path.join(baseDir, `${slug}.md`);
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = matter(raw);
    const title = parsed.data.title || slug;
    let body = ensureShape(parsed.content, title);
    let words = countWords(body);

    let attempt = 0;
    while ((words < WORD_MIN || words > WORD_MAX) && attempt < 4) {
      attempt += 1;
      const reason =
        words > WORD_MAX
          ? `Too long at ${words} words. Compress while preserving practicality.`
          : `Too short at ${words} words. Add practical detail and examples.`;
      body = await rewriteBody(title, body, model, reason);
      words = countWords(body);
    }

    if (words < WORD_MIN) {
      body = await forceExpandBody(title, body, model, words);
      words = countWords(body);
    }

    if (words < WORD_MIN || words > WORD_MAX) {
      throw new Error(`${slug}.md still out of range at ${words} words.`);
    }

    const frontmatter = matter.stringify(body.trim() + "\n", parsed.data);
    fs.writeFileSync(filePath, frontmatter, "utf8");
    console.log(`Normalized ${slug}.md (${words} words)`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
