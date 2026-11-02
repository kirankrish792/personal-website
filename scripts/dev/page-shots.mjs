// Screenshots of every route (top + one viewport down) at desktop and phone widths.
import { chromium } from '@playwright/test';
const base = process.argv[2] ?? 'http://127.0.0.1:4321';
const only = process.argv[3];
const routes = ['/about', '/work', '/work/txtudio', '/work/travelian', '/experience', '/writing', '/lab', '/contact', '/resume', '/writing/one-year-of-txtudio', '/privacy', '/missing-page'];
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errors = [];
for (const [tag, vp] of [['d', { width: 1440, height: 900 }], ['m', { width: 390, height: 844 }]]) {
  const page = await (await browser.newContext({ viewport: vp })).newPage();
  page.on('pageerror', (e) => errors.push(`${tag} ${page.url()} ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && errors.push(`${tag} ${page.url()} ${m.text()}`));
  for (const r of routes.filter((r) => !only || r === only)) {
    await page.goto(base + r, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1800);
    const name = r.replace(/\//g, '_') || '_home';
    await page.screenshot({ path: `test-results/shots/p-${tag}${name}-1.png` });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (overflow > 0) errors.push(`${tag} ${r} horizontal overflow ${overflow}px`);
    for (const k of [1, 2]) {
      await page.evaluate((y) => window.scrollTo(0, y), vp.height * k * 0.95);
      await page.waitForTimeout(1200);
      await page.screenshot({ path: `test-results/shots/p-${tag}${name}-${k + 1}.png` });
    }
  }
}
console.log(errors.length ? errors.join('\n') : 'no errors');
await browser.close();
