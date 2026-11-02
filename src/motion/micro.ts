/**
 * Micro-interactions. Everything is driven by markup and delegated listeners, registered once
 * (bundled scripts run once per visit under the ClientRouter) and re-applied on astro:page-load.
 *
 *   [data-roll]           label rolls up to a copy of itself on hover (also .btn labels and nav links)
 *   [data-magnetic]       element leans toward the pointer
 *   [data-cursor="View"]  cursor ring grows and shows the label over the element
 *   [data-preview="url"]  that image floats beside the cursor while the element is hovered
 *   [data-inview]         set to "in" once the element scrolls into view, so CSS can animate it
 *   [data-switch]         buttons [data-switch-to=i] show panel [data-switch-panel=i]; arrow keys move between them
 *   [data-clock]          live time in Kozhikode (IST)
 *   [data-scramble]       letters scramble and resolve on hover
 *   [data-copy="email"]   copies the email address and shows a toast instead of navigating
 *   [data-tilt]           card tilts in 3D toward the pointer
 *   [data-count]          number counts up when it scrolls into view
 *   [data-split]          heading lines rise from a mask when they scroll into view
 *   [data-wave]           each letter lifts as the pointer passes (footer name)
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { motionAllowed } from './state';
import { getLenis } from './scroll';
import { SITE } from '~/site.config';

gsap.registerPlugin(ScrollTrigger, SplitText);

const fine = () => window.matchMedia('(pointer: fine)').matches;

// ---------- Text roll ----------
function applyRolls(): void {
  document.querySelectorAll<HTMLElement>('[data-roll]:not([data-rolled]), .btn:not([data-rolled])').forEach((el) => {
    const text = el.textContent?.trim();
    if (!text || el.children.length > 1) return;
    el.setAttribute('data-rolled', '');
    if (!el.getAttribute('aria-label') && el.tagName !== 'SPAN') el.setAttribute('aria-label', text);
    const roll = document.createElement('span');
    roll.className = 'roll';
    roll.setAttribute('aria-hidden', 'true');
    roll.innerHTML = `<span></span><span></span>`;
    roll.children[0].textContent = text;
    roll.children[1].textContent = text;
    if (el.tagName === 'SPAN') {
      // Nav labels: keep the accessible text in the link, show the roll visually.
      const sr = document.createElement('span');
      sr.className = 'visually-hidden';
      sr.textContent = text;
      el.replaceChildren(sr, roll);
    } else {
      el.replaceChildren(roll);
    }
  });
}

// ---------- Clock ----------
let clockTimer = 0;
function startClock(): void {
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const tick = () => {
    const t = fmt.format(new Date());
    document.querySelectorAll('[data-clock]').forEach((el) => (el.textContent = `IST, ${t}`));
  };
  tick();
  window.clearInterval(clockTimer);
  clockTimer = window.setInterval(tick, 1000);
}

// ---------- Toast ----------
let toastTimer = 0;
function toast(message: string): void {
  let el = document.querySelector<HTMLElement>('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    document.body.append(el);
  }
  el.textContent = message;
  el.classList.add('is-shown');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el?.classList.remove('is-shown'), 2200);
}

// ---------- Scramble ----------
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function scramble(el: HTMLElement): void {
  if (el.dataset.scrambling) return;
  const original = el.dataset.text ?? el.textContent ?? '';
  el.dataset.text = original;
  el.dataset.scrambling = '1';
  let frame = 0;
  const total = 14;
  const run = () => {
    frame++;
    el.textContent = original
      .split('')
      .map((ch, i) => (ch === ' ' || i < (frame / total) * original.length ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
      .join('');
    if (frame < total) requestAnimationFrame(run);
    else {
      el.textContent = original;
      delete el.dataset.scrambling;
    }
  };
  requestAnimationFrame(run);
}

// ---------- Cursor ----------
let cursor: HTMLElement | null = null;
let cursorLabel: HTMLElement | null = null;
function ensureCursor(): void {
  if (cursor || !fine()) return;
  cursor = document.createElement('div');
  cursor.className = 'cursor';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML = '<span class="cursor__dot"></span><span class="cursor__ring"></span>';
  cursorLabel = cursor.querySelector('.cursor__ring');
  document.body.append(cursor);
  const x = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3.out' });
  const y = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3.out' });
  window.addEventListener('pointermove', (e) => {
    x(e.clientX);
    y(e.clientY);
  }, { passive: true });
}

// ---------- Hover preview: a cover image that trails the cursor and leans into its motion ----------
let preview: HTMLElement | null = null;
let previewImg: HTMLImageElement | null = null;
function ensurePreview(): void {
  if (preview || !fine()) return;
  preview = document.createElement('div');
  preview.className = 'preview';
  preview.setAttribute('aria-hidden', 'true');
  previewImg = document.createElement('img');
  previewImg.alt = '';
  previewImg.decoding = 'async';
  preview.append(previewImg);
  document.body.append(preview);
  const x = gsap.quickTo(preview, 'x', { duration: 0.7, ease: 'power3.out' });
  const y = gsap.quickTo(preview, 'y', { duration: 0.7, ease: 'power3.out' });
  const r = gsap.quickTo(preview, 'rotation', { duration: 0.9, ease: 'power3.out' });
  let lastX = 0;
  window.addEventListener('pointermove', (e) => {
    x(e.clientX);
    y(e.clientY);
    r(Math.max(-14, Math.min(14, (e.clientX - lastX) * 0.9)));
    lastX = e.clientX;
  }, { passive: true });
}

function previewState(target: Element | null): void {
  if (!preview || !previewImg) return;
  const host = target?.closest<HTMLElement>('[data-preview]');
  const src = host?.dataset.preview;
  if (src && motionAllowed()) {
    if (previewImg.getAttribute('src') !== src) previewImg.src = src;
    preview.classList.add('is-on');
  } else preview.classList.remove('is-on');
}

/** The page swap replaces <body>, so the floating helpers are put back after each navigation. */
function reattach(): void {
  if (cursor && !cursor.isConnected) document.body.append(cursor);
  if (preview && !preview.isConnected) document.body.append(preview);
  preview?.classList.remove('is-on');
}

function cursorState(target: Element | null): void {
  if (!cursor || !cursorLabel) return;
  const labelled = target?.closest<HTMLElement>('[data-cursor]');
  const link = target?.closest('a, button, [role="slider"], summary');
  cursor.classList.toggle('is-label', !!labelled);
  cursor.classList.toggle('is-link', !labelled && !!link);
  cursorLabel.textContent = labelled?.dataset.cursor ?? '';
}

// ---------- Magnetic and tilt ----------
function onMove(e: PointerEvent): void {
  if (!motionAllowed() || !fine()) return;
  const target = e.target as Element | null;
  const mag = target?.closest<HTMLElement>('[data-magnetic]');
  if (mag) {
    const r = mag.getBoundingClientRect();
    gsap.to(mag, { x: (e.clientX - (r.left + r.width / 2)) * 0.28, y: (e.clientY - (r.top + r.height / 2)) * 0.35, duration: 0.5, ease: 'power3.out' });
  }
  const tilt = target?.closest<HTMLElement>('[data-tilt]');
  if (tilt) {
    const r = tilt.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(tilt, { rotateY: px * 12, rotateX: -py * 10, transformPerspective: 900, duration: 0.6, ease: 'power3.out' });
  }
}

function onLeave(e: PointerEvent): void {
  const el = e.target as Element | null;
  if (!(el instanceof HTMLElement)) return;
  if (el.matches('[data-magnetic]')) gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
  if (el.matches('[data-tilt]')) gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.8, ease: 'power3.out' });
}

// ---------- Wave letters ----------
function applyWaves(): void {
  document.querySelectorAll<HTMLElement>('[data-wave]:not([data-waved])').forEach((el) => {
    el.setAttribute('data-waved', '');
    const text = el.textContent ?? '';
    el.innerHTML = '';
    const read = document.createElement('span');
    read.className = 'visually-hidden';
    read.textContent = text;
    el.append(read);
    // Letters are grouped into words that never break inside, so lines wrap only between words.
    text.split(' ').forEach((word, wi, words) => {
      const w = document.createElement('span');
      w.setAttribute('aria-hidden', 'true');
      w.style.display = 'inline-block';
      w.style.whiteSpace = 'nowrap';
      for (const ch of word) {
        const s = document.createElement('span');
        s.textContent = ch;
        s.dataset.waveCh = '';
        s.style.display = 'inline-block';
        w.append(s);
      }
      el.append(w);
      if (wi < words.length - 1) el.append(document.createTextNode(' '));
    });
  });
}

// ---------- Per-page build ----------
let ctx: gsap.Context | null = null;
const splits: SplitText[] = [];

// ---------- In view: a one-shot flag for CSS-driven entrances ----------
let inview: IntersectionObserver | null = null;
function watchInView(): void {
  inview?.disconnect();
  inview = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        (e.target as HTMLElement).dataset.inview = 'in';
        inview?.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -12% 0px' },
  );
  document.querySelectorAll<HTMLElement>('[data-inview]:not([data-inview="in"])').forEach((el) => inview!.observe(el));
}

// ---------- Switcher: tabs that swap panels ----------
function switchTo(root: HTMLElement, index: number): void {
  root.querySelectorAll<HTMLElement>('[data-switch-to]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.switchTo) === index)));
  root.querySelectorAll<HTMLElement>('[data-switch-panel]').forEach((p) => {
    const on = Number(p.dataset.switchPanel) === index;
    p.toggleAttribute('data-active', on);
    if (on) p.removeAttribute('aria-hidden');
    else p.setAttribute('aria-hidden', 'true');
  });
}

function build(): void {
  watchInView();
  applyRolls();
  applyWaves();
  startClock();
  ctx?.revert();
  splits.splice(0).forEach((s) => s.revert());
  if (!motionAllowed()) {
    document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
      el.style.opacity = '';
      el.style.transform = '';
    });
    return;
  }
  ctx = gsap.context(() => {
    document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
      gsap.to(el, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
    document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
      const split = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'split-line', aria: 'auto' });
      splits.push(split);
      gsap.from(split.lines, { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
      const end = Number(el.dataset.count);
      const pad = el.dataset.countPad ? Number(el.dataset.countPad) : 0;
      const obj = { v: 0 };
      gsap.to(obj, {
        v: end,
        duration: 1.6,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        onUpdate: () => (el.textContent = pad ? String(Math.round(obj.v)).padStart(pad, '0') : Math.round(obj.v).toLocaleString('en-IN')),
      });
    });
    // Hero cards drop in, then drift with scroll.
    document.querySelectorAll<HTMLElement>('[data-speed]').forEach((el) => {
      const speed = Number(el.dataset.speed);
      gsap.to(el, { y: () => -window.innerHeight * speed, ease: 'none', scrollTrigger: { trigger: el.closest('section') ?? el, start: 'top top', end: 'bottom top', scrub: true } });
    });
    // Scroll progress line.
    const bar = document.querySelector('.progress');
    if (bar) gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: document.documentElement, start: 'top top', end: 'bottom bottom', scrub: 0.3 } });
  });
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

// ---------- Route curtain ----------
function curtainIn(): Promise<void> {
  const el = document.querySelector<HTMLElement>('.curtain');
  if (!el || !motionAllowed()) return Promise.resolve();
  return new Promise((resolve) => {
    gsap.fromTo(el, { scaleY: 0, transformOrigin: 'bottom' }, { scaleY: 1, duration: 0.55, ease: 'expo.inOut', onComplete: () => resolve() });
  });
}

function curtainOut(): void {
  const el = document.querySelector<HTMLElement>('.curtain');
  if (!el || !motionAllowed()) return;
  gsap.fromTo(el, { scaleY: 1, transformOrigin: 'top' }, { scaleY: 0, duration: 0.7, ease: 'expo.inOut', delay: 0.05 });
}

export function initMicro(): void {
  ensureCursor();
  ensurePreview();
  document.addEventListener('astro:page-load', build);
  document.addEventListener('astro:before-preparation', (e) => {
    const ev = e as Event & { loader: () => Promise<void> };
    const original = ev.loader;
    ev.loader = async () => {
      await Promise.all([curtainIn(), original()]);
    };
  });
  document.addEventListener('astro:after-swap', () => {
    reattach();
    getLenis()?.scrollTo(0, { immediate: true });
    curtainOut();
  });

  document.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerleave', onLeave as EventListener, true);
  document.addEventListener('pointerover', (e) => {
    const t = e.target as Element | null;
    cursorState(t);
    previewState(t);
    const s = t?.closest<HTMLElement>('[data-scramble]');
    if (s && motionAllowed()) scramble(s);
    const letter = t instanceof HTMLElement && t.hasAttribute('data-wave-ch') ? t : null;
    if (letter && motionAllowed()) {
      gsap.fromTo(letter, { y: 0 }, { y: '-0.18em', duration: 0.25, yoyo: true, repeat: 1, ease: 'power2.out' });
    }
  });

  document.addEventListener('click', (e) => {
    const btn = (e.target as Element | null)?.closest<HTMLElement>('[data-switch-to]');
    const root = btn?.closest<HTMLElement>('[data-switch]');
    if (btn && root) switchTo(root, Number(btn.dataset.switchTo));
  });
  document.addEventListener('keydown', (e) => {
    const btn = (e.target as Element | null)?.closest<HTMLElement>('[data-switch-to]');
    const root = btn?.closest<HTMLElement>('[data-switch]');
    if (!btn || !root || !['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const all = [...root.querySelectorAll<HTMLElement>('[data-switch-to]')];
    const step = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1;
    const next = all[(all.indexOf(btn) + step + all.length) % all.length];
    e.preventDefault();
    next.focus();
    switchTo(root, Number(next.dataset.switchTo));
  });

  document.addEventListener('click', async (e) => {
    const a = (e.target as Element | null)?.closest<HTMLElement>('[data-copy="email"]');
    if (!a || !SITE.email) return;
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(SITE.email);
      toast('Email copied');
    } catch {
      window.location.href = `mailto:${SITE.email}`;
    }
  });
}
