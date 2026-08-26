<script lang="ts">
  import { onDestroy } from 'svelte';
  import { X, Play, Square, Check, AlertCircle, Loader2, Settings, Zap, ClipboardPaste, RefreshCw, Pencil } from 'lucide-svelte';
  import { SOURCES } from '$lib/types';
  import type { Source, SchoolExtended } from '$lib/types';
  import { schoolsBySource } from '$lib/schools';
  import {
    extractBatch,
    extractSingle,
    loadConfig,
    saveConfig,
    type ExtractorConfig,
    type ExtractProgress,
    type ExtractResult,
  } from '$lib/extractor';
  import { batchSetExtracted, extractedMap } from '$lib/extractedData.svelte';

  let { onClose }: { onClose: () => void } = $props();

  // Abort extraction on unmount
  onDestroy(() => { abortCtrl?.abort(); });

  let config = $state<ExtractorConfig>(loadConfig());
  let showSettings = $state(false);

  let selectedSource = $state<Source>('camp2026');
  let selectedKeys = $state<Set<string>>(new Set());
  let selectAll = $state(false);

  let running = $state(false);
  let progress = $state<ExtractProgress | null>(null);
  let abortCtrl = $state<AbortController | null>(null);
  let results = $state<ExtractResult[]>([]);
  let showResults = $state(false);

  // Manual retry
  let retryKey = $state<string | null>(null);
  let retryText = $state('');

  // Edit mode
  let editKey = $state<string | null>(null);
  let editData = $state<SchoolExtended>({});

  const schools = $derived(schoolsBySource[selectedSource] ?? []);

  $effect(() => {
    if (selectAll) {
      selectedKeys = new Set(schools.map((s) => `${s.name}::${s.institute}`));
    }
  });

  function toggleKey(key: string) {
    const next = new Set(selectedKeys);
    if (next.has(key)) next.delete(key); else next.add(key);
    selectedKeys = next;
    selectAll = next.size === schools.length;
  }
  function toggleSelectAll() { selectAll = !selectAll; if (!selectAll) selectedKeys = new Set(); }

  async function startExtract() {
    if (!config.apiKey) { showSettings = true; return; }
    saveConfig(config);
    const toExtract = schools
      .filter((s) => selectedKeys.has(`${s.name}::${s.institute}`))
      .map((s) => ({ name: s.name, institute: s.institute, website: s.website }));
    if (toExtract.length === 0) return;

    running = true;
    results = [];
    showResults = false;
    retryKey = null;
    editKey = null;
    abortCtrl = new AbortController();
    try {
      results = await extractBatch(config, toExtract, (p) => { progress = p; }, abortCtrl.signal);
    } finally {
      running = false;
      showResults = true;
      abortCtrl = null;
    }
  }

  function stopExtract() { abortCtrl?.abort(); }

  // Save all confirmed results
  function confirmAll() {
    const entries = results
      .filter((r): r is ExtractResult & { data: SchoolExtended } => r.data !== null)
      .map((r) => ({ key: r.schoolKey, data: r.data }));
    if (entries.length > 0) batchSetExtracted(entries);
    showResults = false;
    results = [];
  }

  // Edit a result
  function startEdit(key: string) {
    const found = results.find((r) => r.schoolKey === key);
    if (!found?.data) return;
    editKey = key;
    editData = JSON.parse(JSON.stringify(found.data));
  }

  function saveEdit() {
    if (!editKey) return;
    const idx = results.findIndex((r) => r.schoolKey === editKey);
    if (idx >= 0) {
      results[idx] = { ...results[idx], data: { ...editData, last_verified: new Date().toISOString().slice(0, 10) } };
      results = [...results];
    }
    editKey = null;
  }

  function cancelEdit() { editKey = null; }

  // Manual retry
  function startRetry(key: string) { retryKey = key; retryText = ''; }

  async function doRetry() {
    if (!retryKey || !retryText.trim()) return;
    const school = schools.find((s) => `${s.name}::${s.institute}` === retryKey);
    if (!school) return;
    running = true;
    try {
      const result = await extractSingle(config, school.name, school.institute, school.website, retryText);
      const idx = results.findIndex((r) => r.schoolKey === retryKey);
      if (idx >= 0) { results[idx] = result; results = [...results]; }
    } finally {
      running = false;
      retryKey = null;
      retryText = '';
    }
  }

  function cancelRetry() { retryKey = null; retryText = ''; }

  const successCount = $derived(results.filter((r) => r.data).length);
  const failCount = $derived(results.filter((r) => !r.data).length);
  const alreadyExtracted = $derived([...selectedKeys].filter((key) => extractedMap[key]).length);
</script>

<div class="fixed inset-0 z-50 fade" role="dialog" aria-modal="true" aria-label="智能提取">
  <button class="absolute inset-0 bg-black/50 backdrop-blur-[3px]" onclick={onClose} aria-label="关闭"></button>
  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-2xl max-h-[85vh] surface-1 border border-line rounded-xl shadow-2xl flex flex-col overflow-hidden">
    <!-- Header -->
    <div class="px-5 py-4 border-b border-line flex items-center gap-3 shrink-0">
      <div class="flex-1">
        <h2 class="text-fg-0 font-semibold text-sm">智能提取夏令营信息</h2>
        <p class="text-fg-3 text-xs mt-0.5">调用大模型解析学校官网，提取开营时间、报销等信息</p>
      </div>
      <button onclick={() => (showSettings = !showSettings)} class="p-1.5 rounded text-fg-3 hover:text-fg-0 hover:surface-3 transition" title="API 设置">
        <Settings class="w-4 h-4" />
      </button>
      <button onclick={onClose} class="p-1.5 rounded text-fg-3 hover:text-fg-0 hover:surface-3 transition">
        <X class="w-4 h-4" />
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-5 space-y-4">
      <!-- Settings -->
      {#if showSettings}
        <div class="surface-2 border border-line rounded-lg p-4 space-y-3">
          <div>
            <label class="block text-fg-3 text-[11px] uppercase tracking-[0.16em] font-medium mb-1.5" for="ext-url">API 地址</label>
            <input id="ext-url" bind:value={config.baseUrl} class="w-full surface-1 border border-line rounded-md text-fg-1 text-sm px-3 py-2 outline-none focus:border-line-strong" />
          </div>
          <div>
            <label class="block text-fg-3 text-[11px] uppercase tracking-[0.16em] font-medium mb-1.5" for="ext-model">模型</label>
            <input id="ext-model" bind:value={config.model} class="w-full surface-1 border border-line rounded-md text-fg-1 text-sm px-3 py-2 outline-none focus:border-line-strong" />
          </div>
          <div>
            <label class="block text-fg-3 text-[11px] uppercase tracking-[0.16em] font-medium mb-1.5" for="ext-key">API Key</label>
            <input id="ext-key" type="password" bind:value={config.apiKey} class="w-full surface-1 border border-line rounded-md text-fg-1 text-sm px-3 py-2 outline-none focus:border-line-strong" />
          </div>
          <button onclick={() => { saveConfig(config); showSettings = false; }} class="text-xs text-emerald-400 hover:text-emerald-300 transition">保存设置</button>
        </div>
      {/if}

      <!-- Manual retry -->
      {#if retryKey}
        {@const retrySchool = schools.find((s) => `${s.name}::${s.institute}` === retryKey)}
        <div class="surface-2 border border-amber-500/30 rounded-lg p-4 space-y-3">
          <div class="flex items-center gap-2 text-amber-300 text-sm font-medium">
            <ClipboardPaste class="w-4 h-4" /><span>手动粘贴网页内容</span>
          </div>
          <p class="text-fg-3 text-xs">{retrySchool?.name} · {retrySchool?.institute} — 请打开通知页面，复制正文粘贴到下方</p>
          <textarea bind:value={retryText} placeholder="在此粘贴通知正文内容..." rows="6"
            class="w-full surface-1 border border-line rounded-md text-fg-1 text-sm px-3 py-2 outline-none focus:border-line-strong resize-y"></textarea>
          <div class="flex gap-2">
            <button onclick={doRetry} disabled={!retryText.trim() || running}
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition">
              <RefreshCw class="w-3.5 h-3.5" />重新提取
            </button>
            <button onclick={cancelRetry} class="px-3 py-1.5 rounded-md text-sm text-fg-3 hover:text-fg-0 transition">取消</button>
          </div>
        </div>
      {/if}

      <!-- Edit result -->
      {#if editKey}
        {@const editSchool = schools.find((s) => `${s.name}::${s.institute}` === editKey)}
        <div class="surface-2 border border-sky-500/30 rounded-lg p-4 space-y-3">
          <div class="flex items-center gap-2 text-sky-300 text-sm font-medium">
            <Pencil class="w-4 h-4" /><span>修正提取结果</span>
          </div>
          <p class="text-fg-3 text-xs">{editSchool?.name} · {editSchool?.institute}</p>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-fg-3 text-[10px] uppercase mb-1" for="edit-start">开营日期</label>
              <input id="edit-start" type="date" bind:value={editData.camp_start}
                class="w-full surface-1 border border-line rounded-md text-fg-1 text-sm px-2 py-1.5 outline-none focus:border-line-strong" />
            </div>
            <div>
              <label class="block text-fg-3 text-[10px] uppercase mb-1" for="edit-end">结营日期</label>
              <input id="edit-end" type="date" bind:value={editData.camp_end}
                class="w-full surface-1 border border-line rounded-md text-fg-1 text-sm px-2 py-1.5 outline-none focus:border-line-strong" />
            </div>
          </div>
          <div>
            <label class="block text-fg-3 text-[10px] uppercase mb-1" for="edit-notes">其他信息</label>
            <textarea id="edit-notes" bind:value={editData.other_notes} rows="2"
              class="w-full surface-1 border border-line rounded-md text-fg-1 text-sm px-2 py-1.5 outline-none focus:border-line-strong resize-y"></textarea>
          </div>
          <div class="flex gap-2">
            <button onclick={saveEdit}
              class="px-3 py-1.5 rounded-md text-sm font-medium bg-sky-600 hover:bg-sky-500 text-white transition">保存修正</button>
            <button onclick={cancelEdit} class="px-3 py-1.5 rounded-md text-sm text-fg-3 hover:text-fg-0 transition">取消</button>
          </div>
        </div>
      {/if}

      <!-- Source selector -->
      <div>
        <span class="block text-fg-3 text-[11px] uppercase tracking-[0.16em] font-medium mb-2">数据源</span>
        <div class="flex flex-wrap gap-1.5">
          {#each SOURCES as s}
            <button onclick={() => { selectedSource = s.id; selectedKeys = new Set(); selectAll = false; }}
              class="text-xs rounded-md px-3 py-1.5 transition border
                {selectedSource === s.id
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-500/15 dark:border-emerald-500/40 dark:text-emerald-200'
                  : 'surface-2 hover:surface-3 border-line text-fg-1'}">{s.label}</button>
          {/each}
        </div>
      </div>

      <!-- School list -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-fg-3 text-[11px] uppercase tracking-[0.16em] font-medium">选择学校</span>
          <div class="flex items-center gap-3">
            <span class="text-fg-4 text-xs tabular">{selectedKeys.size} / {schools.length}</span>
            {#if alreadyExtracted > 0}<span class="text-emerald-400 text-xs tabular">{alreadyExtracted} 已提取</span>{/if}
            <button onclick={toggleSelectAll} class="text-xs text-fg-2 hover:text-fg-0 transition">{selectAll ? '取消全选' : '全选'}</button>
          </div>
        </div>
        <div class="max-h-[280px] overflow-y-auto surface-2 border border-line rounded-lg divide-y divide-line">
          {#each schools as s}
            {@const key = `${s.name}::${s.institute}`}
            {@const checked = selectedKeys.has(key)}
            {@const hasData = !!extractedMap[key]}
            <button onclick={() => toggleKey(key)}
              class="w-full text-left px-3 py-2 flex items-center gap-3 hover:surface-3 transition text-sm {checked ? 'bg-emerald-500/5' : ''}">
              <span class="w-4 h-4 shrink-0 rounded border flex items-center justify-center transition
                {checked ? 'bg-emerald-500 border-emerald-500' : 'border-line-strong'}">
                {#if checked}<Check class="w-3 h-3 text-white" />{/if}
              </span>
              <span class="text-fg-0 font-medium truncate">{s.name}</span>
              <span class="text-fg-3 text-xs truncate">{s.institute}</span>
              {#if hasData}<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="已提取"></span>{/if}
            </button>
          {/each}
        </div>
      </div>

      <!-- Progress -->
      {#if running && progress}
        <div class="surface-2 border border-line rounded-lg p-4 space-y-2">
          <div class="flex items-center gap-2">
            <Loader2 class="w-4 h-4 text-emerald-400 animate-spin" />
            <span class="text-fg-1 text-sm">{progress.current}</span>
          </div>
          <div class="h-1.5 surface-3 rounded-full overflow-hidden">
            <div class="h-full bg-emerald-500 transition-all duration-300" style="width: {(progress.done / progress.total) * 100}%"></div>
          </div>
          <div class="text-fg-3 text-xs tabular">{progress.done} / {progress.total}</div>
        </div>
      {/if}

      <!-- Results with confirm/edit -->
      {#if showResults && results.length > 0}
        <div class="surface-2 border border-line rounded-lg p-4 space-y-3">
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-1.5 text-sm">
              <Check class="w-4 h-4 text-emerald-400" /><span class="text-fg-0">{successCount} 成功</span>
            </div>
            {#if failCount > 0}
              <div class="flex items-center gap-1.5 text-sm">
                <AlertCircle class="w-4 h-4 text-fg-3" /><span class="text-fg-2">{failCount} 失败</span>
              </div>
            {/if}
          </div>

          <div class="max-h-[240px] overflow-y-auto space-y-2">
            {#each results as r}
              <div class="flex items-center gap-2 text-xs">
                {#if r.data}
                  <Check class="w-3 h-3 text-emerald-400 shrink-0" />
                  <span class="text-fg-1 truncate flex-1">{r.schoolKey}</span>
                  <span class="text-fg-0 tabular shrink-0 font-medium">
                    {r.data.camp_start ?? '?'} — {r.data.camp_end ?? '?'}
                  </span>
                  <button onclick={() => startEdit(r.schoolKey)}
                    class="shrink-0 p-1 rounded text-fg-4 hover:text-sky-400 hover:surface-3 transition" title="修正">
                    <Pencil class="w-3 h-3" />
                  </button>
                {:else}
                  <AlertCircle class="w-3 h-3 {r.error === 'CORS_LIMITED' ? 'text-amber-400' : 'text-fg-4'} shrink-0" />
                  <span class="text-fg-3 truncate flex-1">{r.schoolKey}</span>
                  {#if r.error === 'CORS_LIMITED'}
                    <button onclick={() => startRetry(r.schoolKey)} class="text-amber-400 hover:text-amber-300 underline underline-offset-2 shrink-0">手动粘贴</button>
                  {:else}
                    <span class="text-fg-4 truncate">{r.error}</span>
                  {/if}
                {/if}
              </div>
            {/each}
          </div>

          {#if successCount > 0}
            <div class="flex items-center gap-2 p-2 rounded-md bg-sky-500/10 border border-sky-500/20">
              <Pencil class="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span class="text-sky-300 text-xs">请检查提取结果，点击 ✏️ 修正不准确的数据，确认无误后点击「确认保存」</span>
            </div>
            <button onclick={confirmAll}
              class="w-full py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition">
              确认保存 ({successCount} 条)
            </button>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Footer -->
    <div class="px-5 py-4 border-t border-line flex items-center gap-3 shrink-0">
      {#if !running && !showResults}
        <button onclick={startExtract} disabled={selectedKeys.size === 0}
          class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition">
          <Play class="w-4 h-4" />开始提取 ({selectedKeys.size})
        </button>
      {/if}
      {#if running}
        <button onclick={stopExtract}
          class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-500 text-white transition">
          <Square class="w-4 h-4" />停止
        </button>
      {/if}
      <div class="flex-1"></div>
      {#if !running && showResults}
        <button onclick={() => { showResults = false; results = []; }} class="text-xs text-fg-3 hover:text-fg-0 transition">重新选择</button>
      {/if}
    </div>
  </div>
</div>
