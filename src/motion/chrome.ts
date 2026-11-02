/** Chrome that persists across page swaps: menu, motion toggle and the current-page arrow. */
import { isPaused, setPaused } from './state';

function syncControls(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-action="motion"]').forEach((b) => {
    b.setAttribute('aria-pressed', String(!isPaused()));
  });
  document.querySelectorAll('[data-motion-state]').forEach((el) => (el.textContent = isPaused() ? 'Off' : 'On'));
}

function routeOf(path: string): string {
  const p = path.replace(/\.html$/, '').replace(/\/$/, '');
  return p || '/';
}

function markCurrent(): void {
  const here = routeOf(location.pathname);
  document.querySelectorAll<HTMLAnchorElement>('[data-nav-link]').forEach((a) => {
    const href = routeOf(new URL(a.href).pathname);
    const current = href === '/' ? here === '/' : here === href || here.startsWith(`${href}/`);
    if (current) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

/**
 * The menu list is open either because Menu was clicked (pinned: it stays until Menu is clicked
 * again, a click lands elsewhere, Escape, or navigation) or because the pointer is over Menu or the
 * list (hover: it closes a moment after the pointer leaves both, so crossing the gap is safe).
 */
let pinned = false;
let closeTimer = 0;

function setMenu(open: boolean): void {
  const chrome = document.querySelector<HTMLElement>('[data-nav]');
  const button = document.querySelector<HTMLButtonElement>('[data-action="menu"]');
  if (!chrome || !button) return;
  window.clearTimeout(closeTimer);
  if (!open) pinned = false;
  chrome.toggleAttribute('data-open', open);
  button.setAttribute('aria-expanded', String(open));
}

const inMenuZone = (t: Element | null) => !!t?.closest('[data-action="menu"], .menu');

export function initChrome(): void {
  document.documentElement.dataset.theme = 'light';

  document.addEventListener('click', (e) => {
    const el = (e.target as Element | null)?.closest<HTMLElement>('[data-action]');
    if (!el) return;
    if (el.dataset.action === 'motion') {
      setPaused(!isPaused());
      syncControls();
    }
    if (el.dataset.action === 'menu') {
      // A click pins the menu open, even if hovering had already opened it; a second click closes it.
      if (pinned) setMenu(false);
      else {
        setMenu(true);
        pinned = true;
      }
    }
  });

  // A click outside the menu closes a pinned menu.
  document.addEventListener('click', (e) => {
    const t = e.target as Element | null;
    if (pinned && !inMenuZone(t)) setMenu(false);
  });

  // On desktop, hovering Menu shows the tucked-away list; it closes shortly after the pointer leaves
  // both Menu and the list (unless pinned by a click).
  document.addEventListener('pointerover', (e) => {
    if (!window.matchMedia('(pointer: fine) and (min-width: 56.01rem)').matches) return;
    const t = e.target as Element | null;
    if (inMenuZone(t)) {
      window.clearTimeout(closeTimer);
      if (t?.closest('[data-action="menu"]') && !document.querySelector('[data-nav][data-open]')) setMenu(true);
      return;
    }
    if (pinned || !document.querySelector('[data-nav][data-open]') || window.scrollY <= 8) return;
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      if (!pinned) setMenu(false);
    }, 450);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
  });

  document.addEventListener('astro:before-swap', (e) => {
    const next = (e as Event & { newDocument: Document }).newDocument.documentElement;
    const root = document.documentElement;
    next.dataset.theme = 'light';
    next.dataset.motion = root.dataset.motion ?? 'on';
    next.className = root.className;
  });

  document.addEventListener('astro:after-swap', () => {
    markCurrent();
    setMenu(false);
    syncControls();
  });

  syncControls();
  markCurrent();
}
