/**
 * Watched schools (favorites / bookmarks).
 * Stored in localStorage, keyed by "${name}::${institute}".
 */
import { schoolKey } from './schools';

const STORAGE_KEY = 'cs-baoyan-ddl-watched';
const DEBOUNCE_MS = 300;

function readFromStorage(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Reactive watched map */
export const watchedMap: Record<string, boolean> = $state(readFromStorage());

// Auto-save
$effect.root(() => {
  let timer: number;
  $effect(() => {
    const serialized = JSON.stringify(watchedMap);
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, serialized);
    }, DEBOUNCE_MS);
  });
});

export function isWatched(name: string, institute: string): boolean {
  return !!watchedMap[schoolKey(name, institute)];
}

export function toggleWatched(name: string, institute: string) {
  const key = schoolKey(name, institute);
  if (watchedMap[key]) {
    delete watchedMap[key];
  } else {
    watchedMap[key] = true;
  }
}

export function watchedCount(): number {
  return Object.keys(watchedMap).length;
}
