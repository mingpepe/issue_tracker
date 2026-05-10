<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useIssueStore } from '../store/issueStore';
import IssueItem from './IssueItem.vue';
import IssueForm from './IssueForm.vue';
import draggable from 'vuedraggable';
import type { Level } from '../types';

const store = useIssueStore();
const isAddingTopLevel = ref(false);
const showDone = ref(false);

onMounted(() => {
  store.fetchIssues();
});

const activeIssues = computed({
  get: () => store.issues.filter(i => !i.completed).sort((a, b) => a.order - b.order),
  set: (val) => {
    // Update orders
    val.forEach((item, index) => {
      item.order = index;
    });
    const doneOnes = store.issues.filter(i => i.completed);
    store.issues = [...val, ...doneOnes];
    store.syncIssues();
  }
});

const doneIssues = computed(() => store.issues.filter(i => i.completed).sort((a, b) => b.createdAt - a.createdAt));

const handleAddTopLevel = (data: { title: string; description: string; importance: Level; urgency: Level }) => {
  store.addIssue(null, data.title, data.importance, data.urgency, data.description);
  isAddingTopLevel.value = false;
};

const handleBulkDelete = () => {
  if (confirm(`Are you sure you want to delete ${store.selectedIds.size} selected tasks?`)) {
    store.bulkDelete();
  }
};
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20 transition-colors duration-300">
    <!-- Compact Sophisticated Header -->
    <header class="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30 shadow-sm transition-colors">
      <div class="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <div>
          <h1 class="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none uppercase">IssueFlow</h1>
        </div>

        <div class="flex items-center gap-3">
          <button 
            @click="showDone = !showDone"
            class="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
            :class="showDone ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'"
          >
            {{ showDone ? 'Hide Done' : 'Show Done' }}
          </button>
          <button 
            @click="isAddingTopLevel = !isAddingTopLevel"
            class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
            New Task
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-6 pt-10">
      <!-- Bulk Actions Bar -->
      <transition 
        enter-active-class="transition duration-300 ease-out" 
        enter-from-class="transform translate-y-4 opacity-0" 
        enter-to-class="transform translate-y-0 opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="transform translate-y-0 opacity-100"
        leave-to-class="transform translate-y-4 opacity-0"
      >
        <div v-if="store.selectedIds.size > 0" class="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-6 border border-slate-800 dark:border-slate-200">
          <span class="text-sm font-bold">{{ store.selectedIds.size }} tasks selected</span>
          <div class="h-4 w-px bg-slate-700 dark:bg-slate-300"></div>
          <div class="flex items-center gap-3">
            <button 
              @click="store.clearSelection"
              class="text-xs font-bold hover:text-indigo-400 dark:hover:text-indigo-600 transition-colors"
            >
              Deselect All
            </button>
            <button 
              @click="handleBulkDelete"
              class="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg font-bold text-xs transition-all shadow-sm active:scale-95"
            >
              Delete Selected
            </button>
          </div>
        </div>
      </transition>

      <!-- Add Top Level Form -->
      <transition enter-active-class="transition duration-300 ease-out" enter-from-class="transform -translate-y-4 opacity-0" enter-to-class="transform translate-y-0 opacity-100">
        <div v-if="isAddingTopLevel" class="mb-12">
          <IssueForm 
            submit-label="Create Task"
            @submit="handleAddTopLevel"
            @cancel="isAddingTopLevel = false"
          />
        </div>
      </transition>

      <!-- Loading State -->
      <div v-if="store.loading" class="flex flex-col items-center justify-center py-20">
        <div class="relative w-12 h-12">
          <div class="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800"></div>
          <div class="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
        </div>
        <p class="mt-4 text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-widest">Synchronizing...</p>
      </div>

      <!-- Content -->
      <div v-else>
        <!-- Active Issues -->
        <div v-if="activeIssues.length > 0" class="space-y-4">
          <h2 class="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span>In Progress</span>
            <span class="h-px flex-1 bg-slate-200 dark:bg-slate-800"></span>
          </h2>
          
          <draggable 
            v-model="activeIssues" 
            item-key="id"
            handle=".drag-handle"
            ghost-class="opacity-50"
            class="space-y-6"
            :group="{ name: 'issues' }"
          >
            <template #item="{ element }">
              <IssueItem 
                :issue="element" 
                :depth="0" 
              />
            </template>
          </draggable>
        </div>

        <!-- Empty State (No Active Issues) -->
        <div v-if="activeIssues.length === 0 && !showDone" class="py-24 flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
          <div class="w-20 h-20 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-6 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h2 class="text-xl font-bold text-slate-700 dark:text-slate-200 transition-colors">Clean Slate</h2>
          <p class="text-slate-400 dark:text-slate-500 mt-1 max-w-xs text-center text-sm transition-colors">No active tasks. Start by creating a new task to organize your flow.</p>
        </div>

        <!-- Done Section -->
        <div v-if="showDone" class="mt-16 space-y-4">
          <h2 class="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span>Completed</span>
            <span class="h-px flex-1 bg-slate-200 dark:bg-slate-800"></span>
          </h2>
          
          <div v-if="doneIssues.length === 0" class="py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
            <p class="text-slate-400 text-sm italic">Finish some tasks to see them here.</p>
          </div>
          
          <div v-else class="space-y-4 opacity-75 grayscale-[0.5]">
            <IssueItem 
              v-for="issue in doneIssues" 
              :key="issue.id" 
              :issue="issue" 
              :depth="0" 
            />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
