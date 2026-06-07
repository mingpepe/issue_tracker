<script setup lang="ts">
import { onMounted, watch, ref, nextTick } from 'vue';
import { useNoteStore } from '../store/noteStore';

const store = useNoteStore();
const localContent = ref('');
const textareaRef = ref<HTMLTextAreaElement | null>(null);

function debounce(fn: Function, delay: number) {
  let timeoutId: number | undefined;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay) as any;
  };
}

onMounted(async () => {
  await store.fetchNotes();
  localContent.value = store.content;
});

// Sync from store if it changes elsewhere (though unlikely in this simple app)
watch(() => store.content, (newVal) => {
  if (newVal !== localContent.value) {
    localContent.value = newVal;
  }
});

const debouncedSync = debounce(() => {
  store.updateContent(localContent.value);
}, 500);

const handleInput = () => {
  debouncedSync();
};

const handleTab = (e: KeyboardEvent) => {
  const textarea = textareaRef.value;
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const val = localContent.value;
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
    localContent.value = val.substring(0, start) + '        ' + val.substring(end);
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

    localContent.value = updatedLines.join('\n');
    nextTick(() => {
      textarea.selectionStart = start + deltaStart;
      textarea.selectionEnd = end + deltaEnd;
    });
  }

  handleInput();
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    handleTab(e);
  }
};
</script>

<template>
  <div class="h-full flex flex-col bg-white dark:bg-slate-800 transition-colors duration-300">
    <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
      <h2 class="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Scratchpad
      </h2>
      <div v-if="store.loading" class="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
    <div class="flex-1 p-0 overflow-hidden relative">
      <textarea
        ref="textareaRef"
        v-model="localContent"
        @input="handleInput"
        @keydown="handleKeyDown"
        spellcheck="false"
        placeholder="Type your temporary notes here..."
        class="w-full h-full p-6 bg-transparent text-slate-700 dark:text-slate-200 resize-none outline-none text-sm leading-relaxed placeholder-slate-300 dark:placeholder-slate-600 custom-scrollbar"
      ></textarea>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #334155;
}
</style>
