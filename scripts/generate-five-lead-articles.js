/**
 * One-off generator: five English lead articles via Gemini API.
 * Usage: node scripts/generate-five-lead-articles.js
 */
const fs = require("node:fs");
const path = require("node:path");
require("dotenv").config();
const { generateWithGemini, DEFAULT_GEMINI_MODEL } = require("../lib/gemini");
const {
  CITIZENSHIP_EXTRA_PROMPT,
  ANGLE: CITIZENSHIP_ANGLE,
  AVOID_OVERLAP: CITIZENSHIP_AVOID_OVERLAP
} = require("./utils/citizenship-by-real-estate-legal-guide-prompt");

const today = "2026-04-21";
const outDir = path.join(process.cwd(), "content", "articles");

const articles = [
  {
    file: "turkish-citizenship-by-real-estate-step-by-step-legal-guide.md",
    frontmatter: {
      title: "Turkish Citizenship by Real Estate: Step-by-Step Legal Guide",
      slug: "turkish-citizenship-by-real-estate-step-by-step-legal-guide",
      seoTitle:
        "Turkish Citizenship by Real Estate | Step-by-Step Legal Guide for Foreigners",
      seoDescription:
        "A structured legal overview for foreigners: how real estate may connect to Turkish citizenship processes, documentation logic, risks, and when to seek counsel.",
      excerpt:
        "Process-focused guidance on citizenship-linked real estate: steps, compliance mindset, and risk awareness without hype.",
      category: "Citizenship by Real Estate"
    },
    angle: CITIZENSHIP_ANGLE,
    mustLink: [
      "/articles/turkish-citizenship-by-investment-through-real-estate",
      "/articles/can-foreigners-buy-property-in-turkey",
      "/articles/legal-checks-before-buying-property-in-turkey"
    ],
    avoidOverlap: CITIZENSHIP_AVOID_OVERLAP,
    temperature: 0.55,
    extraPrompt: CITIZENSHIP_EXTRA_PROMPT
  },
  {
    file: "how-to-get-a-residence-permit-by-buying-property-in-turkey.md",
    frontmatter: {
      title: "How to Get a Residence Permit by Buying Property in Turkey",
      slug: "how-to-get-a-residence-permit-by-buying-property-in-turkey",
      seoTitle:
        "Residence Permit in Turkey Through Property | Foreign Buyer Guide",
      seoDescription:
        "How property ownership may relate to residence permit applications in Turkey: practical steps, documentation mindset, and where legal support helps.",
      excerpt:
        "A residence-first guide for foreign buyers: realistic expectations, preparation, and cautious wording around approvals.",
      category: "Residence Permit"
    },
    angle: `PRIMARY ANGLE: RESIDENCE permit pathway tied to property—practical steps, what ownership may support, documentation habits, where lawyers help. MUST stay separate from citizenship: do not merge CBI into this narrative beyond a brief cross-reference if needed.`,
    mustLink: [
      "/articles/can-buying-property-in-turkey-help-you-get-a-residence-permit",
      "/articles/step-by-step-guide-to-buying-property-in-turkey",
      "/articles/taxes-and-fees-when-foreigners-buy-property-in-turkey"
    ],
    avoidOverlap: `This is NOT the citizenship article. No CBI thresholds.`
  },
  {
    file: "property-due-diligence-in-turkey-for-foreign-buyers.md",
    frontmatter: {
      title: "Property Due Diligence in Turkey for Foreign Buyers",
      slug: "property-due-diligence-in-turkey-for-foreign-buyers",
      seoTitle:
        "Property Due Diligence in Turkey | Foreign Buyer Checklist & Safety",
      seoDescription:
        "High-intent due diligence for foreigners buying in Turkey: title checks, debts, restrictions, project status, and safer payments.",
      excerpt:
        "Transaction-safety focused verification: what to confirm before you pay, and how to reduce legal and financial exposure.",
      category: "Due Diligence"
    },
    angle: `PRIMARY ANGLE: TRANSACTION SAFETY and verification workflow—title deed, ownership chain, debts/charges, restrictions, off-plan/project status, payment discipline. Practical and calm.`,
    mustLink: [
      "/articles/legal-checks-before-buying-property-in-turkey",
      "/articles/how-to-verify-a-turkish-property-before-payment",
      "/articles/how-to-avoid-property-fraud-in-turkey"
    ],
    avoidOverlap: `Not a repeat of generic "tips" only—make it explicitly about due diligence sequencing and evidence.`
  },
  {
    file: "buying-property-in-turkey-remotely-with-power-of-attorney.md",
    frontmatter: {
      title: "Buying Property in Turkey Remotely with Power of Attorney",
      slug: "buying-property-in-turkey-remotely-with-power-of-attorney",
      seoTitle:
        "Buying Property in Turkey Remotely | Power of Attorney Safeguards",
      seoDescription:
        "Remote purchases in Turkey using power of attorney: scope, documents, verification, and how foreign buyers reduce risk when not on site.",
      excerpt:
        "Remote execution mechanics: POA scope, controls, communication, and closing safely from abroad.",
      category: "Remote Purchase"
    },
    angle: `PRIMARY ANGLE: REMOTE purchase mechanics with POA—what the instrument should cover, limits, notarisation mindset, monitoring transfers, verification cadence, red flags. Complement (do not copy) the existing POA article: emphasise distance, governance, and safeguards.`,
    mustLink: [
      "/articles/buying-property-in-turkey-with-power-of-attorney",
      "/articles/how-to-verify-a-turkish-property-before-payment",
      "/articles/title-deed-transfer-in-turkey-for-foreign-buyers"
    ],
    avoidOverlap: `Explicitly written for buyers who will NOT be physically present for key steps; different emphasis from a general POA overview.`
  },
  {
    file: "title-deed-problems-in-turkey-foreign-buyer-mistakes.md",
    frontmatter: {
      title:
        "Title Deed Problems in Turkey: How Foreign Buyers Can Avoid Costly Mistakes",
      slug: "title-deed-problems-in-turkey-foreign-buyer-mistakes",
      seoTitle:
        "Title Deed Problems in Turkey | Foreign Buyer Risk Prevention",
      seoDescription:
        "Common title deed pitfalls for foreigners in Turkey: misunderstandings, hidden issues, and how to reduce exposure before closing.",
      excerpt:
        "Problem-prevention focus: spotting deed-related risks early and keeping the transfer path under control.",
      category: "Title Deed"
    },
    angle: `PRIMARY ANGLE: RISK PREVENTION around TAPU/title—mis-matches, annotations, representation issues, registration misunderstandings, hidden restrictions. NOT a procedural "how transfer works" tutorial alone—pair prevention with pointers to process where useful.`,
    mustLink: [
      "/articles/title-deed-transfer-in-turkey-for-foreign-buyers",
      "/articles/legal-checks-before-buying-property-in-turkey",
      "/articles/common-mistakes-foreign-buyers-make-when-purchasing-property-in-turkey"
    ],
    avoidOverlap: `Different from a neutral transfer walkthrough: foreground mistakes and issue-spotting.`
  }
];

function buildPrompt(spec) {
  const links = spec.mustLink
    .map((href) => `- In the body, naturally link at least once to ${href} using readable anchor text (markdown link format).`)
    .join("\n");

  const extra =
    typeof spec.extraPrompt === "string" && spec.extraPrompt.trim()
      ? `\nARTICLE-SPECIFIC MANDATORY CONSTRAINTS:\n${spec.extraPrompt.trim()}\n`
      : "";

  const h1Rule = spec.extraPrompt
    ? `1) Follow "ARTICLE-SPECIFIC MANDATORY CONSTRAINTS" exactly for the first heading (including any required H1 text).`
    : `1) Start with a single H1 line matching the article title conceptually (clear, human title).`;

  return `You are writing for turkestatelegal.com.

AUDIENCE: Foreigners only. English only.
SITE FOCUS: Buying property in Turkey with legal and practical guidance.
TONE: Professional, trustworthy, clear, reassuring, elegant but direct. Strong commercial potential (lead generation) through usefulness and credibility—NOT aggressive sales, NOT spammy investor hype, NOT robotic "AI" voice.

STRICT RULES:
- Do NOT state specific legal thresholds, government fees, taxes, processing times, or approval outcomes as guaranteed facts. Use cautious phrasing: rules can change; outcomes depend on the file; verify with qualified professionals.
- No keyword stuffing. No generic filler phrases ("in today's world", "delve", "landscape", "robust", "unlock").
- No fake certainty.
- In every markdown link, use exact lowercase slug paths (example: /articles/can-foreigners-buy-property-in-turkey). Never use a capital "Turkey" inside the slug segment.

${spec.angle}
${spec.avoidOverlap}
${extra}

STRUCTURE (markdown body ONLY — no YAML frontmatter):
${h1Rule}
2) Strong introduction (2–4 short paragraphs).
3) Multiple H2 sections with H3 where helpful (main educational content before the FAQ).
4) FAQ section with H2 heading "FAQ" and several ### question headings with answers.
5) After the FAQ, add a short CTA paragraph inviting the reader to seek tailored legal guidance (professional, warm, not pushy).
6) After the CTA, add "## Related Articles" with 3 bullet markdown links. If "ARTICLE-SPECIFIC MANDATORY CONSTRAINTS" lists exact Related Articles links, use those exactly. Otherwise pick from:
   /articles/step-by-step-guide-to-buying-property-in-turkey
   /articles/can-foreigners-buy-property-in-turkey
   /articles/taxes-and-fees-when-foreigners-buy-property-in-turkey

LENGTH: About 1,100 to 1,600 words total (body only).

INTERNAL LINKS (required):
${links}

Return ONLY the article markdown body. Do not wrap in code fences.`;
}

function yamlString(value) {
  if (value.includes("\n") || value.length > 70) {
    return `>-\n  ${value.replace(/\n/g, "\n  ")}`;
  }
  return JSON.stringify(value);
}

function writeArticle(spec, body) {
  const fm = spec.frontmatter;
  const header = `---
title: ${yamlString(fm.title)}
slug: ${fm.slug}
seoTitle: ${yamlString(fm.seoTitle)}
seoDescription: ${yamlString(fm.seoDescription)}
excerpt: ${yamlString(fm.excerpt)}
coverImage: ""
publishedAt: '${today}'
category: ${JSON.stringify(fm.category)}
---
`;
  const trimmed = body.trim();
  const content = `${header}\n${trimmed}\n`;
  const target = path.join(outDir, spec.file);
  fs.writeFileSync(target, content, "utf8");
  return target;
}

async function main() {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  for (const spec of articles) {
    process.stdout.write(`Generating: ${spec.file} ...\n`);
    const prompt = buildPrompt(spec);
    const body = await generateWithGemini(prompt, {
      model,
      generationConfig: {
        maxOutputTokens: 8192,
        temperature:
          typeof spec.temperature === "number" ? spec.temperature : 0.65
      }
    });
    const out = writeArticle(spec, body);
    process.stdout.write(`Wrote ${out}\n`);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}
