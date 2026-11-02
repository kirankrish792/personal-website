#!/usr/bin/env node
/**
 * Lighthouse (mobile, simulated throttling) on key routes of a running server.
 *   node scripts/dev/lighthouse.mjs [baseUrl] [routes...]
 * Uses Playwright's Chromium. Headless Chromium renders WebGL in software, so performance
 * numbers are pessimistic for the 3D layer; LCP, CLS and the other categories are representative.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const [base = 'http://127.0.0.1:4321', ...rest] = process.argv.slice(2);
const routes = rest.length ? rest : ['/', '/work/txtudio', '/writing/plan-first-agent-sessions'];
const cache = join(homedir(), 'Library/Caches/ms-playwright');
const chromeDir = readdirSync(cache).filter((d) => /^chromium-\d+$/.test(d)).sort().pop();
const candidates = [
  join(cache, chromeDir, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'),
  join(cache, chromeDir, 'chrome-mac/Chromium.app/Contents/MacOS/Chromium'),
];
const chrome = candidates.find(existsSync);
if (!chrome) throw new Error('Playwright Chromium not found; run pnpm exec playwright install chromium');
mkdirSync('test-results/lighthouse', { recursive: true });

const rows = [];
for (const route of routes) {
  const out = `test-results/lighthouse/${route === '/' ? 'home' : route.slice(1).replace(/\//g, '-')}.json`;
  execFileSync('pnpm', ['dlx', 'lighthouse@13.6.0', base + route, '--quiet', '--output=json', `--output-path=${out}`, '--only-categories=performance,accessibility,best-practices,seo', '--chrome-flags=--headless=new --use-angle=swiftshader --enable-unsafe-swiftshader'], {
    stdio: 'inherit',
    env: { ...process.env, CHROME_PATH: chrome },
  });
  const r = JSON.parse(readFileSync(out, 'utf8'));
  const score = (k) => Math.round((r.categories[k]?.score ?? 0) * 100);
  const a = r.audits;
  rows.push({
    route,
    performance: score('performance'),
    accessibility: score('accessibility'),
    bestPractices: score('best-practices'),
    seo: score('seo'),
    lcp: a['largest-contentful-paint']?.displayValue,
    cls: a['cumulative-layout-shift']?.displayValue,
    tbt: a['total-blocking-time']?.displayValue,
    lcpElement: a['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]?.node?.nodeLabel ?? '',
  });
}
console.table(rows);
