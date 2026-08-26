<script lang="ts">
  import { Download, Upload, X } from 'lucide-svelte';
  import { downloadProgressJson, importProgressJson } from '$lib/progress.svelte';

  let showImport = $state(false);
  let importMode = $state<'merge' | 'overwrite'>('merge');
  let importResult = $state<{ count: number; error?: string } | null>(null);
  let fileInput = $state<HTMLInputElement | null>(null);

  function handleExport() {
    downloadProgressJson();
  }

  function handleImportClick() {
    showImport = true;
    importResult = null;
  }

  function handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      importResult = importProgressJson(text, importMode);
      if (!importResult.error) {
        // Show success briefly, then close
        setTimeout(() => {
          showImport = false;
          importResult = null;
          if (fileInput) fileInput.value = '';
        }, 1500);
      }
    };
    reader.readAsText(file);
  }

  function closeImport() {
    showImport = false;
    importResult = null;
    if (fileInput) fileInput.value = '';
  }
</script>

<div class="flex items-center gap-1.5">
  <button
    onclick={handleExport}
    class="surface-2 hover:surface-3 border border-line rounded-md p-1.5 transition text-fg-2 hover:text-fg-0"
    title="导出我的进度"
    aria-label="导出我的进度"
  >
    <Download class="w-4 h-4" />
  </button>
  <button
    onclick={handleImportClick}
    class="surface-2 hover:surface-3 border border-line rounded-md p-1.5 transition text-fg-2 hover:text-fg-0"
    title="导入进度"
    aria-label="导入进度"
  >
    <Upload class="w-4 h-4" />
  </button>
</div>

{#if showImport}
  <div class="fixed inset-0 z-50 fade" role="dialog" aria-modal="true" aria-label="导入进度">
    <button class="absolute inset-0 bg-black/50 backdrop-blur-[3px]" onclick={closeImport} aria-label="关闭"></button>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm surface-1 border border-line rounded-xl shadow-2xl p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-fg-0 font-semibold text-sm">导入进度数据</h3>
        <button onclick={closeImport} class="p-1 rounded text-fg-3 hover:text-fg-0 hover:surface-3 transition">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="space-y-3">
        <div class="flex gap-3">
          <label class="flex items-center gap-2 text-sm text-fg-1 cursor-pointer">
            <input type="radio" bind:group={importMode} value="merge" class="accent-emerald-500" />
            合并（保留已有）
          </label>
          <label class="flex items-center gap-2 text-sm text-fg-1 cursor-pointer">
            <input type="radio" bind:group={importMode} value="overwrite" class="accent-emerald-500" />
            覆盖（清空后导入）
          </label>
        </div>

        <input
          bind:this={fileInput}
          type="file"
          accept=".json"
          onchange={handleFileSelect}
          class="w-full text-sm text-fg-2 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:surface-3 file:text-fg-1 hover:file:surface-2 file:cursor-pointer"
        />

        {#if importResult}
          {#if importResult.error}
            <p class="text-xs text-red-400">{importResult.error}</p>
          {:else}
            <p class="text-xs text-emerald-400">成功导入 {importResult.count} 条记录</p>
          {/if}
        {/if}
      </div>
    </div>
  </div>
{/if}
