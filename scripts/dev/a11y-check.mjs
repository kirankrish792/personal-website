#!/usr/bin/env node
/** Runs axe on every built route with motion reduced and with full motion, and reports serious and critical violations. */
import { chromium } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { readFileSync } from 'node:fs';

const base = process.argv[2] ?? 'http://127.0.0.1:4321';
const sitemap = readFileSync('dist/sitemap-0.xml', 'utf8');
const routes = [...sitemap.matchAll(/<loc>https:\/\/kirankrishnakumar\.com([^<]*)<\/loc>/g)].map((m) => m[1] || '/');
routes.push('/404');
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let failures = 0;
for (const theme of ['reduce', 'no-preference']) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light', reducedMotion: theme });
  const page = await ctx.newPage();
  for (const route of routes) {
    await page.goto(base + route, { waitUntil: 'networkidle' });
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    const bad = result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    if (bad.length) {
      failures += bad.length;
      for (const v of bad) {
        console.log(`[${theme}] ${route}: ${v.impact} ${v.id}: ${v.help}`);
        for (const n of v.nodes.slice(0, 3)) console.log(`    ${n.target.join(' ')}  ${n.failureSummary?.split('\n')[1]?.trim() ?? ''}`);
      }
    }
  }
  await ctx.close();
}
await browser.close();
console.log(failures ? `${failures} serious or critical violations` : `no serious or critical violations across ${routes.length} routes with motion reduced and on`);
process.exitCode = failures ? 1 : 0;
