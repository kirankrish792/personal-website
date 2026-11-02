#!/usr/bin/env node
/** Checks the reduced-motion version, the motion pause, the Lab interactions and real 404 status. Navigation is in route-cycle.mjs. */
import { chromium } from '@playwright/test';

const base = process.argv[2] ?? 'http://127.0.0.1:4321';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const results = [];
const check = (name, ok, detail = '') => results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);

// 1. Reduced motion: names readable, no smooth scroll, content not hidden.
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  for (const path of ['/', '/about', '/lab']) {
    await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const s = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      const day = document.querySelector('.cal__day');
      return {
        canvases: document.querySelectorAll('canvas').length,
        h1Visible: h1 ? getComputedStyle(h1).visibility !== 'hidden' && getComputedStyle(h1).opacity !== '0' : false,
        lenis: document.documentElement.classList.contains('lenis'),
        calendarVisible: day ? getComputedStyle(day).opacity !== '0' : null,
      };
    });
    check(`${path}: no 3D canvas`, s.canvases === 0, `${s.canvases} canvases`);
    check(`${path}: H1 visible without motion`, s.h1Visible);
    check(`${path}: no smooth scrolling`, !s.lenis);
    if (s.calendarVisible !== null) check(`${path}: calendar squares visible without motion`, s.calendarVisible);
  }
  await page.goto(`${base}/`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'test-results/shots/home-reduced-motion.png' });
  await ctx.close();
}

// 2. Pause persists; the calendar and product switcher respond.
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${base}/lab`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.click('[data-action="motion"]');
  await page.waitForTimeout(300);
  const paused = await page.evaluate(() => ({ motion: document.documentElement.dataset.motion, pressed: document.querySelector('[data-action="motion"]')?.getAttribute('aria-pressed') }));
  check('pause motion sets the paused state', paused.motion === 'paused' && paused.pressed === 'false', JSON.stringify(paused));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  check('paused state survives a reload', (await page.evaluate(() => document.documentElement.dataset.motion)) === 'paused');
  await page.locator('[data-switch-to="3"]').click();
  await page.waitForTimeout(300);
  await page.locator('[data-switch-to="3"]').press('ArrowUp');
  await page.waitForTimeout(300);
  const lab = await page.evaluate(() => ({
    pressed: [...document.querySelectorAll('[data-switch-to]')].map((b) => b.getAttribute('aria-pressed')).join(','),
    active: document.querySelector('[data-switch-panel][data-active]')?.getAttribute('data-switch-panel'),
    focus: document.activeElement?.getAttribute('data-switch-to'),
  }));
  check('product switcher follows clicks and arrow keys', lab.pressed === 'false,false,true,false' && lab.active === '2' && lab.focus === '2', JSON.stringify(lab));
  await page.locator('.cal').scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  check('calendar marks itself in view', (await page.evaluate(() => document.querySelector('.cal')?.getAttribute('data-inview'))) === 'in');
  check('no page errors', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

// 3. A missing page answers 404.
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const res = await page.goto(`${base}/no-such-page`);
  check('missing page returns 404', res?.status() === 404, String(res?.status()));
  await ctx.close();
}

await browser.close();
console.log(results.join('\n'));
process.exitCode = results.some((r) => r.startsWith('FAIL')) ? 1 : 0;
