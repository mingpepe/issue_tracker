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

const handleTab = () => {
  const textarea = textareaRef.value;
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const val = localContent.value;

  localContent.value = val.substring(0, start) + '    ' + val.substring(end);

  nextTick(() => {
    textarea.selectionStart = textarea.selectionEnd = start + 4;
  });

  handleInput();
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
        @keydown.tab.prevent="handleTab"
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
