export type Source = 'camp2026' | 'camp2025' | 'camp2024' | 'yutuimian2024';

export const SOURCES: { id: Source; label: string }[] = [
  { id: 'camp2026', label: '夏令营 2026' },
  { id: 'camp2025', label: '夏令营 2025' },
  { id: 'camp2024', label: '夏令营 2024' },
  { id: 'yutuimian2024', label: '预推免 2024' },
];

export interface School {
  name: string;
  institute: string;
  description: string;
  deadline: string;
  website: string;
  tags: string[];
  province?: string;
}

/** Extended fields for camp info (from extended.json, merged at load time) */
export interface SchoolExtended {
  camp_start?: string;
  camp_end?: string;
  reimbursement?: {
    food_accommodation: boolean | null;
    travel?: string;
    other?: string;
  };
  other_notes?: string;
  last_verified?: string;
}

/** Structure of extended.json */
export type ExtendedData = Record<Source, Record<string, SchoolExtended>>;

export const SCHOOL_TAGS = ['TOP2', '港三', '华五', 'C9', '985', '211', '双非', '四非', '研究院', '联培'] as const;
export type SchoolTag = (typeof SCHOOL_TAGS)[number];

export const STATUS_TAGS = ['已开营', '已结营'] as const;
export type StatusTag = (typeof STATUS_TAGS)[number];

export type ViewMode = 'list' | 'calendar';

export interface FilterState {
  source: Source;
  view: ViewMode;
  query: string;
  tags: SchoolTag[];
  status: StatusTag[];
  provinces: string[];
  showOnlyTracked: boolean;
  showOnlyWatched: boolean;
  showOnlyScheduled: boolean;
  progressStatuses: ProgressStatus[];
}

export type Urgency = 'expired' | 'critical' | 'soon' | 'near' | 'far' | 'unknown';

export interface DerivedSchool extends School, SchoolExtended {
  /** ms epoch; null if no deadline */
  deadlineMs: number | null;
  /** ms remaining; null if no deadline. Negative if expired. */
  remainingMs: number | null;
  urgency: Urgency;
}

/* ── Personal progress tracking ── */

export const PROGRESS_STATUSES = [
  '未申请', '已报名', '已入营', '优营', '待录取', '已拒', '放弃', '待确认',
] as const;
export type ProgressStatus = (typeof PROGRESS_STATUSES)[number];

export interface UserProgress {
  status: ProgressStatus;
  apply_date?: string;
  notes?: string;
  attachments?: string[];
  updated_at: string;
}
