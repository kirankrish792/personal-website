#!/usr/bin/env node
/**
 * Writes src/data/contributions.json for the Lab's contribution landscape.
 *
 * With GITHUB_TOKEN set (a fine-grained token with no repository access is enough), it uses the
 * GraphQL API for exact daily counts, including private contributions as totals only.
 * Without a token it reads the public contribution calendar, which carries the same days.
 * Repository names are never fetched or stored.
 *
 *   node scripts/github-contributions.mjs            # public calendar
 *   GITHUB_TOKEN=... node scripts/github-contributions.mjs
 */
import { writeFileSync } from 'node:fs';

const LOGIN = 'kirankrish792';
const OUT = new URL('../src/data/contributions.json', import.meta.url);

async function fromGraphQL(token) {
  const query = `query { user(login: "${LOGIN}") { contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { contributionCount date } } } } } }`;
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'kirankrishnakumar.com build' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`GraphQL ${res.status}`);
  const json = await res.json();
  const cal = json?.data?.user?.contributionsCollection?.contributionCalendar;
  if (!cal) throw new Error('No calendar in the GraphQL response');
  return {
    source: 'graphql',
    total: cal.totalContributions,
    weeks: cal.weeks.map((w) => w.contributionDays.map((d) => d.contributionCount)),
    from: cal.weeks[0]?.contributionDays[0]?.date ?? null,
  };
}

async function fromCalendar() {
  const res = await fetch(`https://github.com/users/${LOGIN}/contributions`, { headers: { 'User-Agent': 'kirankrishnakumar.com build' } });
  if (!res.ok) throw new Error(`Calendar ${res.status}`);
  const html = await res.text();
  const days = new Map();
  for (const m of html.matchAll(/<td[^>]*data-date="(\d{4}-\d{2}-\d{2})"[^>]*id="([^"]+)"[^>]*data-level="(\d)"[^>]*>/g)) {
    days.set(m[2], { date: m[1], level: Number(m[3]), count: null });
  }
  for (const m of html.matchAll(/<td[^>]*data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="(\d)"[^>]*id="([^"]+)"[^>]*>/g)) {
    if (!days.has(m[3])) days.set(m[3], { date: m[1], level: Number(m[2]), count: null });
  }
  for (const m of html.matchAll(/<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
    const day = days.get(m[1]);
    if (!day) continue;
    const n = m[2].match(/^(\d+)\s+contribution/);
    day.count = n ? Number(n[1]) : 0;
  }
  const sorted = [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
  if (!sorted.length) throw new Error('Calendar markup changed: no days found');
  const weeks = [];
  let week = [];
  for (const d of sorted) {
    const weekday = new Date(`${d.date}T00:00:00Z`).getUTCDay();
    if (weekday === 0 && week.length) {
      weeks.push(week);
      week = [];
    }
    week.push(d.count ?? d.level * 3);
  }
  if (week.length) weeks.push(week);
  const totalMatch = html.match(/([\d,]+)\s+contributions?\s+in the last year/);
  return {
    source: 'calendar',
    total: totalMatch ? Number(totalMatch[1].replace(/,/g, '')) : weeks.flat().reduce((s, n) => s + n, 0),
    weeks,
    from: sorted[0].date,
  };
}

const token = process.env.GITHUB_TOKEN;
let data;
try {
  data = token ? await fromGraphQL(token) : await fromCalendar();
} catch (err) {
  console.warn(`[contributions] ${err.message}; trying the public calendar`);
  data = await fromCalendar();
}
writeFileSync(OUT, `${JSON.stringify({ login: LOGIN, generated: new Date().toISOString().slice(0, 10), ...data }, null, 0)}\n`);
console.log(`[contributions] ${data.source}: ${data.total} contributions over ${data.weeks.length} weeks`);
