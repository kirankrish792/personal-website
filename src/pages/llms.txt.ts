import type { APIRoute } from 'astro';
import person from '~/data/person.json';
import { page, posts, workEntries } from '~/lib/content';
import { SITE } from '~/site.config';

/** /llms.txt: a plain Markdown index of the site for language models (https://llmstxt.org). */
export const GET: APIRoute = async () => {
  const [about, contact, writingPage, work, writing] = await Promise.all([
    page('about'),
    page('contact'),
    page('writing'),
    workEntries(),
    posts(),
  ]);
  const elsewhere = writingPage.data.elsewhere ?? [];
  const abs = (path: string) => `${SITE.url}${path}`;
  const text = (s: string) => s.replace(/\s+/g, ' ').trim();
  const link = (label: string, href: string, note?: string) =>
    `- [${text(label).replace(/([[\]])/g, '\\$1')}](${href})${note ? `: ${text(note)}` : ''}`;

  const lines = [
    `# ${person.name}`,
    '',
    `> ${text(person.description)}`,
    '',
    '## About',
    '',
    link(about.data.h1, abs('/about'), about.data.description),
    '',
    '## Companies and work',
    '',
    ...work.map((w) => link(w.data.title, abs(`/work/${w.id}`), w.data.summary)),
    '',
    '## Writing',
    '',
    ...writing.map((p) => link(p.data.title, abs(`/writing/${p.id}`), p.data.description)),
    ...elsewhere.map((e) => link(e.title, e.href, e.summary)),
    '',
    '## Contact',
    '',
    link(contact.data.title, abs('/contact'), contact.data.description),
    ...SITE.socials.map((s) => link(s.label, s.href)),
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
