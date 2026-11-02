/**
 * Reading aids for case studies and posts (src/components/ArticleAside.astro):
 *   [data-read-progress="#article"]  sets --read (0..1) and the percentage as the article scrolls past
 *   [data-toc] with [data-toc-link]  marks the section being read (aria-current) as headings pass
 *   [data-copy-url]                  copies the page address and confirms on the button
 * Rebuilt on every page; none of it is motion, so it runs with motion paused too.
 */
let cleanups: (() => void)[] = [];

function build(): void {
  cleanups.splice(0).forEach((f) => f());

  document.querySelectorAll<HTMLElement>('[data-read-progress]').forEach((meter) => {
    const article = document.querySelector<HTMLElement>(meter.dataset.readProgress ?? '');
    const pct = meter.querySelector<HTMLElement>('[data-read-pct]');
    if (!article) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = article.getBoundingClientRect();
      const total = r.height - window.innerHeight * 0.6;
      const p = Math.min(1, Math.max(0, (window.innerHeight * 0.4 - r.top) / Math.max(1, total)));
      meter.style.setProperty('--read', p.toFixed(3));
      if (pct) pct.textContent = `${Math.round(p * 100)}%`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    cleanups.push(() => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    });
  });

  document.querySelectorAll<HTMLElement>('[data-toc]').forEach((toc) => {
    const links = [...toc.querySelectorAll<HTMLAnchorElement>('[data-toc-link]')];
    const headings = links.map((a) => document.getElementById(a.dataset.tocLink ?? '')).filter((h): h is HTMLElement => !!h);
    if (!headings.length) return;
    const mark = (id: string) => links.forEach((a) => (a.dataset.tocLink === id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    // The current section is the last heading that has passed the upper third of the screen.
    const onScroll = () => {
      const line = window.innerHeight * 0.33;
      let current = headings[0].id;
      for (const h of headings) if (h.getBoundingClientRect().top < line) current = h.id;
      mark(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    cleanups.push(() => window.removeEventListener('scroll', onScroll));
  });
}

export function initArticle(): void {
  document.addEventListener('astro:page-load', build);
  document.addEventListener('astro:before-swap', () => cleanups.splice(0).forEach((f) => f()));
  document.addEventListener('click', async (e) => {
    const btn = (e.target as Element | null)?.closest<HTMLElement>('[data-copy-url]');
    if (!btn) return;
    const label = btn.querySelector<HTMLElement>('[data-copy-label]') ?? btn;
    const original = label.textContent;
    try {
      await navigator.clipboard.writeText(location.href.split('#')[0]);
      label.textContent = 'Link copied';
    } catch {
      label.textContent = 'Copy failed';
    }
    window.setTimeout(() => (label.textContent = original), 2000);
  });
}
