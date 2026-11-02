/** The one localStorage entry this site keeps (described on /privacy): theme and motion preferences. */
export interface Prefs {
  theme?: 'light' | 'dark';
  motion?: 'paused' | 'on';
}

const KEY = 'kks-prefs';

export function readPrefs(): Prefs {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Prefs;
  } catch {
    return {};
  }
}

export function writePrefs(update: Prefs): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...readPrefs(), ...update }));
  } catch {
    /* storage unavailable: the choice lasts for this visit */
  }
}
