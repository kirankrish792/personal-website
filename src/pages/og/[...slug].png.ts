/**
 * Open Graph cards, one per route, rendered at build time: /og/home.png, /og/work/txtudio.png, ...
 * satori lays out the card from static Archivo instances (src/assets/fonts, OFL) and sharp rasterises it.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import satori from 'satori';
import sharp from 'sharp';

type Card = {
  title: string;
  line: string;
};

const PAGE_ROUTES: Record<string, string> = {
  home: 'home',
  about: 'about',
  work: 'work',
  experience: 'experience',
  writing: 'writing',
  lab: 'lab',
  contact: 'contact',
  resume: 'resume',
  privacy: 'privacy',
};

export const getStaticPaths: GetStaticPaths = async () => {
  const pages = await getCollection('pages');
  const work = await getCollection('work');
  const posts = await getCollection('writing', (p) => !p.data.draft);
  const paths: { params: { slug: string }; props: Card }[] = [];
  for (const p of pages) {
    const slug = PAGE_ROUTES[p.id];
    if (!slug) continue;
    paths.push({ params: { slug }, props: { title: p.data.h1, line: p.id === 'home' ? (p.data.roleLine ?? p.data.description) : p.data.description } });
  }
  for (const w of work) paths.push({ params: { slug: `work/${w.id}` }, props: { title: w.data.h1, line: w.data.summary } });
  for (const p of posts) paths.push({ params: { slug: `writing/${p.id}` }, props: { title: p.data.title, line: p.data.description } });
  return paths;
};

const root = process.cwd();
const FONTS = [
  { name: 'Archivo', data: readFileSync(join(root, 'src/assets/fonts/Archivo-Medium.ttf')), weight: 500 as const, style: 'normal' as const },
  { name: 'Marcellus', data: readFileSync(join(root, 'node_modules/@fontsource/marcellus/files/marcellus-latin-400-normal.woff')), weight: 400 as const, style: 'normal' as const },
];

const clip = (text: string, max: number) => (text.length <= max ? text : `${text.slice(0, text.lastIndexOf(' ', max)).replace(/[,;:.]$/, '')}…`);

type Node = { type: string; props: Record<string, unknown> };
const el = (type: string, style: Record<string, unknown>, children?: unknown): Node => ({ type, props: { style, children } });

export const GET: APIRoute = async ({ props, params }) => {
  const { title, line } = props as Card;
  const size = title.length > 34 ? 84 : title.length > 18 ? 104 : 132;
  const index = params.slug === 'home' ? 'KS' : String((params.slug ?? '').length % 90).padStart(2, '0');
  const tree = el('div', { width: 1200, height: 630, display: 'flex', position: 'relative', backgroundColor: '#ececec', color: '#0f0f0f', fontFamily: 'Archivo' }, [
    el('div', { position: 'absolute', right: -20, top: -90, fontSize: 560, color: '#fafafa', letterSpacing: -40, lineHeight: 1, display: 'flex' }, index),
    el('div', { position: 'absolute', left: 64, top: 52, fontSize: 26, fontWeight: 500, display: 'flex' }, 'KIRAN K S©'),
    el('div', { position: 'absolute', right: 64, top: 52, fontSize: 22, display: 'flex' }, 'Kozhikode, India'),
    el('div', { position: 'absolute', left: 64, bottom: 150, width: 1060, fontFamily: 'Marcellus', fontSize: size, lineHeight: 0.92, color: '#f2453f', textTransform: 'uppercase', display: 'flex' }, clip(title, 70)),
    el('div', { position: 'absolute', left: 64, bottom: 60, width: 900, fontSize: 26, lineHeight: 1.35, display: 'flex' }, clip(line, 110)),
  ]);
  const svg = await satori(tree as unknown as Parameters<typeof satori>[0], { width: 1200, height: 630, fonts: FONTS });
  const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
