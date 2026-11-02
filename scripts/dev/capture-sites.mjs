#!/usr/bin/env node
/** Captures the public homepages used as work cards (1440 x 900, saved as JPEG). */
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const SITES = {
  txtudio: 'https://www.txtudio.com',
  lofritex: 'https://lofritex.com',
  workeron: 'https://workeron.app',
  snaptiqz: 'https://events.snaptiqz.com',
  doyourdesign: 'https://doyourdesign.com',
  managematey: 'https://managematey.com',
  mitee: 'https://miteeinteriors.com',
};
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
for (const [name, url] of Object.entries(SITES)) {
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(2500);
    const png = await page.screenshot();
    await sharp(png).resize(1200, 750).jpeg({ quality: 82, mozjpeg: true }).toFile(`src/assets/work/${name}.jpg`);
    console.log('captured', name);
  } catch (e) {
    console.log('failed', name, e.message.split('\n')[0]);
  }
  await page.close();
}
await browser.close();
