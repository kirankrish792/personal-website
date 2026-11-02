import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motionAllowed, onMotionChange } from './state';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

export const getLenis = () => lenis;

const tick = (time: number) => lenis?.raf(time * 1000);

function start(): void {
  if (lenis) return;
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false, anchors: true, autoRaf: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
}

function stop(): void {
  if (!lenis) return;
  gsap.ticker.remove(tick);
  lenis.destroy();
  lenis = null;
}

function markScrolled(): void {
  document.documentElement.toggleAttribute('data-scrolled', window.scrollY > 8);
}

export function initSmoothScroll(): void {
  const apply = () => (motionAllowed() ? start() : stop());
  apply();
  onMotionChange(apply);
  window.addEventListener('scroll', markScrolled, { passive: true });
  // Astro has already restored or reset the scroll position when after-swap fires.
  document.addEventListener('astro:after-swap', () => {
    lenis?.resize();
    lenis?.scrollTo(window.scrollY, { immediate: true, force: true });
    markScrolled();
  });
  document.addEventListener('astro:before-preparation', () => lenis?.stop());
  document.addEventListener('astro:page-load', () => lenis?.start());
}
