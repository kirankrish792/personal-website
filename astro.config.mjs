// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SITE = 'https://kirankrishnakumar.com';

/** Routes that never belong in the sitemap. */
const EXCLUDED = [/^\/404$/, /^\/design$/, /^\/og\//, /^\/rss\.xml$/];

/** Map of route path to last-modified date, read from content frontmatter. */
function lastmodByRoute() {
  /** @type {Map<string, string>} */
  const map = new Map();
  /** @param {string} fm @param {string} key */
  const pick = (fm, key) => fm.match(new RegExp(`^${key}:\\s*["']?(\\d{4}-\\d{2}-\\d{2})`, 'm'))?.[1];
  /** @param {string} dir @param {(slug: string) => string | null} toRoute */
  const scan = (dir, toRoute) => {
    if (!existsSync(dir)) return;
    for (const file of readdirSync(dir)) {
      if (!/\.mdx?$/.test(file)) continue;
      const fm = readFileSync(join(dir, file), 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1];
      if (!fm) continue;
      const date = pick(fm, 'updatedDate') ?? pick(fm, 'updated') ?? pick(fm, 'pubDate');
      const route = toRoute(file.replace(/\.mdx?$/, ''));
      if (date && route) map.set(route, date);
    }
  };
  scan('./src/content/pages', (slug) => (slug === 'home' ? '/' : slug === '404' ? null : `/${slug}`));
  scan('./src/content/work', (slug) => `/work/${slug}`);
  scan('./src/content/writing', (slug) => `/writing/${slug}`);
  return map;
}
const LASTMOD = lastmodByRoute();
/** @param {string} url */
const routeOf = (url) => {
  const path = new URL(url).pathname.replace(/\.html$/, '').replace(/\/$/, '');
  return path === '' ? '/' : path;
};

/** Inter Tight (grotesk, variable weight) and Marcellus (flared display serif), self-hosted from Fontsource files. */
/** @type {[string, ...string[]]} */
const LATIN = ['U+0000-00FF', 'U+0131', 'U+0152-0153', 'U+02BB-02BC', 'U+02C6', 'U+02DA', 'U+02DC', 'U+0304', 'U+0308', 'U+0329', 'U+2000-206F', 'U+20AC', 'U+2122', 'U+2191', 'U+2193', 'U+2212', 'U+2215', 'U+FEFF', 'U+FFFD'];
/** @type {[string, ...string[]]} */
const LATIN_EXT = ['U+0100-02BA', 'U+02BD-02C5', 'U+02C7-02CC', 'U+02CE-02D7', 'U+02DD-02FF', 'U+1D00-1DBF', 'U+1E00-1E9F', 'U+1EF2-1EFF', 'U+2020', 'U+20A0-20AB', 'U+20AD-20C0', 'U+2113', 'U+2C60-2C7F', 'U+A720-A7FF'];

export default defineConfig({
  site: SITE,
  trailingSlash: 'never',
  build: { format: 'file' },
  compressHTML: true,
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !EXCLUDED.some((re) => re.test(routeOf(page))),
      serialize(item) {
        const date = LASTMOD.get(routeOf(item.url));
        return date ? { ...item, lastmod: new Date(`${date}T00:00:00Z`).toISOString() } : item;
      },
    }),
  ],
  fonts: [
    {
      name: 'Inter Tight',
      cssVariable: '--font-sans',
      provider: fontProviders.local(),
      fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
      options: {
        variants: [
          { src: ['@fontsource-variable/inter-tight/files/inter-tight-latin-wght-normal.woff2'], weight: '100 900', style: 'normal', unicodeRange: LATIN },
          { src: ['@fontsource-variable/inter-tight/files/inter-tight-latin-wght-italic.woff2'], weight: '100 900', style: 'italic', unicodeRange: LATIN },
        ],
      },
    },
    {
      name: 'Marcellus',
      cssVariable: '--font-display',
      provider: fontProviders.local(),
      fallbacks: ['ui-serif', 'Georgia', 'serif'],
      options: {
        variants: [
          { src: ['@fontsource/marcellus/files/marcellus-latin-400-normal.woff2'], weight: '400', style: 'normal', unicodeRange: LATIN },
          { src: ['@fontsource/marcellus/files/marcellus-latin-ext-400-normal.woff2'], weight: '400', style: 'normal', unicodeRange: LATIN_EXT },
        ],
      },
    },
  ],
  markdown: {
    shikiConfig: { themes: { light: 'github-light', dark: 'github-light' } },
  },
});
