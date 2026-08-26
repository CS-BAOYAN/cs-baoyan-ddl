/**
 * Personal application progress tracking.
 * Uses LocalStorage for persistence and Svelte 5 runes for reactivity.
 */
import type { UserProgress, ProgressStatus } from './types';
import { schoolKey } from './schools';

const STORAGE_KEY = 'cs-baoyan-ddl-progress';
const DEBOUNCE_MS = 500;

function readFromStorage(): Record<string, UserProgress> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Reactive progress map — keyed by "${name}::${institute}" */
export const progressMap: Record<string, UserProgress> = $state(readFromStorage());

// Auto-save to LocalStorage with debounce
$effect.root(() => {
  let timer: number;
  $effect(() => {
    // Serialise triggers reactivity on every nested property change
    const serialized = JSON.stringify(progressMap);
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, serialized);
    }, DEBOUNCE_MS);
  });
});

/* ── CRUD helpers ── */

export function getProgress(name: string, institute: string): UserProgress | undefined {
  return progressMap[schoolKey(name, institute)];
}

export function setProgress(name: string, institute: string, data: Omit<UserProgress, 'updated_at'>) {
  const key = schoolKey(name, institute);
  progressMap[key] = {
    ...data,
    updated_at: new Date().toISOString(),
  };
}

export function updateProgressStatus(name: string, institute: string, status: ProgressStatus) {
  const key = schoolKey(name, institute);
  const existing = progressMap[key];
  if (existing) {
    progressMap[key] = { ...existing, status, updated_at: new Date().toISOString() };
  } else {
    progressMap[key] = {
      status,
      updated_at: new Date().toISOString(),
    };
  }
}

export function removeProgress(name: string, institute: string) {
  delete progressMap[schoolKey(name, institute)];
}

/* ── Import / Export ── */

interface ExportData {
  version: number;
  exported_at: string;
  progress: Record<string, UserProgress>;
}

export function exportProgress(): ExportData {
  return {
    version: 1,
    exported_at: new Date().toISOString(),
    progress: { ...progressMap },
  };
}

export function downloadProgressJson() {
  const data = exportProgress();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `cs-baoyan-ddl-progress-${dateStr}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

type ImportMode = 'merge' | 'overwrite';

export function importProgressJson(json: string, mode: ImportMode): { count: number; error?: string } {
  try {
    const parsed = JSON.parse(json) as ExportData;
    if (!parsed.progress || typeof parsed.progress !== 'object') {
      return { count: 0, error: '无效的 JSON 格式：缺少 progress 字段' };
    }

    const entries = Object.entries(parsed.progress);
    if (mode === 'overwrite') {
      // Clear existing
      for (const key of Object.keys(progressMap)) {
        delete progressMap[key];
      }
    }

    let count = 0;
    for (const [key, value] of entries) {
      if (mode === 'merge' && progressMap[key]) continue; // keep existing
      progressMap[key] = value;
      count++;
    }
    return { count };
  } catch {
    return { count: 0, error: 'JSON 解析失败' };
  }
}
