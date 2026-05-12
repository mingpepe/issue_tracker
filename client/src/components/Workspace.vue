<script setup lang="ts">
import { useIssueStore } from '../store/issueStore';
import draggable from 'vuedraggable';
import { computed } from 'vue';

const store = useIssueStore();

const workspaceIssues = computed({
  get: () => store.workspaceIssues,
  set: (val) => {
    // We only need to update the IDs in the store
    store.workspaceIds = val.map(i => i.id);
    store.syncIssues();
  }
});

const removeFromWorkspace = (id: string) => {
  store.removeFromWorkspace(id);
};

const clearWorkspace = () => {
  if (confirm('Clear all tasks from workspace?')) {
    store.clearWorkspace();
  }
};

const toggleDone = (id: string) => {
  store.toggleIssueComplete(id);
};

const onDrop = () => {
  if (store.draggingIssueId) {
    store.addToWorkspace([store.draggingIssueId]);
  }
};
</script>

<template>
  <div 
    class="flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl transition-all duration-300"
    :class="{ 'ring-4 ring-inset ring-indigo-500/50 bg-indigo-50/30 dark:bg-indigo-900/10': store.draggingIssueId }"
    @dragover.prevent
    @drop="onDrop"
  >
    <div class="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
      <div class="flex items-center gap-2">
        <div class="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h2 class="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Focus Workspace</h2>
      </div>
      <button 
        v-if="store.workspaceIds.length > 0"
        @click="clearWorkspace"
        class="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors"
      >
        Clear
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
      <!-- Drop Hint -->
      <div 
        v-if="store.draggingIssueId" 
        class="mb-4 p-4 border-2 border-dashed border-indigo-400 dark:border-indigo-600 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/20 flex flex-col items-center justify-center animate-pulse"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-indigo-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <span class="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Drop to Add</span>
      </div>

      <div v-if="store.workspaceIds.length === 0" class="h-full flex flex-col items-center justify-center text-center px-6">
        <div class="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Workspace Empty</h3>
        <p class="text-[11px] text-slate-400 dark:text-slate-500 mt-2 leading-relaxed">Select tasks from your list and add them here to focus on your immediate goals.</p>
      </div>

      <draggable 
        v-model="workspaceIssues" 
        item-key="id"
        handle=".drag-handle"
        ghost-class="ghost-class"
        class="space-y-3"
      >
        <template #item="{ element }">
          <div 
            class="drag-handle cursor-grab group relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-sm hover:shadow-md transition-all flex items-center gap-3"
            :class="{ 'opacity-50 grayscale': element.completed }"
          >
            <!-- Complete Toggle -->
            <button 
              @click.stop="toggleDone(element.id)"
              class="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border transition-all"
              :class="element.completed ? 'bg-green-600 border-green-600' : 'border-slate-300 dark:border-slate-600 hover:border-green-500'"
            >
              <svg v-if="element.completed" xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </button>

            <div class="flex-1 min-w-0">
              <h4 
                class="text-xs font-bold text-slate-800 dark:text-slate-100 truncate"
                :class="{ 'line-through text-slate-400 dark:text-slate-500': element.completed }"
              >
                {{ element.title }}
              </h4>
              <div class="flex items-center gap-2 mt-0.5">
                <div 
                  class="w-1.5 h-1.5 rounded-full" 
                  :class="[
                    element.urgency === 4 ? 'bg-red-500' :
                    element.urgency === 3 ? 'bg-orange-500' :
                    element.urgency === 2 ? 'bg-amber-500' : 'bg-teal-500'
                  ]"
                ></div>
                <span class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {{ element.importance === 4 ? 'Critical' : element.importance === 3 ? 'High' : element.importance === 2 ? 'Medium' : 'Low' }}
                </span>
              </div>
            </div>

            <button 
              @click.stop="removeFromWorkspace(element.id)"
              class="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </template>
      </draggable>
    </div>

    <div class="p-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 mt-auto">
      <div class="flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
        <span>Active Focus</span>
        <span>{{ workspaceIssues.filter(i => !i.completed).length }} / {{ workspaceIssues.length }}</span>
      </div>
      <div class="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
        <div 
          class="h-full bg-indigo-500 transition-all duration-500" 
          :style="{ width: workspaceIssues.length > 0 ? (workspaceIssues.filter(i => i.completed).length / workspaceIssues.length * 100) + '%' : '0%' }"
        ></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
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
.ghost-class {
  opacity: 0.5;
  background: #eef2ff;
}
.dark .ghost-class {
  background: #1e1b4b;
}
</style>
