<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import type { Level } from '../types';

const props = defineProps<{
  initialTitle?: string;
  initialDescription?: string;
  initialImportance?: Level;
  initialUrgency?: Level;
  submitLabel: string;
}>();

const emit = defineEmits<{
  (e: 'submit', data: { title: string; description: string; importance: Level; urgency: Level }): void;
  (e: 'cancel'): void;
}>();

const titleInput = ref<HTMLInputElement | null>(null);
const descriptionInput = ref<HTMLTextAreaElement | null>(null);
const title = ref(props.initialTitle || '');
const description = ref(props.initialDescription || '');
const importance = ref<Level>(props.initialImportance || 1);
const urgency = ref<Level>(props.initialUrgency || 1);

onMounted(() => {
  if (props.initialTitle) {
    descriptionInput.value?.focus();
  } else {
    titleInput.value?.focus();
  }
});

const isDirty = computed(() => {
  return title.value !== (props.initialTitle || '') ||
         description.value !== (props.initialDescription || '') ||
         importance.value !== (props.initialImportance || 1) ||
         urgency.value !== (props.initialUrgency || 1);
});

const handleCancel = () => {
  if (isDirty.value) {
    if (confirm('You have unsaved changes. Are you sure you want to discard them?')) {
      emit('cancel');
      return true;
    }
    return false;
  } else {
    emit('cancel');
    return true;
  }
};

const isFormValid = computed(() => title.value.trim().length > 0);

const handleSubmit = () => {
  if (!isFormValid.value) return;
  emit('submit', {
    title: title.value,
    description: description.value,
    importance: importance.value,
    urgency: urgency.value,
  });
};

const handleTab = (e: KeyboardEvent) => {
  const textarea = descriptionInput.value;
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const val = (description.value || '').replace(/\r\n/g, '\n');
  const isShift = e.shiftKey;

  const lines = val.split('\n');
  let currentPos = 0;
  const lineStartIndices = lines.map(line => {
    const s = currentPos;
    currentPos += line.length + 1;
    return s;
  });

  let startLineIdx = 0;
  let endLineIdx = 0;
  for (let i = 0; i < lineStartIndices.length; i++) {
    if (start >= lineStartIndices[i]) {
      startLineIdx = i;
    }
    if (end >= lineStartIndices[i]) {
      endLineIdx = i;
    }
  }

  if (start === end && !isShift) {
    // Single cursor, normal Tab: insert 8 spaces at cursor
    description.value = val.substring(0, start) + '        ' + val.substring(end);
    nextTick(() => {
      textarea.selectionStart = textarea.selectionEnd = start + 8;
    });
  } else {
    // Selection, or Shift+Tab (outdent)
    let deltaStart = 0;
    let deltaEnd = 0;
    const updatedLines = [...lines];

    for (let i = startLineIdx; i <= endLineIdx; i++) {
      const lineStart = lineStartIndices[i];
      const originalLine = lines[i];
      let newLine = originalLine;

      if (!isShift) {
        // Indent: add 8 spaces to the start of the line
        newLine = '        ' + originalLine;

        if (i === startLineIdx) {
          deltaStart += 8;
        }
        if (i === endLineIdx) {
          deltaEnd += 8;
        } else if (i < endLineIdx) {
          deltaEnd += 8;
        }
      } else {
        // Outdent: remove up to 8 spaces or 1 tab from the start of the line
        let spaceCount = 0;
        const isTab = originalLine[0] === '\t';
        if (isTab) {
          spaceCount = 1;
        } else {
          while (spaceCount < 8 && originalLine[spaceCount] === ' ') {
            spaceCount++;
          }
        }

        if (spaceCount > 0) {
          newLine = originalLine.substring(spaceCount);

          if (i === startLineIdx) {
            const offset = start - lineStart;
            deltaStart -= Math.min(offset, spaceCount);
          }
          if (i === endLineIdx) {
            const offset = end - lineStart;
            deltaEnd -= Math.min(offset, spaceCount);
          } else if (i < endLineIdx) {
            deltaEnd -= spaceCount;
          }
        }
      }

      updatedLines[i] = newLine;
    }

    description.value = updatedLines.join('\n');
    nextTick(() => {
      textarea.selectionStart = start + deltaStart;
      textarea.selectionEnd = end + deltaEnd;
    });
  }
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    handleTab(e);
  }
};

const saveOnOutsideClick = () => {
  if (isFormValid.value) {
    if (isDirty.value) {
      handleSubmit();
    } else {
      emit('cancel');
    }
  } else {
    emit('cancel');
  }
};

defineExpose({
  handleCancel,
  saveOnOutsideClick
});

const levelOptions = {
  importance: [
    { value: 4, label: 'Critical', activeClass: 'bg-red-600 text-white border-red-600' },
    { value: 3, label: 'High', activeClass: 'bg-orange-600 text-white border-orange-600' },
    { value: 2, label: 'Medium', activeClass: 'bg-amber-50 text-slate-950 border-amber-500' },
    { value: 1, label: 'Low', activeClass: 'bg-teal-600 text-white border-teal-600' },
  ] as Array<{ value: Level; label: string; activeClass: string }>,
  urgency: [
    { value: 4, label: 'Urgent', activeClass: 'bg-red-600 text-white border-red-600' },
    { value: 3, label: 'Soon', activeClass: 'bg-orange-600 text-white border-orange-600' },
    { value: 2, label: 'Normal', activeClass: 'bg-amber-50 text-slate-950 border-amber-500' },
    { value: 1, label: 'Later', activeClass: 'bg-teal-600 text-white border-teal-600' },
  ] as Array<{ value: Level; label: string; activeClass: string }>
};
</script>

<template>
  <div class="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-colors">
    <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-4 py-1.5 transition-colors">
      <h4 class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {{ initialTitle ? 'Edit issue' : 'New issue' }}
      </h4>
      <button
        type="button"
        @click="handleCancel"
        class="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 dark:text-slate-500 transition hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100"
        aria-label="Cancel"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-2 p-4" @keydown.esc="handleCancel">
      <div class="space-y-0.5">
        <label class="block text-[10px] font-bold uppercase tracking-tight text-slate-400 dark:text-slate-500">Title</label>
        <input
          ref="titleInput"
          v-model="title"
          type="text"
          required
          spellcheck="false"
          @keydown.ctrl.enter="handleSubmit"
          class="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-slate-900 dark:text-slate-100 outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30"
          placeholder="A concise issue title"
        />
      </div>
      
      <div class="space-y-0.5">
        <label class="block text-[10px] font-bold uppercase tracking-tight text-slate-400 dark:text-slate-500">Description</label>
        <textarea
          ref="descriptionInput"
          v-model="description"
          spellcheck="false"
          @keydown="handleKeyDown"
          @keydown.ctrl.enter="handleSubmit"
          class="min-h-[480px] w-full resize-y rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-base leading-relaxed text-slate-800 dark:text-slate-300 outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30"
          placeholder="Optional context, acceptance criteria, or links"
        ></textarea>
      </div>

      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div class="space-y-1">
          <label class="block text-[10px] font-bold uppercase tracking-tight text-slate-400 dark:text-slate-500">Importance</label>
          <div class="grid grid-cols-4 gap-1">
            <button
              v-for="opt in levelOptions.importance"
              :key="'imp-'+opt.value"
              type="button"
              @click="importance = opt.value"
              :class="[
                'rounded border px-0.5 py-1 text-[8.5px] font-bold uppercase transition truncate',
                importance === opt.value 
                  ? opt.activeClass 
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
              ]"
              :title="opt.label"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div class="space-y-1">
          <label class="block text-[10px] font-bold uppercase tracking-tight text-slate-400 dark:text-slate-500">Urgency</label>
          <div class="grid grid-cols-4 gap-1">
            <button
              v-for="opt in levelOptions.urgency"
              :key="'urg-'+opt.value"
              type="button"
              @click="urgency = opt.value"
              :class="[
                'rounded border px-0.5 py-1 text-[8.5px] font-bold uppercase transition truncate',
                urgency === opt.value 
                  ? opt.activeClass 
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
              ]"
              :title="opt.label"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-700 pt-2 transition-colors">
        <button
          type="button"
          @click="handleCancel"
          class="rounded-md px-2 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          :disabled="!isFormValid"
          class="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 dark:disabled:text-slate-500"
        >
          {{ submitLabel }}
        </button>
      </div>
    </form>
  </div>
</template>
