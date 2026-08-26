import type { FilterState, Source, ViewMode, ProgressStatus } from './types';
import { SOURCES, PROGRESS_STATUSES } from './types';

const DEFAULT: FilterState = {
  source: 'camp2026',
  view: 'list',
  query: '',
  tags: [],
  status: [],
  provinces: [],
  showOnlyTracked: false,
  showOnlyWatched: false,
  showOnlyScheduled: false,
  progressStatuses: [],
};

const VALID_SOURCES = new Set(SOURCES.map((s) => s.id));
const VALID_VIEWS = new Set<ViewMode>(['list', 'calendar']);
const VALID_PROG_STATUSES = new Set<string>(PROGRESS_STATUSES);

function readFromUrl(): FilterState {
  if (typeof window === 'undefined') return { ...DEFAULT };
  const p = new URLSearchParams(window.location.search);
  const src = p.get('src') as Source | null;
  const v = p.get('view') as ViewMode | null;
  const progStatuses = parseList(p.get('prog')).filter((s) => VALID_PROG_STATUSES.has(s)) as ProgressStatus[];
  return {
    source: src && VALID_SOURCES.has(src) ? src : DEFAULT.source,
    view: v && VALID_VIEWS.has(v) ? v : DEFAULT.view,
    query: p.get('q') ?? '',
    tags: parseList(p.get('tags')) as FilterState['tags'],
    status: parseList(p.get('status')) as FilterState['status'],
    provinces: parseList(p.get('prov')),
    showOnlyTracked: p.get('tracked') === '1',
    showOnlyWatched: p.get('watched') === '1',
    showOnlyScheduled: p.get('sched') === '1',
    progressStatuses: progStatuses,
  };
}

function parseList(v: string | null): string[] {
  if (!v) return [];
  return v.split(',').map((s) => s.trim()).filter(Boolean);
}

function writeToUrl(s: FilterState) {
  if (typeof window === 'undefined') return;
  const p = new URLSearchParams();
  if (s.source !== DEFAULT.source) p.set('src', s.source);
  if (s.view !== DEFAULT.view) p.set('view', s.view);
  if (s.query) p.set('q', s.query);
  if (s.tags.length) p.set('tags', s.tags.join(','));
  if (s.status.length) p.set('status', s.status.join(','));
  if (s.provinces.length) p.set('prov', s.provinces.join(','));
  if (s.showOnlyTracked) p.set('tracked', '1');
  if (s.showOnlyWatched) p.set('watched', '1');
  if (s.showOnlyScheduled) p.set('sched', '1');
  if (s.progressStatuses.length) p.set('prog', s.progressStatuses.join(','));
  const qs = p.toString();
  const url = qs ? `?${qs}` : window.location.pathname;
  window.history.replaceState(null, '', url);
}

export const filters: FilterState = $state(readFromUrl());

let initialised = false;
export function initFilterSync() {
  if (initialised) return;
  initialised = true;

  $effect.root(() => {
    $effect(() => {
      writeToUrl({
        source: filters.source,
        view: filters.view,
        query: filters.query,
        tags: filters.tags,
        status: filters.status,
        provinces: filters.provinces,
        showOnlyTracked: filters.showOnlyTracked,
        showOnlyWatched: filters.showOnlyWatched,
        showOnlyScheduled: filters.showOnlyScheduled,
        progressStatuses: filters.progressStatuses,
      });
    });
  });

  window.addEventListener('popstate', () => {
    const next = readFromUrl();
    filters.source = next.source;
    filters.view = next.view;
    filters.query = next.query;
    filters.tags = next.tags;
    filters.status = next.status;
    filters.provinces = next.provinces;
    filters.showOnlyTracked = next.showOnlyTracked;
    filters.showOnlyWatched = next.showOnlyWatched;
    filters.showOnlyScheduled = next.showOnlyScheduled;
    filters.progressStatuses = next.progressStatuses;
  });
}

export function clearAllFilters() {
  filters.query = '';
  filters.tags = [];
  filters.status = [];
  filters.provinces = [];
  filters.showOnlyTracked = false;
  filters.showOnlyWatched = false;
  filters.showOnlyScheduled = false;
  filters.progressStatuses = [];
}

export function toggle<T extends string>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
}
