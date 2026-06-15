/**
 * Writes public/sitemap.xml at build time so /sitemap.xml is served as a static file.
 * Usage: node scripts/generate-public-sitemap.js
 */
const fs = require("node:fs");
const path = require("node:path");

async function main() {
  const { getSitemapEntries, sitemapEntriesToXml } = await import(
    "../lib/sitemap-entries.js"
  );

  const entries = getSitemapEntries();
  const xml = sitemapEntriesToXml(entries);
  const outPath = path.join(process.cwd(), "public", "sitemap.xml");

  fs.writeFileSync(outPath, xml, "utf8");
  console.log(`Wrote ${outPath} (${entries.length} URLs)`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
