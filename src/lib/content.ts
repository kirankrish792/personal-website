import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import type { LedgerRow } from '~/components/Ledger.astro';

export async function page(id: string) {
  const entry = await getEntry('pages', id);
  if (!entry) throw new Error(`Missing page copy: src/content/pages/${id}.md`);
  return entry;
}

export async function workEntries() {
  return (await getCollection('work')).sort((a, b) => a.data.order - b.data.order);
}

export async function posts() {
  return (await getCollection('writing', (p) => !p.data.draft)).sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function yearLabel(entry: CollectionEntry<'work'>): string {
  const { year, yearEnd, kind } = entry.data;
  if (kind === 'company') return yearEnd ? `${year}–${yearEnd}` : `${year}–`;
  return String(year);
}

export function toLedgerRow(entry: CollectionEntry<'work'>): LedgerRow {
  return {
    year: yearLabel(entry),
    name: shortName(entry),
    role: entry.data.role,
    summary: entry.data.summary,
    href: `/work/${entry.id}`,
  };
}

export const formatDate = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/** Previous and next case studies in ledger order, for the links at the end of each case study. */
export async function adjacentWork(id: string) {
  const all = await workEntries();
  const i = all.findIndex((w) => w.id === id);
  return { prev: i > 0 ? all[i - 1] : null, next: i >= 0 && i < all.length - 1 ? all[i + 1] : null };
}

/** Minutes to read at about 230 words a minute. */
export function readingMinutes(body: string | undefined): number {
  const words = (body ?? '').replace(/```[\s\S]*?```/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
}

const SHORT_NAMES: Record<string, string> = {
  txtudio: 'Txtudio',
  lofritex: 'Lofritex',
  'blockchain-as-a-service': 'Blockchain as a Service',
  'iot-fingerprint-attendance': 'Fingerprint Attendance',
  travelian: 'Travelian',
  'insight-hackathon-dapp': 'iNSiGHT',
};

/** A short display name for a case study (the H1s are full headlines). */
export function shortName(entry: CollectionEntry<'work'>): string {
  return SHORT_NAMES[entry.id] ?? entry.data.h1.split(':')[0];
}
