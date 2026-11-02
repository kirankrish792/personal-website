import { chromium } from '@playwright/test';
const base = process.argv[2] ?? 'http://127.0.0.1:4321';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(base + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
await page.screenshot({ path: 'test-results/shots/v2-hero.png' });
// The company scenes: arriving, open, and the product swap.
const cos = await page.evaluate(() => [...document.querySelectorAll('[data-company]')].map((el) => ({ top: el.getBoundingClientRect().top + scrollY, h: el.offsetHeight })));
for (const [i, co] of cos.entries()) {
  for (const f of [0.12, 0.45]) {
    await page.evaluate((y) => window.scrollTo(0, y), co.top + (co.h - 900) * f);
    await page.waitForTimeout(1400);
    await page.screenshot({ path: `test-results/shots/v2-company-${i}-${Math.round(f * 100)}.png` });
  }
  const item = page.locator('[data-company]').nth(i).locator('[data-co-show]').nth(1);
  await item.hover();
  await page.waitForTimeout(900);
  await page.screenshot({ path: `test-results/shots/v2-company-${i}-hover.png` });
}
const mt = await page.evaluate(() => document.querySelector('.meet').getBoundingClientRect().top + scrollY);
await page.evaluate((y) => window.scrollTo(0, y), mt);
await page.waitForTimeout(2500);
await page.screenshot({ path: 'test-results/shots/v2-meet.png' });
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(1500);
await page.screenshot({ path: 'test-results/shots/v2-footer.png' });
console.log(errors.length ? errors.join('\n') : 'no errors');
await browser.close();
