// Single pages: a company case study, a project case study and a post, scrolled into the body so the
// sticky aside (sections, progress, facts) is in view. Also the hero and Work list logos.
import { chromium } from '@playwright/test';
const base = process.argv[2] ?? 'http://127.0.0.1:4321';
const browser = await chromium.launch();
const errors = [];
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
for (const [name, path] of [['cs-txtudio', '/work/txtudio'], ['cs-travelian', '/work/travelian'], ['post', '/writing/one-year-of-txtudio']]) {
  await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `test-results/shots/${name}-top.png` });
  await page.mouse.wheel(0, 1800);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `test-results/shots/${name}-body.png` });
}
await page.goto(`${base}/work`, { waitUntil: 'networkidle' });
await page.mouse.wheel(0, 500);
await page.waitForTimeout(1200);
await page.screenshot({ path: 'test-results/shots/work-logos.png' });
console.log(errors.join('\n') || 'no errors');
await browser.close();
