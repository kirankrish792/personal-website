/**
 * Interaction for the Home hero ([data-hero], src/components/HomeHero.astro):
 *   - letters lift and warm in colour as the cursor passes near them;
 *   - a soft glow follows the cursor (--mx, --my on the section);
 *   - the greeting matches the time of day in Kozhikode;
 *   - scrolling away drifts the three lines apart and fades them, like an opening shot.
 * Pointer effects run only with a fine pointer and motion allowed; everything is rebuilt per page.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motionAllowed } from './state';

gsap.registerPlugin(ScrollTrigger);

let cleanup: (() => void) | null = null;

function greeting(): string {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Asia/Kolkata' }).format(new Date()));
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function build(): void {
  cleanup?.();
  cleanup = null;
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (!hero) return;
  const hello = hero.querySelector<HTMLElement>('[data-hero-greeting]');
  if (hello) hello.textContent = greeting();
  // Open the letter masks once the rise has finished (immediately when motion is off).
  const settle = window.setTimeout(() => (hero.dataset.settled = ''), motionAllowed() ? 2300 : 0);
  if (!motionAllowed()) return;

  const disposers: (() => void)[] = [() => window.clearTimeout(settle)];

  // Scroll: the lines drift apart and fade as the hero leaves.
  const lines = [...hero.querySelectorAll<HTMLElement>('[data-hero-line]')];
  const drift = [-6, 5, -3];
  const tween = gsap.to(lines, {
    xPercent: (i: number) => drift[i] ?? 0,
    opacity: 0.15,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 },
  });
  disposers.push(() => {
    tween.scrollTrigger?.kill();
    tween.kill();
    gsap.set(lines, { clearProps: 'transform,opacity' });
  });

  if (window.matchMedia('(pointer: fine)').matches) {
    const letters = [...hero.querySelectorAll<HTMLElement>('.hero__lift')];
    let boxes: { el: HTMLElement; x: number; y: number }[] = [];
    let measuredAt = -1;
    const measure = () => {
      measuredAt = window.scrollY;
      boxes = letters.map((el) => {
        const r = el.getBoundingClientRect();
        return { el, x: r.left + r.width / 2, y: r.top + r.height / 2 + window.scrollY };
      });
    };
    // Measure once the letters have finished rising.
    const measureTimer = window.setTimeout(measure, 2200);
    window.addEventListener('resize', measure);

    let mx = 0;
    let my = 0;
    let gx = 0;
    let gy = 0;
    let raf = 0;
    let inside = false;
    const lifted = new Set<HTMLElement>();
    const R = 160;

    const frame = () => {
      raf = 0;
      // Glow eases toward the pointer.
      gx += (mx - gx) * 0.12;
      gy += (my - gy) * 0.12;
      const rect = hero.getBoundingClientRect();
      hero.style.setProperty('--mx', `${gx - rect.left}px`);
      hero.style.setProperty('--my', `${gy - rect.top}px`);
      const py = my + window.scrollY;
      for (const b of boxes) {
        const d = Math.hypot(b.x - mx, b.y - py);
        if (d < R) {
          const k = 1 - d / R;
          b.el.style.transform = `translateY(${(-k * 0.14).toFixed(3)}em) rotate(${((b.x - mx) / R) * -4 * k}deg)`;
          b.el.style.color = k > 0.55 ? 'var(--coral-ink)' : '';
          lifted.add(b.el);
        } else if (lifted.has(b.el)) {
          b.el.style.transform = '';
          b.el.style.color = '';
          lifted.delete(b.el);
        }
      }
      if (inside && (Math.abs(mx - gx) > 0.5 || Math.abs(my - gy) > 0.5)) raf = requestAnimationFrame(frame);
    };
    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (!inside) {
        inside = true;
        gx = mx;
        gy = my;
        hero.dataset.pointer = '';
      }
      // The lines drift as the page scrolls, so re-measure when the scroll position has moved.
      if (!boxes.length || Math.abs(window.scrollY - measuredAt) > 4) measure();
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const onLeave = () => {
      inside = false;
      delete hero.dataset.pointer;
      for (const el of lifted) {
        el.style.transform = '';
        el.style.color = '';
      }
      lifted.clear();
    };
    hero.addEventListener('pointermove', onMove, { passive: true });
    hero.addEventListener('pointerleave', onLeave);
    disposers.push(() => {
      window.clearTimeout(measureTimer);
      window.removeEventListener('resize', measure);
      cancelAnimationFrame(raf);
      hero.removeEventListener('pointermove', onMove);
      hero.removeEventListener('pointerleave', onLeave);
      onLeave();
    });
  }

  cleanup = () => disposers.forEach((d) => d());
}

export function initHero(): void {
  document.addEventListener('astro:page-load', build);
  document.addEventListener('astro:before-swap', () => {
    cleanup?.();
    cleanup = null;
  });
}
