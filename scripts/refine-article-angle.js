const fs = require("node:fs");
const path = require("node:path");
const matter = require("gray-matter");
const dotenv = require("dotenv");
const { DEFAULT_GEMINI_MODEL, generateWithGemini } = require("../lib/gemini");

dotenv.config();

const WORD_MIN = 1000;
const WORD_MAX = 1500;

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

async function main() {
  const slug = process.argv[2];
  const focus = process.argv.slice(3).join(" ");
  if (!slug || !focus) {
    console.error(
      "Usage: node scripts/refine-article-angle.js <slug> \"focus instructions\""
    );
    process.exit(1);
  }

  const model = DEFAULT_GEMINI_MODEL;
  const filePath = path.join(process.cwd(), "content", "articles", `${slug}.md`);
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = matter(raw);
  const title = parsed.data.title || slug;

  const prompt = `
Rewrite the markdown article below and keep it between ${WORD_MIN} and ${WORD_MAX} words.

Requirements:
- Keep H1 exactly: "${title}"
- Keep tone professional, trustworthy, natural, and written for foreigners only.
- Keep "## FAQ" with at least 3 Q&A pairs.
- End with a short CTA.
- Keep frontmatter out of the output.
- New focus direction: ${focus}
- Reduce overlap with general legal due diligence language unless strictly needed.

Article:
${parsed.content}
`;

  let body = "";
  let words = 0;
  let workingPrompt = `${prompt}\n\nLength target reminder: 1100-1300 words.`;
  for (let i = 0; i < 4; i += 1) {
    const rewritten = await generateWithGemini(workingPrompt, {
      model,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 3000
      }
    });
    body = rewritten.trim().startsWith("# ")
      ? rewritten.trim()
      : `# ${title}\n\n${rewritten.trim()}`;
    words = countWords(body);
    if (words >= WORD_MIN && words <= WORD_MAX) {
      break;
    }
    workingPrompt = `${prompt}\n\nPrevious attempt was ${words} words. Regenerate full article at 1100-1300 words.`;
  }

  if (words < WORD_MIN || words > WORD_MAX) {
    throw new Error(`Rewritten article is ${words} words after retries.`);
  }

  const next = matter.stringify(`${body}\n`, parsed.data);
  fs.writeFileSync(filePath, next, "utf8");
  console.log(`Refined ${slug}.md (${words} words)`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
