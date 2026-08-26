import raw from '$data/schools.json';
import extendedRaw from '$data/extended.json';
import type { School, Source, SchoolExtended } from './types';

export const schoolsBySource = raw as Record<Source, School[]>;
const staticExtendedMap = extendedRaw as Record<Source, Record<string, SchoolExtended>>;

/** Key used to match schools with extended data */
export function schoolKey(name: string, institute: string): string {
  return `${name}::${institute}`;
}

/**
 * Get schools for a source, merged with extended fields.
 * Priority: localStorage extracted > static extended.json > base school data
 *
 * Note: localStorage extractedMap is imported at the call site (App.svelte)
 * and passed in to keep reactivity working correctly with Svelte 5 runes.
 */
export function getSchools(src: Source): School[] {
  return getSchoolsWithExtracted(src, {});
}

export function getSchoolsWithExtracted(src: Source, userExtracted: Record<string, SchoolExtended>): School[] {
  const schools = schoolsBySource[src] ?? [];
  const staticExt = staticExtendedMap[src] ?? {};
  return schools.map((s) => {
    const key = schoolKey(s.name, s.institute);
    // localStorage extracted takes priority over static extended
    const userExt = userExtracted[key];
    const staticExtEntry = staticExt[key];
    const extension = userExt ?? staticExtEntry;
    return extension ? { ...s, ...extension } : s;
  });
}

export function sourceCounts(): Record<Source, number> {
  return {
    camp2026: schoolsBySource.camp2026?.length ?? 0,
    camp2025: schoolsBySource.camp2025?.length ?? 0,
    camp2024: schoolsBySource.camp2024?.length ?? 0,
    yutuimian2024: schoolsBySource.yutuimian2024?.length ?? 0,
  };
}
