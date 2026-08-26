<script lang="ts">
  import { Search, X, Zap, CalendarDays, Layers, BookmarkCheck } from 'lucide-svelte';
  import { filters, clearAllFilters, toggle } from '$lib/urlState.svelte';
  import type { DerivedSchool } from '$lib/types';
  import { progressMap } from '$lib/progress.svelte';

  let { totalCount, visibleCount, rows }: {
    totalCount: number;
    visibleCount: number;
    rows: DerivedSchool[];
  } = $props();

  // quick stats: not-yet-due
  const stats = $derived.by(() => {
    const oneDay = 86_400_000;
    let week = 0, month = 0, all = 0;
    for (const r of rows) {
      if (r.remainingMs === null || r.remainingMs < 0) continue;
      all++;
      if (r.remainingMs < 7 * oneDay) week++;
      if (r.remainingMs < 30 * oneDay) month++;
    }
    return { week, month, all };
  });

  const activeFilterCount = $derived(
    filters.tags.length + filters.status.length + filters.provinces.length + (filters.query ? 1 : 0)
    + (filters.showOnlyTracked ? 1 : 0) + (filters.showOnlyWatched ? 1 : 0) + (filters.showOnlyScheduled ? 1 : 0) + filters.progressStatuses.length,
  );

  function clearQuery() {
    filters.query = '';
  }
</script>

<div class="flex flex-col gap-3 pt-4">
  <!-- stats strip -->
  <div class="flex flex-wrap items-center gap-2">
    <div class="text-fg-2 text-xs uppercase tracking-[0.14em] font-medium pr-1">未截止</div>

    <button
      class="group surface-1 hover:surface-2 border border-line rounded-md px-3 py-2 flex items-center gap-2.5 transition"
      title="本周内截止"
    >
      <Zap class="w-3.5 h-3.5 urge-soon" />
      <span class="text-fg-2 text-xs">本周</span>
      <span class="text-fg-0 font-semibold text-sm tabular">{stats.week}</span>
    </button>

    <button
      class="group surface-1 hover:surface-2 border border-line rounded-md px-3 py-2 flex items-center gap-2.5 transition"
      title="30 天内截止"
    >
      <CalendarDays class="w-3.5 h-3.5 urge-near" />
      <span class="text-fg-2 text-xs">本月</span>
      <span class="text-fg-0 font-semibold text-sm tabular">{stats.month}</span>
    </button>

    <button
      class="group surface-1 hover:surface-2 border border-line rounded-md px-3 py-2 flex items-center gap-2.5 transition"
      title="尚未截止的全部"
    >
      <Layers class="w-3.5 h-3.5 urge-far" />
      <span class="text-fg-2 text-xs">全部</span>
      <span class="text-fg-0 font-semibold text-sm tabular">{stats.all}</span>
    </button>

    <button
      class="group surface-1 hover:surface-2 border border-line rounded-md px-3 py-2 flex items-center gap-2.5 transition"
      title="已跟踪的项目"
    >
      <BookmarkCheck class="w-3.5 h-3.5 prog-positive" />
      <span class="text-fg-2 text-xs">已跟踪</span>
      <span class="text-fg-0 font-semibold text-sm tabular">{Object.keys(progressMap).length}</span>
    </button>


    <div class="flex-1"></div>

    <div class="text-fg-3 text-xs tabular">
      显示
      <span class="text-fg-0 font-medium">{visibleCount}</span>
      <span class="text-fg-4">/</span>
      <span class="text-fg-1">{totalCount}</span>
    </div>
  </div>

  <!-- search -->
  <div class="relative">
    <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-3 pointer-events-none" />
    <input
      id="search-input"
      type="search"
      bind:value={filters.query}
      placeholder='搜索学校、学院 …  按 "/" 聚焦'
      class="w-full surface-1 hover:surface-2 focus:surface-2 transition rounded-lg border border-line focus:border-line-strong text-fg-0 placeholder:text-fg-4 text-sm pl-9 pr-9 py-2.5 outline-none"
    />
    {#if filters.query}
      <button
        onclick={clearQuery}
        aria-label="清除搜索"
        class="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded text-fg-3 hover:text-fg-1 hover:surface-3"
      >
        <X class="w-3.5 h-3.5" />
      </button>
    {/if}
  </div>

  <!-- active filter chips -->
  {#if activeFilterCount > 0}
    <div class="flex flex-wrap items-center gap-1.5">
      {#if filters.query}
        <button
          onclick={clearQuery}
          class="group inline-flex items-center gap-1 surface-3 border border-line-strong text-fg-1 text-xs rounded-full pl-2.5 pr-1.5 py-1 hover:text-fg-0"
        >
          <span class="text-fg-3">搜索:</span>
          <span class="tabular">{filters.query}</span>
          <X class="w-3 h-3" />
        </button>
      {/if}
      {#each filters.tags as t}
        <button
          onclick={() => (filters.tags = toggle(filters.tags, t))}
          class="inline-flex items-center gap-1 surface-3 border border-line-strong text-fg-1 text-xs rounded-full pl-2.5 pr-1.5 py-1 hover:text-fg-0"
        >
          {t}
          <X class="w-3 h-3" />
        </button>
      {/each}
      {#each filters.status as t}
        <button
          onclick={() => (filters.status = toggle(filters.status, t))}
          class="inline-flex items-center gap-1 surface-3 border border-line-strong text-fg-1 text-xs rounded-full pl-2.5 pr-1.5 py-1 hover:text-fg-0"
        >
          {t}
          <X class="w-3 h-3" />
        </button>
      {/each}
      {#each filters.provinces as p}
        <button
          onclick={() => (filters.provinces = toggle(filters.provinces, p))}
          class="inline-flex items-center gap-1 surface-3 border border-line-strong text-fg-1 text-xs rounded-full pl-2.5 pr-1.5 py-1 hover:text-fg-0"
        >
          {p}
          <X class="w-3 h-3" />
        </button>
      {/each}
      {#if filters.showOnlyWatched}
        <button
          onclick={() => (filters.showOnlyWatched = false)}
          class="inline-flex items-center gap-1 surface-3 border border-line-strong text-fg-1 text-xs rounded-full pl-2.5 pr-1.5 py-1 hover:text-fg-0"
        >
          已关注
          <X class="w-3 h-3" />
        </button>
      {/if}
      {#if filters.showOnlyTracked}
        <button
          onclick={() => (filters.showOnlyTracked = false)}
          class="inline-flex items-center gap-1 surface-3 border border-line-strong text-fg-1 text-xs rounded-full pl-2.5 pr-1.5 py-1 hover:text-fg-0"
        >
          已跟踪
          <X class="w-3 h-3" />
        </button>
      {/if}
      {#if filters.showOnlyScheduled}
        <button
          onclick={() => (filters.showOnlyScheduled = false)}
          class="inline-flex items-center gap-1 surface-3 border border-line-strong text-fg-1 text-xs rounded-full pl-2.5 pr-1.5 py-1 hover:text-fg-0"
        >
          我的行程
          <X class="w-3 h-3" />
        </button>
      {/if}
      {#each filters.progressStatuses as s}
        <button
          onclick={() => (filters.progressStatuses = toggle(filters.progressStatuses, s))}
          class="inline-flex items-center gap-1 surface-3 border border-line-strong text-fg-1 text-xs rounded-full pl-2.5 pr-1.5 py-1 hover:text-fg-0"
        >
          {s}
          <X class="w-3 h-3" />
        </button>
      {/each}
      <button
        onclick={clearAllFilters}
        class="ml-1 text-fg-3 hover:text-fg-1 text-xs underline-offset-4 hover:underline"
      >
        清空全部
      </button>
    </div>
  {/if}
</div>
