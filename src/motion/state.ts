import { writePrefs } from '~/lib/prefs';

/** One shared answer to "may things move?": the system reduced-motion setting plus the site's Pause motion control. */
type Listener = (state: { reduced: boolean; paused: boolean }) => void;

const query = window.matchMedia('(prefers-reduced-motion: reduce)');
let paused = document.documentElement.dataset.motion === 'paused';
const listeners = new Set<Listener>();

export const isReduced = () => query.matches;
export const isPaused = () => paused;
export const motionAllowed = () => !query.matches && !paused;

export function onMotionChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function apply(): void {
  const root = document.documentElement;
  root.dataset.motion = paused ? 'paused' : 'on';
  root.classList.toggle('js-motion', motionAllowed());
  listeners.forEach((fn) => fn({ reduced: query.matches, paused }));
}

export function setPaused(value: boolean): void {
  paused = value;
  writePrefs({ motion: value ? 'paused' : 'on' });
  apply();
}

export function initMotionState(): void {
  query.addEventListener('change', apply);
  apply();
}
