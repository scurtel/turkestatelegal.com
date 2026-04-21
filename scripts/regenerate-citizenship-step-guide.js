require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const { generateWithGemini, DEFAULT_GEMINI_MODEL } = require("../lib/gemini");
const {
  buildRegenerateCitizenshipPrompt
} = require("./utils/citizenship-by-real-estate-legal-guide-prompt");

async function main() {
  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const prompt = buildRegenerateCitizenshipPrompt();
  const body = await generateWithGemini(prompt, {
    model,
    generationConfig: { maxOutputTokens: 8192, temperature: 0.55 }
  });

  const fm = `---
title: "Turkish Citizenship by Real Estate: Step-by-Step Legal Guide"
slug: turkish-citizenship-by-real-estate-step-by-step-legal-guide
seoTitle: >-
  Turkish Citizenship by Real Estate | Step-by-Step Legal Guide for Foreigners
seoDescription: >-
  A structured legal overview for foreigners: how real estate may connect to Turkish citizenship processes, documentation logic, risks, and when to seek counsel.
excerpt: >-
  Process-focused guidance on citizenship-linked real estate: steps, compliance mindset, and risk awareness without hype.
coverImage: ""
publishedAt: '2026-04-21'
category: "Citizenship by Real Estate"
---
`;

  const target = path.join(
    process.cwd(),
    "content",
    "articles",
    "turkish-citizenship-by-real-estate-step-by-step-legal-guide.md"
  );
  fs.writeFileSync(target, `${fm}\n${body.trim()}\n`, "utf8");
  console.log("Wrote", target);
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
