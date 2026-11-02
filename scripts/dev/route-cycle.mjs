#!/usr/bin/env node
/**
 * Navigates the seven main pages three times through the nav (ClientRouter), then back and forward,
 * and checks after every swap: no canvas anywhere (the site has no 3D), light theme kept, the right nav item marked, one H1,
 * the cursor follower still attached, and no page errors.
 */
import { chromium } from '@playwright/test';

const base = process.argv[2] ?? 'http://127.0.0.1:4321';
const NAV = ['/about', '/work', '/experience', '/writing', '/lab', '/contact', '/'];
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: 'light' });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const fails = [];
const fail = (msg) => fails.push(msg);

const snapshot = async () => {
  return page.evaluate(() => ({
    path: location.pathname,
    canvases: document.querySelectorAll('canvas').length,
    theme: document.documentElement.dataset.theme,
    current: [...document.querySelectorAll('[data-nav-link][aria-current="page"]')].map((a) => a.getAttribute('href')),
    h1: document.querySelectorAll('h1').length,
    cursor: !!document.querySelector('.cursor')?.isConnected,
  }));
};

function check(s, where, href) {
  if (s.canvases !== 0) fail(`${where}: ${s.canvases} canvases (the site has no 3D)`);
  if (s.theme !== 'light') fail(`${where}: theme ${s.theme}`);
  if (href && (s.current.length !== 1 || s.current[0] !== href)) fail(`${where}: nav marks ${JSON.stringify(s.current)}`);
  if (s.h1 !== 1) fail(`${where}: ${s.h1} h1 elements`);
  if (!s.cursor) fail(`${where}: cursor detached`);
}

await page.goto(`${base}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
for (let round = 1; round <= 3; round++) {
  for (const href of NAV) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.click(`[data-nav-link][href="${href}"]`);
    await page.waitForFunction((h) => location.pathname === h, href, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1400);
    check(await snapshot(), `round ${round}, ${href}`, href);
  }
}
for (let i = 0; i < 4; i++) {
  await page.goBack();
  await page.waitForTimeout(1600);
  check(await snapshot(), `back ${i + 1}`);
}
for (let i = 0; i < 2; i++) {
  await page.goForward();
  await page.waitForTimeout(1600);
  check(await snapshot(), `forward ${i + 1}`);
}
errors.forEach((e) => fail(`page error: ${e}`));
console.log(fails.length ? `FAIL\n${fails.join('\n')}` : 'route cycle: all checks passed (21 swaps, 4 back, 2 forward)');
await browser.close();
process.exit(fails.length ? 1 : 0);
