# Turk Estate Legal

Simple English-only content website for foreigners buying property in Turkey.

## Run locally

1. Install dependencies:
   - `npm install`
2. Start development server:
   - `npm run dev`
3. Open:
   - `http://localhost:3000`

## Content location

- Articles live in: `content/articles/`
- Use `.md` or `.mdx` files with frontmatter.

## Generate draft article with Gemini

Use your existing `GEMINI_API_KEY` from `.env`:

- `npm run generate:draft -- "How foreigners can check title deed safety"`

Optional model override:

- `npm run generate:draft -- "How to avoid legal mistakes" gemini-3.0-flash`

Default model is controlled in:

- `lib/gemini.js` (`DEFAULT_GEMINI_MODEL`)

## Mobile QA

- Checklist: `docs/mobile-qa-checklist.md`

## Release QA

- Checklist: `docs/release-checklist.md`
