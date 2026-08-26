/**
 * Personal extracted extended data (from LLM extraction).
 * Stored in localStorage, merged with static extended.json at runtime.
 */
import type { SchoolExtended } from './types';
import { schoolKey } from './schools';

const STORAGE_KEY = 'cs-baoyan-ddl-extracted';
const DEBOUNCE_MS = 500;

function readFromStorage(): Record<string, SchoolExtended> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Reactive extracted data — keyed by "${name}::${institute}" */
export const extractedMap: Record<string, SchoolExtended> = $state(readFromStorage());

// Auto-save to LocalStorage with debounce
$effect.root(() => {
  let timer: number;
  $effect(() => {
    const serialized = JSON.stringify(extractedMap);
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, serialized);
    }, DEBOUNCE_MS);
  });
});

/* ── CRUD ── */

export function setExtracted(name: string, institute: string, data: SchoolExtended) {
  extractedMap[schoolKey(name, institute)] = {
    ...data,
    last_verified: data.last_verified ?? new Date().toISOString().slice(0, 10),
  };
}

export function getExtracted(name: string, institute: string): SchoolExtended | undefined {
  return extractedMap[schoolKey(name, institute)];
}

export function removeExtracted(name: string, institute: string) {
  delete extractedMap[schoolKey(name, institute)];
}

/** Batch set from extraction results */
export function batchSetExtracted(entries: Array<{ key: string; data: SchoolExtended }>) {
  for (const { key, data } of entries) {
    extractedMap[key] = {
      ...data,
      last_verified: data.last_verified ?? new Date().toISOString().slice(0, 10),
    };
  }
}

/** Get all extracted data as a plain object (for export) */
export function getAllExtracted(): Record<string, SchoolExtended> {
  return { ...extractedMap };
}

/** Count of extracted entries */
export function extractedCount(): number {
  return Object.keys(extractedMap).length;
}
