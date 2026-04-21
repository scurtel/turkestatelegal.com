const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");
const { DEFAULT_GEMINI_MODEL, generateWithGemini } = require("../lib/gemini");
const { pickRandomPlaceholder } = require("./utils/placeholder-images");

dotenv.config();

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function main() {
  const title = process.argv[2];

  if (!title) {
    console.error(
      "Usage: npm run generate:draft -- \"Your article title here\" [optional-model]"
    );
    process.exit(1);
  }

  const model = process.argv[3] || DEFAULT_GEMINI_MODEL;
  const slug = slugify(title);
  const today = new Date().toISOString().slice(0, 10);
  const coverImage = pickRandomPlaceholder();

  const prompt = `
Write a professional, clear, reassuring English article for foreigners who want to buy property in Turkey.
The article must be practical and not robotic.

Topic title: "${title}"

Return only markdown body content (no frontmatter).
Use:
- A short introduction
- 4 to 6 clear section headings
- Helpful bullet points where useful
- A short closing section
`;

  const markdownBody = await generateWithGemini(prompt, { model });

  const article = `---
title: "${title.replace(/"/g, '\\"')}"
slug: ${slug}
seoTitle: "${title.replace(/"/g, '\\"')}"
seoDescription: "Practical legal and process guidance for foreigners buying property in Turkey."
excerpt: "Draft article for review."
coverImage: "${coverImage}"
publishedAt: "${today}"
category: "General Guidance"
---

${markdownBody}
`;

  const outputDir = path.join(process.cwd(), "content", "articles");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `${slug}.md`);
  fs.writeFileSync(outputPath, article, "utf8");

  console.log(`Draft created: ${outputPath}`);
  console.log(`Model used: ${model}`);
  console.log(`Assigned cover image: ${coverImage}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
