# Mobile QA Checklist

Quick manual QA checklist for responsive quality before publish.

## Viewports

- `390x844` (small phone)
- `430x932` (large phone)
- `768x1024` (tablet portrait)

## Pages To Check

- `/`
- `/articles`
- `/articles/[slug]` (open at least 2 different articles)
- `/about`
- `/contact`

## Global Checks

- Header links wrap cleanly; no overlap or clipping
- No horizontal scroll on any page
- Text remains readable without zoom
- Buttons/links are easy to tap (minimum touch target feel)
- Footer sections stack clearly on mobile

## Home Page

- Hero title wraps naturally and stays readable
- Hero chips stack properly on small screens
- Trust and Journey cards appear as single-column blocks on small screens
- Article cards have consistent image ratio and spacing

## Articles List

- Card images, titles, meta, and excerpt align cleanly
- No card content overflow on long titles
- Read Article link remains visible and tappable

## Article Detail

- Header image + overlay text are readable on mobile
- Reading time and meta do not collide
- Action buttons (Share / WhatsApp) stack and remain tappable
- TOC appears in normal flow on mobile and does not break layout
- In-content links and headings keep good spacing
- Final CTA block remains readable and aligned

## About / Contact

- Profile and contact cards stack correctly
- Lawyer photo scales without distortion
- WhatsApp button remains visible without clipping

## Pass/Fail Rule

- Pass when all checks are visually clean in all three viewports
- If one breakpoint fails, fix and re-check all pages quickly
