#!/usr/bin/env node
/** Typographic covers for projects without screenshots: src/assets/work/<slug>.jpg (1200 x 750). */
import satori from 'satori';
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const fonts = [
  { name: 'Marcellus', data: readFileSync('node_modules/@fontsource/marcellus/files/marcellus-latin-400-normal.woff'), weight: 400, style: 'normal' },
  { name: 'Archivo', data: readFileSync('src/assets/fonts/Archivo-Medium.ttf'), weight: 500, style: 'normal' },
];
const PROJECTS = [
  { slug: 'blockchain-as-a-service', n: '03', title: 'Blockchain as a Service', year: '2023', stack: ['SolidStart', 'TypeScript', 'Solidity', 'Monaco'] },
  { slug: 'iot-fingerprint-attendance', n: '04', title: 'Fingerprint Attendance', year: '2022', stack: ['ESP8266', 'PlatformIO', 'Express', 'Firebase'] },
  { slug: 'travelian', n: '05', title: 'Travelian', year: '2022', stack: ['Express', 'MongoDB', 'Mapbox', 'Cloudinary'] },
  { slug: 'insight-hackathon-dapp', n: '06', title: 'iNSiGHT', year: '2023', stack: ['SolidStart', 'web3.js', 'MetaMask'] },
];
const el = (type, style, children) => ({ type, props: { style, children } });
for (const p of PROJECTS) {
  const tree = el('div', { width: 1200, height: 750, display: 'flex', position: 'relative', backgroundColor: '#e4e4e4', fontFamily: 'Archivo', color: '#0f0f0f' }, [
    el('div', { position: 'absolute', right: -30, top: -120, fontSize: 620, color: '#f4f4f4', letterSpacing: -40, lineHeight: 1 }, p.n),
    el('div', { position: 'absolute', left: 56, top: 48, fontSize: 24, display: 'flex' }, `Case study ${p.n}`),
    el('div', { position: 'absolute', right: 56, top: 48, fontSize: 24, display: 'flex' }, p.year),
    el('div', { position: 'absolute', left: 56, bottom: 140, width: 1000, fontFamily: 'Marcellus', fontSize: p.title.length > 14 ? 112 : 150, lineHeight: 0.92, color: '#f2453f', textTransform: 'uppercase', display: 'flex' }, p.title),
    el('div', { position: 'absolute', left: 56, bottom: 56, display: 'flex', gap: 12 }, p.stack.map((s) => el('div', { border: '2px solid #0f0f0f', borderRadius: 999, padding: '6px 18px', fontSize: 22 }, s))),
  ]);
  const svg = await satori(tree, { width: 1200, height: 750, fonts });
  await sharp(Buffer.from(svg)).jpeg({ quality: 86 }).toFile(`src/assets/work/${p.slug}.jpg`);
  console.log('cover', p.slug);
}
