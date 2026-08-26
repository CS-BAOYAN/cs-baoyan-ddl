/**
 * Scheduled schools (added to camp schedule).
 * Subset of watched schools that the user explicitly adds to the schedule.
 * Stored in localStorage.
 */
import { schoolKey } from './schools';

const STORAGE_KEY = 'cs-baoyan-ddl-scheduled';
const DEBOUNCE_MS = 300;

function readFromStorage(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Reactive scheduled map */
export const scheduledMap: Record<string, boolean> = $state(readFromStorage());

$effect.root(() => {
  let timer: number;
  $effect(() => {
    const serialized = JSON.stringify(scheduledMap);
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, serialized);
    }, DEBOUNCE_MS);
  });
});

export function isScheduled(name: string, institute: string): boolean {
  return !!scheduledMap[schoolKey(name, institute)];
}

export function toggleScheduled(name: string, institute: string) {
  const key = schoolKey(name, institute);
  if (scheduledMap[key]) {
    delete scheduledMap[key];
  } else {
    scheduledMap[key] = true;
  }
}

export function scheduledCount(): number {
  return Object.keys(scheduledMap).length;
}
