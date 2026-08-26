<script lang="ts">
  import { X, ChevronLeft, ChevronRight, AlertTriangle, Calendar, Sparkles, ClipboardPaste } from 'lucide-svelte';
  import { SOURCES } from '$lib/types';
  import type { SchoolExtended } from '$lib/types';
  import { schoolsBySource } from '$lib/schools';
  import { extractedMap } from '$lib/extractedData.svelte';
  import { scheduledMap } from '$lib/scheduled.svelte';
  import { clock } from '$lib/clock.svelte';
  import { dateKey, startOfDay } from '$lib/time';
  import { extractSingle, loadConfig, saveConfig } from '$lib/extractor';
  import { batchSetExtracted } from '$lib/extractedData.svelte';

  let { onClose, onSelect }: { onClose: () => void; onSelect: (key: string) => void } = $props();

  let extracting = $state(false);
  let pasteKey = $state<string | null>(null);
  let pasteText = $state('');
  let pasteSchool = $state<{ name: string; institute: string; website: string } | null>(null);

  const now = new Date();
  let cursorY = $state(now.getFullYear());
  let cursorM = $state(now.getMonth());

  const monthLabel = $derived(`${cursorY} 年 ${cursorM + 1} 月`);
  const daysInMonth = $derived(new Date(cursorY, cursorM + 1, 0).getDate());

  function prev() { if (cursorM === 0) { cursorY--; cursorM = 11; } else { cursorM--; } }
  function next() { if (cursorM === 11) { cursorY++; cursorM = 0; } else { cursorM++; } }
  function jumpToday() { const n = new Date(); cursorY = n.getFullYear(); cursorM = n.getMonth(); }

  // Scheduled schools (deduplicated)
  const scheduledSchools = $derived.by(() => {
    const seen = new Set<string>();
    const list: Array<{ name: string; institute: string; website: string }> = [];
    for (const src of SOURCES) {
      for (const s of (schoolsBySource[src.id] ?? [])) {
        const key = `${s.name}::${s.institute}`;
        if (scheduledMap[key] && !seen.has(key)) {
          seen.add(key);
          list.push({ name: s.name, institute: s.institute, website: s.website });
        }
      }
    }
    return list;
  });

  // Camp entries: for each school, pick the source with the best dates
  interface CampEntry {
    key: string; name: string; institute: string; source: string;
    startDate: Date; endDate: Date;
    reimbursement?: { food_accommodation: boolean | null; travel?: string };
  }

  const campEntries = $derived.by((): CampEntry[] => {
    const candidates = new Map<string, Array<{ srcLabel: string; name: string; institute: string; ext: SchoolExtended }>>();

    for (const src of SOURCES) {
      for (const s of (schoolsBySource[src.id] ?? [])) {
        const key = `${s.name}::${s.institute}`;
        if (!scheduledMap[key]) continue;
        const ext = extractedMap[key];
        if (!ext) continue;
        if (!ext.camp_start && !ext.camp_end) continue;
        if (!candidates.has(key)) candidates.set(key, []);
        candidates.get(key)!.push({ srcLabel: src.label, name: s.name, institute: s.institute, ext });
      }
    }

    const result: CampEntry[] = [];
    const currentYear = new Date().getFullYear();
    for (const [key, opts] of candidates) {
      const best = opts.find((o) => o.ext.camp_start) ?? opts.find((o) => o.ext.camp_end) ?? opts[0];
      const ext = best.ext;
      const dateStr = ext.camp_start ?? ext.camp_end!;
      let start = new Date(dateStr);
      if (isNaN(start.getTime())) continue;
      // Auto-correct year: if date is from a past year, shift to current year
      if (start.getFullYear() < currentYear) {
        start = new Date(currentYear, start.getMonth(), start.getDate());
      }
      let end = ext.camp_end ? new Date(ext.camp_end) : new Date(start.getTime() + 3 * 86400000);
      if (end.getFullYear() < currentYear) {
        end = new Date(currentYear, end.getMonth(), end.getDate());
      }
      result.push({
        key, name: best.name, institute: best.institute, source: best.srcLabel,
        startDate: start, endDate: isNaN(end.getTime()) ? new Date(start.getTime() + 3 * 86400000) : end,
        reimbursement: ext.reimbursement,
      });
    }

    return result.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  });

  // Calendar grid
  const calendarGrid = $derived.by(() => {
    const first = new Date(cursorY, cursorM, 1);
    const startDow = (first.getDay() + 6) % 7;
    const start = new Date(cursorY, cursorM, 1 - startDow);
    const cells: Array<{ ms: number; key: string; day: number; inMonth: boolean;
      camps: Array<{ entry: CampEntry; isStart: boolean; isEnd: boolean }> }> = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const ms = d.getTime();
      const k = dateKey(ms);
      const dayStart = startOfDay(ms);
      const dayEnd = dayStart + 86400000 - 1;
      const inMonth = d.getMonth() === cursorM;
      const camps = campEntries
        .filter((e) => e.startDate.getTime() <= dayEnd && e.endDate.getTime() >= dayStart)
        .map((e) => ({ entry: e, isStart: startOfDay(e.startDate.getTime()) === dayStart, isEnd: startOfDay(e.endDate.getTime()) === dayStart }));
      cells.push({ ms, key: k, day: d.getDate(), inMonth, camps });
    }
    return cells;
  });

  // Conflict detection: store pairs
  const conflictPairs = $derived.by(() => {
    const pairs: Array<[CampEntry, CampEntry]> = [];
    for (let i = 0; i < campEntries.length; i++) {
      for (let j = i + 1; j < campEntries.length; j++) {
        if (campEntries[i].startDate <= campEntries[j].endDate && campEntries[i].endDate >= campEntries[j].startDate) {
          pairs.push([campEntries[i], campEntries[j]]);
        }
      }
    }
    return pairs;
  });

  const conflictKeys = $derived.by(() => {
    const set = new Set<string>();
    for (const [a, b] of conflictPairs) { set.add(a.key); set.add(b.key); }
    return set;
  });

  const todayKeyVal = $derived.by(() => {
    const n = new Date(clock.now);
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
  });

  function fmtShort(d: Date) { return `${d.getMonth() + 1}/${d.getDate()}`; }

  // Derived once per tick, not per item in loop
  const nowDate = $derived(new Date(clock.now));

  function startPaste(school: { name: string; institute: string; website: string }) {
    pasteKey = `${school.name}::${school.institute}`;
    pasteSchool = school;
    pasteText = '';
  }

  async function doPasteExtract() {
    if (!pasteKey || !pasteText.trim() || !pasteSchool) return;
    const config = loadConfig();
    if (!config.apiKey) { alert('请先配置 API Key'); return; }
    saveConfig(config);
    extracting = true;
    try {
      const result = await extractSingle(config, pasteSchool.name, pasteSchool.institute, pasteSchool.website, pasteText);
      if (result.data) batchSetExtracted([{ key: result.schoolKey, data: result.data }]);
    } finally {
      extracting = false;
      pasteKey = null;
      pasteText = '';
      pasteSchool = null;
    }
  }

  const wd = ['一', '二', '三', '四', '五', '六', '日'];
</script>

<div class="fixed inset-0 z-50 fade" role="dialog" aria-modal="true" aria-label="夏令营行程表">
  <button class="absolute inset-0 bg-black/50 backdrop-blur-[3px]" onclick={onClose} aria-label="关闭"></button>
  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-4xl max-h-[85vh] surface-1 border border-line rounded-xl shadow-2xl flex flex-col overflow-hidden">
    <!-- Header -->
    <div class="px-5 py-3 border-b border-line flex items-center gap-3 shrink-0 surface-2">
      <Calendar class="w-4 h-4 text-fg-2" />
      <h2 class="text-fg-0 font-semibold text-sm">夏令营行程表</h2>
      <span class="text-fg-4 text-xs">行程 {scheduledSchools.length} 所</span>
      <div class="flex-1"></div>
      <button class="px-2.5 py-1 text-xs text-fg-1 hover:surface-3 rounded transition" onclick={jumpToday}>今日</button>
      <div class="flex items-center gap-0.5">
        <button class="p-1 rounded hover:surface-3 transition" onclick={prev}><ChevronLeft class="w-4 h-4 text-fg-1" /></button>
        <span class="text-fg-0 text-sm font-medium tabular min-w-[100px] text-center">{monthLabel}</span>
        <button class="p-1 rounded hover:surface-3 transition" onclick={next}><ChevronRight class="w-4 h-4 text-fg-1" /></button>
      </div>
      <button onclick={onClose} class="p-1.5 rounded text-fg-3 hover:text-fg-0 hover:surface-3 transition ml-1"><X class="w-4 h-4" /></button>
    </div>

    <div class="flex-1 overflow-auto p-5">
      {#if scheduledSchools.length === 0}
        <div class="flex flex-col items-center justify-center py-20 text-center">
          <Calendar class="w-10 h-10 text-fg-4 mb-3" />
          <div class="text-fg-1 font-medium">暂无行程院校</div>
          <div class="text-fg-3 text-sm mt-1.5">请先在列表中点击 📅 将关注的院校加入行程</div>
        </div>
      {:else}

        {#if campEntries.length > 0}
          <!-- Legend -->
          <div class="flex items-center gap-4 mb-3 text-xs text-fg-3">
            <div class="flex items-center gap-1.5"><span class="w-3 h-2 rounded-sm bg-emerald-500/40 border border-emerald-500/60"></span><span>夏令营</span></div>
            <div class="flex items-center gap-1.5"><span class="w-3 h-2 rounded-sm bg-red-500/40 border border-red-500/60"></span><span>时间冲突</span></div>
            <div class="flex items-center gap-1.5"><span class="w-3 h-2 rounded-sm bg-emerald-500/40 border-2 border-amber-400"></span><span>进行中</span></div>
          </div>

          <!-- Calendar grid -->
          <div class="surface-1 border border-line rounded-xl overflow-hidden">
            <div class="grid grid-cols-7 border-b border-line">
              {#each wd as w}
                <div class="text-fg-3 text-[10.5px] uppercase tracking-[0.16em] text-center py-1.5">{w}</div>
              {/each}
            </div>
            <div class="grid grid-cols-7 grid-rows-6">
              {#each calendarGrid as cell, i}
                {@const isToday = cell.key === todayKeyVal}
                <div class="relative border-r border-b border-line p-1 flex flex-col gap-0.5 min-h-[88px]
                  {cell.inMonth ? '' : 'opacity-30'} {isToday ? 'bg-emerald-500/5' : ''}
                  {(i + 1) % 7 === 0 ? 'border-r-0' : ''} {i >= 35 ? 'border-b-0' : ''}">
                  <span class="text-[11px] tabular {isToday ? 'text-emerald-400 font-semibold' : 'text-fg-3'}">{cell.day}</span>
                  {#each cell.camps.slice(0, 3) as camp}
                    {@const hasConflict = conflictKeys.has(camp.entry.key)}
                    {@const n = new Date(clock.now)}
                    {@const isActive = camp.entry.startDate <= n && camp.entry.endDate >= n}
                    <button
                      onclick={(e) => { e.stopPropagation(); onClose(); onSelect(camp.entry.key); }}
                      class="group text-left w-full rounded px-1.5 py-0.5 text-[10px] font-medium truncate transition
                        {hasConflict ? 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'}
                        {isActive ? 'ring-1 ring-amber-400' : ''}
                        {camp.isStart ? 'rounded-l-md' : ''} {camp.isEnd ? 'rounded-r-md' : ''}"
                      title="{camp.entry.name} · {camp.entry.institute} ({fmtShort(camp.entry.startDate)} — {fmtShort(camp.entry.endDate)})">
                      {#if camp.isStart}{camp.entry.name.slice(0, 4)}{:else}<span class="opacity-50">···</span>{/if}
                    </button>
                  {/each}
                  {#if cell.camps.length > 3}
                    <span class="text-[9px] text-fg-4 px-1">+{cell.camps.length - 3} 更多</span>
                  {/if}
                </div>
              {/each}
            </div>
          </div>

          <!-- Camp list -->
          <div class="mt-4 space-y-1.5">
            <div class="text-fg-3 text-[11px] uppercase tracking-[0.14em] font-medium mb-2">全部营期</div>
            {#each campEntries as entry}
              {@const hasConflict = conflictKeys.has(entry.key)}
              {@const n = new Date(clock.now)}
              {@const isActive = entry.startDate <= n && entry.endDate >= n}
              <button onclick={() => { onClose(); onSelect(entry.key); }}
                class="w-full flex items-center gap-3 px-3 py-2 rounded-lg border transition text-left hover:surface-2 {hasConflict ? 'border-red-500/30' : 'border-line'}">
                <span class="w-2 h-2 rounded-full shrink-0 {hasConflict ? 'bg-red-400' : isActive ? 'bg-amber-400' : 'bg-emerald-400'}"></span>
                <div class="flex-1 min-w-0">
                  <span class="text-fg-0 text-xs font-medium">{entry.name}</span>
                  <span class="text-fg-3 text-xs mx-1">·</span>
                  <span class="text-fg-4 text-xs">{entry.institute}</span>
                </div>
                <span class="text-fg-3 text-xs tabular shrink-0">{fmtShort(entry.startDate)} — {fmtShort(entry.endDate)}</span>
                <span class="text-fg-4 text-[10px] shrink-0">{entry.source}</span>
                {#if entry.reimbursement?.food_accommodation === true}
                  <span class="text-emerald-400 text-xs" title="食宿报销">✓</span>
                {/if}
                {#if hasConflict}<AlertTriangle class="w-3.5 h-3.5 text-red-400 shrink-0" />{/if}
              </button>
            {/each}
          </div>

          <!-- Conflict warnings -->
          {#if conflictPairs.length > 0}
            <div class="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 space-y-2">
              <div class="flex items-center gap-2 text-red-300 text-sm font-medium">
                <AlertTriangle class="w-4 h-4" /><span>检测到 {conflictPairs.length} 组时间冲突</span>
              </div>
              {#each conflictPairs as [a, b]}
                <div class="flex items-center gap-2 text-xs pl-2">
                  <span class="text-fg-1 font-medium">{a.name}</span>
                  <span class="text-fg-4 tabular">{fmtShort(a.startDate)}-{fmtShort(a.endDate)}</span>
                  <span class="text-red-400">×</span>
                  <span class="text-fg-1 font-medium">{b.name}</span>
                  <span class="text-fg-4 tabular">{fmtShort(b.startDate)}-{fmtShort(b.endDate)}</span>
                </div>
              {/each}
              <p class="text-xs text-fg-3 mt-1">建议联系招生办确认是否可以错开时间。</p>
            </div>
          {/if}

          <div class="mt-3 text-xs text-fg-3">
            共 <span class="text-fg-0 font-medium">{campEntries.length}</span> 个营期
            {#if conflictPairs.length > 0}<span class="text-red-400">· {conflictPairs.length} 组冲突</span>{/if}
          </div>
        {/if}

        <!-- Scheduled schools with inline paste -->
        <div class="mt-4 space-y-1.5">
          <div class="text-fg-3 text-[11px] uppercase tracking-[0.14em] font-medium mb-2">行程院校</div>
          {#each scheduledSchools as s}
            {@const key = `${s.name}::${s.institute}`}
            {@const ext = extractedMap[key]}
            {@const hasDate = ext?.camp_start || ext?.camp_end}
            {@const isPasting = pasteKey === key}
            <div class="rounded-lg surface-2 border border-line overflow-hidden">
              <div class="flex items-center gap-3 px-3 py-2 text-xs">
                <span class="w-2 h-2 rounded-full shrink-0 {hasDate ? 'bg-emerald-400' : ext ? 'bg-amber-400' : 'bg-fg-4'}"></span>
                <span class="text-fg-0 font-medium flex-1 truncate">{s.name} · {s.institute}</span>
                {#if hasDate}
                  <span class="text-fg-3 tabular shrink-0">{ext.camp_start ?? '?'} — {ext.camp_end ?? '?'}</span>
                {:else if ext}
                  <span class="text-amber-400 text-[10px] shrink-0">无营期</span>
                {:else}
                  <span class="text-fg-4 text-[10px] shrink-0">未解析</span>
                {/if}
                <button onclick={() => isPasting ? (pasteKey = null) : startPaste(s)}
                  class="shrink-0 px-1.5 py-0.5 rounded text-[10px] border transition
                    {isPasting ? 'text-amber-300 border-amber-500/50 bg-amber-500/10'
                      : hasDate ? 'text-fg-4 hover:text-fg-2 border-line hover:surface-3'
                      : 'text-amber-400 hover:text-amber-300 border-amber-500/30 hover:bg-amber-500/10'}">
                  {isPasting ? '收起' : '粘贴解析'}
                </button>
              </div>
              {#if isPasting}
                <div class="px-3 pb-3 space-y-2 border-t border-line pt-2">
                  <textarea bind:value={pasteText} placeholder="打开通知页面，复制正文粘贴到此处..." rows="4"
                    class="w-full surface-1 border border-line rounded-md text-fg-1 text-sm px-3 py-2 outline-none focus:border-line-strong resize-y"></textarea>
                  <div class="flex gap-2">
                    <button onclick={doPasteExtract} disabled={!pasteText.trim() || extracting}
                      class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-40 transition">
                      <Sparkles class="w-3 h-3" />{extracting ? '解析中...' : '解析'}
                    </button>
                    <button onclick={() => { pasteKey = null; pasteText = ''; }}
                      class="px-3 py-1.5 rounded-md text-xs text-fg-3 hover:text-fg-0 transition">取消</button>
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
