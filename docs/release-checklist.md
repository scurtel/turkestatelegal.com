# Release Checklist

Use this checklist before publishing updates.

## 1) Build and Runtime

- `npm run build` passes without errors
- `npm run dev` starts normally
- No obvious console/runtime errors on key pages

## 2) Content and Routes

- Home page loads correctly
- Articles list loads with cards and images
- Open at least 3 article detail pages and verify:
  - header area
  - TOC
  - final CTA
- About and Contact pages load and look correct

## 3) Mobile Responsive

- Run checks from: `docs/mobile-qa-checklist.md`
- Confirm no horizontal overflow on 390 / 430 / 768 widths

## 4) Contact and Conversion

- WhatsApp links open correctly:
  - Article header CTA
  - Contact page CTA
  - Footer contact area
- Phone link works (`tel:`)

## 5) SEO and Discoverability

- `sitemap.xml` route loads
- Page titles/descriptions look correct on:
  - Home
  - Articles
  - At least one article detail page

## 6) Final Visual Pass

- Hero section readability is good
- Card hover/elevation looks consistent
- Footer layout is clean on desktop and mobile
- Placeholder images render without broken links
