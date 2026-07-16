<script setup lang="ts">
import { useIssueStore } from '../store/issueStore';
import draggable from 'vuedraggable';
import { computed } from 'vue';

const store = useIssueStore();

const getIssueLocation = (id: string) => {
  const pathInfo = store.findIssuePath(id);
  if (!pathInfo) return null;
  
  const tabName = pathInfo.tab.name;
  const parentTitles = pathInfo.path.slice(0, -1).map(i => i.title);
  
  return {
    tabName,
    parentPath: parentTitles.join(' > ')
  };
};

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
        <h2 class="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Workspace</h2>
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
            class="group relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all flex items-center gap-3 cursor-pointer"
            :class="{ 'opacity-50 grayscale': element.completed }"
            @click="store.locateIssue(element.id)"
          >
            <!-- Drag Handle Grip -->
            <div 
              class="drag-handle flex h-6 w-5 flex-shrink-0 items-center justify-center rounded text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-600 dark:hover:text-slate-300 cursor-grab active:cursor-grabbing transition"
              title="Drag to reorder"
              @click.stop
            >
              <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 4a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM7 10a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM7 16a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM13 4a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM13 10a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM13 16a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              </svg>
            </div>

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
                    element.urgency === 3 ? 'bg-red-500' :
                    element.urgency === 2 ? 'bg-amber-500' : 'bg-slate-400'
                  ]"
                ></div>
                <span class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {{ element.importance === 3 ? 'High' : element.importance === 2 ? 'Medium' : 'Low' }}
                </span>
              </div>
              <!-- Tab & Parent Info Display -->
              <div v-if="getIssueLocation(element.id)" class="flex flex-wrap items-center gap-1 mt-1.5">
                <span class="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30 flex items-center gap-0.5 uppercase tracking-tighter">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {{ getIssueLocation(element.id)?.tabName }}
                </span>
                <span v-if="getIssueLocation(element.id)?.parentPath" class="text-[8px] text-slate-400 dark:text-slate-500 truncate max-w-[120px] font-medium" :title="getIssueLocation(element.id)?.parentPath">
                  in {{ getIssueLocation(element.id)?.parentPath }}
                </span>
              </div>
            </div>

            <!-- Locate Button -->
            <button 
              @click.stop="store.locateIssue(element.id)"
              class="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-indigo-500 dark:hover:text-indigo-400 transition-all"
              title="Locate Task in List"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            <!-- Delete Button -->
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
        <span>Progress</span>
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
