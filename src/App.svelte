<script lang="ts">
  import { onMount } from 'svelte';
  import { startClock, clock } from '$lib/clock.svelte';
  import { filters, initFilterSync } from '$lib/urlState.svelte';
  import { applyFilters, applyProgressFilter, applyWatchedFilter, applyScheduledFilter, deriveSchool } from '$lib/filter';
  import { getSchoolsWithExtracted } from '$lib/schools';
  import { progressMap } from '$lib/progress.svelte';
  import { extractedMap } from '$lib/extractedData.svelte';
  import { watchedMap } from '$lib/watched.svelte';
  import { scheduledMap } from '$lib/scheduled.svelte';
  import type { DerivedSchool } from '$lib/types';
  import Header from '$components/Header.svelte';
  import Toolbar from '$components/Toolbar.svelte';
  import FilterPanel from '$components/FilterPanel.svelte';
  import ListView from '$components/ListView.svelte';
  import CalendarView from '$components/CalendarView.svelte';
  import DetailPanel from '$components/DetailPanel.svelte';
  import KbdHints from '$components/KbdHints.svelte';

  let selectedKey = $state<string | null>(null);
  let selectedIndex = $state(0);
  let drawerOpen = $state(false);
  let helpOpen = $state(false);

  // mount / unmount the shared 1Hz tick
  onMount(() => {
    initFilterSync();
    const stop = startClock();
    return stop;
  });

  // raw schools for the active source, merged with static extended + user extracted data
  const sourceRows = $derived(getSchoolsWithExtracted(filters.source, extractedMap));

  // every 1Hz tick re-derives countdowns; expensive only in proportion to row count
  const allRows = $derived<DerivedSchool[]>(
    sourceRows.map((s) => deriveSchool(s, clock.now)),
  );

  const filtered = $derived(
    applyFilters(allRows, {
      query: filters.query,
      tags: filters.tags,
      status: filters.status,
      provinces: filters.provinces,
    }),
  );

  const watchedFiltered = $derived(
    applyWatchedFilter(filtered, watchedMap, filters.showOnlyWatched),
  );

  const scheduledFiltered = $derived(
    applyScheduledFilter(watchedFiltered, scheduledMap, filters.showOnlyScheduled),
  );

  const visible = $derived(
    applyProgressFilter(scheduledFiltered, progressMap, {
      showOnlyTracked: filters.showOnlyTracked,
      statusFilter: filters.progressStatuses,
    }),
  );

  const totalCount = $derived(allRows.length);
  const visibleCount = $derived(visible.length);

  const selected = $derived(
    selectedKey ? visible.find((r) => `${r.name}::${r.institute}` === selectedKey) ?? null : null,
  );

  // global keyboard shortcuts
  function onKey(e: KeyboardEvent) {
    const target = e.target as HTMLElement | null;
    const inField =
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable);

    if (e.key === 'Escape') {
      if (helpOpen) { helpOpen = false; e.preventDefault(); return; }
      if (selectedKey) { selectedKey = null; e.preventDefault(); return; }
      if (drawerOpen) { drawerOpen = false; e.preventDefault(); return; }
      if (inField && target instanceof HTMLInputElement) {
        target.blur();
        e.preventDefault();
      }
      return;
    }

    if (inField) return;

    if (e.key === '/') {
      const el = document.getElementById('search-input') as HTMLInputElement | null;
      el?.focus();
      el?.select();
      e.preventDefault();
      return;
    }
    if (e.key === '?' || (e.shiftKey && e.key === '/')) {
      helpOpen = !helpOpen;
      e.preventDefault();
      return;
    }
    if (e.key === 'j' || e.key === 'ArrowDown') {
      if (visible.length === 0) return;
      selectedIndex = Math.min(visible.length - 1, selectedIndex + 1);
      const r = visible[selectedIndex];
      ensureRowVisible(`${r.name}::${r.institute}`);
      e.preventDefault();
      return;
    }
    if (e.key === 'k' || e.key === 'ArrowUp') {
      if (visible.length === 0) return;
      selectedIndex = Math.max(0, selectedIndex - 1);
      const r = visible[selectedIndex];
      ensureRowVisible(`${r.name}::${r.institute}`);
      e.preventDefault();
      return;
    }
    if (e.key === 'Enter') {
      if (visible[selectedIndex]) {
        const r = visible[selectedIndex];
        selectedKey = `${r.name}::${r.institute}`;
        e.preventDefault();
      }
    }
  }

  function ensureRowVisible(key: string) {
    queueMicrotask(() => {
      document
        .querySelector(`[data-row-key="${CSS.escape(key)}"]`)
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }

  function handleSelect(key: string) {
    selectedKey = key;
    const i = visible.findIndex((r) => `${r.name}::${r.institute}` === key);
    if (i >= 0) selectedIndex = i;
  }
</script>

<svelte:window onkeydown={onKey} />

<div class="bg-page min-h-dvh flex flex-col">
  <Header onOpenDrawer={() => (drawerOpen = true)} onOpenHelp={() => (helpOpen = true)} onSelectSchool={handleSelect} />

  <div class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex-1 flex flex-col gap-4 pb-24">
    <Toolbar {totalCount} {visibleCount} rows={allRows} />

    <div class="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 flex-1">
      <aside class="hidden lg:block">
        <FilterPanel rows={allRows} mode="sidebar" />
      </aside>

      <main class="min-w-0">
        {#if filters.view === 'list'}
          <ListView
            rows={visible}
            {selectedKey}
            onSelect={handleSelect}
          />
        {:else}
          <CalendarView rows={visible} onSelect={handleSelect} />
        {/if}
      </main>
    </div>
  </div>

  {#if selected}
    <DetailPanel school={selected} onClose={() => (selectedKey = null)} />
  {/if}

  {#if drawerOpen}
    <div class="lg:hidden fixed inset-0 z-40 fade" role="presentation">
      <button
        class="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="关闭筛选面板"
        onclick={() => (drawerOpen = false)}
      ></button>
      <div
        class="surface-1 absolute bottom-0 inset-x-0 max-h-[85dvh] overflow-y-auto rounded-t-2xl border-t border-line slide-up p-4"
      >
        <FilterPanel rows={allRows} mode="drawer" onDone={() => (drawerOpen = false)} />
      </div>
    </div>
  {/if}

  {#if helpOpen}
    <KbdHints onClose={() => (helpOpen = false)} />
  {/if}
</div>
