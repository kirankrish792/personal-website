#!/usr/bin/env node
/**
 * Checks the built site in dist/ against the SEO rules in the design spec:
 * every HTML page is in the sitemap (and nothing else is), one h1 per page, a canonical URL,
 * a title of at most 60 characters, a description of 70 to 160 characters, valid JSON-LD with one
 * Person node, and an Open Graph image that exists and measures 1200 x 630.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import sharp from 'sharp';

const DIST = 'dist';
const SITE = 'https://kirankrishnakumar.com';
const NOT_IN_SITEMAP = new Set(['/404', '/design']);
const problems = [];
const note = (msg) => problems.push(msg);

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const htmlFiles = walk(DIST).filter((f) => f.endsWith('.html'));
const routeOf = (file) => {
  const r = `/${relative(DIST, file)}`.replace(/\.html$/, '').replace(/\/index$/, '/');
  return r === '/index' ? '/' : r.replace(/(.)\/$/, '$1');
};
const routes = htmlFiles.map(routeOf);

const sitemapFiles = walk(DIST).filter((f) => /sitemap-\d+\.xml$/.test(f));
const sitemapUrls = sitemapFiles.flatMap((f) => [...readFileSync(f, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
const sitemapRoutes = new Set(sitemapUrls.map((u) => new URL(u).pathname.replace(/(.)\/$/, '$1')));
for (const r of routes) {
  if (NOT_IN_SITEMAP.has(r)) {
    if (sitemapRoutes.has(r)) note(`${r}: must not be in the sitemap`);
  } else if (!sitemapRoutes.has(r)) note(`${r}: missing from the sitemap`);
}
for (const r of sitemapRoutes) if (!routes.includes(r)) note(`${r}: in the sitemap but no page was built`);
const lastmods = sitemapFiles.flatMap((f) => [...readFileSync(f, 'utf8').matchAll(/<lastmod>/g)]).length;

let checked = 0;
for (const file of htmlFiles) {
  const route = routeOf(file);
  const html = readFileSync(file, 'utf8');
  checked++;
  const h1s = (html.match(/<h1[\s>]/g) ?? []).length;
  if (h1s !== 1) note(`${route}: ${h1s} h1 elements`);
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1]?.replace(/&amp;/g, '&').replace(/&#39;/g, "'") ?? '';
  if (!title) note(`${route}: no title`);
  else if (title.length > 60 && route !== '/design') note(`${route}: title is ${title.length} characters: "${title}"`);
  const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
  if (desc.length < 70 || desc.length > 160) note(`${route}: description is ${desc.length} characters`);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  const expected = route === '/' ? SITE : `${SITE}${route}`;
  const noindex = /<meta name="robots" content="noindex/.test(html);
  if (noindex && canonical) note(`${route}: noindex page should not declare a canonical`);
  if (!noindex && canonical !== expected) note(`${route}: canonical is ${canonical}, expected ${expected}`);
  if (noindex && !NOT_IN_SITEMAP.has(route)) note(`${route}: unexpectedly noindex`);
  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (!ld.length) note(`${route}: no JSON-LD`);
  for (const m of ld) {
    try {
      const data = JSON.parse(m[1]);
      const graph = data['@graph'] ?? [data];
      const persons = graph.filter((n) => n['@type'] === 'Person' && n['@id'] === `${SITE}/#person`);
      if (persons.length !== 1) note(`${route}: ${persons.length} Person nodes with the site @id`);
    } catch (e) {
      note(`${route}: JSON-LD does not parse (${e.message})`);
    }
  }
  const og = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
  if (!og) note(`${route}: no og:image`);
  else if (route !== '/404' && route !== '/design') {
    const local = join(DIST, new URL(og).pathname);
    if (!existsSync(local)) note(`${route}: og:image ${new URL(og).pathname} was not built`);
    else {
      const meta = await sharp(local).metadata();
      if (meta.width !== 1200 || meta.height !== 630) note(`${route}: og:image is ${meta.width} x ${meta.height}`);
    }
  }
}

const required = ['robots.txt', 'sitemap-index.xml', 'rss.xml', 'llms.txt', '_headers', 'favicon.svg', '404.html'];
for (const f of required) if (!existsSync(join(DIST, f))) note(`missing dist/${f}`);

console.log(`${checked} pages checked, ${sitemapUrls.length} sitemap URLs, ${lastmods} with lastmod`);
if (problems.length) {
  console.log(`${problems.length} problems:\n- ${problems.join('\n- ')}`);
  process.exitCode = 1;
} else console.log('dist passes every check');
