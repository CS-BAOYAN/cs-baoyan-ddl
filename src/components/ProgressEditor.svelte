<script lang="ts">
  import { X, Plus, Link, Trash2 } from 'lucide-svelte';
  import { PROGRESS_STATUSES } from '$lib/types';
  import type { ProgressStatus, UserProgress } from '$lib/types';
  import { setProgress, removeProgress, getProgress } from '$lib/progress.svelte';
  import { progressStatusColor } from '$lib/progressColors';

  let { name, institute }: { name: string; institute: string } = $props();

  const existing = $derived(getProgress(name, institute));

  let status = $state<ProgressStatus>('未申请');
  let applyDate = $state('');
  let notes = $state('');
  let attachments = $state<string[]>([]);
  let newAttachment = $state('');

  // Initialise from existing data
  $effect(() => {
    const p = getProgress(name, institute);
    if (p) {
      status = p.status;
      applyDate = p.apply_date ?? '';
      notes = p.notes ?? '';
      attachments = p.attachments ? [...p.attachments] : [];
    } else {
      status = '未申请';
      applyDate = '';
      notes = '';
      attachments = [];
    }
  });

  function handleSave() {
    setProgress(name, institute, {
      status,
      apply_date: applyDate || undefined,
      notes: notes || undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
    });
  }

  function handleDelete() {
    removeProgress(name, institute);
    status = '未申请';
    applyDate = '';
    notes = '';
    attachments = [];
  }

  function addAttachment() {
    const url = newAttachment.trim();
    if (url && !attachments.includes(url)) {
      attachments = [...attachments, url];
      newAttachment = '';
    }
  }

  function removeAttachment(url: string) {
    attachments = attachments.filter((a) => a !== url);
  }

  function onAttachmentKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addAttachment();
    }
  }
</script>

<div class="space-y-4">
  <!-- Status selector -->
  <div>
    <label class="block text-fg-3 text-[11px] uppercase tracking-[0.16em] font-medium mb-2" for="progress-status">
      申请状态
    </label>
    <select
      id="progress-status"
      bind:value={status}
      onchange={handleSave}
      class="w-full surface-2 hover:surface-3 transition rounded-md border border-line text-fg-1 text-sm px-3 py-2 outline-none focus:border-line-strong"
    >
      {#each PROGRESS_STATUSES as s}
        <option value={s}>{s}</option>
      {/each}
    </select>
    <div class="mt-1.5 flex items-center gap-2">
      <span class="w-2 h-2 rounded-full {progressStatusColor(status).dot}"></span>
      <span class="text-xs {progressStatusColor(status).text}">{status}</span>
    </div>
  </div>

  <!-- Apply date -->
  <div>
    <label class="block text-fg-3 text-[11px] uppercase tracking-[0.16em] font-medium mb-2" for="progress-date">
      申请日期
    </label>
    <input
      id="progress-date"
      type="date"
      bind:value={applyDate}
      onchange={handleSave}
      class="w-full surface-2 hover:surface-3 transition rounded-md border border-line text-fg-1 text-sm px-3 py-2 outline-none focus:border-line-strong"
    />
  </div>

  <!-- Notes -->
  <div>
    <label class="block text-fg-3 text-[11px] uppercase tracking-[0.16em] font-medium mb-2" for="progress-notes">
      备注
    </label>
    <textarea
      id="progress-notes"
      bind:value={notes}
      onchange={handleSave}
      placeholder="材料要求、导师信息、面试经验 …"
      rows="3"
      class="w-full surface-2 hover:surface-3 transition rounded-md border border-line text-fg-1 text-sm px-3 py-2 outline-none focus:border-line-strong resize-y"
    ></textarea>
  </div>

  <!-- Attachments -->
  <div>
    <span class="block text-fg-3 text-[11px] uppercase tracking-[0.16em] font-medium mb-2">
      附件链接
    </span>
    <div class="flex gap-2">
      <input
        type="url"
        bind:value={newAttachment}
        onkeydown={onAttachmentKeydown}
        placeholder="https://..."
        class="flex-1 surface-2 hover:surface-3 transition rounded-md border border-line text-fg-1 text-sm px-3 py-2 outline-none focus:border-line-strong"
      />
      <button
        onclick={addAttachment}
        disabled={!newAttachment.trim()}
        class="shrink-0 surface-2 hover:surface-3 border border-line rounded-md px-2.5 py-2 text-fg-2 hover:text-fg-0 transition disabled:text-fg-4 disabled:cursor-not-allowed"
        title="添加链接"
      >
        <Plus class="w-4 h-4" />
      </button>
    </div>
    {#if attachments.length > 0}
      <div class="mt-2 space-y-1.5">
        {#each attachments as url}
          <div class="flex items-center gap-2 surface-2 rounded-md px-2.5 py-1.5 border border-line">
            <Link class="w-3 h-3 text-fg-3 shrink-0" />
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              class="text-xs text-fg-2 hover:text-fg-0 truncate flex-1"
            >{url}</a>
            <button
              onclick={() => removeAttachment(url)}
              class="shrink-0 p-0.5 rounded text-fg-3 hover:text-fg-0 hover:surface-3 transition"
              title="移除"
            >
              <X class="w-3 h-3" />
            </button>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Delete button -->
  {#if existing}
    <button
      onclick={handleDelete}
      class="flex items-center gap-1.5 text-xs text-fg-3 hover:text-red-400 transition mt-2"
    >
      <Trash2 class="w-3.5 h-3.5" />
      <span>清除我的进度</span>
    </button>
  {/if}
</div>
