/**
 * Drives the company scenes on Home ([data-company], src/components/Companies.astro).
 *
 * Desktop, motion allowed: each scene pins (CSS sticky) while one scrubbed timeline plays across its
 * scroll range: the brand panel irises open from a point, the logo mark turns and settles at its
 * centre, the wordmark wipes in from the left, the details slide in, and at the end the scene eases
 * back and fades as the next one arrives.
 * Always: hovering or focusing a product ([data-co-show="Name|Note"]) swaps the panel's caption.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motionAllowed } from './state';

gsap.registerPlugin(ScrollTrigger);

let mm: gsap.MatchMedia | null = null;

function caption(scene: HTMLElement, name: string, note: string): void {
  const box = scene.querySelector<HTMLElement>('.co__caption');
  const nameEl = scene.querySelector<HTMLElement>('[data-co-caption-name]');
  const noteEl = scene.querySelector<HTMLElement>('[data-co-caption-note]');
  if (!box || !nameEl || !noteEl || (nameEl.textContent === name && noteEl.textContent === note)) return;
  box.dataset.swapping = '';
  window.setTimeout(() => {
    nameEl.textContent = name;
    noteEl.textContent = note;
    delete box.dataset.swapping;
  }, 180);
}

function show(item: HTMLElement): void {
  const scene = item.closest<HTMLElement>('[data-company]');
  if (!scene) return;
  const [name, note] = (item.dataset.coShow ?? '').split('|');
  caption(scene, name, note);
  scene.querySelectorAll<HTMLElement>('[data-co-show]').forEach((i) => i.toggleAttribute('data-active', i === item));
}

function reset(scene: HTMLElement): void {
  const title = scene.querySelector<HTMLElement>('[data-co-name] .logo')?.getAttribute('aria-label') ?? '';
  const site = scene.querySelector<HTMLElement>('[data-co-caption-note]')?.dataset.default ?? '';
  caption(scene, title, site);
  scene.querySelectorAll<HTMLElement>('[data-co-show]').forEach((i) => i.removeAttribute('data-active'));
}

function build(): void {
  mm?.revert();
  mm = null;
  const scenes = [...document.querySelectorAll<HTMLElement>('[data-company]')];
  if (!scenes.length || !motionAllowed()) return;
  mm = gsap.matchMedia();
  mm.add('(min-width: 56.01rem)', () => {
    scenes.forEach((scene) => {
      const stage = scene.querySelector<HTMLElement>('.co__stage');
      const panel = scene.querySelector<HTMLElement>('[data-co-panel]');
      const mark = scene.querySelector<HTMLElement>('[data-co-mark]');
      const word = scene.querySelector<HTMLElement>('[data-co-name]');
      const meta = scene.querySelector<HTMLElement>('[data-co-meta]');
      const index = scene.querySelector<HTMLElement>('.co__index');
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: scene, start: 'top top', end: 'bottom bottom', scrub: 0.8 },
      });
      tl.fromTo(index, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.2 }, 0)
        .fromTo(panel, { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)', duration: 0.4, ease: 'power2.inOut' }, 0.02)
        .fromTo(mark, { scale: 0.35, rotate: -35, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, duration: 0.42, ease: 'power3.out' }, 0.1)
        .fromTo(word, { clipPath: 'inset(0% 100% 0% 0%)', x: -40 }, { clipPath: 'inset(0% 0% 0% 0%)', x: 0, duration: 0.42, ease: 'power2.out' }, 0.12)
        .fromTo(meta ? [...meta.children] : [], { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.2, stagger: 0.05, ease: 'power2.out' }, 0.28)
        // Hold, then leave: the scene eases back and fades as the next one arrives.
        .to({}, { duration: 0.25 })
        .to(stage, { scale: 0.94, opacity: 0, duration: 0.2, ease: 'power1.in' }, '>');
      return () => tl.scrollTrigger?.kill();
    });
  });
}

export function initCompanies(): void {
  document.addEventListener('astro:page-load', build);
  document.addEventListener('astro:before-swap', () => {
    mm?.revert();
    mm = null;
  });
  const onEnter = (e: Event) => {
    const item = (e.target as Element | null)?.closest<HTMLElement>('[data-co-show]');
    if (item) show(item);
  };
  document.addEventListener('pointerover', onEnter);
  document.addEventListener('focusin', onEnter);
  // Leaving the list returns the caption to the company's own site.
  document.addEventListener('pointerout', (e) => {
    const from = (e.target as Element | null)?.closest<HTMLElement>('.co__list');
    const to = (e as PointerEvent).relatedTarget as Element | null;
    if (from && !from.contains(to)) {
      const scene = from.closest<HTMLElement>('[data-company]');
      if (scene) reset(scene);
    }
  });
}
