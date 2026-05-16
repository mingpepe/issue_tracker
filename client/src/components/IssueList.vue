<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue';
import { useIssueStore } from '../store/issueStore';
import IssueItem from './IssueItem.vue';
import IssueForm from './IssueForm.vue';
import Workspace from './Workspace.vue';
import draggable from 'vuedraggable';
import type { Level } from '../types';

const store = useIssueStore();
const isAddingTopLevel = ref(false);
const showTrash = ref(false);
const showWorkspace = ref(true);
const editingTabId = ref<string | null>(null);
const editingTabName = ref('');

const handleGlobalKeydown = (e: KeyboardEvent) => {
  if (e.altKey && e.key.toLowerCase() === 'n') {
    e.preventDefault();
    isAddingTopLevel.value = !isAddingTopLevel.value;
  } else if (e.altKey && e.key.toLowerCase() === 'w') {
    e.preventDefault();
    showWorkspace.value = !showWorkspace.value;
  } else if (e.key === 'Delete') {
    if (store.selectedIds.size > 0 && !showTrash.value) {
      handleBulkDelete();
    }
  }
};

onMounted(() => {
  store.fetchIssues();
  window.addEventListener('keydown', handleGlobalKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
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
  store.addIssue(store.lastSelectedId, data.title, data.importance, data.urgency, data.description);
  isAddingTopLevel.value = false;
};

const handleBulkDelete = () => {
  store.bulkDelete();
};

const handleAddToWorkspace = () => {
  store.addToWorkspace(Array.from(store.selectedIds));
  store.clearSelection();
  showWorkspace.value = true;
};

const handleAddTab = () => {
  const name = prompt('Enter tab name:');
  if (name) {
    store.addTab(name);
  }
};

const startRenameTab = (id: string, name: string) => {
  editingTabId.value = id;
  editingTabName.value = name;
};

const saveTabRename = () => {
  if (editingTabId.value && editingTabName.value.trim()) {
    store.renameTab(editingTabId.value, editingTabName.value.trim());
    editingTabId.value = null;
  }
};

const cancelTabRename = () => {
  editingTabId.value = null;
};

const handleDeleteTab = (id: string, name: string) => {
  if (store.tabs.length <= 1) return;
  if (confirm(`Are you sure you want to move all tasks from "${name}" to Trash and delete the tab?`)) {
    store.deleteTab(id);
  }
};

const handleEmptyTrash = () => {
  if (confirm('Are you sure you want to permanently delete all items in the Trash? This cannot be undone.')) {
    store.emptyTrash();
  }
};

const onTabDrop = (tabId: string) => {
  if (store.draggingIssueId && tabId !== store.activeTabId) {
    store.moveIssueToTab(store.draggingIssueId, tabId);
  }
};

const vFocus = {
  mounted: (el: HTMLInputElement) => el.focus()
};

const draggableTabs = computed({
  get: () => store.tabs,
  set: (val) => {
    store.tabs = val;
    store.syncIssues();
  }
});
</script>

<template>
  <div class="flex h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 overflow-hidden">
    <!-- Main Content Container -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Compact Sophisticated Header -->
      <header class="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30 shadow-sm transition-colors">
        <div class="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div class="flex items-center gap-6 overflow-hidden">
            <!-- Tab Bar -->
            <draggable 
              v-if="!showTrash" 
              v-model="draggableTabs" 
              item-key="id"
              class="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth"
              handle=".tab-drag-handle"
            >
              <template #item="{ element: tab }">
                <div 
                  class="relative group/tab"
                  @dragover.prevent
                  @drop="onTabDrop(tab.id)"
                >
                  <div v-if="editingTabId === tab.id" class="flex items-center px-2 py-1">
                    <input 
                      v-model="editingTabName"
                      @blur="saveTabRename"
                      @keyup.enter="saveTabRename"
                      @keyup.esc="cancelTabRename"
                      v-focus
                      class="bg-slate-100 dark:bg-slate-700 border-none rounded px-2 py-1 text-xs font-bold outline-none ring-2 ring-indigo-500 w-24"
                    />
                  </div>
                  <div v-else class="flex items-center">
                    <button 
                      @click="store.activeTabId = tab.id"
                      @dblclick="startRenameTab(tab.id, tab.name)"
                      class="tab-drag-handle px-4 py-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-grab active:cursor-grabbing"
                      :class="[
                        store.activeTabId === tab.id 
                          ? 'text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400' 
                          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border-transparent',
                        store.draggingIssueId ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''
                      ]"
                    >
                      {{ tab.name }}
                    </button>
                    <button 
                      v-if="store.tabs.length > 1"
                      @click.stop="handleDeleteTab(tab.id, tab.name)"
                      class="absolute top-1 right-0 opacity-0 group-hover/tab:opacity-100 transition-opacity bg-red-500/80 hover:bg-red-500 text-white rounded-full p-0.5"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-2 w-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  
                  <!-- Drop Zone Indicator -->
                  <div v-if="store.draggingIssueId && store.activeTabId !== tab.id" class="absolute inset-0 border-2 border-dashed border-indigo-400 dark:border-indigo-500 rounded-lg pointer-events-none animate-pulse"></div>
                </div>
              </template>
            </draggable>
            <button 
              v-if="!showTrash"
              @click="handleAddTab"
              class="p-2 text-slate-400 hover:text-indigo-600 transition-colors flex-shrink-0"
              title="Add Tab"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
              </svg>
            </button>
            <div v-else class="flex items-center px-4 py-4 text-xs font-bold text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              TRASH BIN
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button 
              @click="showWorkspace = !showWorkspace"
              class="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
              :class="showWorkspace ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'"
              title="Alt + W"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Workspace
            </button>
            <button 
              @click="showTrash = !showTrash"
              class="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
              :class="showTrash ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {{ showTrash ? 'Exit Trash' : 'Trash' }}
              <span v-if="store.trash.length > 0 && !showTrash" class="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{{ store.trash.length }}</span>
            </button>
            <button 
              v-if="!showTrash"
              @click="store.showDone = !store.showDone"
              class="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
              :class="store.showDone ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'"
            >
              {{ store.showDone ? 'Hide Done' : 'Show Done' }}
            </button>
            <button 
              v-if="!showTrash"
              @click="isAddingTopLevel = !isAddingTopLevel"
              class="px-4 py-1.5 rounded-lg font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
              :class="store.lastSelectedId ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'"
              title="Alt + N"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
              </svg>
              {{ store.lastSelectedId ? 'New Sub-task' : 'New Task' }}
            </button>
          </div>
        </div>
      </header>

      <!-- Scrollable Main Content -->
      <div class="flex-1 overflow-y-auto custom-scrollbar">
        <main class="max-w-5xl mx-auto px-6 py-10 pb-32">
          <!-- Bulk Actions Bar -->
          <transition 
            enter-active-class="transition duration-300 ease-out" 
            enter-from-class="transform translate-y-4 opacity-0" 
            enter-to-class="transform translate-y-0 opacity-100"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="transform translate-y-0 opacity-100"
            leave-to-class="transform translate-y-4 opacity-0"
          >
            <div v-if="store.selectedIds.size > 0 && !showTrash" class="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-6 border border-slate-800 dark:border-slate-200">
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
                  @click="handleAddToWorkspace"
                  class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg font-bold text-xs transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Track
                </button>
                <button 
                  @click="handleBulkDelete"
                  class="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg font-bold text-xs transition-all shadow-sm active:scale-95"
                  title="Delete"
                >
                  Move to Trash
                </button>
              </div>
            </div>
          </transition>

          <!-- Add Top Level Form -->
          <transition 
            enter-active-class="transition duration-300 ease-out" 
            enter-from-class="transform -translate-y-4 opacity-0" 
            enter-to-class="transform translate-y-0 opacity-100"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="transform translate-y-0 opacity-100"
            leave-to-class="transform translate-y-4 opacity-0"
          >
            <div v-if="isAddingTopLevel && !showTrash" class="mb-12">
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

          <!-- Trash View -->
          <div v-else-if="showTrash">
            <div class="flex items-center justify-between mb-8">
              <h2 class="text-2xl font-black text-slate-800 dark:text-slate-100">Trash Bin</h2>
              <button 
                v-if="store.trash.length > 0"
                @click="handleEmptyTrash"
                class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-lg active:scale-95 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Empty Trash
              </button>
            </div>

            <div v-if="store.trash.length === 0" class="py-24 flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
              <div class="w-20 h-20 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-6 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h2 class="text-xl font-bold text-slate-700 dark:text-slate-200">Trash is empty</h2>
              <p class="text-slate-400 dark:text-slate-500 mt-1 max-w-xs text-center text-sm">Deleted tasks will appear here for a second chance.</p>
            </div>

            <div v-else class="space-y-4">
              <div v-for="item in store.trash" :key="item.id" class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center justify-between shadow-sm">
                <div class="flex-1 min-w-0">
                  <h3 class="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{{ item.title }}</h3>
                  <p class="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest mt-1">Deleted at {{ new Date(item.createdAt).toLocaleDateString() }}</p>
                </div>
                <div class="flex items-center gap-2">
                  <button 
                    @click="store.restoreIssue(item.id)"
                    class="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
                  >
                    Restore
                  </button>
                  <button 
                    @click="store.permanentlyDeleteIssue(item.id)"
                    class="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                  >
                    Delete Permanently
                  </button>
                </div>
              </div>
            </div>
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
                ghost-class="ghost-class"
                class="space-y-6"
                :group="{ name: 'issues' }"
                @start="store.draggingIssueId = ($event.item as any)._underlying_vm_.id"
                @end="store.draggingIssueId = null"
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
            <div v-if="activeIssues.length === 0 && !store.showDone" class="py-24 flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
              <div class="w-20 h-20 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-6 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h2 class="text-xl font-bold text-slate-700 dark:text-slate-200 transition-colors">Clean Slate</h2>
              <p class="text-slate-400 dark:text-slate-500 mt-1 max-w-xs text-center text-sm transition-colors">No active tasks. Start by creating a new task to organize your flow.</p>
            </div>

            <!-- Done Section -->
            <div v-if="store.showDone" class="mt-16 space-y-4">
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
    </div>

    <!-- Workspace Panel -->
    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <div v-if="showWorkspace" class="w-80 border-l border-slate-200 dark:border-slate-800 flex-shrink-0 z-40">
        <Workspace />
      </div>
    </transition>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
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
.ghost-class {
  opacity: 0.5;
  background: #eef2ff;
}
.dark .ghost-class {
  background: #1e1b4b;
}
</style>
