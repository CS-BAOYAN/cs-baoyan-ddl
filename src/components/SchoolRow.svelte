<script lang="ts">
  import { ExternalLink, Bookmark, CalendarPlus, CalendarCheck } from 'lucide-svelte';
  import type { DerivedSchool } from '$lib/types';
  import { formatRemainingShort, formatDateShort, progressAgainst } from '$lib/time';
  import { getInitials, getLogoUrl } from '$lib/logos';
  import { resolveProvince } from '$data/provinces';
  import { getProgress } from '$lib/progress.svelte';
  import { progressStatusColor, progressStatusShort } from '$lib/progressColors';
  import { isWatched, toggleWatched } from '$lib/watched.svelte';
  import { isScheduled, toggleScheduled } from '$lib/scheduled.svelte';

  let { school, selected, onSelect }: {
    school: DerivedSchool;
    selected: boolean;
    onSelect: (key: string) => void;
  } = $props();

  const key = $derived(`${school.name}::${school.institute}`);
  const logo = $derived(getLogoUrl(school.name));
  const province = $derived(resolveProvince(school.name, school.province));
  const progress = $derived(progressAgainst(school.remainingMs, 90));
  const urgeClass = $derived(`urge-${school.urgency}`);
  const urgeBgClass = $derived(`bg-urge-${school.urgency}`);
  const expired = $derived(school.urgency === 'expired');
  const userProg = $derived(getProgress(school.name, school.institute));
  const progColor = $derived(userProg ? progressStatusColor(userProg.status) : null);
  const watched = $derived(isWatched(school.name, school.institute));
  const scheduled = $derived(isScheduled(school.name, school.institute));

  let imgFailed = $state(false);
</script>

<button
  type="button"
  data-row-key={key}
  onclick={() => onSelect(key)}
  aria-pressed={selected}
  class="group w-full text-left grid grid-cols-[40px_minmax(0,1fr)_auto] sm:grid-cols-[44px_minmax(0,1fr)_auto_auto_auto] items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 transition relative overflow-hidden
    {selected ? 'surface-3' : 'hover:surface-2'}
    {expired ? 'opacity-60' : ''}"
>
  <!-- selected indicator -->
  <span
    class="absolute left-0 top-0 bottom-0 w-[3px] {selected ? urgeBgClass : 'bg-transparent'} transition"
    aria-hidden="true"
  ></span>

  <!-- logo -->
  <div class="relative w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-lg surface-2 border border-line grid place-items-center overflow-hidden">
    {#if logo && !imgFailed}
      <img
        src={logo}
        alt=""
        class="w-full h-full object-contain"
        loading="lazy"
        onerror={() => (imgFailed = true)}
      />
    {:else}
      <span class="text-fg-2 text-[11px] font-medium tracking-tight">{getInitials(school.name)}</span>
    {/if}
    {#if watched}
      <span class="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 text-amber-400">
        <Bookmark class="w-full h-full fill-current" />
      </span>
    {/if}
  </div>

  <!-- main: name + meta -->
  <div class="min-w-0 flex flex-col gap-1.5">
    <div class="flex items-baseline gap-2 min-w-0">
      <span class="text-fg-0 font-medium text-sm truncate">{school.name}</span>
      <span class="text-fg-3 text-xs truncate">{school.institute}</span>
    </div>
    <div class="flex items-center gap-1.5 flex-wrap min-h-[18px]">
      {#each school.tags as t}
        <span
          class="inline-block text-[10.5px] tracking-tight font-medium px-1.5 py-0.5 rounded
            {t === 'TOP2' ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/30'
            : t === '港三' || t === '华五' ? 'bg-fuchsia-100 text-fuchsia-700 ring-1 ring-fuchsia-200 dark:bg-fuchsia-500/15 dark:text-fuchsia-300 dark:ring-fuchsia-500/30'
            : t === 'C9' ? 'bg-violet-100 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/30'
            : t === '985' ? 'bg-sky-100 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/30'
            : t === '211' ? 'bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-300 dark:ring-cyan-500/30'
            : t === '已开营' ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30'
            : t === '已结营' ? 'bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-500/15 dark:text-fg-3 dark:ring-zinc-500/30'
            : 'bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-500/10 dark:text-fg-2 dark:ring-zinc-500/20'}"
        >{t}</span>
      {/each}
      {#if province}
        <span class="text-fg-4 text-[10.5px]">· {province}</span>
      {/if}
      {#if userProg && progColor}
        <span
          class="inline-flex items-center gap-1 text-[10.5px] tracking-tight font-medium px-1.5 py-0.5 rounded
            bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200
            dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30"
          title="{userProg.status}"
        >
          <span class="w-1.5 h-1.5 rounded-full {progColor.dot}"></span>
          {progressStatusShort(userProg.status)}
        </span>
      {/if}
    </div>
  </div>

  <!-- progress + countdown -->
  <div class="hidden sm:flex flex-col items-end gap-1.5 w-32 shrink-0">
    <div class="text-fg-0 text-sm font-medium tabular {urgeClass}">
      {formatRemainingShort(school.remainingMs)}
    </div>
    <div class="w-full h-1 surface-2 rounded-full overflow-hidden">
      <div
        class="h-full {urgeBgClass} transition-all"
        style="width: {progress * 100}%"
      ></div>
    </div>
    <div class="text-fg-4 text-[10px] tabular">{formatDateShort(school.deadlineMs)}</div>
  </div>

  <!-- mobile compact countdown -->
  <div class="sm:hidden flex flex-col items-end shrink-0">
    <div class="text-sm tabular font-medium {urgeClass}">
      {formatRemainingShort(school.remainingMs)}
    </div>
    <div class="text-fg-4 text-[10px] tabular">{formatDateShort(school.deadlineMs)}</div>
  </div>

  <span
    role="button"
    tabindex="0"
    onclick={(e) => { e.stopPropagation(); toggleWatched(school.name, school.institute); }}
    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); toggleWatched(school.name, school.institute); } }}
    class="hidden sm:inline-flex shrink-0 p-1.5 rounded cursor-pointer transition
      {watched ? 'text-amber-400 hover:text-amber-300' : 'text-fg-4 hover:text-fg-2'}"
    aria-label={watched ? '取消关注' : '关注'}
    title={watched ? '取消关注' : '关注'}
  >
    <Bookmark class="w-3.5 h-3.5 {watched ? 'fill-current' : ''}" />
  </span>

  {#if watched}
    <span
      role="button"
      tabindex="0"
      onclick={(e) => { e.stopPropagation(); toggleScheduled(school.name, school.institute); }}
      onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); toggleScheduled(school.name, school.institute); } }}
      class="hidden sm:inline-flex shrink-0 p-1.5 rounded cursor-pointer transition
        {scheduled ? 'text-sky-400 hover:text-sky-300' : 'text-fg-4 hover:text-fg-2'}"
      aria-label={scheduled ? '从行程移除' : '加入行程'}
      title={scheduled ? '从行程移除' : '加入行程'}
    >
      {#if scheduled}
        <CalendarCheck class="w-3.5 h-3.5" />
      {:else}
        <CalendarPlus class="w-3.5 h-3.5" />
      {/if}
    </span>
  {/if}

  {#if school.website && school.website !== '_No response_'}
    <a
      href={school.website}
      target="_blank"
      rel="noopener noreferrer"
      onclick={(e) => e.stopPropagation()}
      class="hidden sm:inline-flex shrink-0 p-1.5 rounded text-fg-3 hover:text-fg-0 hover:surface-3 transition"
      aria-label="打开 {school.name} 官网"
      title="打开官网"
    >
      <ExternalLink class="w-3.5 h-3.5" />
    </a>
  {/if}
</button>
