// Screenshots of the Lab pieces at desktop and phone widths: the calendar after its ripple, a hovered
// square, and the product switcher on its third product. Prints page errors.
import { chromium } from '@playwright/test';
const base = process.argv[2] ?? 'http://127.0.0.1:4321';
const browser = await chromium.launch();
const errors = [];
for (const [tag, vp] of [['d', { width: 1440, height: 900 }], ['m', { width: 390, height: 844 }]]) {
  const page = await (await browser.newContext({ viewport: vp })).newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(`${base}/lab`, { waitUntil: 'networkidle' });
  await page.locator('.cal').scrollIntoViewIfNeeded();
  await page.waitForTimeout(2400);
  const day = page.locator('.cal__day[data-level="4"]').first();
  if (tag === 'd') await day.hover({ force: true });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `test-results/shots/lab-${tag}-calendar.png` });
  await page.locator('#products').scrollIntoViewIfNeeded();
  await page.click('[data-switch-to="2"]');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `test-results/shots/lab-${tag}-products.png` });
}
console.log(errors.join('\n') || 'no errors');
await browser.close();
