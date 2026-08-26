/**
 * Map progress status to CSS color classes.
 * Returns both text and dot (background) classes.
 */
import type { ProgressStatus } from './types';

interface ColorPair {
  text: string;
  dot: string;
}

export function progressStatusColor(status: ProgressStatus): ColorPair {
  switch (status) {
    case '优营':
    case '待录取':
      return { text: 'prog-positive', dot: 'bg-prog-positive' };
    case '已报名':
    case '已入营':
    case '待确认':
      return { text: 'prog-active', dot: 'bg-prog-active' };
    case '已拒':
      return { text: 'prog-negative', dot: 'bg-prog-negative' };
    case '未申请':
    case '放弃':
    default:
      return { text: 'prog-neutral', dot: 'bg-prog-neutral' };
  }
}

/** Short label for compact display */
export function progressStatusShort(status: ProgressStatus): string {
  switch (status) {
    case '未申请': return '未';
    case '已报名': return '报';
    case '已入营': return '入';
    case '优营': return '优';
    case '待录取': return '录';
    case '已拒': return '拒';
    case '放弃': return '弃';
    case '待确认': return '待';
    default: return '?';
  }
}
