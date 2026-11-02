// Menu behaviour after scrolling (desktop): hover then move down to a link and click it; hover then
// click Menu keeps it open; a click outside closes it; Escape closes it. Phone: Menu opens the overlay.
import { chromium } from '@playwright/test';
const base = process.argv[2] ?? 'http://127.0.0.1:4321';
const browser = await chromium.launch();
const results = [];
const check = (name, ok, detail = '') => results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
const open = (page) => page.evaluate(() => document.querySelector('[data-nav]')?.hasAttribute('data-open'));

const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto(`${base}/about`, { waitUntil: 'networkidle' });
await page.mouse.wheel(0, 1500);
await page.waitForTimeout(1200);
check('menu tucks away after scrolling', !(await open(page)));

// Hover Menu, then glide slowly down across the gap to "Work" and click it.
const btn = await page.locator('[data-action="menu"]').boundingBox();
await page.mouse.move(btn.x + btn.width / 2, btn.y + btn.height / 2, { steps: 5 });
await page.waitForTimeout(400);
check('hovering Menu opens the list', await open(page));
const work = await page.locator('[data-nav-link][href="/work"]').boundingBox();
await page.mouse.move(work.x + 20, work.y + work.height / 2, { steps: 25 });
await page.waitForTimeout(300);
check('moving down to a link keeps it open', await open(page));
await page.mouse.click(work.x + 20, work.y + work.height / 2);
await page.waitForURL('**/work', { timeout: 10000 }).catch(() => {});
check('clicking the link navigates', page.url().endsWith('/work'), page.url());

// Hover then click Menu: stays open, even after the pointer leaves.
await page.mouse.wheel(0, 1500);
await page.waitForTimeout(1200);
await page.mouse.move(btn.x + btn.width / 2, btn.y + btn.height / 2, { steps: 5 });
await page.waitForTimeout(300);
await page.mouse.click(btn.x + btn.width / 2, btn.y + btn.height / 2);
await page.mouse.move(800, 600, { steps: 10 });
await page.waitForTimeout(900);
check('hover then click pins the menu open', await open(page));
await page.mouse.click(800, 600);
await page.waitForTimeout(300);
check('a click outside closes it', !(await open(page)));
await page.mouse.click(btn.x + btn.width / 2, btn.y + btn.height / 2);
await page.waitForTimeout(200);
await page.keyboard.press('Escape');
check('Escape closes it', !(await open(page)));

const phone = await (await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true })).newPage();
await phone.goto(`${base}/about`, { waitUntil: 'networkidle' });
await phone.evaluate(() => scrollTo(0, 1200));
await phone.waitForTimeout(800);
await phone.locator('[data-action="menu"]').tap();
await phone.waitForTimeout(400);
check('phone: tapping Menu opens the overlay', await open(phone));
await phone.locator('[data-nav-link][href="/lab"]').tap();
await phone.waitForURL('**/lab', { timeout: 10000 }).catch(() => {});
check('phone: tapping a link navigates', phone.url().endsWith('/lab'), phone.url());

await browser.close();
console.log(results.join('\n'));
process.exitCode = results.some((r) => r.startsWith('FAIL')) ? 1 : 0;
