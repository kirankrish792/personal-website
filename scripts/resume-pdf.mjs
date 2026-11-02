#!/usr/bin/env node
/**
 * Prints the /resume page to the PDF that the Experience and Résumé pages link to.
 *
 *   node scripts/resume-pdf.mjs [baseUrl]     # default http://127.0.0.1:4321
 *
 * Run it against a built site (`pnpm build && pnpm preview`), then commit the PDF: it is written
 * to public/, so the next build ships it. The page's print styles set A4 with 16 mm margins.
 * The script exits non-zero when the résumé runs past two pages.
 */
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const base = (process.argv[2] ?? 'http://127.0.0.1:4321').replace(/\/+$/, '');
const OUT = new URL('../public/Kiran-Krishnakumar-Subhashini-Resume.pdf', import.meta.url);
const TITLE = 'Kiran Krishnakumar Subhashini – Résumé';
const MAX_PAGES = 2;

/** Counts page objects: "/Type /Page" entries, leaving out the "/Type /Pages" tree nodes. */
const countPages = (pdf) => pdf.toString('latin1').match(/\/Type\s*\/Page(?![A-Za-z])/g)?.length ?? 0;

let browser;
try {
  browser = await chromium.launch();
  // Light scheme and reduced motion: the page renders without the particle layer or reveal fades.
  const context = await browser.newContext({ colorScheme: 'light', reducedMotion: 'reduce' });
  const page = await context.newPage();
  const url = `${base}/resume`;
  const response = await page.goto(url, { waitUntil: 'load' });
  if (!response?.ok()) throw new Error(`${url} answered ${response?.status() ?? 'with nothing'}`);

  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(async (title) => {
    await document.fonts.ready;
    document.title = title;
  }, TITLE);

  // Page size and the 16 mm margins come from the page's @page rule, which Chromium honours here.
  const pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
  writeFileSync(OUT, pdf);

  const pages = countPages(pdf);
  console.log(`Wrote ${fileURLToPath(OUT)}: ${pages} page${pages === 1 ? '' : 's'}, ${Math.round(pdf.length / 1024)} KB.`);
  if (pages > MAX_PAGES) {
    console.error(`The résumé runs to ${pages} pages; keep it to ${MAX_PAGES}.`);
    process.exitCode = 1;
  }
} catch (error) {
  console.error(`Could not print the résumé: ${error instanceof Error ? error.message : error}`);
  console.error(`Is the site running at ${base}? Try \`pnpm build && pnpm preview\`, then run this again.`);
  console.error('If Chromium is missing, install it with `pnpm exec playwright install chromium`.');
  process.exitCode = 1;
} finally {
  await browser?.close();
}
