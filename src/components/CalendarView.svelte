<script lang="ts">
  import { ChevronLeft, ChevronRight, CalendarRange } from 'lucide-svelte';
  import type { DerivedSchool } from '$lib/types';
  import { dateKey, startOfDay } from '$lib/time';
  import { clock } from '$lib/clock.svelte';
  import { getProgress } from '$lib/progress.svelte';
  import { progressStatusColor } from '$lib/progressColors';

  let { rows, onSelect }: { rows: DerivedSchool[]; onSelect: (key: string) => void } = $props();

  // current visible month — initialise to the month of the earliest live deadline
  function pickInitialMonth(): { y: number; m: number } {
    const now = new Date(clock.now);
    let earliest: number | null = null;
    for (const r of rows) {
      if (r.deadlineMs !== null && r.remainingMs !== null && r.remainingMs >= 0) {
        if (earliest === null || r.deadlineMs < earliest) earliest = r.deadlineMs;
      }
    }
    const target = earliest ? new Date(earliest) : now;
    return { y: target.getFullYear(), m: target.getMonth() };
  }

  let cursor = $state(pickInitialMonth());

  // group rows by date key for the visible month
  const byDay = $derived.by(() => {
    const map = new Map<string, DerivedSchool[]>();
    for (const r of rows) {
      if (r.deadlineMs === null) continue;
      const k = dateKey(r.deadlineMs);
      const arr = map.get(k);
      if (arr) arr.push(r);
      else map.set(k, [r]);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => (a.deadlineMs ?? 0) - (b.deadlineMs ?? 0));
    }
    return map;
  });

  const grid = $derived.by(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const startDow = first.getDay(); // 0=Sun
    // we want week starting on Monday for CN audience
    const offset = (startDow + 6) % 7;
    const start = new Date(cursor.y, cursor.m, 1 - offset);
    const cells: { ms: number; key: string; inMonth: boolean }[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const ms = d.getTime();
      cells.push({
        ms,
        key: dateKey(ms),
        inMonth: d.getMonth() === cursor.m,
      });
    }
    return cells;
  });

  const todayKey = $derived(dateKey(startOfDay(clock.now)));

  const monthLabel = $derived(`${cursor.y} 年 ${cursor.m + 1} 月`);

  function prev() {
    const m = cursor.m === 0 ? 11 : cursor.m - 1;
    const y = cursor.m === 0 ? cursor.y - 1 : cursor.y;
    cursor = { y, m };
  }
  function next() {
    const m = cursor.m === 11 ? 0 : cursor.m + 1;
    const y = cursor.m === 11 ? cursor.y + 1 : cursor.y;
    cursor = { y, m };
  }
  function jumpToday() {
    const d = new Date(clock.now);
    cursor = { y: d.getFullYear(), m: d.getMonth() };
  }

  const wd = ['一', '二', '三', '四', '五', '六', '日'];

  function pillClass(r: DerivedSchool): string {
    const p = getProgress(r.name, r.institute);
    if (p) return progressStatusColor(p.status).text;
    return `urge-${r.urgency}`;
  }
  function dotClass(r: DerivedSchool): string {
    const p = getProgress(r.name, r.institute);
    if (p) return progressStatusColor(p.status).dot;
    return `bg-urge-${r.urgency}`;
  }
</script>

<div class="surface-1 border border-line rounded-xl overflow-hidden flex flex-col">
  <!-- header -->
  <div class="px-4 py-2.5 border-b border-line flex items-center gap-3 surface-2">
    <CalendarRange class="w-4 h-4 text-fg-2" />
    <div class="text-fg-0 font-medium tabular">{monthLabel}</div>
    <div class="flex-1"></div>
    <button class="px-2.5 py-1 text-xs text-fg-1 hover:surface-3 rounded transition" onclick={jumpToday}>
      今日
    </button>
    <div class="flex items-center gap-0.5">
      <button class="p-1 rounded hover:surface-3 transition" onclick={prev} aria-label="上个月">
        <ChevronLeft class="w-4 h-4 text-fg-1" />
      </button>
      <button class="p-1 rounded hover:surface-3 transition" onclick={next} aria-label="下个月">
        <ChevronRight class="w-4 h-4 text-fg-1" />
      </button>
    </div>
  </div>

  <!-- weekday header -->
  <div class="grid grid-cols-7 border-b border-line">
    {#each wd as w}
      <div class="text-fg-3 text-[10.5px] uppercase tracking-[0.16em] text-center py-1.5">{w}</div>
    {/each}
  </div>

  <!-- grid -->
  <div class="grid grid-cols-7 grid-rows-6 flex-1 min-h-[640px]">
    {#each grid as cell, i}
      {@const items = byDay.get(cell.key) ?? []}
      {@const isToday = cell.key === todayKey}
      <div
        class="relative border-r border-b border-line p-1.5 sm:p-2 flex flex-col gap-1 min-h-[88px] {cell.inMonth ? '' : 'opacity-40'} {(i + 1) % 7 === 0 ? 'border-r-0' : ''} {i >= 35 ? 'border-b-0' : ''}"
      >
        <div class="flex items-center justify-between">
          <span class="text-[11px] tabular {isToday ? 'urge-far font-semibold' : 'text-fg-3'}">
            {new Date(cell.ms).getDate()}
          </span>
          {#if items.length > 3}
            <span class="text-[10px] text-fg-4 tabular">+{items.length - 3}</span>
          {/if}
        </div>
        <div class="flex flex-col gap-0.5 min-h-0">
          {#each items.slice(0, 3) as r, ri (r.name + '|' + r.institute + '|' + (r.deadlineMs ?? ri))}
            <button
              onclick={() => onSelect(`${r.name}::${r.institute}`)}
              class="group min-w-0 text-left flex items-center gap-1.5 surface-2 hover:surface-3 transition rounded-md px-1.5 py-1 border border-transparent hover:border-line"
              title="{r.name} · {r.institute}"
            >
              <span class="w-1 h-1 rounded-full shrink-0 {dotClass(r)}"></span>
              <span class="text-[11px] {pillClass(r)} truncate">{r.name}</span>
            </button>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>
