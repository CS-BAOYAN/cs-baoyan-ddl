import type { DerivedSchool, FilterState, School, UserProgress, ProgressStatus } from './types';
import { parseDeadline, urgency } from './time';
import { resolveProvince } from '$data/provinces';

export function deriveSchool(s: School, nowMs: number): DerivedSchool {
  const deadlineMs = parseDeadline(s.deadline);
  const remainingMs = deadlineMs === null ? null : deadlineMs - nowMs;
  return {
    ...s,
    deadlineMs,
    remainingMs,
    urgency: urgency(remainingMs),
  };
}

interface ApplyOpts {
  query: string;
  tags: readonly string[];
  status: readonly string[]; // 已开营 / 已结营
  provinces: readonly string[];
}

/** Pure: filter + sort. Caller passes already-derived rows. */
export function applyFilters(
  rows: readonly DerivedSchool[],
  { query, tags, status, provinces }: ApplyOpts,
): DerivedSchool[] {
  const q = query.trim().toLowerCase();
  const tagSet = new Set(tags);
  const statusSet = new Set(status);
  const provSet = new Set(provinces);

  const out = rows.filter((r) => {
    // school-tier tags: OR across selected
    if (tagSet.size > 0) {
      const hit = r.tags.some((t) => tagSet.has(t));
      if (!hit) return false;
    }
    // status tags: AND
    if (statusSet.size > 0) {
      for (const st of statusSet) {
        if (!r.tags.includes(st)) return false;
      }
    }
    // search across name + institute (case-insensitive)
    if (q) {
      const hay = `${r.name} ${r.institute}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    // province
    if (provSet.size > 0) {
      const p = resolveProvince(r.name, r.province);
      if (!p || !provSet.has(p)) return false;
    }
    return true;
  });

  // sort: not-yet-due first by ascending remaining; then expired by most-recent; then unknown last
  out.sort((a, b) => {
    const aBucket = a.remainingMs === null ? 2 : a.remainingMs < 0 ? 1 : 0;
    const bBucket = b.remainingMs === null ? 2 : b.remainingMs < 0 ? 1 : 0;
    if (aBucket !== bBucket) return aBucket - bBucket;
    if (aBucket === 0) return (a.remainingMs as number) - (b.remainingMs as number);
    if (aBucket === 1) return (b.remainingMs as number) - (a.remainingMs as number);
    return a.name.localeCompare(b.name, 'zh-CN');
  });

  return out;
}

/** Filter rows by personal progress tracking state */
export function applyProgressFilter(
  rows: readonly DerivedSchool[],
  progressMap: Record<string, UserProgress>,
  opts: { showOnlyTracked: boolean; statusFilter: readonly ProgressStatus[] },
): DerivedSchool[] {
  const { showOnlyTracked, statusFilter } = opts;
  if (!showOnlyTracked && statusFilter.length === 0) return [...rows];

  return rows.filter((r) => {
    const key = `${r.name}::${r.institute}`;
    const p = progressMap[key];
    if (showOnlyTracked && !p) return false;
    if (statusFilter.length > 0 && (!p || !statusFilter.includes(p.status))) return false;
    return true;
  });
}

/** Filter rows to only show watched (favorited) schools */
export function applyWatchedFilter(
  rows: readonly DerivedSchool[],
  watchedMap: Record<string, boolean>,
  showOnlyWatched: boolean,
): DerivedSchool[] {
  if (!showOnlyWatched) return [...rows];
  return rows.filter((r) => !!watchedMap[`${r.name}::${r.institute}`]);
}

/** Filter rows to only show scheduled schools */
export function applyScheduledFilter(
  rows: readonly DerivedSchool[],
  scheduledMap: Record<string, boolean>,
  showOnlyScheduled: boolean,
): DerivedSchool[] {
  if (!showOnlyScheduled) return [...rows];
  return rows.filter((r) => !!scheduledMap[`${r.name}::${r.institute}`]);
}
