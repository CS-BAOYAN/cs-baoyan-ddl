<script lang="ts">
  import { Sun, Moon, Calendar, List, HelpCircle, SlidersHorizontal, Clock, Sparkles, CalendarClock } from 'lucide-svelte';
  import { filters } from '$lib/urlState.svelte';
  import { theme, toggleTheme } from '$lib/theme.svelte';
  import { SOURCES } from '$lib/types';
  import type { Source, ViewMode } from '$lib/types';
  import ImportExport from './ImportExport.svelte';
  import ExtractPanel from './ExtractPanel.svelte';
  import CampSchedule from './CampSchedule.svelte';

  let { onOpenDrawer, onOpenHelp, onSelectSchool }: { onOpenDrawer: () => void; onOpenHelp: () => void; onSelectSchool: (key: string) => void } = $props();
  let extractOpen = $state(false);
  let scheduleOpen = $state(false);

  function setSource(e: Event) {
    filters.source = (e.target as HTMLSelectElement).value as Source;
  }
  function setView(v: ViewMode) {
    filters.view = v;
  }
</script>

<header class="sticky top-0 z-30 backdrop-blur-md bg-[var(--color-surface-0)]/70 border-b border-line">
  <div class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
    <!-- mark -->
    <div class="flex items-center gap-2.5 min-w-0 shrink-0">
      <div class="relative w-8 h-8 rounded-lg surface-3 border border-line-strong grid place-items-center overflow-hidden shrink-0">
        <Clock class="w-4 h-4 urge-far" />
        <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-sky-500/10 pointer-events-none"></div>
      </div>
      <div class="hidden sm:block min-w-0">
        <div class="text-fg-0 font-semibold tracking-tight text-sm leading-none whitespace-nowrap">CS 保研 DDL</div>
        <div class="text-fg-3 text-[11px] mt-0.5 whitespace-nowrap">夏令营 / 预推免 截止日期</div>
      </div>
    </div>

    <!-- source switcher -->
    <div class="ml-1 sm:ml-3">
      <label class="sr-only" for="source-select">数据源</label>
      <div class="relative">
        <select
          id="source-select"
          value={filters.source}
          onchange={setSource}
          class="appearance-none surface-2 hover:surface-3 transition text-fg-1 text-xs sm:text-sm font-medium pl-3 pr-8 py-1.5 rounded-md border border-line cursor-pointer outline-none focus:border-line-strong"
        >
          {#each SOURCES as s}
            <option value={s.id}>{s.label}</option>
          {/each}
        </select>
        <svg class="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-fg-3 pointer-events-none" viewBox="0 0 12 12" fill="none">
          <path d="M3 4.5l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>

    <div class="flex-1"></div>

    <!-- view toggle -->
    <div class="surface-2 border border-line rounded-md p-0.5 flex items-center gap-0.5" role="tablist" aria-label="视图切换">
      <button
        role="tab"
        aria-selected={filters.view === 'list'}
        onclick={() => setView('list')}
        class="px-2 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition {filters.view === 'list' ? 'surface-3 text-fg-0' : 'text-fg-2 hover:text-fg-1'}"
      >
        <List class="w-3.5 h-3.5" />
        <span class="hidden sm:inline">列表</span>
      </button>
      <button
        role="tab"
        aria-selected={filters.view === 'calendar'}
        onclick={() => setView('calendar')}
        class="px-2 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition {filters.view === 'calendar' ? 'surface-3 text-fg-0' : 'text-fg-2 hover:text-fg-1'}"
      >
        <Calendar class="w-3.5 h-3.5" />
        <span class="hidden sm:inline">日历</span>
      </button>
    </div>

    <!-- mobile filter trigger -->
    <button
      class="lg:hidden surface-2 hover:surface-3 border border-line rounded-md p-1.5 transition"
      onclick={onOpenDrawer}
      aria-label="筛选"
    >
      <SlidersHorizontal class="w-4 h-4 text-fg-1" />
    </button>

    <!-- import / export -->
    <ImportExport />

    <!-- extract -->
    <button
      onclick={() => (extractOpen = true)}
      class="surface-2 hover:surface-3 border border-line rounded-md p-1.5 transition text-amber-400 hover:text-amber-300"
      title="智能提取夏令营信息"
      aria-label="智能提取夏令营信息"
    >
      <Sparkles class="w-4 h-4" />
    </button>

    <!-- camp schedule -->
    <button
      onclick={() => (scheduleOpen = true)}
      class="surface-2 hover:surface-3 border border-line rounded-md p-1.5 transition text-sky-400 hover:text-sky-300"
      title="夏令营行程表"
      aria-label="夏令营行程表"
    >
      <CalendarClock class="w-4 h-4" />
    </button>

    <!-- theme -->
    <button
      onclick={toggleTheme}
      class="surface-2 hover:surface-3 border border-line rounded-md p-1.5 transition"
      aria-label="切换主题"
      title={theme.value === 'dark' ? '切换浅色' : '切换深色'}
    >
      {#if theme.value === 'dark'}
        <Sun class="w-4 h-4 text-fg-1" />
      {:else}
        <Moon class="w-4 h-4 text-fg-1" />
      {/if}
    </button>

    <!-- help -->
    <button
      onclick={onOpenHelp}
      class="hidden sm:flex surface-2 hover:surface-3 border border-line rounded-md p-1.5 transition"
      aria-label="键盘快捷键"
      title="键盘快捷键 (?)"
    >
      <HelpCircle class="w-4 h-4 text-fg-1" />
    </button>

    <a
      href="https://github.com/CS-BAOYAN/CS-BAOYAN-DDL"
      target="_blank"
      rel="noopener noreferrer"
      class="hidden md:flex surface-2 hover:surface-3 border border-line rounded-md p-1.5 transition"
      aria-label="GitHub"
    >
      <svg viewBox="0 0 16 16" class="w-4 h-4 text-fg-1" fill="currentColor" aria-hidden="true">
        <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/>
      </svg>
    </a>
  </div>
</header>

{#if extractOpen}
  <ExtractPanel onClose={() => (extractOpen = false)} />
{/if}

{#if scheduleOpen}
  <CampSchedule onClose={() => (scheduleOpen = false)} onSelect={onSelectSchool} />
{/if}
