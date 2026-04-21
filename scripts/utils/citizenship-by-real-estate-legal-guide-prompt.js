/**
 * Single source of truth for Gemini prompts:
 * "Turkish Citizenship by Real Estate: Step-by-Step Legal Guide"
 *
 * Used by:
 * - scripts/generate-five-lead-articles.js (extraPrompt on first article)
 * - scripts/regenerate-citizenship-step-guide.js (full body prompt)
 */

const ANGLE = `PRIMARY ANGLE: Practical LEGAL PROCESS guide—structured steps, documentation logic, common risks, why qualified legal guidance matters. NOT marketing hype. Do not state investment amounts, thresholds, timelines, or approval guarantees as facts—say they can change and depend on official rules and the individual file. Clearly distinguish this from a generic "why Turkey" pitch.`;

const AVOID_OVERLAP = `Do not duplicate the existing "Turkish Citizenship by Investment Through Real Estate" article tone or structure; this piece is a step-by-step LEGAL guide with risk awareness.`;

/** Injected into generate-five-lead-articles.js `buildPrompt` under ARTICLE-SPECIFIC MANDATORY CONSTRAINTS */
const CITIZENSHIP_EXTRA_PROMPT = `CITIZENSHIP ARTICLE — NON-NEGOTIABLE (failure = unusable draft):

1) H1 LINE: Your FIRST markdown heading must be EXACTLY this line (character-for-character, including spacing and colon):
# Turkish Citizenship by Real Estate: Step-by-Step Legal Guide

2) SUBJECT LOCK: The entire article must be about Turkish citizenship in connection with REAL ESTATE from a LEGAL PROCEDURE and RISK-AWARENESS perspective. Every major section must tie back to citizenship application logic, documentation bundles, or common filing risks.

3) FORBIDDEN CONTENT (do not drift):
- Do NOT write a general "how to buy property in Turkey" primer as the main story (no long walkthrough of routine Tapu office steps, generic foreign-buyer eligibility essays, or purchase tourism).
- At most ONE short paragraph may mention routine title transfer mechanics, and ONLY if directly tied to a citizenship-compliance point (evidence, declarations, consistency with the immigration file).

4) DISTINCTION YOU MUST PRESERVE:
- Explain why clean real estate work is necessary but NOT sufficient for immigration approval.
- Separate "property market attractiveness" from "program/file compliance".

5) INTERNAL LINKS — EXACT PATHS (copy literally; slugs are always lowercase):
- [Turkish Citizenship by Investment Through Real Estate](/articles/turkish-citizenship-by-investment-through-real-estate)
- [can foreigners buy property in Turkey](/articles/can-foreigners-buy-property-in-turkey)
- [legal checks before buying property in Turkey](/articles/legal-checks-before-buying-property-in-turkey)
Never write "/articles/...-Turkey" with a capital T in the slug.

6) STEP FRAMING: Use clear step-style H2 headings (e.g. "Step 1 …") for responsible planning—not a sales funnel.

7) RELATED ARTICLES (after CTA): use exactly these three bullets with readable anchor text:
- [Step-by-step guide to buying property in Turkey](/articles/step-by-step-guide-to-buying-property-in-turkey)
- [Title deed transfer in Turkey for foreign buyers](/articles/title-deed-transfer-in-turkey-for-foreign-buyers)
- [How to verify a Turkish property before payment](/articles/how-to-verify-a-turkish-property-before-payment)

8) FAQ headings must be valid markdown: exactly one "### " prefix per question (three hash marks, then a space), never duplicated like "### ###".`;

function buildRegenerateCitizenshipPrompt() {
  return `You are writing for turkestatelegal.com.

AUDIENCE: Foreigners only. English only.
SITE FOCUS: Buying property in Turkey with legal and practical guidance.
TONE: Professional, trustworthy, clear, reassuring, elegant but direct. Useful for lead generation through credibility—NOT aggressive sales, NOT spammy investor hype, NOT robotic "AI" voice.

STRICT RULES:
- Do NOT state specific legal thresholds, government fees, taxes, processing times, or approval outcomes as guaranteed facts. Use cautious phrasing: rules can change; outcomes depend on the file; verify with qualified professionals.
- No keyword stuffing. No generic filler phrases ("in today's world", "delve", "landscape", "robust", "unlock").
- No fake certainty.
- In every markdown link, use exact lowercase slug paths (example: /articles/can-foreigners-buy-property-in-turkey). Never use a capital "Turkey" inside the slug segment.

${ANGLE}
${AVOID_OVERLAP}

ARTICLE-SPECIFIC MANDATORY CONSTRAINTS:
${CITIZENSHIP_EXTRA_PROMPT}

STRUCTURE (markdown body ONLY — no YAML frontmatter):
1) Follow "ARTICLE-SPECIFIC MANDATORY CONSTRAINTS" exactly for the first heading (including any required H1 text).
2) Strong introduction (2–4 short paragraphs).
3) Multiple H2 sections with H3 where helpful (main educational content before the FAQ).
4) FAQ section with H2 heading "FAQ" and several ### question headings with answers (each question line must start with "### " exactly once).
5) After the FAQ, add a short CTA paragraph inviting the reader to seek tailored legal guidance (professional, warm, not pushy).
6) After the CTA, add "## Related Articles" with 3 bullet markdown links exactly as specified in constraint (7) above.

INTERNAL LINKS (required in the body, at least once each, exact paths):
- /articles/turkish-citizenship-by-investment-through-real-estate
- /articles/can-foreigners-buy-property-in-turkey
- /articles/legal-checks-before-buying-property-in-turkey

LENGTH: About 1,200 to 1,600 words total (body only).

Return ONLY the article markdown body. Do not wrap in code fences.`;
}

module.exports = {
  CITIZENSHIP_EXTRA_PROMPT,
  ANGLE,
  AVOID_OVERLAP,
  buildRegenerateCitizenshipPrompt
};
